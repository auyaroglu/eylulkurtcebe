import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import ContactForm from '@/models/ContactForm';
import { validateToken } from '@/lib/auth-middleware';
import mongoose from 'mongoose';

/**
 * İletişim formunun okundu durumunu güncelle
 */
export async function PUT(req, { params }) {
    try {
        // Admin tokenı doğrula
        const validation = await validateToken(req);
        if (!validation.isValid) {
            return NextResponse.json(
                { error: validation.error },
                { status: validation.statusCode }
            );
        }

        // İstek gövdesini al
        const body = await req.json();
        const { isRead } = body;

        if (typeof isRead !== 'boolean') {
            return NextResponse.json(
                { error: 'isRead alanı zorunludur ve boolean olmalıdır' },
                { status: 400 }
            );
        }

        // Veritabanına bağlan
        await connectToDatabase();

        // Doğrudan mongoose bağlantısı ile collection'a eriş
        const db = mongoose.connection;
        const contactFormsCollection = db.collection('contactforms');

        // params'ı bekleyip id'yi alın
        const { id } = await params;

        // İletişim formunu ID ile bul ve güncelle
        const objectId = new mongoose.Types.ObjectId(id);
        const result = await contactFormsCollection.findOneAndUpdate(
            { _id: objectId },
            { $set: { isRead } },
            { returnDocument: 'after' }
        );

        const form = result.value;

        if (!form) {
            return NextResponse.json({ error: 'İletişim formu bulunamadı' }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            message: isRead
                ? 'İletişim formu okundu olarak işaretlendi'
                : 'İletişim formu okunmadı olarak işaretlendi',
            form,
        });
    } catch (error) {
        console.error('İletişim formu güncelleme hatası:', error);
        return NextResponse.json(
            { error: 'İletişim formu güncellenirken bir hata oluştu' },
            { status: 500 }
        );
    }
}
