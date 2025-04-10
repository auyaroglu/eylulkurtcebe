import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Project, { IProject } from '@/models/Project';
import { withAuth } from '@/lib/auth-middleware';
import { unlink, access } from 'fs/promises';
import { constants } from 'fs';
import path from 'path';
import mongoose from 'mongoose';

// Tek bir projeyi getirme
async function getHandler(
    req: NextRequest,
    user: any,
    { params }: { params: Promise<{ locale: string; id: string }> }
) {
    // params'ı bekleyerek locale ve id'yi al
    const { locale, id } = await params;

    if (locale !== 'tr' && locale !== 'en') {
        return NextResponse.json({ error: 'Geçersiz dil kodu' }, { status: 400 });
    }

    try {
        await connectToDatabase();

        // URL'den gelen parametreyi alalım
        const { searchParams } = new URL(req.url);
        const byOriginalId = searchParams.get('byOriginalId') === 'true';

        let project: IProject | null = null;

        console.log(
            `${locale} dilinde ${byOriginalId ? 'originalId' : 'id'}=${id} ile proje aranıyor...`
        );

        // Doğrudan mongoose bağlantısı ile koleksiyona erişiyoruz
        const db = mongoose.connection;
        const projectsCollection = db.collection('projects');

        // Arama stratejisi: İlk olarak doğrudan ID ile ara
        project = (await projectsCollection.findOne({ locale, id })) as IProject | null;

        // Eğer ID ile bulunamazsa ve UUID formatındaysa, direkt originalId olarak ara
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

        if (!project && isUUID) {
            console.log(`ID bir UUID formatında, originalId olarak aranıyor...`);
            project = (await projectsCollection.findOne({
                locale,
                originalId: id,
            })) as IProject | null;
        }
        // Eğer hala bulunamadıysa ve direkt originalId olarak aranmadıysa, originalId ile ara
        else if (!project && !byOriginalId) {
            console.log(
                `${locale} dilinde id=${id} ile proje bulunamadı, originalId ile deneniyor...`
            );
            project = (await projectsCollection.findOne({
                locale,
                originalId: id,
            })) as IProject | null;
        }

        if (project) {
            console.log(
                `${locale} dilinde proje bulundu: ${project.id}, originalId: ${project.originalId}`
            );
            return NextResponse.json(project);
        }

        // Projeyi bulamadıysak, diğer dildeki ilişkili projeyi kontrol et
        console.log(`${locale} dilinde proje bulunamadı, ilişkili projeyi kontrolü yapılıyor...`);
        const otherLocale = locale === 'tr' ? 'en' : 'tr';

        // Hem id hem de originalId ile diğer dilde arama yap
        const projectInOtherLocale = (await projectsCollection.findOne({
            locale: otherLocale,
            $or: [{ id }, { originalId: id }],
        })) as IProject | null;

        if (projectInOtherLocale) {
            console.log(
                `${otherLocale} dilinde ilişkili proje bulundu, originalId: ${projectInOtherLocale.originalId}`
            );

            // originalId kullanarak hedef dildeki projeyi bul
            project = (await projectsCollection.findOne({
                locale,
                originalId: projectInOtherLocale.originalId,
            })) as IProject | null;

            if (project) {
                console.log(`Hedef dilde ilişkili proje bulundu: ${project.id}`);
                return NextResponse.json(project);
            }
        }

        // Hiçbir şekilde proje bulunamadı
        console.log(`${locale} dilinde proje bulunamadı ve ilişkili proje de bulunamadı.`);
        return NextResponse.json({ error: 'Proje bulunamadı' }, { status: 404 });
    } catch (error) {
        console.error('Proje getirme hatası:', error);
        return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
    }
}

