import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Content from '@/models/Content';
import { revalidatePath, revalidateTag } from 'next/cache';
import mongoose from 'mongoose';

export async function GET(request, { params }) {
    try {
        const { locale } = await params;

        // Desteklenen dilleri kontrol et
        if (locale !== 'tr' && locale !== 'en') {
            return NextResponse.json({ error: 'Desteklenmeyen dil' }, { status: 400 });
        }

        await connectToDatabase();

        // MongoDB koleksiyonuna doğrudan erişim
        const db = mongoose.connection;
        const contentsCollection = db.collection('contents');

        // Veritabanından içeriği al
        const content = await contentsCollection.findOne({ locale });

        if (!content) {
            return NextResponse.json({ error: 'İçerik bulunamadı' }, { status: 404 });
        }

        // İsteğin bir revalidate secret içerip içermediğini kontrol et
        const searchParams = request.nextUrl.searchParams;
        const secret = searchParams.get('secret');
        const shouldRevalidate = secret === process.env.REVALIDATE_SECRET;

        // Eğer revalidate isteği ise, ilgili yolları revalidate et
        if (shouldRevalidate) {
            revalidatePath(`/${locale}`);
            revalidatePath(`/${locale}/projects`);
            revalidateTag(`content-${locale}`);
            return NextResponse.json({ revalidated: true, timestamp: Date.now() }, { status: 200 });
        }

        return NextResponse.json(content, {
            status: 200,
            headers: {
                'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
            },
        });
    } catch (error) {
        console.error('İçerik getirme hatası:', error);
        return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
    }
}

export async function PUT(request, { params }) {
    try {
        const { locale } = await params;

        // Desteklenen dilleri kontrol et
        if (locale !== 'tr' && locale !== 'en') {
            return NextResponse.json({ error: 'Desteklenmeyen dil' }, { status: 400 });
        }

        // İsteğin güvenlik kontrolü
        const secret = request.headers.get('x-revalidate-secret');
        if (secret !== process.env.REVALIDATE_SECRET) {
            return NextResponse.json({ error: 'Yetkilendirme hatası' }, { status: 401 });
        }

        const contentData = await request.json();
        await connectToDatabase();

        // MongoDB koleksiyonuna doğrudan erişim
        const db = mongoose.connection;
        const contentsCollection = db.collection('contents');

        // Timestamp ekleyelim
        contentData.updatedAt = new Date();

        // İçeriği güncelle
        const result = await contentsCollection.findOneAndUpdate(
            { locale },
            { $set: contentData },
            { upsert: true, returnDocument: 'after' }
        );

        const updatedContent = result.value;

        // İlgili sayfaları revalidate et
        revalidatePath(`/${locale}`);
        revalidatePath(`/${locale}/projects`);
        revalidateTag(`content-${locale}`);

        return NextResponse.json(updatedContent, { status: 200 });
    } catch (error) {
        console.error('İçerik güncelleme hatası:', error);
        return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
    }
}
