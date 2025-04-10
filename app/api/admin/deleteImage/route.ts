import { NextRequest, NextResponse } from 'next/server';
import { unlink, access } from 'fs/promises';
import { constants } from 'fs';
import path from 'path';
import { withAuth } from '@/lib/auth-middleware';

async function handler(req: NextRequest) {
    if (req.method !== 'POST') {
        return NextResponse.json({ error: 'Yalnızca POST metodu desteklenir' }, { status: 405 });
    }

    try {
        // İsteği işle
        const data = await req.json();
        const { fileName } = data;

        if (!fileName) {
            return NextResponse.json({ error: 'Dosya adı gereklidir' }, { status: 400 });
        }

        // Güvenlik kontrolü: dosya adının güvenli olduğundan emin ol
        if (fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) {
            return NextResponse.json({ error: 'Geçersiz dosya adı' }, { status: 400 });
        }

        // Dosyanın fiziksel yolunu belirle
        const filePath = path.join(process.cwd(), 'public', 'images', 'projects', fileName);

        // Dosyanın var olup olmadığını kontrol et
        try {
            await access(filePath, constants.F_OK);
        } catch (err) {
            console.log(`Dosya bulunamadı: ${filePath}`);
            return NextResponse.json({ error: 'Dosya bulunamadı' }, { status: 404 });
        }

        // Dosyayı sil
        await unlink(filePath);

        return NextResponse.json({
            success: true,
            message: 'Görsel dosyası başarıyla silindi',
            fileName,
        });
    } catch (error) {
        console.error('Görsel silme hatası:', error);
        return NextResponse.json({ error: 'Dosya silinirken bir hata oluştu' }, { status: 500 });
    }
}

export const POST = withAuth(handler);
