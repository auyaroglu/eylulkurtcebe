import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Project from '@/models/Project';
import ProjectTranslation from '@/models/ProjectTranslation';
import { revalidatePath, revalidateTag } from 'next/cache';
import { unlink, access } from 'fs/promises';
import { constants } from 'fs';
import path from 'path';
import mongoose from 'mongoose';

export async function GET(request, { params }) {
    try {
        const { locale } = await params;
        const { searchParams } = new URL(request.url);
        const projectId = searchParams.get('id');
        const secret = searchParams.get('secret');

        // Desteklenen dilleri kontrol et
        if (locale !== 'tr' && locale !== 'en') {
            return NextResponse.json({ error: 'Desteklenmeyen dil' }, { status: 400 });
        }

        await connectToDatabase();

        // Doğrudan MongoDB koleksiyonlarına erişim
        const db = mongoose.connection;
        const projectsCollection = db.collection('projects');
        const projectTranslationsCollection = db.collection('projecttranslations');

        // Revalidate isteği mi kontrolü
        const shouldRevalidate = secret === process.env.REVALIDATE_SECRET;
        if (shouldRevalidate) {
            revalidatePath(`/${locale}`);
            revalidatePath(`/${locale}/projects`);
            if (projectId) {
                revalidatePath(`/${locale}/projects/${projectId}`);
            }
            revalidateTag(`projects-${locale}`);
            return NextResponse.json({ revalidated: true, timestamp: Date.now() }, { status: 200 });
        }

        // Çeviri verilerini al
        const projectTranslation = await projectTranslationsCollection.findOne({ locale });

        if (!projectTranslation) {
            return NextResponse.json({ error: 'Proje çevirileri bulunamadı' }, { status: 404 });
        }

        let projects;

        // Eğer proje ID'si verilmişse, sadece o projeyi getir
        if (projectId) {
            projects = await projectsCollection.findOne({ locale, id: projectId });

            if (!projects) {
                return NextResponse.json({ error: 'Proje bulunamadı' }, { status: 404 });
            }

            return NextResponse.json(projects, {
                status: 200,
                headers: {
                    'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
                },
            });
        }

        // Tüm projeleri getir
        projects = await projectsCollection.find({ locale }).sort({ createdAt: -1 }).toArray();

        // Proje çevirilerini ve projeleri birleştir
        const response = {
            ...projectTranslation,
            list: projects,
        };

        return NextResponse.json(response, {
            status: 200,
            headers: {
                'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
            },
        });
    } catch (error) {
        console.error('Projeler getirme hatası:', error);
        return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
    }
}

export async function POST(request, { params }) {
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

        const projectData = await request.json();
        await connectToDatabase();

        // Doğrudan MongoDB koleksiyonlarına erişim
        const db = mongoose.connection;
        const projectsCollection = db.collection('projects');

        // Yeni proje oluştur - createdAt ekle
        const newProjectData = {
            ...projectData,
            locale,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const result = await projectsCollection.insertOne(newProjectData);
        const newProject = await projectsCollection.findOne({ _id: result.insertedId });

        // İlgili sayfaları revalidate et
        revalidatePath(`/${locale}`);
        revalidatePath(`/${locale}/projects`);
        revalidateTag(`projects-${locale}`);

        return NextResponse.json(newProject, { status: 201 });
    } catch (error) {
        console.error('Proje oluşturma hatası:', error);
        return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
    }
}