// Proje güncelleme
async function putHandler(
    req: NextRequest,
    user: any,
    { params }: { params: Promise<{ locale: string; id: string }> }
) {
    // params'ı bekleyerek locale ve id'yi al
    const { locale, id } = await params;

    console.log(`PUT /api/admin/projects/${locale}/${id} isteği alındı`);

    if (locale !== 'tr' && locale !== 'en') {
        console.error(`Geçersiz dil kodu: ${locale}`);
        return NextResponse.json({ error: 'Geçersiz dil kodu' }, { status: 400 });
    }

    try {
        const projectData = await req.json();
        console.log(`Gelen proje verileri:`, JSON.stringify(projectData, null, 2));

        // _id ve __v gibi değiştirilemeyecek alanları temizle
        delete projectData._id;
        delete projectData.__v;

        await connectToDatabase();

        // Site ayarlarını getir (varsayılan OG Görsel için)
        const siteConfig = await mongoose.connection.collection('siteconfigs').findOne({});
        const defaultOgImage = siteConfig?.seo?.ogImage || '/logo.webp';
        console.log('Site ayarlarından varsayılan OG Görsel:', defaultOgImage);

        // Proje bulma stratejisi: Önce id ile ara, sonra originalId ile ara
        let existingProject: IProject | null = null;
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

        // 1. İlk olarak ID ile ara
        existingProject = (await mongoose.connection
            .collection('projects')
            .findOne({ locale, id })) as unknown as IProject;

        // 2. UUID formatında ise direkt originalId olarak ara
        if (!existingProject && isUUID) {
            console.log(`ID bir UUID formatında, originalId olarak aranıyor...`);
            existingProject = (await mongoose.connection
                .collection('projects')
                .findOne({ locale, originalId: id })) as unknown as IProject;
        }
        // 3. Diğer durumlarda originalId ile ara
        else if (!existingProject) {
            console.log(
                `Proje [locale=${locale}, id=${id}] bulunamadı, originalId ile aranıyor...`
            );
            existingProject = (await mongoose.connection
                .collection('projects')
                .findOne({ locale, originalId: id })) as unknown as IProject;
        }

        if (!existingProject) {
            console.error(
                `${locale} dilinde id veya originalId=${id} olan proje bulunamadı. Güncelleme yapılamıyor.`
            );
            return NextResponse.json(
                { error: `${locale} dilinde proje bulunamadı` },
                { status: 404 }
            );
        }

        // Proje bulundu, gerekli alanları güvenceye al
        console.log(
            `${locale} dilinde ${existingProject.id} ID'li proje bulundu, güncelleniyor...`
        );

        // locale değerini garantiye al
        projectData.locale = locale;

        // id değiştirilmemişse mevcut id'yi kullan
        if (!projectData.id || projectData.id.trim() === '') {
            projectData.id = existingProject.id;
        }

        // originalId asla değiştirilmemeli
        projectData.originalId = existingProject.originalId;

        // SEO alanlarını kontrol edelim ve eksikse ekleyelim
        if (!projectData.seo) {
            projectData.seo = existingProject.seo || {
                metaTitle: projectData.title || '',
                metaDescription: '',
                metaKeywords: '',
                ogTitle: projectData.title || '',
                ogDescription: '',
                ogImage: defaultOgImage, // Site ayarlarından alınan varsayılan değer
            };
        } else {
            // SEO alanları objesi var, değerleri kontrol edelim
            // Kullanıcının girdiği ogImage değerini kullan (undefined/null/boş string ise varsayılan değer kullan)
            const userOgImage = projectData.seo.ogImage;
            const hasValidOgImage =
                userOgImage !== undefined && userOgImage !== null && userOgImage !== '';

            projectData.seo = {
                metaTitle: projectData.seo.metaTitle || projectData.title || '',
                metaDescription: projectData.seo.metaDescription || '',
                metaKeywords: projectData.seo.metaKeywords || '',
                ogTitle: projectData.seo.ogTitle || projectData.title || '',
                ogDescription: projectData.seo.ogDescription || '',
                ogImage: hasValidOgImage ? userOgImage : defaultOgImage,
            };

            console.log('OG Görsel durumu:', {
                kullanıcıDeğeri: userOgImage,
                geçerliMi: hasValidOgImage,
                kullanılanDeğer: projectData.seo.ogImage,
            });
        }

        console.log('Güncellenmiş SEO alanları:', JSON.stringify(projectData.seo, null, 2));

        // createdAt alanını koruyalım
        if (existingProject.createdAt) {
            projectData.createdAt = existingProject.createdAt;
        } else {
            projectData.createdAt = new Date();
        }

        // updatedAt alanını güncelleyelim
        projectData.updatedAt = new Date();

        // İngilizce projeler için id (slug) değeri boş olabilir, bu durumda mevcut değeri koruyalım
        if (locale === 'en' && (!projectData.id || projectData.id.trim() === '')) {
            console.log(
                'İngilizce proje için boş id değeri, mevcut değer korunuyor:',
                existingProject.id
            );
            projectData.id = existingProject.id;
        }

        console.log('Güncellenecek proje verisi:', JSON.stringify(projectData, null, 2));

        try {
            // Mongoose model şemasını aşmak için doğrudan MongoDB collection'ı ile çalışalım
            const updateResult = await mongoose.connection
                .collection('projects')
                .updateOne({ locale, id: existingProject.id }, { $set: projectData });

            if (updateResult.matchedCount === 0) {
                console.error(
                    `${locale} dilinde ${existingProject.id} ID'li proje bulunamadı. Güncelleme yapılamıyor.`
                );
                return NextResponse.json(
                    { error: `${locale} dilinde proje bulunamadı` },
                    { status: 404 }
                );
            }

            if (updateResult.modifiedCount === 0) {
                console.warn(
                    `${locale} dilinde ${existingProject.id} ID'li proje bulundu ancak hiçbir değişiklik yapılmadı.`
                );
            }

            // Güncellenmiş projeyi getir
            const updatedProject = await mongoose.connection
                .collection('projects')
                .findOne({ locale, id: projectData.id });

            if (!updatedProject) {
                console.error(
                    `${locale} dilinde ${projectData.id} ID'li güncellenen proje getirilemedi.`
                );
                return NextResponse.json(
                    { error: 'Güncellenmiş proje getirilemedi' },
                    { status: 500 }
                );
            }

            // Görseller değiştiyse diğer dildeki karşılığında da güncelle
            if (projectData.images && projectData.images.length > 0) {
                try {
                    const otherLocale = locale === 'tr' ? 'en' : 'tr';
                    const otherProject = await mongoose.connection.collection('projects').findOne({
                        locale: otherLocale,
                        originalId: existingProject.originalId,
                    });

                    if (otherProject) {
                        console.log(
                            `Diğer dildeki (${otherLocale}) ilişkili projeye görseller de güncelleniyor... originalId: ${existingProject.originalId}`
                        );

                        // Diğer dildeki projeyi güncellediğimizde createdAt korunmalı ve updatedAt güncellenmeli
                        await mongoose.connection.collection('projects').updateOne(
                            { _id: otherProject._id },
                            {
                                $set: {
                                    images: projectData.images,
                                    updatedAt: new Date(),
                                },
                            }
                        );

                        console.log(`Diğer dildeki projede görseller güncellendi.`);
                    }
                } catch (error) {
                    console.error('Diğer dildeki projenin görsellerini güncelleme hatası:', error);
                }
            }

            return NextResponse.json(updatedProject);
        } catch (dbError: any) {
            console.error('Veritabanı güncelleme hatası:', dbError);
            return NextResponse.json(
                { error: 'Veritabanı hatası: ' + dbError.message },
                { status: 500 }
            );
        }
    } catch (error) {
        console.error('Proje güncelleme hatası:', error);
        return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
    }
}

