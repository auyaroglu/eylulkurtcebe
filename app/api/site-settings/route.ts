import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic'; // Varsayılanı dynamic yapın (her istekte)
// Alternatif olarak şöyle kullanabilirsiniz: export const revalidate = 60; // 60 saniyede bir

export async function GET(request: NextRequest) {
    try {
        await connectToDatabase();

        // Doğrudan veritabanına eriş
        const db = mongoose.connection;
        const configCollection = db.collection('siteconfigs');
        const config = await configCollection.findOne({});

        // Ayarlar yoksa varsayılan değerleri döndür
        if (!config) {
            return NextResponse.json(
                {
                    logo: '/logo.webp',
                    robotsEnabled: false,
                    seo: {
                        title: {
                            tr: 'Eylül Kurtcebe - Kişisel Portfolyo',
                            en: 'Eylul Kurtcebe - Personal Portfolio',
                        },
                        description: {
                            tr: 'Eylül Kurtcebe - Seramik sanatçısı ve Ar-Ge kimyageri olarak seramik sırları ve formülasyon geliştirme konusunda profesyonel deneyim.',
                            en: 'Eylul Kurtcebe - Professional experience in ceramic glazes and formulation development as a ceramic artist and R&D chemist.',
                        },
                        keywords: {
                            tr: 'seramik sanatçısı, sır geliştirme, çömlekçilik, seramik, Ar-Ge kimyageri',
                            en: 'ceramic artist, glaze development, pottery, ceramics, R&D chemist',
                        },
                        ogImage: '/logo.webp',
                    },
                },
                {
                    status: 200,
                    headers: {
                        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
                    },
                }
            );
        }

        // Config'i düz nesneye dönüştür
        const cleanConfig = JSON.parse(JSON.stringify(config));

        // Cache-Control header ekleyerek cevap dön
        return NextResponse.json(cleanConfig, {
            status: 200,
            headers: {
                'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
            },
        });
    } catch (error) {
        console.error('Site ayarları API hatası:', error);
        return NextResponse.json(
            { error: 'Site ayarları alınırken bir hata oluştu' },
            { status: 500 }
        );
    }
}
