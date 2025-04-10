import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Project, { IProject } from '@/models/Project';
import mongoose from 'mongoose';

// originalId ile herkese açık proje getirme
export async function GET(request, { params }) {
    try {
        // Paramları al
        const awaitedParams = await params;
        const locale = awaitedParams?.locale || '';
        const originalId = awaitedParams?.originalId || '';

        console.log(`API çağrısı alındı: locale=${locale}, originalId=${originalId}`);

        if (locale !== 'tr' && locale !== 'en') {
            return NextResponse.json({ error: 'Geçersiz dil kodu' }, { status: 400 });
        }

        await connectToDatabase();

        // MongoDB koleksiyonuna doğrudan erişim
        const db = mongoose.connection;
        const projectsCollection = db.collection('projects');

        // originalId ile projeyi bul - sadece yayındaki projeler
        const project = await projectsCollection.findOne({
            locale,
            originalId,
            status: true, // Sadece yayında olan projeleri getir
        });

        if (!project) {
            console.log(
                `${locale} dilinde originalId=${originalId} ile yayında olan proje bulunamadı`
            );
            return NextResponse.json(
                { error: `${locale} dilinde proje bulunamadı` },
                { status: 404 }
            );
        }

        // TypeScript hatalarını önlemek için proje alanlarına güvenli erişim
        const projectData = {
            id: project.id || '',
            status: typeof project.status === 'boolean' ? project.status : true,
            originalId: project.originalId || '',
        };

        console.log(`Proje bulundu: ${projectData.id}, status=${projectData.status}`);

        // CORS başlığı ekleyelim
        return NextResponse.json(projectData, {
            status: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET',
                'Access-Control-Allow-Headers': 'Content-Type',
            },
        });
    } catch (error) {
        console.error('API hatası:', error);

        return NextResponse.json(
            { error: 'Proje detayları getirilirken bir hata oluştu' },
            { status: 500 }
        );
    }
}
