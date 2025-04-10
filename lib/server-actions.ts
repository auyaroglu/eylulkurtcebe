'use server';

import { connectToDatabase } from './db';
import Content from '@/models/Content';
import Project from '@/models/Project';
import ProjectTranslation from '@/models/ProjectTranslation';
import { revalidatePath } from 'next/cache';
import { cache } from 'react';
import { cookies } from 'next/headers';
import { unlink, access } from 'fs/promises';
import { constants } from 'fs';
import path from 'path';
import { v4 } from 'uuid';
import mongoose from 'mongoose';

/**
 * MongoDB verilerini düz JavaScript objelerine dönüştürür
 * Bu fonksiyon, MongoDB'den dönen verilerdeki _id gibi özel objeleri
 * client componentlerde kullanılabilecek düz objeler haline getirir
 */
function convertToPlainObject(data: any): any {
    if (data === null || data === undefined) {
        return data;
    }

    // Date nesnelerini ISO string formatına dönüştür
    if (data instanceof Date) {
        return data.toISOString();
    }

    // Buffer gibi nesneleri string'e çevir
    if (data instanceof Buffer || (data && data.buffer instanceof ArrayBuffer)) {
        return data.toString();
    }

    // Array'leri işle
    if (Array.isArray(data)) {
        return data.map(item => convertToPlainObject(item));
    }

    // Objeler için
    if (typeof data === 'object') {
        const plainObject: Record<string, any> = {};

        // _id özel bir şekilde işle (MongoDB ObjectId)
        if (data._id) {
            plainObject._id = data._id.toString();
        }

        // Diğer tüm alanları dönüştür
        for (const key in data) {
            if (Object.prototype.hasOwnProperty.call(data, key) && key !== '_id') {
                plainObject[key] = convertToPlainObject(data[key]);
            }
        }

        return plainObject;
    }

    // İlkel veri tipleri için doğrudan döndür
    return data;
}

/**
 * Belirli bir dil için içerik verilerini getirir
 * @param locale Dil kodu (tr, en)
 */
export const getContentFromDB = cache(async (locale: string) => {
    try {
        await connectToDatabase();

        // MongoDB koleksiyonuna doğrudan erişim
        const db = mongoose.connection;
        const contentsCollection = db.collection('contents');

        const content = await contentsCollection.findOne({ locale });

        if (!content) {
            console.error(`${locale} için içerik bulunamadı`);
            return null;
        }

        // İçerik verisini düz JavaScript nesnesine dönüştür
        return convertToPlainObject(content);
    } catch (error) {
        console.error('Veritabanından içerik verilerini getirme hatası:', error);
        return null;
    }
});

// Tüm projeleri alma
export const getProjectsFromDB = cache(async (locale: string, projectId?: string): Promise<any> => {
    try {
        await connectToDatabase();

        // Çeviri verilerini al
        // @ts-ignore - Mongoose tip sorunlarını görmezden gel
        const projectTranslation = await ProjectTranslation.findOne({ locale }).lean();

        if (!projectTranslation) {
            console.error(`${locale} dili için proje çevirileri bulunamadı`);
            return null;
        }

        // Belirli bir proje ID'si belirtildiyse o projeyi getir
        if (projectId) {
            // @ts-ignore - Mongoose tip sorunlarını görmezden gel
            const project = await Project.findOne({
                locale,
                id: projectId,
                status: true, // Sadece "yayında" olan projeleri getir
            }).lean();

            if (!project) {
                console.error(
                    `${locale} dilinde ${projectId} ID'si ile yayında olan proje bulunamadı`
                );
                return null;
            }

            // MongoDB verisini düz JavaScript nesnesine dönüştür
            return convertToPlainObject(project);
        }

        // Tüm projeleri al (sadece yayında olanlar)
        // @ts-ignore - Mongoose tip sorunlarını görmezden gel
        const projects = await Project.find({
            locale,
            status: true, // Sadece "yayında" olan projeleri getir
        })
            .sort({ order: 1, createdAt: -1 })
            .lean();

        // Tüm verileri düz JavaScript nesnelerine dönüştür
        const plainProjectTranslation = convertToPlainObject(projectTranslation);
        const plainProjects = convertToPlainObject(projects);

        // Çeviri verilerini projelerle birleştir
        return {
            ...plainProjectTranslation,
            list: plainProjects,
        };
    } catch (error) {
        console.error('Veritabanı hatası (getProjectsFromDB):', error);
        return null;
    }
});

