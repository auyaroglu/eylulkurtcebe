import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import mongoose from 'mongoose';
import Content from '@/models/Content';
import { withAuth } from '@/lib/auth-middleware';
import { revalidatePath, revalidateTag } from 'next/cache';

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

        // İçeriği güncelle
        const result = await db.collection('contents').updateOne({ locale }, { $set: contentData });

        if (result.matchedCount === 0) {
            return NextResponse.json({ error: 'İçerik bulunamadı' }, { status: 404 });
        }

        // Güncellenen içeriği al
        const updatedContent = await db.collection('contents').findOne({ locale });

        // Temizlenecek yolları belirle
        const pathsToRevalidate = [
            '/',
            `/${locale}`,
            `/${locale}/projects`,
            '/api/admin/content',
            `/api/admin/content/${locale}`,
            `/api/content/${locale}`,
            `/api/content`,
            `/api/site-settings`,
        ];

        // Önbelleği kapsamlı şekilde temizle
        // Her yol için hem layout hem de page revalidasyonu uygula
        for (const path of pathsToRevalidate) {
            try {
                revalidatePath(path, 'layout');
                revalidatePath(path, 'page');
                console.log(`Sayfa önbelleği temizlendi: ${path}`);
            } catch (revalidateError) {
                console.error(`Sayfa önbelleği temizleme hatası (${path}):`, revalidateError);
            }
        }

        // Tüm ilgili etiketleri temizle
        const tagsToRevalidate = [
            'content',
            'navigation',
            `content-${locale}`,
            `navigation-${locale}`,
            'site-content',
            'footer',
            'site-settings',
            'site-config',
        ];

        for (const tag of tagsToRevalidate) {
            try {
                revalidateTag(tag);
                console.log(`Etiket önbelleği temizlendi: ${tag}`);
            } catch (tagError) {
                console.error(`Etiket önbelleği temizleme hatası (${tag}):`, tagError);
            }
        }

        console.log(`${locale} içeriği güncellendi ve önbellekler temizlendi`);

        // Güncellenmiş içeriği döndür
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
