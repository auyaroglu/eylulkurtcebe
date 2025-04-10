import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Project, { IProject } from '@/models/Project';
import ProjectTranslation from '@/models/ProjectTranslation';
import { withAuth } from '@/lib/auth-middleware';
import crypto from 'crypto';
import { slugify } from '@/lib/utils';
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

interface ProjectDocument {
    _id: string;
    id: string;
    locale: string;
    [key: string]: any;
}

// Proje listesini getirme
async function getHandler(
    req: NextRequest,
    user: any,
    { params }: { params: Promise<{ locale: string }> }
) {
    // params'ı bekleyerek locale'yi al
    const { locale } = await params;

    if (locale !== 'tr' && locale !== 'en') {
        return NextResponse.json({ error: 'Geçersiz dil kodu' }, { status: 400 });
    }

    try {
        await connectToDatabase();

        // Doğrudan MongoDB koleksiyonlarına erişim
        const db = mongoose.connection;
        const projectsCollection = db.collection('projects');
        const projectTranslationsCollection = db.collection('projecttranslations');

        // Çeviri verilerini al
        const projectTranslation = await projectTranslationsCollection.findOne({ locale });

        if (!projectTranslation) {
            return NextResponse.json({ error: 'Proje çevirileri bulunamadı' }, { status: 404 });
        }

        // Tüm projeleri getir
        let projects = await projectsCollection
            .find({ locale })
            .sort({ order: 1, createdAt: -1 })
            .toArray();

        // Order alanı yoksa veya sıfırsa, projelere otomatik order değeri ekle
        // Bu adım, veritabanında henüz order alanı olmayan projeleri günceller
        const projectsNeedOrderUpdate = projects.some(
            p => p.order === undefined || p.order === null
        );

        if (projectsNeedOrderUpdate) {
            console.log(
                `${locale} dilindeki bazı projelerde order alanı eksik veya sıfır. Güncelleniyor...`
            );

            // Bulk operasyonları hazırla
            const bulkOps = projects.map((project, index) => ({
                updateOne: {
                    filter: { _id: project._id },
                    update: { $set: { order: index } },
                },
            }));

            // Bulk update işlemi gerçekleştir
            if (bulkOps.length > 0) {
                try {
                    const bulkResult = await projectsCollection.bulkWrite(bulkOps);
                    console.log('Bulk update sonucu:', bulkResult);

                    // Güncellenmiş projeleri tekrar getir
                    projects = await projectsCollection
                        .find({ locale })
                        .sort({ order: 1, createdAt: -1 })
                        .toArray();
                } catch (bulkError) {
                    console.error('Bulk update hatası:', bulkError);

                    // Eğer bulk update başarısız olursa, her projeyi tek tek güncelle
                    for (let i = 0; i < projects.length; i++) {
                        try {
                            await projectsCollection.updateOne(
                                { _id: projects[i]._id },
                                { $set: { order: i } }
                            );
                        } catch (updateError) {
                            console.error(
                                `Proje güncelleme hatası (${projects[i].id}):`,
                                updateError
                            );
                        }
                    }

                    // Son kez güncellenmiş projeleri getir
                    projects = await projectsCollection
                        .find({ locale })
                        .sort({ order: 1, createdAt: -1 })
                        .toArray();
                }
            }
        }

        return NextResponse.json({
            ...projectTranslation,
            list: projects,
        });
    } catch (error) {
        console.error('Proje listesi getirme hatası:', error);
        return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
    }
}

// Benzersiz slug oluşturma fonksiyonu
async function generateUniqueSlug(baseSlug: string, locale: string): Promise<string> {
    let slug = baseSlug;
    let counter = 1;
    let isUnique = false;

    const db = mongoose.connection;
    const projectsCollection = db.collection('projects');

    while (!isUnique) {
        const existingProject = await projectsCollection.findOne({ locale, id: slug });
        if (!existingProject) {
            isUnique = true;
        } else {
            slug = `${baseSlug}${counter}`;
            counter++;
        }
    }

    return slug;
}

