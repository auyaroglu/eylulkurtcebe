import ProjectDetailPage from '@/components/ProjectDetailPage';
import { useTranslations } from 'next-intl';
import { locales } from '@/i18n';
import { hasLocale } from 'next-intl';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { getContentFromDB, getProjectsFromDB } from '@/lib/server-actions';
import type { Metadata, ResolvingMetadata } from 'next';
import { connectToDatabase } from '@/lib/db';
import mongoose from 'mongoose';

// Sayfa önbelleğini kontrol etme süresi
export const revalidate = 10; // 10 saniyede bir yeniden doğrula, daha hızlı erişim için

// Statik olarak oluşturulacak dil yollarını belirle
export const dynamicParams = false;

// Interface ile type tanımları yapalım
interface PageParams {
    params: {
        lng: string;
        id: string;
    };
}

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

// Dinamik meta verileri getir
export async function generateMetadata(props: any, parent: ResolvingMetadata): Promise<Metadata> {
    try {
        // Params değerlerini Promise olarak await edelim
        const params = await Promise.resolve(props.params);

        // Paramlar artık await edildi, şimdi doğrudan erişebiliriz
        const lng = params.lng;
        const id = params.id;

        // Link oluştur
        const canonical = `${process.env.SITE_URL}/${lng}/projects/${id}`;

        // Varsayılan logo URL'i
        const defaultLogoUrl = process.env.NEXT_PUBLIC_DEFAULT_LOGO_PATH || '/logo.webp';

        // Site ayarlarını al
        const siteSettings = await getSiteSettings();
        const siteOgImage = siteSettings?.seo?.ogImage || siteSettings?.logo || defaultLogoUrl;

        // Proje verisini veritabanından getir
        const projectData = await getProjectsFromDB(lng, id);

        // Proje verisi yoksa veya gizliyse 404 döndür
        if (!projectData || projectData.status === false) {
            return {
                title: 'Not Found',
                description: 'The page you are looking for does not exist.',
            };
        }

        // SEO verileri varsa onları kullan, yoksa varsayılan değerleri kullan
        const seo = projectData.seo || {};

        // Meta title - "Eylül Kurtcebe | [başlık]" formatı
        const metaTitle = `Eylül Kurtcebe | ${
            seo.metaTitle || projectData.title || `${id} Project`
        }`;

        // Meta açıklama
        const metaDescription =
            seo.metaDescription ||
            (projectData.description
                ? `${projectData.description.substring(0, 155)}${
                      projectData.description.length > 155 ? '...' : ''
                  }`
                : `Details for project ${id}`);

        // Meta keywords
        const metaKeywords =
            seo.metaKeywords ||
            (projectData.technologies ? projectData.technologies.join(', ') : '');

        // OG verileri - başlık için "Eylül Kurtcebe | [başlık]" formatı
        const ogTitle = `Eylül Kurtcebe | ${
            seo.ogTitle || seo.metaTitle || projectData.title || `${id} Project`
        }`;
        const ogDescription = seo.ogDescription || seo.metaDescription || metaDescription;

        // OG görsel - öncelik sırası:
        // 1. Projenin kendi OG görseli (varsa)
        // 2. Site ayarlarındaki OG görseli
        // 3. Projenin ilk görseli (varsa)
        // 4. Site logosu
        // 5. Varsayılan logo
        const ogImage =
            seo.ogImage ||
            siteOgImage ||
            (projectData.images && projectData.images.length > 0
                ? projectData.images[0]
                : defaultLogoUrl);

        return {
            title: metaTitle,
            description: metaDescription,
            keywords: metaKeywords,
            openGraph: {
                title: ogTitle,
                description: ogDescription,
                images: [{ url: ogImage, alt: metaTitle }],
                type: 'website',
                url: canonical,
            },
            twitter: {
                card: 'summary_large_image',
                title: ogTitle,
                description: ogDescription,
                images: [ogImage],
            },
            alternates: {
                canonical: canonical,
                languages: {
                    tr: `${process.env.SITE_URL}/projects/${id}`,
                    en: `${process.env.SITE_URL}/en/projects/${id}`,
                },
            },
        };
    } catch (error) {
        // params değerlerini Promise olarak await edelim
        const params = await Promise.resolve(props.params);

        // Paramlar artık await edildi, şimdi doğrudan erişebiliriz
        const lng = params.lng;
        const id = params.id;

        console.error(`SEO meta verileri oluşturulurken hata: ${error}`);

        const canonical = `${process.env.SITE_URL}/${lng}/projects/${id}`;
        const defaultLogoUrl = process.env.NEXT_PUBLIC_DEFAULT_LOGO_PATH || '/logo.webp';

        // Hata durumunda varsayılan meta verileri
        return {
            title: `Eylül Kurtcebe | Project ${id}`,
            description: 'Project details page',
            openGraph: {
                title: `Eylül Kurtcebe | Project ${id}`,
                images: [defaultLogoUrl],
                url: canonical,
            },
            twitter: {
                title: `Eylül Kurtcebe | Project ${id}`,
                images: [defaultLogoUrl],
            },
            alternates: {
                canonical: canonical,
            },
        };
    }
}

