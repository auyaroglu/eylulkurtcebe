import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Project from '@/models/Project';
import { withAuth } from '@/lib/auth-middleware';
import mongoose from 'mongoose';

// Projelerin sıralamasını güncelleme
async function postHandler(req: NextRequest, user: any) {
    try {
        const { locale, orders } = await req.json();

        if (!locale || !orders || !Array.isArray(orders)) {
            return NextResponse.json(
                { error: 'Geçersiz veri formatı. locale ve orders gerekli.' },
                { status: 400 }
            );
        }

        if (locale !== 'tr' && locale !== 'en') {
            return NextResponse.json({ error: 'Geçersiz dil kodu' }, { status: 400 });
        }

        await connectToDatabase();

        const projectsCollection = mongoose.connection.collection('projects');

        // 3 farklı yöntemi deneyelim, en az biri çalışmalı
        let updateSuccess = false;
        let errorMessages: string[] = [];

        // 1. Yöntem: Bulk yazma işlemi (en hızlı)
        try {
            // Bulk operasyonları hazırla
            const bulkOps = orders.map((item: { id: string; order: number }) => {
                const { id, order } = item;

                if (!id || typeof order !== 'number') {
                    throw new Error('Her sıralama öğesi için id ve order değerleri gerekli');
                }

                return {
                    updateOne: {
                        filter: { id, locale },
                        update: { $set: { order } },
                        upsert: false,
                    },
                };
            });

            // Bir toplu yazma işlemi gerçekleştir
            const bulkResult = await projectsCollection.bulkWrite(bulkOps);

            if (bulkResult.modifiedCount > 0) {
                updateSuccess = true;
            } else {
                errorMessages.push('Bulk güncelleme başarısız: Hiçbir döküman güncellenemedi');
            }
        } catch (error) {
            errorMessages.push(
                `Bulk güncelleme hatası: ${error instanceof Error ? error.message : String(error)}`
            );
        }

        // 2. Yöntem: Her bir projeyi doğrudan güncelle (find + update)
        if (!updateSuccess) {
            try {
                let updateCount = 0;
                for (const item of orders) {
                    const { id, order } = item;

                    // Dokümanı bul ve güncelle
                    const updateResult = await projectsCollection.updateOne(
                        { id, locale },
                        { $set: { order } }
                    );

                    if (updateResult.modifiedCount > 0) {
                        updateCount++;
                    }
                }

                if (updateCount > 0) {
                    updateSuccess = true;
                } else {
                    errorMessages.push('updateOne yöntemi başarısız: Hiçbir proje bulunamadı');
                }
            } catch (error) {
                errorMessages.push(
                    `updateOne yöntemi hatası: ${
                        error instanceof Error ? error.message : String(error)
                    }`
                );
            }
        }

        // 3. Yöntem: Raw MongoDB query - updateOne (son çare) - önceki 2. metotla aynı mantıkta çalıştığı için
        // sadece farklı bir implementasyon deniyoruz
        if (!updateSuccess) {
            try {
                let updateCount = 0;

                for (const item of orders) {
                    const { id, order } = item;

                    const updateResult = await projectsCollection.updateOne(
                        { id, locale },
                        { $set: { order } }
                    );

                    if (updateResult.modifiedCount > 0) {
                        updateCount++;
                    }
                }

                if (updateCount > 0) {
                    updateSuccess = true;
                } else {
                    errorMessages.push(
                        'Raw MongoDB yöntemi başarısız: Hiçbir proje güncellenemedi'
                    );
                }
            } catch (error) {
                errorMessages.push(
                    `Raw MongoDB hatası: ${error instanceof Error ? error.message : String(error)}`
                );
            }
        }

        // Güncellemeden sonra projeleri kontrol et
        const projects = await projectsCollection
            .find({ locale })
            .sort({ order: 1 })
            .project({ id: 1, title: 1, order: 1 })
            .toArray();

        if (updateSuccess) {
            return NextResponse.json({
                success: true,
                message: 'Projeler başarıyla güncellendi.',
            });
        } else {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Projeler güncellenemedi.',
                    details: errorMessages,
                },
                { status: 500 }
            );
        }
    } catch (error) {
        return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
    }
}

export const POST = withAuth(postHandler);
