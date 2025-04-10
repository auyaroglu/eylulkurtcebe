import { MetadataRoute } from 'next';
import { connectToDatabase } from '@/lib/db';
import SiteConfig from '@/models/SiteConfig';
import mongoose from 'mongoose';

export default async function robots(): Promise<MetadataRoute.Robots> {
    try {
        // Site ayarlarını veritabanından al
        await connectToDatabase();

        // MongoDB koleksiyonuna doğrudan erişim
        const db = mongoose.connection;
        const siteConfigCollection = db.collection('siteconfigs');

        const siteConfig = await siteConfigCollection.findOne({});

        // Varsayılan site URL'i
        const siteUrl = process.env.SITE_URL || 'eylulkurtcebe.com';

        // Eğer robot indexlemesi kapalıysa veya ayar yoksa (varsayılan olarak kapalı)
        // Type-safe bir şekilde robotsEnabled'ı kontrol et
        let robotsEnabled = false;

        if (siteConfig && typeof siteConfig === 'object' && 'robotsEnabled' in siteConfig) {
            robotsEnabled = Boolean(siteConfig.robotsEnabled);
        }

        if (!robotsEnabled) {
            // Robotları engelle - tüm yaygın botlar için kurallar
            return {
                rules: [
                    {
                        userAgent: '*',
                        disallow: '/',
                    },
                    {
                        userAgent: 'Googlebot',
                        disallow: '/',
                    },
                    {
                        userAgent: 'Bingbot',
                        disallow: '/',
                    },
                    {
                        userAgent: 'Slurp',
                        disallow: '/',
                    },
                    {
                        userAgent: 'DuckDuckBot',
                        disallow: '/',
                    },
                    {
                        userAgent: 'Baiduspider',
                        disallow: '/',
                    },
                    {
                        userAgent: 'YandexBot',
                        disallow: '/',
                    },
                    {
                        userAgent: 'Sogou',
                        disallow: '/',
                    },
                    {
                        userAgent: 'facebookexternalhit',
                        disallow: '/',
                    },
                    {
                        userAgent: 'ia_archiver',
                        disallow: '/',
                    },
                    {
                        userAgent: 'Twitterbot',
                        disallow: '/',
                    },
                    {
                        userAgent: 'LinkedInBot',
                        disallow: '/',
                    },
                ],
            };
        }

        // Robotlara izin ver
        return {
            rules: {
                userAgent: '*',
                allow: '/',
            },
            sitemap: `${siteUrl}/sitemap.xml`,
        };
    } catch (error) {
        console.error('Robots ayarları alınırken hata:', error);

        // Hata durumunda varsayılan olarak robotları engelle
        return {
            rules: {
                userAgent: '*',
                disallow: '/',
            },
        };
    }
}