/**
 * Yeni proje ekleyen fonksiyon
 * @param projectData - Proje verileri
 */
export async function addProject(projectData: any) {
    try {
        await connectToDatabase();

        // Eğer originalId yoksa, yeni bir unique ID oluştur (UUID v4 formatında)
        if (!projectData.originalId) {
            projectData.originalId = v4();
        }

        // TR dili için tüm alanlar dolu olmalı
        // EN dili için sadece resimler aynı olacak, diğer alanlar boş bırakılabilir
        if (projectData.locale === 'en') {
            // İngilizce için boş alanları korumalıyız
            // Sadece images alanı dolu olarak gelecek
            // Eğer title, description, technologies boş gelirse varsayılan değerler atama
            if (!projectData.title) projectData.title = '';
            if (!projectData.description) projectData.description = '';
            if (!projectData.technologies || !projectData.technologies.length)
                projectData.technologies = [];
        }

        // @ts-ignore - Mongoose tip sorunlarını görmezden gel
        const result = await Project.create(projectData);

        // Cache'i temizle - tüm ilgili sayfaları yeniden doğrula
        revalidatePath('/', 'layout');
        revalidatePath(`/${projectData.locale}`, 'layout');
        revalidatePath(`/${projectData.locale}/projects`, 'layout');
        revalidatePath(`/${projectData.locale}/projects/${projectData.id}`, 'layout');

        // Sonucu düz nesneye dönüştür
        return convertToPlainObject(result);
    } catch (error) {
        console.error('Proje ekleme hatası:', error);
        return null;
    }
}

/**
 * Projeyi güncelleyen fonksiyon
 * @param projectId - Güncellenecek projenin ID'si
 * @param locale - Dil kodu (tr, en)
 * @param updateData - Güncellenecek veriler
 */