// Zaman bilgisini içeren originalId oluşturma
function generateOriginalId(): string {
    // Şu anki zaman damgası (timestamp)
    const timestamp = new Date().getTime().toString(36);

    // Rastgele 8 karakterlik bir dize
    const randomPart = Math.random().toString(36).substring(2, 10);

    // İkisini birleştir: zaman-random (örnek: kz0bxmft-a7x92p3v)
    return `${timestamp}-${randomPart}`;
}

// Yeni proje ekleme
async function postHandler(
    req: NextRequest,
    user: any,
    { params }: { params: Promise<{ locale: string }> }
) {
    try {
        // params'ı bekleyerek locale'i al
        const { locale } = await params;

        // Projeden gelecek olan veriler
        const body = await req.json();

        // Not: withAuth middleware'i sayesinde JWT kontrolü zaten yapıldı
        // ve user parametresi mevcut, ayrı bir kontrol yapmaya gerek yok

        if (locale !== 'tr' && locale !== 'en') {
            return NextResponse.json({ error: 'Geçersiz dil kodu' }, { status: 400 });
        }

        await connectToDatabase();

        // Site ayarlarını getir (varsayılan OG Görsel için)
        const siteConfig = await mongoose.connection.collection('siteconfigs').findOne({});
        const defaultOgImage = siteConfig?.seo?.ogImage || '/logo.webp';
        console.log('Site ayarlarından varsayılan OG Görsel:', defaultOgImage);

        // Benzersiz bir originalId oluştur - her iki dil için aynı değer kullanılacak
        const uniqueOriginalId = uuidv4();
        console.log(`Yeni proje için originalId oluşturuldu: ${uniqueOriginalId}`);

        // Şu anki tarih - ISO formatında kaydet
        const now = new Date();

        // Yeni proje verilerini hazırla
        const projectData = {
            ...body,
            locale: locale,
            originalId: uniqueOriginalId,
            createdAt: now,
            updatedAt: now,
        };

        // Status alanını locale'e göre ayarla
        // Türkçe projeler varsayılan olarak görünür, İngilizce projeler gizli olur
        if (locale === 'tr') {
            projectData.status = body.status !== undefined ? body.status : true;
        } else {
            projectData.status = body.status !== undefined ? body.status : false;
        }

        // Türkçe projede id alanı boş olmamalı
        if (locale === 'tr' && (!projectData.id || projectData.id.trim() === '')) {
            return NextResponse.json(
                { error: 'Türkçe projeler için ID (slug) alanı boş olamaz' },
                { status: 400 }
            );
        }

        // Türkçe projede title alanı boş olmamalı
        if (locale === 'tr' && (!projectData.title || projectData.title.trim() === '')) {
            return NextResponse.json(
                { error: 'Türkçe projeler için başlık alanı boş olamaz' },
                { status: 400 }
            );
        }

        // İngilizce projeler için id alanı boş ise benzersiz bir ID oluştur
        // Bu ID sadece veritabanı için kullanılacak ve UI'da görünmeyecek
        if (locale === 'en' && (!projectData.id || projectData.id.trim() === '')) {
            const uniqueId = `en-project-${Date.now()}`;
            console.log(
                `İngilizce proje için ID (slug) alanı boş, benzersiz ID oluşturuldu: ${uniqueId}`
            );
            projectData.id = uniqueId;
        }

        // SEO alanlarını kontrol et ve yoksa ekle
        if (!projectData.seo) {
            projectData.seo = {
                metaTitle: projectData.title || '',
                metaDescription: '',
                metaKeywords: '',
                ogTitle: projectData.title || '',
                ogDescription: '',
                ogImage: defaultOgImage, // Site ayarlarından alınan varsayılan değer
            };
        } else if (
            projectData.seo.ogImage === undefined ||
            projectData.seo.ogImage === null ||
            projectData.seo.ogImage === ''
        ) {
            // SEO alanları var ama ogImage boş/tanımsız ise varsayılan değeri kullan
            projectData.seo.ogImage = defaultOgImage;
            console.log('ogImage alanı boş, varsayılan değer kullanıldı:', defaultOgImage);
        } else {
            // Kullanıcı tarafından girilen ogImage değeri var, onu koru
            console.log(
                'Kullanıcı tarafından girilen OG Görsel değeri kullanıldı:',
                projectData.seo.ogImage
            );
        }

        console.log(
            `Yeni ${locale} projesi oluşturuluyor (SEO dahil):`,
            JSON.stringify(projectData, null, 2)
        );

        try {
            // Mongoose model şemasını aşmak için doğrudan MongoDB collection'ı ile çalışalım
            const result = await mongoose.connection.collection('projects').insertOne(projectData);
            console.log(`Yeni ${locale} projesi oluşturuldu, ID: ${result.insertedId}`);

            // Oluşturulan projeyi tekrar çekelim
            const newProject = await mongoose.connection
                .collection('projects')
                .findOne({ _id: result.insertedId });
            console.log(`Oluşturulan proje içeriği:`, JSON.stringify(newProject, null, 2));

            // Türkçe proje oluşturulduğunda, otomatik olarak İngilizce karşılığını da oluştur
            if (locale === 'tr') {
                try {
                    console.log('Türkçe proje için İngilizce karşılık oluşturuluyor...');

                    // İngilizce proje için varsayılan veriler
                    const englishProjectData = {
                        id: `en-${uniqueOriginalId.substring(0, 8)}`, // Veritabanında benzersiz olması için kısa bir ID
                        originalId: uniqueOriginalId, // Türkçe proje ile aynı originalId
                        title: '', // Başlangıçta boş
                        description: '', // Başlangıçta boş
                        technologies: [], // Başlangıçta boş
                        images: projectData.images || [], // Görselleri Türkçe projeden al
                        status: false, // Varsayılan olarak gizli
                        locale: 'en', // İngilizce
                        seo: {
                            metaTitle: '',
                            metaDescription: '',
                            metaKeywords: '',
                            ogTitle: '',
                            ogDescription: '',
                            ogImage: defaultOgImage, // Site ayarlarından alınan varsayılan değer
                        },
                        createdAt: now,
                        updatedAt: now,
                    };

                    console.log(
                        'İngilizce proje verileri:',
                        JSON.stringify(englishProjectData, null, 2)
                    );

                    // İngilizce projeyi doğrudan collection ile oluştur
                    const englishResult = await mongoose.connection
                        .collection('projects')
                        .insertOne(englishProjectData);
                    console.log(
                        'İngilizce proje başarıyla oluşturuldu, ID:',
                        englishResult.insertedId
                    );

                    // Oluşturulan projeyi kontrol et
                    const englishProject = await mongoose.connection
                        .collection('projects')
                        .findOne({ _id: englishResult.insertedId });
                    console.log(
                        'Oluşturulan İngilizce proje:',
                        JSON.stringify(englishProject, null, 2)
                    );
                } catch (englishError) {
                    // İngilizce proje oluşturma başarısız olsa bile, ana projeyi etkilememeli
                    console.error('İngilizce proje oluşturma hatası:', englishError);
                }
            }

            return NextResponse.json(newProject);
        } catch (dbError: any) {
            console.error('Veritabanı kayıt hatası:', dbError);
            return NextResponse.json(
                { error: 'Veritabanı hatası: ' + dbError.message },
                { status: 500 }
            );
        }
    } catch (error) {
        console.error('Proje oluşturma hatası:', error);
        return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
    }
}

export const GET = withAuth(getHandler);
export const POST = withAuth(postHandler);
