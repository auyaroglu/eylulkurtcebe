import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Project from '@/models/Project';
import Content from '@/models/Content';
import { withAuth } from '@/lib/auth-middleware';
import mongoose from 'mongoose';

interface ContentDocument {
    _id: string;
    locale: string;
    updatedAt: Date;
    [key: string]: any;
}

async function handler(req: NextRequest) {
    try {
        await connectToDatabase();

        const db = mongoose.connection;
        const projectsCollection = db.collection('projects');
        const contentsCollection = db.collection('contents');

        // Projeleri say
        const projectCount = await projectsCollection.countDocuments({ locale: 'tr' });

        // İçerik güncellenme tarihlerini al
        const trContent = (await contentsCollection.findOne({
            locale: 'tr',
        })) as unknown as ContentDocument | null;

        const enContent = (await contentsCollection.findOne({
            locale: 'en',
        })) as unknown as ContentDocument | null;

        return NextResponse.json({
            projectCount,
            trContentUpdated: trContent ? trContent.updatedAt : null,
            enContentUpdated: enContent ? enContent.updatedAt : null,
        });
    } catch (error) {
        console.error('İstatistik alınırken hata oluştu:', error);
        return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
    }
}

export const GET = withAuth(handler);
