import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Project from '@/models/Project';
import { withAuth } from '@/lib/auth-middleware';
import mongoose from 'mongoose';

// Benzersiz slug oluşturma fonksiyonu
async function generateUniqueSlug(
    baseSlug: string,
    locale: string,
    currentOriginalId?: string
): Promise<string> {
    let slug = baseSlug;
    let counter = 1;
    let isUnique = false;

    const db = mongoose.connection;
    const projectsCollection = db.collection('projects');

    while (!isUnique) {
        // Eğer bir originalId belirtilmişse, kendi projesini dışlamak için kontrol ekliyoruz
        const query: any = { locale, id: slug };
        if (currentOriginalId) {
            query.originalId = { $ne: currentOriginalId };
        }

        const existingProject = await projectsCollection.findOne(query);

        if (!existingProject) {
            isUnique = true;
        } else {
            slug = `${baseSlug}${counter}`;
            counter++;
        }
    }

    return slug;
}

async function handler(req: NextRequest, user: any): Promise<NextResponse> {
    try {
        await connectToDatabase();

        const db = mongoose.connection;
        const projectsCollection = db.collection('projects');

        // URL'den parametreleri al
        const { searchParams } = new URL(req.url);
        const slug = searchParams.get('slug');
        const locale = searchParams.get('locale') || 'tr';
        const originalId = searchParams.get('originalId');
        const currentId = searchParams.get('currentId');

        if (!slug) {
            return NextResponse.json({ error: 'Slug parametresi gereklidir' }, { status: 400 });
        }

        // Aynı originalId'ye sahip projeyi dışlayarak slug kontrolü
        const query: any = { locale, id: slug };
        if (originalId) {
            query.originalId = { $ne: originalId };
        }

        // Eğer bu işlem bir güncelleme ise ve kendi slug değerini kontrol ediyorsak
        if (currentId && currentId === slug) {
            console.log(
                'Proje kendi slug değerini kontrol ediyor, mevcut değeri koruyabilir:',
                slug
            );
            return NextResponse.json({
                isAvailable: true,
                slug,
            });
        }

        const existingProject = await projectsCollection.findOne(query);

        if (!existingProject) {
            return NextResponse.json({
                isAvailable: true,
                slug,
            });
        }

        // Slug kullanılıyorsa benzersiz bir slug öner
        const uniqueSlug = await generateUniqueSlug(slug, locale, originalId || undefined);

        return NextResponse.json({
            isAvailable: false,
            suggestedSlug: uniqueSlug,
        });
    } catch (error) {
        console.error('Slug kontrolü hatası:', error);
        return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
    }
}

export const GET = withAuth(handler);
