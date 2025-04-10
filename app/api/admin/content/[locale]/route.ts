import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import mongoose from 'mongoose';
import Content from '@/models/Content';
import { withAuth } from '@/lib/auth-middleware';

// İçerik getirme
async function getHandler(
    req: NextRequest,
    user: any,
    { params }: { params: Promise<{ locale: string }> }
) {
    const { locale } = await params;

    if (locale !== 'tr' && locale !== 'en') {
        return NextResponse.json({ error: 'Geçersiz dil kodu' }, { status: 400 });
    }

    try {
        await connectToDatabase();

        // Mongoose modeli yerine doğrudan MongoDB bağlantısı kullanarak
        const db = mongoose.connection;
        const content = await db.collection('contents').findOne({ locale });

        if (!content) {
            return NextResponse.json({ error: 'İçerik bulunamadı' }, { status: 404 });
        }

        return NextResponse.json(content);
    } catch (error) {
        console.error('İçerik getirme hatası:', error);
        return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
    }
}

// İçerik güncelleme
async function putHandler(
    req: NextRequest,
    user: any,
    { params }: { params: Promise<{ locale: string }> }
) {
    const { locale } = await params;

    if (locale !== 'tr' && locale !== 'en') {
        return NextResponse.json({ error: 'Geçersiz dil kodu' }, { status: 400 });
    }

    try {
        const contentData = await req.json();

        // MongoDB tarafından yönetilen alanları kaldır
        if (contentData._id) delete contentData._id;
        if (contentData.__v !== undefined) delete contentData.__v;
        if (contentData.createdAt) delete contentData.createdAt;
        if (contentData.updatedAt) delete contentData.updatedAt;

        // Mongoose yerine doğrudan MongoDB bağlantısı kullanarak şema validasyonunu pas geçeceğiz
        await connectToDatabase();

        // URL temizleme işlemini kaldırdık
        // Kullanıcı ne girdiyse aynen veritabanına kaydediyoruz
        console.log('Düzeltilmiş içerik verisi:', JSON.stringify(contentData.footer, null, 2));

        // Doğrudan MongoDB koleksiyonuna erişelim
        const db = mongoose.connection.db;

        if (!db) {
            throw new Error('Veritabanı bağlantısı kurulamadı');
        }

        const result = await db.collection('contents').updateOne({ locale }, { $set: contentData });

        if (result.matchedCount === 0) {
            return NextResponse.json({ error: 'İçerik bulunamadı' }, { status: 404 });
        }

        // Güncellenen içeriği dönelim
        const updatedContent = await db.collection('contents').findOne({ locale });
        return NextResponse.json(updatedContent);
    } catch (error: any) {
        console.error('İçerik güncelleme hatası:', error);
        // Detaylı hata bilgisi
        return NextResponse.json(
            {
                error: 'İçerik güncellenirken hata oluştu',
                details: error.message || 'Bilinmeyen hata',
            },
            { status: 500 }
        );
    }
}

export const GET = withAuth(getHandler);
export const PUT = withAuth(putHandler);
