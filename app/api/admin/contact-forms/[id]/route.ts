import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import ContactForm from '@/models/ContactForm';
import { validateToken } from '@/lib/auth-middleware';
import mongoose from 'mongoose';

// Belirli bir iletişim formunu getir
export async function GET(req, { params }) {
    try {
        // Admin tokenı doğrula
        const validation = await validateToken(req);
        if (!validation.isValid) {
            return NextResponse.json(
                { error: validation.error },
                { status: validation.statusCode }
            );
        }

        // Veritabanına bağlan
        await connectToDatabase();

        // Doğrudan mongoose bağlantısı ile collection'a eriş
        const db = mongoose.connection;
        const contactFormsCollection = db.collection('contactforms');

        // params'ı bekleyip id'yi alın
        const { id } = await params;

        // İletişim formunu ID ile bul
        const objectId = new mongoose.Types.ObjectId(id);
        const form = await contactFormsCollection.findOne({ _id: objectId });

        if (!form) {
            return NextResponse.json({ error: 'İletişim formu bulunamadı' }, { status: 404 });
        }

        return NextResponse.json({ form });
    } catch (error) {
        console.error('İletişim formu detayı getirme hatası:', error);
        return NextResponse.json(
            { error: 'İletişim formu detayı getirilirken bir hata oluştu' },
            { status: 500 }
        );
    }
}

// İletişim formunu sil
export async function DELETE(req, { params }) {
    try {
        // Admin tokenı doğrula
        const validation = await validateToken(req);
        if (!validation.isValid) {
            return NextResponse.json(
                { error: validation.error },
                { status: validation.statusCode }
            );
        }

        // Veritabanına bağlan
        await connectToDatabase();

        // Doğrudan mongoose bağlantısı ile collection'a eriş
        const db = mongoose.connection;
        const contactFormsCollection = db.collection('contactforms');

        // params'ı bekleyip id'yi alın
        const { id } = await params;

        // Hata ayıklama için ID'yi loglayalım
        console.log(`Silinecek form ID: ${id}`);

        try {
            // İletişim formunu ID ile sil
            const objectId = new mongoose.Types.ObjectId(id);

            // deleteOne ile silme işlemi yapıp sonucu kontrol edelim
            const result = await contactFormsCollection.deleteOne({ _id: objectId });

            console.log(`Silme sonucu:`, result);

            if (result.deletedCount === 0) {
                return NextResponse.json(
                    {
                        error: 'İletişim formu bulunamadı veya silinemedi',
                        details: `ID: ${id}, Silinen kayıt sayısı: 0`,
                    },
                    { status: 404 }
                );
            }

            return NextResponse.json({
                success: true,
                message: 'İletişim formu başarıyla silindi',
                deletedId: id,
            });
        } catch (idError) {
            console.error(`ID dönüştürme veya silme hatası: ${idError.message}`);
            return NextResponse.json(
                {
                    error: 'Geçersiz ID formatı veya veritabanı hatası',
                    details: idError.message,
                },
                { status: 400 }
            );
        }
    } catch (error) {
        console.error('İletişim formu silme hatası:', error);
        return NextResponse.json(
            { error: 'İletişim formu silinirken bir hata oluştu' },
            { status: 500 }
        );
    }
}
