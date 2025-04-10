'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import Image from 'next/image';

// Site ayarları için tip tanımı
interface SiteConfig {
    _id?: string;
    contactEmail: string;
    displayEmail: string;
    logo: string;
    seo: {
        title: {
            tr: string;
            en: string;
        };
        description: {
            tr: string;
            en: string;
        };
        keywords: {
            tr: string;
            en: string;
        };
        ogImage: string;
    };
    pagination: {
        itemsPerPage: number;
    };
    robotsEnabled: boolean;
    [key: string]: any; // Dynamic index signature for nested objects
}

export default function SiteSettings() {
    const router = useRouter();
    const [settings, setSettings] = useState<SiteConfig | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'tr' | 'en'>('tr');
    const [isUploading, setIsUploading] = useState<{ logo: boolean; ogImage: boolean }>({
        logo: false,
        ogImage: false,
    });

    // Yeni seçilen görseller (henüz yüklenmemiş)
    const [selectedFiles, setSelectedFiles] = useState<{
        logo: File | null;
        ogImage: File | null;
    }>({
        logo: null,
        ogImage: null,
    });

    // Seçilen görsellerin önizleme URL'leri
    const [previewUrls, setPreviewUrls] = useState<{
        logo: string | null;
        ogImage: string | null;
    }>({
        logo: null,
        ogImage: null,
    });

    const logoInputRef = useRef<HTMLInputElement>(null);
    const ogImageInputRef = useRef<HTMLInputElement>(null);

    // Site ayarlarını yükle
    const fetchSettings = async () => {
        try {
            setIsLoading(true);
            const token = localStorage.getItem('adminToken');

            if (!token) {
                router.push('/admin/giris');
                return;
            }

            const response = await fetch('/api/admin/site-config', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                console.log('Alınan site ayarları:', data);

                // Verileri normalize et (eski format uyumluluğu için)
                const normalizedData = {
                    ...data,
                    seo: {
                        title: data.seo?.title || { tr: '', en: '' },
                        description: data.seo?.description || { tr: '', en: '' },
                        keywords: data.seo?.keywords || { tr: '', en: '' },
                        ogImage: data.seo?.ogImage || '',
                    },
                };

                setSettings(normalizedData);

                // Önizlemeleri sıfırla
                setPreviewUrls({
                    logo: null,
                    ogImage: null,
                });
                setSelectedFiles({
                    logo: null,
                    ogImage: null,
                });
            } else {
                toast.error('Site ayarları alınamadı');
            }
        } catch (error) {
            console.error('Site ayarları yükleme hatası:', error);
            toast.error('Site ayarları yüklenirken bir hata oluştu');
        } finally {
            setIsLoading(false);
        }
    };

    // İlk yükleme
    useEffect(() => {
        fetchSettings();
    }, [router]);

    // Form değişikliklerini işle
    const handleChange = (field: string, value: string | number | boolean) => {
        if (!settings) return;

        // İç içe alan (örn: seo.title.tr) mı kontrol et
        if (field.includes('.')) {
            const parts = field.split('.');

            if (parts.length === 2) {
                // İki seviyeli alan (örn: pagination.itemsPerPage)
                const [parent, child] = parts;
                setSettings(prev => {
                    if (!prev) return prev;
                    return {
                        ...prev,
                        [parent]: {
                            ...prev[parent],
                            [child]: value,
                        },
                    };
                });
            } else if (parts.length === 3) {
                // Üç seviyeli alan (örn: seo.title.tr)
                const [parent, child, subChild] = parts;
                setSettings(prev => {
                    if (!prev) return prev;
                    return {
                        ...prev,
                        [parent]: {
                            ...prev[parent],
                            [child]: {
                                ...prev[parent][child],
                                [subChild]: value,
                            },
                        },
                    };
                });
            }
        } else {
            // Normal alan
            setSettings(prev => {
                if (!prev) return prev;
                return {
                    ...prev,
                    [field]: value,
                };
            });
        }
    };

    // Görsel yükleme işlemleri için dosyaya tıklama
    const triggerFileInput = (type: 'logo' | 'ogImage') => {
        if (type === 'logo' && logoInputRef.current) {
            logoInputRef.current.click();
        } else if (type === 'ogImage' && ogImageInputRef.current) {
            ogImageInputRef.current.click();
        }
    };

    // Görsel seçme işlemi
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'ogImage') => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Dosya türü kontrolü
        if (!file.type.startsWith('image/')) {
            toast.error('Sadece resim dosyaları yüklenebilir');
            return;
        }

        // Dosya boyutu kontrolü (5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error("Dosya boyutu 5MB'dan küçük olmalıdır");
            return;
        }

        // Dosyayı kaydet
        setSelectedFiles(prev => ({ ...prev, [type]: file }));

        // Önizleme URL'i oluştur
        const previewUrl = URL.createObjectURL(file);
        setPreviewUrls(prev => ({ ...prev, [type]: previewUrl }));

        // Input değerini temizle (yeniden aynı dosyayı seçebilmek için)
        e.target.value = '';
    };

    // Görsel yükleme işlemi
    const uploadFile = async (file: File, type: 'logo' | 'ogImage'): Promise<string | null> => {
        if (!file) return null;

        try {
            const token = localStorage.getItem('adminToken');
            if (!token) {
                router.push('/admin/giris');
                return null;
            }

            const formData = new FormData();
            formData.append('file', file);
            formData.append('type', type);

            const response = await fetch('/api/admin/upload', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            });

            if (response.ok) {
                const data = await response.json();
                return data.url;
            } else {
                const error = await response.json();
                throw new Error(
                    error.error || `${type === 'logo' ? 'Logo' : 'OG Görseli'} yüklenemedi`
                );
            }
        } catch (error) {
            console.error(`${type} yükleme hatası:`, error);
            throw error;
        }
    };

    // Formu kaydet
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!settings) return;

        setIsSaving(true);
        try {
            const token = localStorage.getItem('adminToken');

            if (!token) {
                router.push('/admin/giris');
                return;
            }

            // Seçilen görselleri yükle
            let newSettings = { ...settings };

            // Logo yükleme
            if (selectedFiles.logo) {
                setIsUploading(prev => ({ ...prev, logo: true }));
                try {
                    const logoUrl = await uploadFile(selectedFiles.logo, 'logo');
                    if (logoUrl) {
                        newSettings.logo = logoUrl;
                    }
                } finally {
                    setIsUploading(prev => ({ ...prev, logo: false }));
                }
            }

            // OG Görsel yükleme
            if (selectedFiles.ogImage) {
                setIsUploading(prev => ({ ...prev, ogImage: true }));
                try {
                    const ogImageUrl = await uploadFile(selectedFiles.ogImage, 'ogImage');
                    if (ogImageUrl) {
                        newSettings.seo.ogImage = ogImageUrl;
                    }
                } finally {
                    setIsUploading(prev => ({ ...prev, ogImage: false }));
                }
            }

            // SEO bilgilerini kontrol et ve düzenle
            const normalizedSettings = {
                ...newSettings,
                // Yeni yapıya göre SEO alanlarının formatını düzgün şekilde ayarla
                seo: {
                    title: {
                        tr: newSettings.seo?.title?.tr || newSettings.seo?.title || '',
                        en: newSettings.seo?.title?.en || '',
                    },
                    description: {
                        tr: newSettings.seo?.description?.tr || newSettings.seo?.description || '',
                        en: newSettings.seo?.description?.en || '',
                    },
                    keywords: {
                        tr: newSettings.seo?.keywords?.tr || newSettings.seo?.keywords || '',
                        en: newSettings.seo?.keywords?.en || '',
                    },
                    ogImage: newSettings.seo?.ogImage || '',
                },
            };

            console.log('Gönderilen ayarlar:', normalizedSettings);

            const response = await fetch('/api/admin/site-config', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(normalizedSettings),
            });

            if (response.ok) {
                const result = await response.json();
                console.log('Sunucu yanıtı:', result);
                toast.success('Site ayarları başarıyla güncellendi');

                // Önizleme URL'lerini temizle
                setSelectedFiles({ logo: null, ogImage: null });
                URL.revokeObjectURL(previewUrls.logo || '');
                URL.revokeObjectURL(previewUrls.ogImage || '');
                setPreviewUrls({ logo: null, ogImage: null });

                // Güncel verileri tekrar çek
                fetchSettings();
            } else {
                const error = await response.json();
                console.error('Sunucu hatası:', error);
                toast.error(error.error || 'Site ayarları güncellenemedi');
            }
        } catch (error) {
            console.error('Site ayarları kaydetme hatası:', error);
            toast.error('Site ayarları kaydedilirken bir hata oluştu');
        } finally {
            setIsSaving(false);
        }
    };

    // Component unmount olduğunda önizleme URL'lerini temizle
    useEffect(() => {
        return () => {
            if (previewUrls.logo) URL.revokeObjectURL(previewUrls.logo);
            if (previewUrls.ogImage) URL.revokeObjectURL(previewUrls.ogImage);
        };
    }, [previewUrls]);

    if (isLoading) {
        return (
            <div className="h-64 flex justify-center items-center p-6">
                <div className="w-12 h-12 rounded-full border-t-2 border-b-2 border-blue-500 animate-spin"></div>
            </div>
        );
    }

    if (!settings) {
        return (
            <div className="p-6">
                <div className="bg-red-500/10 p-4 text-red-500 rounded-lg border border-red-500">
                    Site ayarları yüklenemedi. Lütfen sayfayı yenileyin veya yöneticiye başvurun.
                </div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <h1 className="mb-6 text-3xl font-bold text-white">Site Ayarları</h1>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="p-6 bg-gray-800 rounded-lg shadow-md">
                    <h2 className="mb-4 text-xl font-semibold text-white">İletişim ve Görünüm</h2>

                    <div className="space-y-6">
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <div>
                                <label
                                    htmlFor="displayEmail"
                                    className="block mb-1 text-sm font-medium text-gray-400"
                                >
                                    Görüntülenen E-posta
                                </label>
                                <input
                                    type="email"
                                    id="displayEmail"
                                    className="w-full px-4 py-2 text-white bg-gray-700 rounded-md border border-gray-600 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                                    value={settings.displayEmail}
                                    onChange={e => handleChange('displayEmail', e.target.value)}
                                    placeholder="Sitede görüntülenecek e-posta adresi"
                                />
                                <p className="mt-1 text-sm text-gray-500">
                                    Sitede ziyaretçilere gösterilecek e-posta adresi
                                </p>
                            </div>

                            <div>
                                <label
                                    htmlFor="contactEmail"
                                    className="block mb-1 text-sm font-medium text-gray-400"
                                >
                                    İletişim Formu E-postası
                                </label>
                                <input
                                    type="email"
                                    id="contactEmail"
                                    className="w-full px-4 py-2 text-white bg-gray-700 rounded-md border border-gray-600 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                                    value={settings.contactEmail}
                                    onChange={e => handleChange('contactEmail', e.target.value)}
                                    placeholder="İletişim formu bildirimleri için e-posta adresi"
                                />
                                <p className="mt-1 text-sm text-gray-500">
                                    İletişim formu mesajlarının gönderileceği e-posta
                                </p>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-gray-700">
                            <h3 className="mb-3 text-lg font-medium text-white">Site Logosu</h3>

                            <div className="flex items-center space-x-4">
                                {/* Logo görüntüleme - önizleme veya mevcut logo */}
                                <div className="w-20 h-20 overflow-hidden relative bg-gray-900 rounded-md">
                                    {previewUrls.logo ? (
                                        <Image
                                            src={previewUrls.logo}
                                            alt="Logo Önizleme"
                                            fill
                                            className="object-contain"
                                        />
                                    ) : settings.logo ? (
                                        <Image
                                            src={settings.logo}
                                            alt="Site Logosu"
                                            fill
                                            className="object-contain"
                                        />
                                    ) : (
                                        <div className="h-full flex justify-center items-center text-gray-500">
                                            <span>Logo yok</span>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <input
                                        type="file"
                                        ref={logoInputRef}
                                        onChange={e => handleFileSelect(e, 'logo')}
                                        accept="image/*"
                                        className="hidden"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => triggerFileInput('logo')}
                                        className="px-4 py-2 text-sm text-white bg-blue-600 rounded-md disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500 hover:bg-blue-700"
                                    >
                                        Logo Seç
                                    </button>
                                    <p className="mt-1 text-xs text-gray-500">
                                        Önerilen: PNG veya WebP, şeffaf arka plan, maks. 5MB
                                    </p>
                                    {selectedFiles.logo && (
                                        <p className="mt-1 text-xs text-yellow-400">
                                            Değişiklikler kaydedildiğinde logo yüklenecek
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-6 bg-gray-800 rounded-lg shadow-md">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold text-white">SEO Ayarları</h2>

                        <div className="flex p-1 bg-gray-700 rounded-md">
                            <button
                                type="button"
                                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                                    activeTab === 'tr'
                                        ? 'bg-blue-600 text-white'
                                        : 'text-gray-300 hover:text-white'
                                }`}
                                onClick={() => setActiveTab('tr')}
                            >
                                Türkçe
                            </button>
                            <button
                                type="button"
                                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                                    activeTab === 'en'
                                        ? 'bg-blue-600 text-white'
                                        : 'text-gray-300 hover:text-white'
                                }`}
                                onClick={() => setActiveTab('en')}
                            >
                                English
                            </button>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label
                                htmlFor={`seoTitle_${activeTab}`}
                                className="block mb-1 text-sm font-medium text-gray-400"
                            >
                                Site Başlığı {activeTab === 'en' ? '(İngilizce)' : ''}
                            </label>
                            <input
                                type="text"
                                id={`seoTitle_${activeTab}`}
                                className="w-full px-4 py-2 text-white bg-gray-700 rounded-md border border-gray-600 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                                value={settings.seo.title[activeTab]}
                                onChange={e =>
                                    handleChange(`seo.title.${activeTab}`, e.target.value)
                                }
                                placeholder={
                                    activeTab === 'tr' ? 'Sitenin ana başlığı' : 'Site title'
                                }
                            />
                        </div>

                        <div>
                            <label
                                htmlFor={`seoDescription_${activeTab}`}
                                className="block mb-1 text-sm font-medium text-gray-400"
                            >
                                Site Açıklaması {activeTab === 'en' ? '(İngilizce)' : ''}
                            </label>
                            <textarea
                                id={`seoDescription_${activeTab}`}
                                rows={3}
                                className="w-full px-4 py-2 text-white bg-gray-700 rounded-md border border-gray-600 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                                value={settings.seo.description[activeTab]}
                                onChange={e =>
                                    handleChange(`seo.description.${activeTab}`, e.target.value)
                                }
                                placeholder={
                                    activeTab === 'tr'
                                        ? 'Sitenin kısa açıklaması'
                                        : 'Site description'
                                }
                            />
                        </div>

                        <div>
                            <label
                                htmlFor={`seoKeywords_${activeTab}`}
                                className="block mb-1 text-sm font-medium text-gray-400"
                            >
                                Anahtar Kelimeler {activeTab === 'en' ? '(İngilizce)' : ''}
                            </label>
                            <input
                                type="text"
                                id={`seoKeywords_${activeTab}`}
                                className="w-full px-4 py-2 text-white bg-gray-700 rounded-md border border-gray-600 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                                value={settings.seo.keywords[activeTab]}
                                onChange={e =>
                                    handleChange(`seo.keywords.${activeTab}`, e.target.value)
                                }
                                placeholder={
                                    activeTab === 'tr'
                                        ? 'Anahtar kelimeler (virgülle ayrılmış)'
                                        : 'Keywords (comma separated)'
                                }
                            />
                        </div>

                        <div className="pt-4 mt-4 border-t border-gray-700">
                            <h3 className="mb-3 text-lg font-medium text-white">OG Görseli</h3>

                            <div className="flex items-center space-x-4">
                                {/* OG Görsel - önizleme veya mevcut görsel */}
                                <div className="w-32 h-20 overflow-hidden relative bg-gray-900 rounded-md">
                                    {previewUrls.ogImage ? (
                                        <Image
                                            src={previewUrls.ogImage}
                                            alt="OG Görsel Önizleme"
                                            fill
                                            className="object-cover"
                                        />
                                    ) : settings.seo.ogImage ? (
                                        <Image
                                            src={settings.seo.ogImage}
                                            alt="OG Görsel"
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="h-full flex justify-center items-center text-gray-500">
                                            <span>Görsel yok</span>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <input
                                        type="file"
                                        ref={ogImageInputRef}
                                        onChange={e => handleFileSelect(e, 'ogImage')}
                                        accept="image/*"
                                        className="hidden"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => triggerFileInput('ogImage')}
                                        className="px-4 py-2 text-sm text-white bg-blue-600 rounded-md disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500 hover:bg-blue-700"
                                    >
                                        OG Görsel Seç
                                    </button>
                                    <p className="mt-1 text-xs text-gray-500">
                                        Önerilen: 1200x630 piksel, maks. 5MB
                                    </p>
                                    {selectedFiles.ogImage && (
                                        <p className="mt-1 text-xs text-yellow-400">
                                            Değişiklikler kaydedildiğinde görsel yüklenecek
                                        </p>
                                    )}
                                </div>
                            </div>
                            <p className="mt-2 text-sm text-gray-500">
                                Sosyal medyada paylaşıldığında gösterilecek resim
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-6 bg-gray-800 rounded-lg shadow-md">
                    <h2 className="mb-4 text-xl font-semibold text-white">Sayfa Yapılandırması</h2>

                    <div className="space-y-4">
                        <div>
                            <label
                                htmlFor="itemsPerPage"
                                className="block mb-1 text-sm font-medium text-gray-400"
                            >
                                Sayfa Başına Öğe Sayısı
                            </label>
                            <input
                                type="number"
                                id="itemsPerPage"
                                min="3"
                                max="30"
                                className="w-full px-4 py-2 text-white bg-gray-700 rounded-md border border-gray-600 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                                value={settings.pagination.itemsPerPage}
                                onChange={e =>
                                    handleChange(
                                        'pagination.itemsPerPage',
                                        parseInt(e.target.value) || 9
                                    )
                                }
                            />
                            <p className="mt-1 text-sm text-gray-500">
                                Listeleme sayfalarında gösterilecek öğe sayısı
                            </p>
                        </div>

                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="robotsEnabled"
                                className="w-5 h-5 text-blue-500 bg-gray-700 rounded border-gray-600 focus:ring-blue-500"
                                checked={settings.robotsEnabled}
                                onChange={e => handleChange('robotsEnabled', e.target.checked)}
                            />
                            <label
                                htmlFor="robotsEnabled"
                                className="block ml-2 text-sm font-medium text-gray-200"
                            >
                                Arama Motorlarına İzin Ver
                            </label>
                        </div>
                        <p className="text-sm text-gray-500">
                            Bu ayar kapalı olduğunda site arama motorları tarafından indekslenmez
                        </p>
                    </div>
                </div>

                <div className="flex justify-end">
                    <button
                        type="submit"
                        className="px-6 py-2 text-white bg-blue-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 hover:bg-blue-700"
                        disabled={isSaving || isUploading.logo || isUploading.ogImage}
                    >
                        {isSaving ? 'Kaydediliyor...' : 'Ayarları Kaydet'}
                    </button>
                </div>
            </form>
        </div>
    );
}
