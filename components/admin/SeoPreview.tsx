import React, { useEffect, useState } from 'react';

interface SeoPreviewProps {
    siteUrl: string;
    path: string;
    slug: string;
    seo: {
        metaTitle?: string;
        metaDescription?: string;
        metaKeywords?: string;
        ogTitle?: string;
        ogDescription?: string;
        ogImage?: string;
    };
    title: string;
    description: string;
    image?: string | null;
    contentType?: 'project' | 'blog' | 'page';
    customUrl?: string;
    previewTitle?: string;
}

const SeoPreview: React.FC<SeoPreviewProps> = ({
    siteUrl,
    path,
    slug,
    seo,
    title,
    description,
    image,
    contentType = 'project',
    customUrl,
    previewTitle = 'SEO Önizleme',
}) => {
    const [siteLogo, setSiteLogo] = useState<string>('/logo.webp');

    // Site ayarlarını getir
    useEffect(() => {
        const fetchSiteSettings = async () => {
            try {
                const response = await fetch('/api/site-config');
                if (response.ok) {
                    const data = await response.json();
                    if (data.logo) {
                        setSiteLogo(data.logo);
                    }
                }
            } catch (error) {
                console.error('Site ayarları alınamadı:', error);
            }
        };

        fetchSiteSettings();
    }, []);

    // SEO başlık ve açıklamalarını hazırla
    const metaTitle = seo?.metaTitle || title || getDefaultTitle(contentType);
    const metaDescription =
        seo?.metaDescription ||
        (description
            ? `${description.substring(0, 155)}${description.length > 155 ? '...' : ''}`
            : getDefaultDescription(contentType));

    const ogTitle = seo?.ogTitle || seo?.metaTitle || title || getDefaultTitle(contentType);
    const ogDescription = seo?.ogDescription || seo?.metaDescription || metaDescription;

    // URL oluştur
    const pageUrl = customUrl || `${siteUrl}${path}/${slug}`;

    // OG görsel URL'sini belirle
    const ogImageUrl = React.useMemo(() => {
        // Öncelik SEO alanındaki görsel
        if (seo?.ogImage) {
            return seo.ogImage.startsWith('http') || seo.ogImage.startsWith('/')
                ? seo.ogImage
                : `${siteUrl}/${seo.ogImage}`;
        }

        // İçerik görseli
        if (image) {
            return image.startsWith('http') || image.startsWith('/')
                ? image
                : `${siteUrl}/${image}`;
        }

        // Site logo görseli
        return siteLogo.startsWith('http') || siteLogo.startsWith('/')
            ? siteLogo
            : `${siteUrl}${siteLogo}`;
    }, [seo?.ogImage, image, siteUrl, siteLogo]);

    return (
        <div className="p-4 mt-6 bg-gray-900 rounded-lg">
            <h3 className="mb-2 text-lg font-medium text-white">{previewTitle}</h3>

            <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-400">Google Arama Sonucu</h4>
                <div className="p-4 mt-2 bg-white rounded">
                    <div className="text-[#1a0dab] text-xl font-medium truncate">{metaTitle}</div>
                    <div className="text-[#006621] text-sm truncate">{pageUrl}</div>
                    <div className="text-[#545454] text-sm mt-1 line-clamp-2">
                        {metaDescription}
                    </div>
                </div>
            </div>

            <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-400">Sosyal Medya Kartı</h4>
                <div className="mt-2 bg-[#f2f3f5] rounded overflow-hidden border border-gray-700">
                    <div className="h-40 overflow-hidden flex justify-center items-center bg-gray-700">
                        {ogImageUrl ? (
                            <img
                                src={ogImageUrl}
                                alt="OG Preview"
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="text-gray-500">Görsel bulunamadı</div>
                        )}
                    </div>
                    <div className="p-3">
                        <div className="text-[#385898] font-medium">{siteUrl}</div>
                        <div className="text-[#1d2129] font-bold mt-1">{ogTitle}</div>
                        <div className="text-[#606770] text-sm mt-1 line-clamp-3">
                            {ogDescription}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// İçerik türüne göre varsayılan başlık
function getDefaultTitle(contentType: string): string {
    switch (contentType) {
        case 'project':
            return 'Proje Başlığı';
        case 'blog':
            return 'Blog Yazısı';
        case 'page':
            return 'Sayfa Başlığı';
        default:
            return 'Başlık';
    }
}

// İçerik türüne göre varsayılan açıklama
function getDefaultDescription(contentType: string): string {
    switch (contentType) {
        case 'project':
            return 'Proje açıklaması...';
        case 'blog':
            return 'Blog yazısı içeriği...';
        case 'page':
            return 'Sayfa içeriği...';
        default:
            return 'Açıklama...';
    }
}

export default SeoPreview;
