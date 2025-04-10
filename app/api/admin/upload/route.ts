import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { withAuth } from '@/lib/auth-middleware';
import crypto from 'crypto';

async function handler(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;
        const type = formData.get('type') as string; // 'logo' veya 'ogImage'

        if (!file) {
            return NextResponse.json({ error: 'Dosya bulunamadı' }, { status: 400 });
        }

        // Dosya türünü kontrol et
        if (!type || (type !== 'logo' && type !== 'ogImage' && type !== 'project')) {
            return NextResponse.json(
                { error: 'Geçersiz dosya türü. Sadece logo, ogImage veya project kabul edilir' },
                { status: 400 }
            );
        }

        // Dosya boyutu kontrolü (5MB)
        if (file.size > 5 * 1024 * 1024) {
            return NextResponse.json(
                { error: "Dosya boyutu 5MB'dan büyük olamaz" },
                { status: 400 }
            );
        }

        // Dosya türü kontrolü
        const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (!validTypes.includes(file.type)) {
            return NextResponse.json(
                {
                    error: 'Yalnızca JPEG, PNG, WebP ve GIF dosyaları kabul edilir',
                },
                { status: 400 }
            );
        }

        // Dosya ismini güvenli hale getir
        const originalFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');

        // Benzersiz dosya adı oluştur
        const fileExtension = path.extname(originalFileName).toLowerCase();
        const baseName = path.basename(originalFileName, fileExtension);
        const uniqueId = crypto.randomBytes(8).toString('hex');
        const timestamp = Date.now();

        const fileName = `${type}_${baseName}_${uniqueId}_${timestamp}${fileExtension}`;

        // Hedef klasörü belirle
        let uploadDir;

        if (type === 'project') {
            // Proje görselleri için mevcut klasör yapısını kullan
            uploadDir = path.join(process.cwd(), 'public', 'images', 'projects');
        } else {
            // Site görselleri için yeni klasör yapısı
            uploadDir = path.join(process.cwd(), 'public', 'images', 'site');
        }

        const filePath = path.join(uploadDir, fileName);

        // Klasörün var olduğundan emin ol
        await mkdir(uploadDir, { recursive: true });

        // Dosya içeriğini oku
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Dosyayı kaydet
        await writeFile(filePath, buffer);

        // Görselin URL'i
        const imageUrl =
            type === 'project' ? `/images/projects/${fileName}` : `/images/site/${fileName}`;

        return NextResponse.json({
            success: true,
            url: imageUrl,
            filePath: imageUrl, // eski API ile uyumlu olması için
            fileName: fileName,
            type: type,
        });
    } catch (error) {
        console.error('Dosya yükleme hatası:', error);
        return NextResponse.json(
            {
                error: 'Dosya yüklenirken bir hata oluştu',
            },
            { status: 500 }
        );
    }
}

export const POST = withAuth(handler);
