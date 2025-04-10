import type { Metadata } from 'next';
import '../globals.css';
import { NextIntlClientProvider } from 'next-intl';
import { hasLocale } from 'next-intl';
import { notFound } from 'next/navigation';
import { locales } from '@/i18n';
import { setRequestLocale } from 'next-intl/server';
import { connectToDatabase } from '@/lib/db';
import mongoose from 'mongoose';

// Site ayarlarını getiren fonksiyon
async function getSiteSettings() {
    try {
        await connectToDatabase();

        // Doğrudan veritabanına eriş (model kullanmadan)
        const db = mongoose.connection;
        const configCollection = db.collection('siteconfigs');
        const config = await configCollection.findOne({});

        // Eğer ayarlar yoksa varsayılan değerleri döndür
        if (!config) {
            return {
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
            };
        }

        // Config'i düz nesneye dönüştür (veritabanından gelen özel MongoDB tiplerini temizle)
        return JSON.parse(JSON.stringify(config));
    } catch (error) {
        console.error('Site ayarları alınırken hata:', error);
        return {
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
        };
    }
}

// Dile özgü metadata oluşturmak için kullanılan fonksiyon
export async function generateMetadata({ params }: { params: { lng: string } }): Promise<Metadata> {
    const { lng } = await params;

    // Geçerli dil kontrolü
    if (!hasLocale(locales, lng)) {
        notFound();
    }

    // İçerik dilini ayarla
    setRequestLocale(lng);

    // Site ayarlarını al
    const siteSettings = await getSiteSettings();
    const robotsEnabled = siteSettings?.robotsEnabled === true;
    const robotsContent = robotsEnabled ? 'index, follow' : 'noindex, nofollow';

    // SEO bilgilerini al, varsayılan değerler ve kontrol
    const seo = siteSettings?.seo || {};

    // Başlık için dil ayarına göre değer al (varsayılan değerlerle)
    const title = {
        tr: 'Eylül Kurtcebe - Kişisel Portfolyo',
        en: 'Eylul Kurtcebe - Personal Portfolio',
    };

    // Açıklama için dil ayarına göre değer al (varsayılan değerlerle)
    const description = {
        tr: 'Eylül Kurtcebe - Seramik sanatçısı ve Ar-Ge kimyageri olarak seramik sırları ve formülasyon geliştirme konusunda profesyonel deneyim.',
        en: 'Eylul Kurtcebe - Professional experience in ceramic glazes and formulation development as a ceramic artist and R&D chemist.',
    };

    // Anahtar kelimeler için dil ayarına göre değer al (varsayılan değerlerle)
    const keywords = {
        tr: 'seramik sanatçısı, sır geliştirme, çömlekçilik, seramik, Ar-Ge kimyageri',
        en: 'ceramic artist, glaze development, pottery, ceramics, R&D chemist',
    };

    // OG görsel
    const ogImage = seo.ogImage || siteSettings?.logo || '/logo.webp';

    // Doğru dildeki verileri al
    const titleText = seo.title?.[lng] || title[lng];
    const descriptionText = seo.description?.[lng] || description[lng];
    const keywordsText = seo.keywords?.[lng] || keywords[lng];

    // Dil özel OpenGraph ayarları
    const openGraphSettings = {
        tr: {
            locale: 'tr_TR',
            url: process.env.SITE_URL || 'https://eylulkurtcebe.com',
        },
        en: {
            locale: 'en_US',
            url: `${process.env.SITE_URL}/en` || 'https://eylulkurtcebe.com/en',
        },
    };

    return {
        title: titleText,
        description: descriptionText,
        keywords: keywordsText,
        metadataBase: new URL(process.env.SITE_URL || 'https://eylulkurtcebe.com'),
        openGraph: {
            type: 'website',
            locale: openGraphSettings[lng].locale,
            url: openGraphSettings[lng].url,
            title: titleText,
            description: descriptionText,
            siteName: 'Eylül Kurtcebe',
            images: [{ url: ogImage, alt: titleText }],
        },
        robots: robotsContent,
    };
}

// Statik olarak oluşturulacak dil yollarını belirle
export function generateStaticParams() {
    return locales.map(lng => ({ lng }));
}

export default async function LngLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ lng: string }>;
}) {
    const { lng } = await params;

    // Geçerli dil kontrolü
    if (!hasLocale(locales, lng)) {
        notFound();
    }

    // Statik render için dil ayarı
    setRequestLocale(lng);

    let messages;
    try {
        messages = (await import(`../../messages/${lng}.json`)).default;
    } catch (error) {
        console.error(`Dil mesajları yüklenirken hata: ${lng}`, error);
        messages = {};
    }

    return (
        <NextIntlClientProvider locale={lng} messages={messages}>
            {children}
        </NextIntlClientProvider>
    );
}
