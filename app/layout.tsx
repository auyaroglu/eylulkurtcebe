import './globals.css';
import 'react-toastify/dist/ReactToastify.css';
import type { Metadata } from 'next';
import { defaultLocale } from '@/i18n';
import { inter, robotoMono, fontStyles } from './fonts';
import { connectToDatabase } from '@/lib/db';
import mongoose from 'mongoose';
import StarBackground from '@/components/StarBackground';
import ClientProviders from './client-providers';

// Site ayarlarını getiren fonksiyon
async function getSiteSettings() {
    try {
        await connectToDatabase();

        // MongoDB koleksiyonuna doğrudan erişim
        const db = mongoose.connection;
        const siteConfigCollection = db.collection('siteconfigs');

        // Veritabanından ayarları al
        const config = await siteConfigCollection.findOne({});

        // Eğer ayarlar yoksa varsayılan olarak robotları engelle
        if (!config) return { robotsEnabled: false };

        // Config'i düz JSON nesnesine dönüştür
        return {
            robotsEnabled: config.robotsEnabled === true,
        };
    } catch (error) {
        console.error('Site ayarları alınırken hata:', error);
        return { robotsEnabled: false }; // Hata durumunda varsayılan olarak robotları engelle
    }
}

// Dinamik metadata oluşturma
export async function generateMetadata(): Promise<Metadata> {
    // Site ayarlarını al
    const { robotsEnabled } = await getSiteSettings();

    // Robots meta etiketini ayarla
    const robotsContent = robotsEnabled ? 'index, follow' : 'noindex, nofollow';

    return {
        title: 'Eylül Kurtcebe | Seramik Sanatçısı & AR-GE Kimyageri',
        description:
            'Eylül Kurtcebe - Seramik sanatçısı ve Ar-Ge kimyageri olarak seramik sırları ve formülasyon geliştirme konusunda 3 yıllık profesyonel deneyime sahip.',
        keywords:
            'seramik sanatçısı, sır geliştirme, çömlekçilik, seramik, Ar-Ge kimyageri, seramik sanatı, sır kimyası, Dokuz Eylül, Gorbon',
        metadataBase: new URL(process.env.SITE_URL || 'https://eylulkurtcebe.com'),
        openGraph: {
            type: 'website',
            locale: 'tr_TR',
            url: process.env.SITE_URL || 'https://eylulkurtcebe.com',
            title: 'Eylül Kurtcebe | Seramik Sanatçısı & AR-GE Kimyageri',
            description: "Seramik sanatçısı ve Ar-Ge kimyageri Eylül Kurtcebe'nin portfolyo sitesi",
            siteName: 'Eylül Kurtcebe',
        },
        robots: robotsContent,
    };
}

export default async function RootLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: { locale: string };
}) {
    const locale = params.locale || defaultLocale;

    // Mesajları güvenli bir şekilde yükleme girişimi
    let messages = {};
    try {
        messages = (await import(`../messages/${locale}.json`)).default;
    } catch (error) {
        console.error(`Dil dosyası yüklenemedi: ${locale}.json`, error);
        // Varsayılan dile düşme
        if (locale !== defaultLocale) {
            try {
                messages = (await import(`../messages/${defaultLocale}.json`)).default;
            } catch (fallbackError) {
                console.error(
                    `Varsayılan dil dosyası da yüklenemedi: ${defaultLocale}.json`,
                    fallbackError
                );
            }
        }
    }

    return (
        <html lang={locale} className={`${inter.variable} ${robotoMono.variable} scroll-smooth`}>
            <body
                style={{ fontFamily: fontStyles.sans }}
                className="bg-[#111827] dark:bg-[#111827] text-[#f9fafb] dark:text-[#f9fafb] antialiased"
            >
                <StarBackground />
                <ClientProviders locale={locale} messages={messages}>
                    {children}
                </ClientProviders>

                {/* SWR Önbelleğini Dinleyen Script */}
                <script
                    dangerouslySetInnerHTML={{
                        __html: `
                        // SWR revalidate sinyalini kontrol eden script
                        (function() {
                            try {
                                // Sayfa yüklendiğinde de localStorage'dan revalidate sinyali kontrol et
                                function checkForRevalidateSignal() {
                                    const timestamp = localStorage.getItem('swr-revalidate-timestamp');
                                    const shouldRevalidate = localStorage.getItem('swr-revalidate-content');
                                    
                                    if (timestamp && shouldRevalidate === 'true') {
                                        console.log('[SWR] Revalidate sinyali algılandı, sayfa yenilenecek');
                                        
                                        // Sinyali temizle ki diğer sekmeler aynı işlemi tekrarlamasın
                                        localStorage.removeItem('swr-revalidate-content');
                                        
                                        // Sayfa içeriğini yenile
                                        window.location.reload();
                                    }
                                }
                                
                                // Sayfa yüklendiğinde kontrol et
                                checkForRevalidateSignal();
                                
                                // Storage olaylarını dinle (diğer sekmelerden gelen sinyaller için)
                                window.addEventListener('storage', function(e) {
                                    // Local storage değişikliği olduğunda
                                    if (e.key === 'swr-revalidate-timestamp') {
                                        console.log('[SWR] Storage event: Revalidate sinyali algılandı');
                                        checkForRevalidateSignal();
                                    }
                                });
                            } catch(e) {
                                console.error('[SWR] Revalidate listener hatası:', e);
                            }
                        })();
                    `,
                    }}
                />
            </body>
        </html>
    );
}