export async function updateProject(projectId: string, locale: string, updateData: any) {
    try {
        await connectToDatabase();

        // Güncellenecek projenin mevcut durumunu al ve dönüştür
        // @ts-ignore - Mongoose tip sorunlarını görmezden gel
        const currentProjectDoc = await Project.findOne({ id: projectId, locale }).lean();

        if (!currentProjectDoc) {
            throw new Error(`${locale} dilinde ${projectId} ID'li proje bulunamadı`);
        }

        // MongoDB dökümanını tipli nesneye dönüştür
        const currentProject = convertToPlainObject(currentProjectDoc) as {
            id: string;
            locale: string;
            originalId: string;
            images: string[];
            [key: string]: any;
        };

        // EN dili için boş alanların korunması
        if (locale === 'en') {
            // İngilizce için boş alanları korumalıyız
            // Eğer title, description, technologies boş gelirse varsayılan değerler atama
            if (!updateData.title) updateData.title = '';
            if (!updateData.description) updateData.description = '';
            if (!updateData.technologies || !updateData.technologies.length)
                updateData.technologies = [];
        }

        // Görseller değiştirilmişse ve originalId varsa, aynı projenin diğer dildeki versiyonunda da güncelle
        if (updateData.images && updateData.images.length > 0 && currentProject.originalId) {
            const otherLocale = locale === 'tr' ? 'en' : 'tr';
            // @ts-ignore - Mongoose tip sorunlarını görmezden gel
            const otherProject = await Project.findOne({
                locale: otherLocale,
                originalId: currentProject.originalId,
            });

            if (otherProject) {
                // Diğer dildeki projenin görsellerini güncelle
                // @ts-ignore - Mongoose tip sorunlarını görmezden gel
                await Project.updateOne(
                    { locale: otherLocale, originalId: currentProject.originalId },
                    { $set: { images: updateData.images } }
                );
                console.log(`${otherLocale} dilindeki projenin görselleri güncellendi`);
            }
        }

        // Status değişimi durumunda, originalId ile ilişkili diğer dildeki projelerde de aynı değişiklik yapılsın mı?
        // (Eğer istenirse burada diğer dildeki projelerin de status'unu güncelleyebiliriz)

        // @ts-ignore - Mongoose tip sorunlarını görmezden gel
        const result = await Project.findOneAndUpdate({ id: projectId, locale }, updateData, {
            new: true,
        });

        // Cache'i temizle - tüm ilgili sayfaları yeniden doğrula
        revalidatePath('/', 'layout');
        revalidatePath(`/${locale}`, 'layout');
        revalidatePath(`/${locale}/projects`, 'layout');
        revalidatePath(`/${locale}/projects/${projectId}`, 'layout');

        // Görseller güncellendiğinde veya status değişince diğer dildeki sayfaları da yenile
        if ((updateData.images || updateData.status !== undefined) && currentProject.originalId) {
            const otherLocale = locale === 'tr' ? 'en' : 'tr';
            // @ts-ignore - Mongoose tip sorunlarını görmezden gel
            const otherProject = await Project.findOne({
                locale: otherLocale,
                originalId: currentProject.originalId,
            });

            if (otherProject) {
                revalidatePath(`/${otherLocale}`, 'layout');
                revalidatePath(`/${otherLocale}/projects`, 'layout');
                revalidatePath(`/${otherLocale}/projects/${otherProject.id}`, 'layout');
            }
        }

        // Sonucu düz nesneye dönüştür
        return convertToPlainObject(result);
    } catch (error) {
        console.error('Proje güncelleme hatası:', error);
        throw error;
    }
}

/**
 * Projeyi silen fonksiyon
 * @param projectId - Silinecek projenin ID'si
 * @param locale - Dil kodu (tr, en)
 */
