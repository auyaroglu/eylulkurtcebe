import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import mongoose from 'mongoose';
import { deleteImageFile } from '@/lib/site-utils';
import { withAuth } from '@/lib/auth-middleware';

// Site ayarları GET handler
async function getHandler() {
    try {
        await connectToDatabase();

        // Doğrudan veritabanına eriş (model kullanmadan)
        const db = mongoose.connection;
        const configCollection = db.collection('siteconfigs');
        const config = await configCollection.findOne({});

        // Eğer ayar yoksa varsayılan değerleri döndür
        if (!config) {
            const defaultConfig = {
                contactEmail: 'info@eylulkurtcebe.com',
                displayEmail: 'info@eylulkurtcebe.com',
                logo: '/logo.webp',
                seo: {
                    title: {
                        tr: 'Eylül Kurtcebe - Kişisel Portfolyo',
                        en: 'Eylul Kurtcebe - Personal Portfolio',
                    },
                    description: {
                        tr: 'Eylül Kurtcebe kişisel portfolyo sitesi',
                        en: 'Eylul Kurtcebe personal portfolio site',
                    },
                    keywords: {
                        tr: 'iç mimarlık, tasarım, portfolyo',
                        en: 'interior architecture, design, portfolio',
                    },
                    ogImage: '/logo.webp',
                },
                pagination: {
                    itemsPerPage: 9,
                },
                robotsEnabled: false,
            };

            return NextResponse.json(defaultConfig);
        }

        return NextResponse.json(config);
    } catch (error) {
        console.error('Site yapılandırması alınırken hata:', error);
        return NextResponse.json({ error: 'Site yapılandırması alınamadı' }, { status: 500 });
    }
}

// Site ayarları PUT handler
async function putHandler(req: NextRequest) {
    try {
        const body = await req.json();
        console.log('Alınan veri:', body);

        // Veriyi doğrula
        if (!body.contactEmail || !body.displayEmail) {
            return NextResponse.json({ error: 'E-posta bilgileri gereklidir' }, { status: 400 });
        }

        // SEO verilerini format kontrolü
        const seo = body.seo || {};

        // SEO alanlarını normalize et
        const normalizedSeo = {
            title: typeof seo.title === 'object' ? seo.title : { tr: seo.title || '', en: '' },
            description:
                typeof seo.description === 'object'
                    ? seo.description
                    : { tr: seo.description || '', en: '' },
            keywords:
                typeof seo.keywords === 'object'
                    ? seo.keywords
                    : { tr: seo.keywords || '', en: '' },
            ogImage: seo.ogImage || '/logo.webp',
        };

        await connectToDatabase();

        // Doğrudan veritabanına eriş (model kullanmadan)
        const db = mongoose.connection;
        const configCollection = db.collection('siteconfigs');

        // Mevcut ayarları al
        const existingConfig = await configCollection.findOne({});

        // Eski görselleri sakla
        const oldLogo = existingConfig?.logo || null;
        const oldOgImage = existingConfig?.seo?.ogImage || null;

        // Güncellenecek veriyi hazırla
        const updateData: any = {
            contactEmail: body.contactEmail,
            displayEmail: body.displayEmail,
            logo: body.logo || oldLogo || '/logo.webp',
            seo: normalizedSeo,
            pagination: {
                itemsPerPage: parseInt(body.pagination?.itemsPerPage) || 9,
            },
            robotsEnabled: body.robotsEnabled !== undefined ? body.robotsEnabled : false,
            updatedAt: new Date(),
        };

        // Yeni görsel yolları
        const newLogo = updateData.logo;
        const newOgImage = updateData.seo.ogImage;

        // İşlem sonucu
        let result: any = null;

        console.log('Güncellenecek veri:', updateData);
        console.log('Eski logo:', oldLogo, 'Yeni logo:', newLogo);
        console.log('Eski OG görsel:', oldOgImage, 'Yeni OG görsel:', newOgImage);

        if (existingConfig) {
            try {
                // Güncelleme işlemi
                result = await configCollection.findOneAndUpdate(
                    { _id: existingConfig._id },
                    { $set: updateData },
                    { returnDocument: 'after' }
                );

                console.log('Güncelleme sonucu:', result);

                // Değişen görselleri sil
                if (oldLogo && newLogo && oldLogo !== newLogo && oldLogo !== '/logo.webp') {
                    console.log('Eski logo siliniyor:', oldLogo);
                    await deleteImageFile(oldLogo);
                    console.log('Eski logo silindi');
                }

                if (
                    oldOgImage &&
                    newOgImage &&
                    oldOgImage !== newOgImage &&
                    oldOgImage !== '/logo.webp'
                ) {
                    console.log('Eski OG görsel siliniyor:', oldOgImage);
                    await deleteImageFile(oldOgImage);
                    console.log('Eski OG görsel silindi');
                }
            } catch (error) {
                console.error('Güncelleme hatası:', error);
                throw error;
            }
        } else {
            // Yeni veri oluştur
            updateData.createdAt = new Date();
            result = await configCollection.insertOne(updateData);
            console.log('Yeni kayıt oluşturuldu:', result);
        }

        return NextResponse.json({
            success: true,
            message: 'Site ayarları güncellendi',
            data: result?.value || result?.ok || updateData,
        });
    } catch (error) {
        console.error('Site yapılandırması güncellenirken hata:', error);
        return NextResponse.json({ error: 'Site yapılandırması güncellenemedi' }, { status: 500 });
    }
}

export const GET = withAuth(getHandler);
export const PUT = withAuth(putHandler);