// Proje silme
async function deleteHandler(
    req: NextRequest,
    user: any,
    { params }: { params: Promise<{ locale: string; id: string }> }
) {
    // params'ı bekleyerek locale ve id'yi al
    const { locale, id } = await params;

    if (locale !== 'tr' && locale !== 'en') {
        return NextResponse.json({ error: 'Geçersiz dil kodu' }, { status: 400 });
    }

    try {
        await connectToDatabase();

        // Önce id ile arama yapalım
        let project = await mongoose.connection.collection('projects').findOne({ locale, id });

        // Eğer id ile bulunamazsa, originalId ile arama yapalım
        if (!project) {
            console.log(
                `${locale} dilinde id=${id} ile proje bulunamadı, originalId ile deneniyor...`
            );
            project = await mongoose.connection
                .collection('projects')
                .findOne({ locale, originalId: id });

            if (project) {
                console.log(`${locale} dilinde originalId=${id} ile proje bulundu: ${project.id}`);
            }
        }

        if (!project) {
            return NextResponse.json({ error: 'Proje bulunamadı' }, { status: 404 });
        }

        console.log(
            `[SİLME İŞLEMİ] Proje bulundu: ${project.id}, görsel sayısı: ${
                project.images?.length || 0
            }, originalId: ${project.originalId}`
        );

        // Projenin originalId'sini saklayın
        const originalId = project.originalId;

        // Tüm görselleri toplayalım (hem bu projeden hem de ilişkili projeden)
        let allImages = [...(project.images || [])];

        // Diğer dildeki ilişkili projeyi bulun
        const otherLocale = locale === 'tr' ? 'en' : 'tr';
        const relatedProject = await mongoose.connection.collection('projects').findOne({
            locale: otherLocale,
            originalId,
        });

        if (relatedProject) {
            console.log(
                `[SİLME İŞLEMİ] İlişkili ${otherLocale} projesi bulundu: ${relatedProject.id}, originalId: ${relatedProject.originalId}`
            );

            // İlişkili projenin görsellerini de toplayın (eğer farklıysa)
            if (relatedProject.images && relatedProject.images.length > 0) {
                // Tekrar eden görselleri filtreleyerek ekleyin
                relatedProject.images.forEach((img: string) => {
                    if (!allImages.includes(img)) {
                        allImages.push(img);
                    }
                });
            }
        } else {
            console.log(
                `[SİLME İŞLEMİ] İlişkili ${otherLocale} projesi bulunamadı (originalId: ${originalId})`
            );
        }

        console.log(`[SİLME İŞLEMİ] Silinecek toplam görsel sayısı: ${allImages.length}`);
        if (allImages.length > 0) {
            console.log(`[SİLME İŞLEMİ] Silinecek görseller: ${JSON.stringify(allImages)}`);
        }

        // Bu projeyi sil
        const deletedProject = await mongoose.connection
            .collection('projects')
            .deleteOne({ locale, id: project.id });
        console.log(`[SİLME İŞLEMİ] Ana proje silindi: ${locale}/${project.id}`);

        // İlişkili projeyi de sil (eğer varsa)
        if (relatedProject) {
            const deletedRelatedProject = await mongoose.connection
                .collection('projects')
                .deleteOne({
                    locale: otherLocale,
                    originalId,
                });
            console.log(
                `[SİLME İŞLEMİ] İlişkili proje silindi: ${otherLocale}/${relatedProject.id}`
            );
        }

        // Görselleri fiziksel olarak sil
        if (allImages.length > 0) {
            try {
                // Görselleri fiziksel olarak silmeye çalış
                const deleteResults = await deleteImageFiles(allImages);

                console.log(
                    `[SİLME İŞLEMİ] ${deleteResults.success.length} görsel başarıyla silindi, ${deleteResults.errors.length} görsel silinemedi.`
                );
                console.log(
                    `[SİLME İŞLEMİ] Silinen görseller: ${JSON.stringify(deleteResults.success)}`
                );

                if (deleteResults.errors.length > 0) {
                    console.error('[SİLME İŞLEMİ] Silinemeyen görseller:', deleteResults.errors);
                }
            } catch (imageDeleteError) {
                console.error('[SİLME İŞLEMİ] Görsel silme hatası:', imageDeleteError);
            }
        } else {
            console.log('[SİLME İŞLEMİ] Silinecek görsel yok');
        }

        return NextResponse.json({
            success: true,
            message: 'Proje ve ilişkili kayıtlar başarıyla silindi',
        });
    } catch (error) {
        console.error('[SİLME İŞLEMİ] Proje silme hatası:', error);
        return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
    }
}