export async function deleteProject(projectId: string, locale: string) {
    try {
        await connectToDatabase();

        // Projeyi silmeden önce görsel yollarını al
        // @ts-ignore - Mongoose tip sorunlarını görmezden gel
        const project = (await Project.findOne({ id: projectId, locale }).lean()) as any;

        if (!project) {
            return { success: false, error: 'Proje bulunamadı' };
        }

        console.log(
            `[SERVER-ACTION SİLME] Proje bulundu: ${projectId}, görsel sayısı: ${
                project.images?.length || 0
            }`
        );

        // Projeyi veritabanından sil
        // @ts-ignore - Mongoose tip sorunlarını görmezden gel
        const result = await Project.findOneAndDelete({ id: projectId, locale });

        // Projenin görsellerini fiziksel olarak sil
        if (project.images && project.images.length > 0) {
            console.log(
                `[SERVER-ACTION SİLME] Görsel silme işlemi başlatılıyor, görsel sayısı: ${project.images.length}`
            );
            console.log(
                `[SERVER-ACTION SİLME] Silinecek görseller: ${JSON.stringify(project.images)}`
            );

            try {
                const deleteResults = await deleteImageFiles(project.images);

                console.log(
                    `[SERVER-ACTION SİLME] ${deleteResults.success.length} görsel sunucudan başarıyla silindi, ${deleteResults.errors.length} görsel silinemedi.`
                );
                console.log(
                    `[SERVER-ACTION SİLME] Silinen görseller: ${JSON.stringify(
                        deleteResults.success
                    )}`
                );

                if (deleteResults.errors.length > 0) {
                    console.error(
                        '[SERVER-ACTION SİLME] Silinemeyen görseller:',
                        deleteResults.errors
                    );
                }
            } catch (imageDeleteError) {
                console.error('[SERVER-ACTION SİLME] Görsel silme hatası:', imageDeleteError);
            }
        } else {
            console.log('[SERVER-ACTION SİLME] Silinecek görsel yok');
        }

        // Cache'i temizle - tüm ilgili sayfaları yeniden doğrula
        revalidatePath('/', 'layout');
        revalidatePath(`/${locale}`, 'layout');
        revalidatePath(`/${locale}/projects`, 'layout');

        // Sonucu düz nesneye dönüştür
        return convertToPlainObject({
            ...result,
            success: true,
            message: 'Proje ve ilişkili görseller başarıyla silindi',
        });
    } catch (error) {
        console.error('[SERVER-ACTION SİLME] Proje silme hatası:', error);
        return { success: false, error: 'Proje silinirken bir hata oluştu' };
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

/**
 * Veritabanı içeriğini güncelleyen fonksiyon
 * @param locale - Dil kodu (tr, en)
 * @param contentData - Güncellenecek içerik verisi
 */
export async function updateContent(locale: string, contentData: any) {
    try {
        await connectToDatabase();

        // @ts-ignore - Mongoose tip sorunlarını görmezden gel
        const result = await Content.findOneAndUpdate({ locale }, contentData, {
            upsert: true,
            new: true,
        });

        // Cache'i temizle - tüm ilgili sayfaları yeniden doğrula
        revalidatePath('/', 'layout');
        revalidatePath(`/${locale}`, 'layout');

        // Sonucu düz nesneye dönüştür
        return convertToPlainObject(result);
    } catch (error) {
        console.error('İçerik güncelleme hatası:', error);
        return null;
    }
}

/**
 * Belirli bir rotayı yeniden doğrulayan (revalidate) fonksiyon
 * @param path - Yeniden doğrulanacak yol
 */
export async function revalidateData(path: string) {
    try {
        revalidatePath(path, 'layout');
        return { success: true, message: `${path} için veriler yeniden doğrulandı` };
    } catch (error) {
        console.error('Veri yeniden doğrulama hatası:', error);
        return { success: false, message: 'Veri yeniden doğrulama başarısız oldu' };
    }
}

/**
 * Projelerin sıralama değerlerini günceller
 * @param locale - Dil kodu (tr, en)
 * @param orderData - Proje ID ve yeni sıralama değerleri içeren dizi [{id: string, order: number}]
 */
export async function updateProjectsOrder(orders: { id: string; order: number }[], locale: string) {
    'use server';
    try {
        const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/admin/projects/order`;

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Cookie: cookies().toString(),
            },
            body: JSON.stringify({ locale, orders }),
        });

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error || 'Projeler sıralanamadı');
        }

        revalidatePath('/admin/projeler');
        return { success: true };
    } catch (error) {
        if (error instanceof Error) {
            return { success: false, error: error.message };
        }
        return { success: false, error: 'Bilinmeyen hata' };
    }
}

/**
 * SEO içeriği oluşturan fonksiyon
 * @param title - Proje başlığı
 * @param description - Proje açıklaması
 * @param technologies - Kullanılan teknolojiler
 * @param locale - Dil kodu (tr, en)
 * @returns SEO verileri
 */
export async function generateSeoContent(
    title: string,
    description: string,
    technologies: string[],
    locale: string
) {
    try {
        const userLanguage = locale === 'tr' ? 'Türkçe' : 'İngilizce';
        const techString = technologies.filter(tech => tech.trim() !== '').join(', ');

        const prompt = `Seramik sanatçısı Eylül Kurtcebe'nin bir eseri için SEO metni oluştur.
Eser başlığı: "${title}"
Eser açıklaması: "${description}"
Kullanılan teknikler: "${techString}"

ÖNEMLİ: Yanıtını TAMAMEN ${userLanguage} dilinde oluştur. Tüm metinler ${userLanguage} olmalı.

Bu bilgilere dayanarak şunları ${userLanguage} dilinde oluştur:
1. Meta başlık (tam olarak 60 karakter)
2. Meta açıklama (tam olarak 155 karakter)
3. Anahtar kelimeler (virgülle ayrılmış, en fazla 10 kelime)
4. Sosyal medya başlığı (tam olarak 60 karakter)
5. Sosyal medya açıklaması (tam olarak 155 karakter)

Yanıtı şu JSON formatında ver:
{
  "metaTitle": "Meta başlık buraya",
  "metaDescription": "Meta açıklama buraya",
  "metaKeywords": "kelime1, kelime2, kelime3",
  "ogTitle": "Sosyal medya başlığı buraya",
  "ogDescription": "Sosyal medya açıklaması buraya"
}`;

        const response = await fetch(
            'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${process.env.NEXT_PUBLIC_HUGGINGFACE_API_KEY}`,
                },
                body: JSON.stringify({
                    inputs: prompt,
                    parameters: {
                        max_new_tokens: 500,
                        temperature: 0.7,
                        top_p: 0.9,
                        repetition_penalty: 1.2,
                        return_full_text: false,
                    },
                }),
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API hatası: ${response.status} ${response.statusText}\n${errorText}`);
        }

        const data = await response.json();
        const responseText = data[0]?.generated_text || '';

        // JSON formatını düzelt
        let jsonText = responseText
            .replace(/[\n\r]/g, '')
            .replace(/\s+/g, ' ')
            .trim();

        const jsonStartIndex = jsonText.indexOf('{');
        const jsonEndIndex = jsonText.lastIndexOf('}') + 1;

        if (jsonStartIndex >= 0 && jsonEndIndex > jsonStartIndex) {
            jsonText = jsonText.substring(jsonStartIndex, jsonEndIndex);

            try {
                const seoData = JSON.parse(jsonText);

                // İçerikleri sınırla ve temizle
                const limitedSeoData = {
                    metaTitle: (seoData.metaTitle?.trim() || title).substring(0, 60),
                    metaDescription: (seoData.metaDescription?.trim() || description).substring(
                        0,
                        155
                    ),
                    metaKeywords: (seoData.metaKeywords?.trim() || techString)
                        .split(',')
                        .map((keyword: string) => keyword.trim())
                        .filter((keyword: string) => keyword)
                        .slice(0, 10)
                        .join(', '),
                    ogTitle: (seoData.ogTitle?.trim() || title).substring(0, 60),
                    ogDescription: (seoData.ogDescription?.trim() || description).substring(0, 155),
                };

                return limitedSeoData;
            } catch (error) {
                // JSON ayrıştırma hatası durumunda varsayılan değerleri sınırla
                return {
                    metaTitle: title.substring(0, 60),
                    metaDescription: description.substring(0, 155),
                    metaKeywords: techString.split(',').slice(0, 10).join(', '),
                    ogTitle: title.substring(0, 60),
                    ogDescription: description.substring(0, 155),
                };
            }
        }

        // JSON bulunamazsa varsayılan değerleri sınırla
        return {
            metaTitle: title.substring(0, 60),
            metaDescription: description.substring(0, 155),
            metaKeywords: techString.split(',').slice(0, 10).join(', '),
            ogTitle: title.substring(0, 60),
            ogDescription: description.substring(0, 155),
        };
    } catch (error) {
        // Hata durumunda varsayılan değerleri sınırla
        return {
            metaTitle: title.substring(0, 60),
            metaDescription: description.substring(0, 155),
            metaKeywords: technologies
                .filter(tech => tech.trim() !== '')
                .slice(0, 10)
                .join(', '),
            ogTitle: title.substring(0, 60),
            ogDescription: description.substring(0, 155),
        };
    }
}