export async function PUT(request, { params }) {
    try {
        const { locale } = await params;
        const { searchParams } = new URL(request.url);
        const projectId = searchParams.get('id');

        // ID ve dil kontrolü
        if (!projectId) {
            return NextResponse.json({ error: 'Proje ID parametresi eksik' }, { status: 400 });
        }

        if (locale !== 'tr' && locale !== 'en') {
            return NextResponse.json({ error: 'Desteklenmeyen dil' }, { status: 400 });
        }

        // İsteğin güvenlik kontrolü
        const secret = request.headers.get('x-revalidate-secret');
        if (secret !== process.env.REVALIDATE_SECRET) {
            return NextResponse.json({ error: 'Yetkilendirme hatası' }, { status: 401 });
        }

        const updateData = await request.json();
        await connectToDatabase();

        // Doğrudan MongoDB koleksiyonlarına erişim
        const db = mongoose.connection;
        const projectsCollection = db.collection('projects');

        // Güncelleme tarihini ekle
        updateData.updatedAt = new Date();

        // Projeyi güncelle
        const result = await projectsCollection.findOneAndUpdate(
            { id: projectId, locale },
            { $set: updateData },
            { returnDocument: 'after' }
        );

        const updatedProject = result.value;

        if (!updatedProject) {
            return NextResponse.json({ error: 'Proje bulunamadı' }, { status: 404 });
        }

        // İlgili sayfaları revalidate et
        revalidatePath(`/${locale}`);
        revalidatePath(`/${locale}/projects`);
        revalidatePath(`/${locale}/projects/${projectId}`);
        revalidateTag(`projects-${locale}`);

        return NextResponse.json(updatedProject, { status: 200 });
    } catch (error) {
        console.error('Proje güncelleme hatası:', error);
        return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    try {
        const { locale } = await params;
        const { searchParams } = new URL(request.url);
        const projectId = searchParams.get('id');

        // ID ve dil kontrolü
        if (!projectId) {
            return NextResponse.json({ error: 'Proje ID parametresi eksik' }, { status: 400 });
        }

        if (locale !== 'tr' && locale !== 'en') {
            return NextResponse.json({ error: 'Desteklenmeyen dil' }, { status: 400 });
        }

        // İsteğin güvenlik kontrolü
        const secret = request.headers.get('x-revalidate-secret');
        if (secret !== process.env.REVALIDATE_SECRET) {
            return NextResponse.json({ error: 'Yetkilendirme hatası' }, { status: 401 });
        }

        await connectToDatabase();

        // Doğrudan MongoDB koleksiyonlarına erişim
        const db = mongoose.connection;
        const projectsCollection = db.collection('projects');

        // Projeyi silmeden önce görsel yollarını al
        const project = await projectsCollection.findOne({ id: projectId, locale });

        if (!project) {
            return NextResponse.json({ error: 'Proje bulunamadı' }, { status: 404 });
        }

        console.log(
            `[GENEL-API SİLME] Proje bulundu: ${projectId}, görsel sayısı: ${
                project.images?.length || 0
            }`
        );

        // Projeyi sil
        await projectsCollection.deleteOne({ id: projectId, locale });

        // Görsel dosyalarını sil
        if (project.images && project.images.length > 0) {
            try {
                await deleteImageFiles(project.images);
            } catch (error) {
                console.error('Görsel dosyaları silinirken hata:', error);
                // Görsel silme hatası olsa bile projeyi sildiğimiz için devam ediyoruz
            }
        }

        // İlgili sayfaları revalidate et
        revalidatePath(`/${locale}`);
        revalidatePath(`/${locale}/projects`);
        revalidateTag(`projects-${locale}`);

        return NextResponse.json(
            { success: true, message: 'Proje başarıyla silindi' },
            { status: 200 }
        );
    } catch (error) {
        console.error('Proje silme hatası:', error);
        return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
    }
}

// Görsel dosyalarını sunucudan silen yardımcı fonksiyon
async function deleteImageFiles(imageUrls: string[]) {
    const results = {
        success: [] as string[],
        errors: [] as string[],
    };

    for (const imageUrl of imageUrls) {
        try {
            // URL'den dosya adını çıkar
            const fileName = imageUrl.split('/').pop();

            if (!fileName) {
                results.errors.push(`${imageUrl} (geçersiz dosya adı)`);
                continue;
            }

            // Dosyanın fiziksel yolunu belirle
            const filePath = path.join(process.cwd(), 'public', 'images', 'projects', fileName);

            // Dosyanın var olup olmadığını kontrol et
            try {
                await access(filePath, constants.F_OK);
            } catch (err) {
                // Dosya bulunamadıysa hata mesajını kaydet ve bir sonraki dosyaya geç
                results.errors.push(`${fileName} (dosya bulunamadı)`);
                continue;
            }

            // Dosyayı sil
            await unlink(filePath);
            results.success.push(fileName);
        } catch (error) {
            console.error(`Görsel dosyası silinirken hata: ${imageUrl}`, error);
            results.errors.push(imageUrl);
        }
    }

    return results;
}