// Görsel dosyalarını sunucudan silen yardımcı fonksiyon
async function deleteImageFiles(imageUrls: string[]) {
    const results = {
        success: [] as string[],
        errors: [] as string[],
    };

    for (const imageUrl of imageUrls) {
        try {
            // URL'den dosya adını çıkar
            const fileName = imageUrl.split('/').pop();

            if (!fileName) {
                results.errors.push(`${imageUrl} (geçersiz dosya adı)`);
                continue;
            }

            // Dosyanın fiziksel yolunu belirle
            const filePath = path.join(process.cwd(), 'public', 'images', 'projects', fileName);

            // Dosyanın var olup olmadığını kontrol et
            try {
                await access(filePath, constants.F_OK);
            } catch (err) {
                // Dosya bulunamadıysa hata mesajını kaydet ve bir sonraki dosyaya geç
                results.errors.push(`${fileName} (dosya bulunamadı)`);
                continue;
            }

            // Dosyayı sil
            await unlink(filePath);
            results.success.push(fileName);
        } catch (error) {
            console.error(`Görsel dosyası silinirken hata: ${imageUrl}`, error);
            results.errors.push(imageUrl);
        }
    }

    return results;
}

export const GET = withAuth(getHandler);
export const PUT = withAuth(putHandler);
export const DELETE = withAuth(deleteHandler);
