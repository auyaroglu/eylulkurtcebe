import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import ContactForm from '@/models/ContactForm';
import { validateToken } from '@/lib/auth-middleware';
import mongoose from 'mongoose';

// Bütün iletişim formlarını getir (sayfalama ve arama ile)
export async function GET(req: NextRequest) {
    try {
        // Admin tokenı doğrula
        const validation = await validateToken(req);
        if (!validation.isValid) {
            return NextResponse.json(
                { error: validation.error },
                { status: validation.statusCode }
            );
        }

        // URL parametrelerini al
        const url = new URL(req.url);
        const page = parseInt(url.searchParams.get('page') || '1');
        const limit = parseInt(url.searchParams.get('limit') || '10');
        const search = url.searchParams.get('search') || '';

        // Veritabanına bağlan
        await connectToDatabase();

        // Doğrudan mongoose bağlantısı ile collection'a eriş
        const db = mongoose.connection;
        const contactFormsCollection = db.collection('contactforms');

        // Arama filtresi oluştur
        const filter: any = {};
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { message: { $regex: search, $options: 'i' } },
            ];
        }

        // Toplam form sayısını hesapla
        const total = await contactFormsCollection.countDocuments(filter);
        const totalPages = Math.ceil(total / limit);

        // İletişim formlarını getir (yeniden eskiye doğru sırala)
        const forms = await contactFormsCollection
            .find(filter)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .toArray();

        return NextResponse.json({
            forms,
            page,
            limit,
            totalPages,
            totalCount: total,
        });
    } catch (error) {
        console.error('İletişim formları getirme hatası:', error);
        return NextResponse.json(
            { error: 'İletişim formları getirilirken bir hata oluştu' },
            { status: 500 }
        );
    }
}
