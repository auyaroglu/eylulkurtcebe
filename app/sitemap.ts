import { MetadataRoute } from 'next';
import { getProjectsFromDB } from '@/lib/server-actions';
import { IProject } from '@/models/Project';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = process.env.SITE_URL || 'https://eylulkurtcebe.com';
    const currentDate = new Date().toISOString();

    // Temel sayfalar
    const routes = [
        {
            url: baseUrl,
            lastModified: currentDate,
            changeFrequency: 'monthly' as const,
            priority: 1,
        },
        {
            url: `${baseUrl}/en`,
            lastModified: currentDate,
            changeFrequency: 'monthly' as const,
            priority: 0.9,
        },
        {
            url: `${baseUrl}/projeler`,
            lastModified: currentDate,
            changeFrequency: 'monthly' as const,
            priority: 0.8,
        },
        {
            url: `${baseUrl}/en/projects`,
            lastModified: currentDate,
            changeFrequency: 'monthly' as const,
            priority: 0.8,
        },
    ];

    // Proje sayfalarını ekle
    try {
        // Türkçe projeler
        const trProjects = await getProjectsFromDB('tr');
        if (trProjects && trProjects.list) {
            const trProjectRoutes = trProjects.list.map((project: IProject) => ({
                url: `${baseUrl}/projeler/${project.id}`,
                lastModified: project.updatedAt || currentDate,
                changeFrequency: 'monthly' as const,
                priority: 0.7,
            }));
            routes.push(...trProjectRoutes);
        }

        // İngilizce projeler
        const enProjects = await getProjectsFromDB('en');
        if (enProjects && enProjects.list) {
            const enProjectRoutes = enProjects.list.map((project: IProject) => ({
                url: `${baseUrl}/en/projects/${project.id}`,
                lastModified: project.updatedAt || currentDate,
                changeFrequency: 'monthly' as const,
                priority: 0.7,
            }));
            routes.push(...enProjectRoutes);
        }
    } catch (error) {
        console.error('Sitemap için projeler alınırken hata oluştu:', error);
    }

    return routes;
}