export async function generateStaticParams() {
    // Her dil için statik parametreleri oluştur
    const params: Array<{ lng: string; id: string }> = [];

    for (const locale of locales) {
        try {
            // Veritabanından verileri çekmeyi dene
            const projectsData = await getProjectsFromDB(locale);

            if (projectsData && projectsData.list && Array.isArray(projectsData.list)) {
                // Her projeyi ilgili dilde ekle
                for (const project of projectsData.list) {
                    params.push({
                        lng: locale,
                        id: project.id,
                    });
                }
                continue; // Sonraki dile geç
            }

            // Veritabanı yoksa fallback olarak JSON dosyasını kullan
            const messages = (await import(`../../../../messages/${locale}.json`)).default;
            const projects = messages.projects.list;

            // Her projeyi ilgili dilde ekle
            for (const project of projects) {
                params.push({
                    lng: locale,
                    id: project.id,
                });
            }
        } catch (error) {
            console.error(`${locale} için proje parametreleri oluşturulurken hata:`, error);
            // Hata durumunda JSON dosyasından dene
            try {
                const messages = (await import(`../../../../messages/${locale}.json`)).default;
                const projects = messages.projects.list;

                // Her projeyi ilgili dilde ekle
                for (const project of projects) {
                    params.push({
                        lng: locale,
                        id: project.id,
                    });
                }
            } catch (jsonError) {
                console.error(`${locale} için JSON dosyasından da veri alınamadı:`, jsonError);
            }
        }
    }

    return params;
}

// Ana sayfa bileşeni
export default async function ProjectDetail(props: any) {
    try {
        // Params değerlerini Promise olarak await edelim
        const params = await Promise.resolve(props.params);

        // Paramlar artık await edildi, şimdi doğrudan erişebiliriz
        const lng = params.lng;
        const id = params.id;

        console.log(`Proje sayfası render ediliyor: lng=${lng}, id=${id}`);

        // Geçerli dil kontrolü
        if (!hasLocale(locales, lng)) {
            console.log(`Geçersiz dil: ${lng}`);
            notFound();
        }

        // Statik render için dil ayarı
        setRequestLocale(lng);

        // Veritabanından içerik ve proje verilerini al
        console.log(`Veritabanı sorguları başlıyor`);
        const contentData = await getContentFromDB(lng);
        const projectData = await getProjectsFromDB(lng, id);
        const allProjectsData = await getProjectsFromDB(lng);
        console.log(`Veritabanı sorguları tamamlandı`);

        // Eğer içerik verisi yoksa 404 döndür
        if (!contentData) {
            console.error(`${lng} için içerik verileri bulunamadı`);
            notFound();
        }

        // Proje verisi yoksa veya status değeri false ise 404 döndür
        if (!projectData || projectData.status === false) {
            console.error(`${lng} dilinde ve ${id} ID'si ile yayında olan proje bulunamadı`);
            notFound();
        }

        console.log(`Proje sayfası render edilecek`);
        return (
            <>
                <Header lng={lng} />
                <main className="pt-20">
                    <ProjectDetailPage
                        lng={lng}
                        projectId={id}
                        initialProject={projectData}
                        initialContent={allProjectsData}
                    />
                </main>
                <Footer contentData={contentData} />
            </>
        );
    } catch (error) {
        console.error(`Proje sayfası oluşturulurken hata:`, error);
        notFound();
    }
}
