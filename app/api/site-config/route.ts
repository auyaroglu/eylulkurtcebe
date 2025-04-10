import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import SiteConfig from '@/models/SiteConfig';
import { withAuth } from '@/lib/auth-middleware';
import mongoose from 'mongoose';

// Site ayarlarını alma endpoint'i
export async function GET() {
    try {
        await connectToDatabase();

        // MongoDB koleksiyonuna doğrudan erişim
        const db = mongoose.connection;
        const siteConfigCollection = db.collection('siteconfigs');

        // Veritabanından ayarları al
        const config = await siteConfigCollection.findOne({});

        // Eğer ayarlar yoksa, varsayılan değerleri döndür
        if (!config) {
            return NextResponse.json({
                siteUrl: process.env.SITE_URL || 'eylulkurtcebe.com',
                contactEmail: 'info@eylulkurtcebe.com',
                displayEmail: 'info@eylulkurtcebe.com',
                seo: {
                    title: 'Eylül Kurtcebe - Kişisel Portfolyo',
                    description: 'Eylül Kurtcebe kişisel portfolyo sitesi',
                    keywords: 'iç mimarlık, tasarım, portfolyo',
                    ogImage: '/logo.webp',
                },
                pagination: {
                    itemsPerPage: 9,
                },
                robotsEnabled: false,
            });
        }

        // Config'i düz JSON nesnesine dönüştür
        const configData = JSON.parse(JSON.stringify(config));

        // Ortam değişkenlerinden site URL'i ekle
        configData.siteUrl = process.env.SITE_URL || 'eylulkurtcebe.com';

        return NextResponse.json(configData);
    } catch (error) {
        console.error('Site yapılandırması alınırken hata:', error);
        return NextResponse.json({ error: 'Site yapılandırması alınamadı' }, { status: 500 });
    }
}

// Site ayarlarını güncelleme endpoint'i (admin yetkisi gerektirir)
async function putHandler(req: NextRequest) {
    try {
        const body = await req.json();

        await connectToDatabase();

        // MongoDB koleksiyonuna doğrudan erişim
        const db = mongoose.connection;
        const siteConfigCollection = db.collection('siteconfigs');

        // Veritabanındaki ayarları bul
        const config = await siteConfigCollection.findOne({});

        // Timestamp ekleyelim
        const updateData = {
            ...body,
            updatedAt: new Date(),
        };

        if (config) {
            // Mevcut ayarları güncelle
            await siteConfigCollection.updateOne({ _id: config._id }, { $set: updateData });
        } else {
            // Yeni ayarlar oluştur - oluşturma zamanı da ekleyelim
            updateData.createdAt = new Date();
            await siteConfigCollection.insertOne(updateData);
        }

        // Güncellenmiş ayarları al
        const updatedConfig = await siteConfigCollection.findOne({});

        return NextResponse.json({
            success: true,
            message: 'Site ayarları güncellendi',
            data: updatedConfig,
        });
    } catch (error) {
        console.error('Site yapılandırması güncellenirken hata:', error);
        return NextResponse.json({ error: 'Site yapılandırması güncellenemedi' }, { status: 500 });
    }
}

export const PUT = withAuth(putHandler);
