import PageContent from '@/components/PageContent';
import { useTranslations } from 'next-intl';
import { hasLocale } from 'next-intl';
import { notFound } from 'next/navigation';
import { locales } from '@/i18n';
import { setRequestLocale } from 'next-intl/server';
import { getContentFromDB, getProjectsFromDB } from '@/lib/server-actions';
import { connectToDatabase } from '@/lib/db';
import mongoose from 'mongoose';

// Statik olarak oluşturulacak dil yollarını belirle
export const dynamicParams = false;

// Sayfa önbelleğini kontrol etme süresi - Daha sık yenileme için 30 saniyeye düşürdük
export const revalidate = 30;

// Site ayarlarını getiren yardımcı fonksiyon
async function getSiteConfig() {
    try {
        await connectToDatabase();

        // Doğrudan mongoose bağlantısı ile koleksiyona erişim
        const db = mongoose.connection;
        const siteConfigCollection = db.collection('siteconfigs');
        const config = await siteConfigCollection.findOne({});

        if (!config) {
            return {
                displayEmail: 'info@eylulkurtcebe.com',
                contactEmail: 'info@eylulkurtcebe.com',
                robotsEnabled: false,
                pagination: { itemsPerPage: 9 },
            };
        }

        // MongoDB verilerini düz nesneye dönüştür
        return JSON.parse(JSON.stringify(config));
    } catch (error) {
        console.error('Site ayarları alınamadı:', error);
        return {
            displayEmail: 'info@eylulkurtcebe.com',
            contactEmail: 'info@eylulkurtcebe.com',
            robotsEnabled: false,
            pagination: { itemsPerPage: 9 },
        };
    }
}

export function generateStaticParams() {
    return locales.map(lng => ({ lng }));
}

export default async function LngPage({ params }: { params: Promise<{ lng: string }> }) {
    const { lng } = await params;

    // Geçerli dil kontrolü
    if (!hasLocale(locales, lng)) {
        notFound();
    }

    // Statik render için dil ayarı
    setRequestLocale(lng);

    try {
        // Veritabanından verileri çek - Tüm veriler düz JavaScript nesneleri olarak dönecek
        const [contentData, projectsData, siteConfig] = await Promise.all([
            getContentFromDB(lng),
            getProjectsFromDB(lng),
            getSiteConfig(),
        ]);

        // Veri yoksa veya hatalıysa 404 döndür
        if (!contentData || !projectsData) {
            console.error(`${lng} için veriler alınamadı.`);
            notFound();
        }

        // Tüm bileşenlere veri aktarımını gerçekleştir
        return (
            <PageContent
                initialContent={contentData}
                initialProjects={projectsData}
                siteConfig={siteConfig}
            />
        );
    } catch (error) {
        // Hata durumunda loglama yap ve 404 döndür
        console.error(`${lng} için sayfa oluşturulurken hata:`, error);
        notFound();
    }
}
