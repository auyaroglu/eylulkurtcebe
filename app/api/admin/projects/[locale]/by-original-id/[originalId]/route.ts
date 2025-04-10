import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Project from '@/models/Project';
import { withAuth } from '@/lib/auth-middleware';
import mongoose from 'mongoose';

// originalId ile proje getirme
async function getHandler(
    req: NextRequest,
    user: any,
    { params }: { params: Promise<{ locale: string; originalId: string }> }
) {
    // params'ı bekleyerek locale ve originalId'yi al
    const { locale, originalId } = await params;

    if (locale !== 'tr' && locale !== 'en') {
        return NextResponse.json({ error: 'Geçersiz dil kodu' }, { status: 400 });
    }

    try {
        await connectToDatabase();

        console.log(`${locale} dilinde originalId='${originalId}' ile proje aranıyor`);

        // Doğrudan mongoose bağlantısı ile koleksiyona erişim
        const db = mongoose.connection;
        const projectsCollection = db.collection('projects');

        // originalId ile projeyi bul
        const project = await projectsCollection.findOne({ locale, originalId });

        if (!project) {
            console.log(`${locale} dilinde originalId='${originalId}' ile proje bulunamadı`);
            return NextResponse.json({ error: 'Proje bulunamadı' }, { status: 404 });
        }

        console.log(
            `${locale} dilinde originalId='${originalId}' ile proje bulundu: ${project.id}`
        );
        return NextResponse.json(project);
    } catch (error) {
        console.error('originalId ile proje getirme hatası:', error);
        return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
    }
}

// originalId ile proje güncelleme
async function putHandler(
    req: NextRequest,
    user: any,
    { params }: { params: Promise<{ locale: string; originalId: string }> }
) {
    // params'ı bekleyerek locale ve originalId'yi al
    const { locale, originalId } = await params;

    console.log(`PUT /api/admin/projects/${locale}/by-original-id/${originalId} isteği alındı`);

    if (locale !== 'tr' && locale !== 'en') {
        return NextResponse.json({ error: 'Geçersiz dil kodu' }, { status: 400 });
    }

    try {
        const projectData = await req.json();
        console.log(`Gelen proje verileri:`, JSON.stringify(projectData, null, 2));

        // _id gibi değiştirilemeyecek alanları temizle
        delete projectData._id;
        delete projectData.__v;

        await connectToDatabase();

        // Doğrudan mongoose bağlantısı ile koleksiyona erişim
        const db = mongoose.connection;
        const projectsCollection = db.collection('projects');

        // originalId ile projeyi bul
        const existingProject = await projectsCollection.findOne({ locale, originalId });

        if (!existingProject) {
            console.error(
                `${locale} dilinde originalId=${originalId} olan proje bulunamadı. Güncelleme yapılamıyor.`
            );
            return NextResponse.json(
                { error: `${locale} dilinde proje bulunamadı` },
                { status: 404 }
            );
        }

        // Proje bulundu, gerekli alanları güvenceye al
        console.log(
            `${locale} dilinde ${existingProject.id} ID'li proje bulundu, güncelleniyor...`
        );

        // locale değerini garantiye al
        projectData.locale = locale;

        // id değiştirilmemişse mevcut id'yi kullan
        if (!projectData.id || projectData.id.trim() === '') {
            projectData.id = existingProject.id;
        }

        // originalId asla değiştirilmemeli
        projectData.originalId = originalId;

        // MongoDB güncelleme işlemi - iki aşamalı yaklaşım
        // 1. Önce updateOne ile güncelleme yap
        const updateResult = await projectsCollection.updateOne(
            { locale, originalId },
            { $set: projectData }
        );

        if (updateResult.matchedCount === 0) {
            console.error(
                `${locale} dilinde originalId=${originalId} olan proje bulunamadı. Güncelleme yapılamıyor.`
            );
            return NextResponse.json(
                { error: `${locale} dilinde proje bulunamadı` },
                { status: 404 }
            );
        }

        if (updateResult.modifiedCount === 0) {
            console.warn(
                `${locale} dilinde ${existingProject.id} ID'li proje bulundu ancak hiçbir değişiklik yapılmadı.`
            );
        }

        // 2. Sonra findOne ile güncellenmiş veriyi al
        const updatedProject = await projectsCollection.findOne({ locale, originalId });

        if (!updatedProject) {
            console.error(`${locale} dilinde ${existingProject.id} ID'li proje güncellenemedi`);
            return NextResponse.json({ error: 'Proje güncellenemedi' }, { status: 500 });
        }

        console.log(`${locale} dilinde ${updatedProject.id} ID'li proje başarıyla güncellendi`);

        // Görseller değiştiyse diğer dildeki karşılığında da güncelle
        if (projectData.images && projectData.images.length > 0) {
            try {
                const otherLocale = locale === 'tr' ? 'en' : 'tr';
                const otherProject = await projectsCollection.findOne({
                    locale: otherLocale,
                    originalId,
                });

                if (otherProject) {
                    console.log(
                        `Diğer dildeki (${otherLocale}) ilişkili projeye görseller de güncelleniyor...`
                    );
                    await projectsCollection.updateOne(
                        { _id: otherProject._id },
                        { $set: { images: projectData.images } }
                    );
                    console.log(`Diğer dildeki projede görseller güncellendi.`);
                }
            } catch (error) {
                console.error('Diğer dildeki projenin görsellerini güncelleme hatası:', error);
            }
        }

        return NextResponse.json(updatedProject);
    } catch (error) {
        console.error('originalId ile proje güncelleme hatası:', error);
        return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
    }
}

export const GET = withAuth(getHandler);
export const PUT = withAuth(putHandler);
