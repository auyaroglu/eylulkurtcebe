import ProjectsPage, { Project } from '@/components/ProjectsPage';
import { useTranslations } from 'next-intl';
import { locales } from '@/i18n';
import { hasLocale } from 'next-intl';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
// Direkt veritabanı erişimi için gerekli import
import { getProjectsFromDB, getContentFromDB } from '@/lib/server-actions';
import type { Metadata } from 'next';
import { connectToDatabase } from '@/lib/db';
import mongoose from 'mongoose';

// Her istek için sayfayı dinamik olarak oluştur
export const dynamicParams = true;
// Önbelleğe almayı devre dışı bırak
export const revalidate = 0;

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
                seo: {
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
            seo: {
                ogImage: '/logo.webp',
            },
        };
    }
}

// Projeler sayfası için meta veriler
export async function generateMetadata({
    params,
}: {
    params: Promise<{ lng: string }>;
}): Promise<Metadata> {
    const resolvedParams = await params;
    const { lng } = resolvedParams;

    try {
        // İçerik verilerini getir
        const contentData = await getContentFromDB(lng);

        // Site ayarlarını getir
        const siteSettings = await getSiteSettings();
        const siteLogo = siteSettings?.logo || '/logo.webp';
        const siteOgImage = siteSettings?.seo?.ogImage || siteLogo;

        // Lokalizasyon için doğru başlık ve açıklamalar
        let title = 'Projects';
        let description = 'Browse our portfolio of projects';

        // İçerik verileri mevcutsa onları kullan
        if (contentData && contentData.projects) {
            if (contentData.projects.projectsPage) {
                title = contentData.projects.projectsPage.title || title;
                description = contentData.projects.projectsPage.description || description;
            }
        }

        return {
            title: `Eylül Kurtcebe | ${title}`,
            description,
            openGraph: {
                title: `Eylül Kurtcebe | ${title}`,
                description,
                type: 'website',
                images: [{ url: siteOgImage, alt: title }],
            },
            twitter: {
                card: 'summary',
                title: `Eylül Kurtcebe | ${title}`,
                description,
                images: [siteOgImage],
            },
        };
    } catch (error) {
        console.error(`Projeler sayfası meta verileri oluşturulurken hata: ${error}`);

        // Site ayarlarını getirmeyi dene
        try {
            const siteSettings = await getSiteSettings();
            const siteLogo = siteSettings?.logo || '/logo.webp';
            const siteOgImage = siteSettings?.seo?.ogImage || siteLogo;

            // Hata durumunda varsayılan meta verileri
            return {
                title: 'Eylül Kurtcebe | Projects',
                description: 'Browse our portfolio of projects',
                openGraph: {
                    title: 'Eylül Kurtcebe | Projects',
                    description: 'Browse our portfolio of projects',
                    images: [siteOgImage],
                },
                twitter: {
                    title: 'Eylül Kurtcebe | Projects',
                    description: 'Browse our portfolio of projects',
                    images: [siteOgImage],
                },
            };
        } catch (settingsError) {
            console.error('Site ayarları alınamadı:', settingsError);

            // Varsayılan logo URL'i
            const defaultLogoUrl = process.env.NEXT_PUBLIC_DEFAULT_LOGO_PATH || '/logo.webp';

            // Hiçbir şekilde veri alınamadığında en basit haliyle dön
            return {
                title: 'Eylül Kurtcebe | Projects',
                description: 'Browse our portfolio of projects',
                openGraph: {
                    title: 'Eylül Kurtcebe | Projects',
                    description: 'Browse our portfolio of projects',
                    images: [defaultLogoUrl],
                },
                twitter: {
                    title: 'Eylül Kurtcebe | Projects',
                    description: 'Browse our portfolio of projects',
                    images: [defaultLogoUrl],
                },
            };
        }
    }
}

export function generateStaticParams() {
    return locales.map(lng => ({ lng }));
}

// Veritabanından projeleri getir
async function getProjects(lng: string): Promise<Project[]> {
    try {
        // Site ayarlarını getir
        const siteSettings = await getSiteSettings();
        const itemsPerPage = siteSettings?.pagination?.itemsPerPage || 9;

        // getProjectsFromDB fonksiyonunu çağır
        const projectsData = await getProjectsFromDB(lng);

        // Veri yoksa boş dizi döndür
        if (!projectsData || !projectsData.list) {
            console.error(`${lng} dilinde proje verisi bulunamadı.`);
            return [];
        }

        // Sadece "yayında" (status: true) olan projeleri filtrele - getProjectsFromDB zaten filtrelemiş olacak
        return projectsData.list;
    } catch (error) {
        console.error('Projeler getirilirken hata:', error);
        return [];
    }
}

export default async function Projects({ params }: { params: Promise<{ lng: string }> }) {
    const { lng } = await params;

    // Geçerli dil kontrolü
    if (!hasLocale(locales, lng)) {
        notFound();
    }

    // Statik render için dil ayarı
    setRequestLocale(lng);

    // Site ayarlarını getir
    const siteSettings = await getSiteSettings();
    const itemsPerPage = siteSettings?.pagination?.itemsPerPage || 9;

    // Veritabanından projeleri getir, dil parametresini aktar
    const projects = await getProjects(lng);

    return (
        <>
            <Header lng={lng} />
            <main className="pt-20">
                <ProjectsPage lng={lng} projects={projects} itemsPerPage={itemsPerPage} />
            </main>
            <Footer />
        </>
    );
}
