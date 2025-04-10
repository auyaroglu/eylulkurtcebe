import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = 'https://eylulkurtcebe.com';
    const currentDate = new Date().toISOString();

    return [
        {
            url: baseUrl,
            lastModified: currentDate,
            changeFrequency: 'monthly',
            priority: 1,
        },
        {
            url: `${baseUrl}/en`,
            lastModified: currentDate,
            changeFrequency: 'monthly',
            priority: 0.9,
        },
    ];
}
