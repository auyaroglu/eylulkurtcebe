'use client';

import { useState, useEffect, use, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import ImageUploader from '@/components/admin/ImageUploader';
import SeoPreview from '@/components/admin/SeoPreview';
import SeoInputs from '@/components/admin/SeoInputs';
import { slugify, debouncedCheckAndUpdateSlug } from '@/lib/utils';
import { toast } from 'react-toastify';
import { Error } from 'mongoose';
import { updateProject, generateSeoContent } from '@/lib/server-actions';
import path from 'path';

interface PageProps {
    params: Promise<{
        id: string;
    }>;
}

interface ProjectDataType {
    title: string;
    description: string;
    technologies: string[];
    images: string[];
    id?: string;
    originalId?: string;
    status: boolean;
    seo: {
        metaTitle: string;
        metaDescription: string;
        metaKeywords: string;
        ogTitle: string;
        ogDescription: string;
        ogImage: string;
    };
    [key: string]: any;
}

export default function EditProject({ params }: PageProps) {
    // Params'ı doğru şekilde kullan
    const resolvedParams = use(params);
    const projectId = resolvedParams.id;

    const searchParams = useSearchParams();
    const router = useRouter();
    const [activeLocale, setActiveLocale] = useState(searchParams?.get('locale') || 'tr');
    const [originalProjectId, setOriginalProjectId] = useState<string | null>(null);
    const lastInputRef = useRef<HTMLInputElement>(null);
    const [tempImages, setTempImages] = useState<string[]>([]);

    const [projectData, setProjectData] = useState<ProjectDataType>({
        title: '',
        description: '',
        technologies: [''],
        images: [] as string[],
        status: true,
        id: '', // mevcut id/slug değeri
        seo: {
            metaTitle: '',
            metaDescription: '',
            metaKeywords: '',
            ogTitle: '',
            ogDescription: '',
            ogImage: '',
        },
    });

    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [draggedTechIndex, setDraggedTechIndex] = useState<number | null>(null);
    const [savedOriginalId, setSavedOriginalId] = useState<string | null>(null);

    // SEO otomatik doldurma fonksiyonu
    const [isGeneratingSeo, setIsGeneratingSeo] = useState(false);

    // Önizleme için site URL'i state'i
    const [siteUrl, setSiteUrl] = useState(process.env.SITE_URL || 'eylulkurtcebe.com');

    // Site logo URL'ini tutan değişken
    const [siteLogoUrl, setSiteLogoUrl] = useState('/logo.webp');

    // Yeni teknik eklendiğinde son input'a focus ol
    useEffect(() => {
        if (lastInputRef.current) {
            lastInputRef.current.focus();
        }
    }, [projectData.technologies.length]);

    // Projeyi yükle
    useEffect(() => {
        async function fetchProject() {
            try {
                setIsLoading(true);
                setError(null);
                const token = localStorage.getItem('adminToken');

                if (!token) {
                    router.push('/admin/giris');
                    return;
                }

                console.log(`${activeLocale} dilinde '${projectId}' ID'li proje yükleniyor...`);

                // UUID formatında mı kontrol et
                const isUUID =
                    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
                        projectId
                    );

                // UUID ise originalId olarak ara
                const apiUrl = isUUID
                    ? `/api/admin/projects/${activeLocale}/by-original-id/${projectId}`
                    : `/api/admin/projects/${activeLocale}/${projectId}`;

                const response = await fetch(apiUrl, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (response.ok) {
                    const data = await response.json();
                    console.log(
                        `${activeLocale} dilinde proje başarıyla yüklendi. originalId: ${
                            data.originalId || 'yok'
                        }, status: ${data.status ? 'Yayında' : 'Gizli'}`
                    );

                    // originalId'yi sakla - dil değiştirme ve diğer işlemler için gerekli
                    setSavedOriginalId(data.originalId);
                    setOriginalProjectId(projectId);

                    // Diğer dildeki projenin görüntülerini al
                    const otherLocale = activeLocale === 'tr' ? 'en' : 'tr';
                    let sharedImages = data.images;

                    try {
                        if (data.originalId) {
                            // originalId ile diğer dildeki projeyi kontrol et
                            const otherProjectResponse = await fetch(
                                `/api/admin/projects/${otherLocale}/by-original-id/${data.originalId}`,
                                {
                                    headers: {
                                        Authorization: `Bearer ${token}`,
                                    },
                                }
                            );

                            if (otherProjectResponse.ok) {
                                const otherData = await otherProjectResponse.json();
                                // Eğer diğer dilde proje varsa ve görselleri varsa, bunları kullan
                                if (otherData && otherData.images && otherData.images.length > 0) {
                                    sharedImages = otherData.images;
                                    console.log(
                                        `Diğer dildeki projeden (${otherData.id}) ${sharedImages.length} görsel alındı`
                                    );
                                }
                            }
                        }
                    } catch (otherErr) {
                        console.error('Diğer dildeki proje görsellerini alma hatası:', otherErr);
                    }

                    // Eğer teknolojiler veya görseller boşsa, en az bir tane boş alan ekle
                    setProjectData({
                        ...data,
                        technologies: data.technologies?.length > 0 ? data.technologies : [''],
                        images: sharedImages?.length > 0 ? sharedImages : [],
                        status:
                            typeof data.status === 'boolean' ? data.status : activeLocale === 'tr', // Status yoksa locale'e göre varsayılan değeri belirle
                    });

                    // Orijinal URL'ye (slug'a) yönlendir eğer şu anki URL slug değilse ve UUID değilse
                    if (!isUUID && projectId !== data.id) {
                        console.log(`URL güncelleniyor: ${projectId} -> ${data.id}`);
                        router.replace(
                            `/admin/projeler/duzenle/${data.id}?locale=${activeLocale}`,
                            { scroll: false }
                        );
                    }
                } else if (response.status === 404) {
                    // Proje bulunamadıysa ve diğer dildeki ilişkili projeyi arayabiliriz
                    await tryFindRelatedProject();
                } else {
                    console.error(
                        `${activeLocale} dilinde '${projectId}' ID'li proje bulunamadı. Status: ${response.status}`
                    );
                    setError(`Proje yüklenemedi (HTTP ${response.status})`);
                }
            } catch (error) {
                console.error('Proje yükleme hatası:', error);
                setError('Proje yüklenemedi');
            } finally {
                setIsLoading(false);
            }
        }

        // Diğer dilde ilişkili projeyi bulmaya çalış
        async function tryFindRelatedProject() {
            try {
                const token = localStorage.getItem('adminToken');
                if (!token) return;

                const otherLocale = activeLocale === 'tr' ? 'en' : 'tr';
                console.log(`Diğer dilde (${otherLocale}) ilişkili proje aranıyor...`);

                const otherResponse = await fetch(
                    `/api/admin/projects/${otherLocale}/${projectId}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                if (otherResponse.ok) {
                    const otherData = await otherResponse.json();

                    if (!otherData.originalId) {
                        console.error('Diğer dildeki projenin originalId değeri yok');
                        setError('İlişkili proje bulunamadı');
                        return;
                    }

                    setSavedOriginalId(otherData.originalId);

                    // Ortak originalId'yi kullanarak doğru dildeki projeyi bul
                    console.log(`originalId=${otherData.originalId} ile proje aranıyor...`);
                    const relatedResponse = await fetch(
                        `/api/admin/projects/${activeLocale}/by-original-id/${otherData.originalId}`,
                        {
                            headers: {
                                Authorization: `Bearer ${token}`,
                            },
                        }
                    );

                    if (relatedResponse.ok) {
                        const relatedData = await relatedResponse.json();
                        console.log(`İlişkili proje bulundu: ${relatedData.id}`);

                        // Projeyi yükle
                        setProjectData({
                            ...relatedData,
                            technologies:
                                relatedData.technologies?.length > 0
                                    ? relatedData.technologies
                                    : [''],
                            images: relatedData.images?.length > 0 ? relatedData.images : [],
                        });

                        // URL'i sessizce güncelle (sayfa yenilemeden)
                        router.replace(
                            `/admin/projeler/duzenle/${relatedData.id}?locale=${activeLocale}`,
                            { scroll: false }
                        );
                    } else {
                        console.error('İlişkili proje bulunamadı');
                        setError('İlişkili proje bulunamadı');
                    }
                } else {
                    console.error(`Diğer dilde de proje bulunamadı (${otherLocale})`);
                    setError('Proje bulunamadı');
                }
            } catch (error) {
                console.error('İlişkili proje arama hatası:', error);
                setError('Proje yüklenemedi');
            }
        }

        fetchProject();
    }, [activeLocale, projectId, router]);

    // Locale değişimi için sessiz URL güncellemesi
    useEffect(() => {
        // Sadece URL'deki locale parametresini güncelle, sayfayı yönlendirme veya yenileme yapmadan
        const currentUrl = new URL(window.location.href);
        currentUrl.searchParams.set('locale', activeLocale);
        router.replace(currentUrl.pathname + currentUrl.search, { scroll: false });
    }, [activeLocale, router]);

    // Locali değiştir - şimdi originalId kullanarak geçiş yapıyoruz
    const toggleLocale = async () => {
        const newLocale = activeLocale === 'tr' ? 'en' : 'tr';
        console.log(`Dil değiştiriliyor: ${activeLocale} -> ${newLocale}`);

        // Önce mevcut değişiklikleri kaydet
        if (Object.keys(projectData).length > 0 && projectData.title) {
            await handleSaveBeforeLanguageChange();
        }

        // originalId ile yeni sayfaya yönlendirme yapalım
        if (savedOriginalId) {
            try {
                setIsLoading(true);
                const token = localStorage.getItem('adminToken');
                if (!token) {
                    router.push('/admin/giris');
                    return;
                }

                // originalId kullanarak diğer dildeki projeyi bul
                const response = await fetch(
                    `/api/admin/projects/${newLocale}/by-original-id/${savedOriginalId}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                if (response.ok) {
                    const otherProject = await response.json();
                    // Yeni locale ile o projenin sayfasına git
                    router.push(`/admin/projeler/duzenle/${otherProject.id}?locale=${newLocale}`);
                } else {
                    console.log(`${newLocale} dilinde proje bulunamadı, yeni oluşturuluyor...`);
                    // Dili değiştir - bu sayfa yeniden yüklenmeyecek, sadece içerik değişecek
                    setActiveLocale(newLocale);
                }
            } catch (error) {
                console.error('Dil değiştirme hatası:', error);
                setActiveLocale(newLocale);
            } finally {
                setIsLoading(false);
            }
        } else {
            // originalId yoksa sadece dili değiştir
            setActiveLocale(newLocale);
        }
    };

    // Dil değişmeden önce mevcut projeyi kaydet
    const handleSaveBeforeLanguageChange = async () => {
        try {
            setIsSubmitting(true);

            // Boş teknikleri temizle
            const technologies = projectData.technologies.filter(tech => tech.trim() !== '');

            const token = localStorage.getItem('adminToken');
            if (!token) {
                router.push('/admin/giris');
                return;
            }

            const response = await fetch(`/api/admin/projects/${activeLocale}/${projectId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    ...projectData,
                    technologies,
                }),
            });

            if (response.ok) {
                console.log(`${activeLocale} dilindeki proje otomatik olarak kaydedildi.`);
            } else {
                console.warn(
                    'Dil değişikliği öncesi kaydetme başarısız oldu:',
                    await response.text()
                );
            }
        } catch (err) {
            console.error('Dil değişikliği öncesi kaydetme hatası:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Görsel dizisini güncelle
    const handleImagesChange = async (newImages: string[]) => {
        setProjectData(prev => ({ ...prev, images: newImages }));

        // Diğer dildeki projeyi de güncelle (görseller tüm diller arasında paylaşılır)
        try {
            if (savedOriginalId) {
                const token = localStorage.getItem('adminToken');
                if (!token) return;

                const otherLocale = activeLocale === 'tr' ? 'en' : 'tr';

                // originalId ile diğer dildeki projeyi kontrol et
                const otherProjectResponse = await fetch(
                    `/api/admin/projects/${otherLocale}/by-original-id/${savedOriginalId}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                if (otherProjectResponse.ok) {
                    const otherData = await otherProjectResponse.json();

                    // Diğer dildeki projeyi güncelle (sadece görseller)
                    if (otherData && otherData.id) {
                        await fetch(`/api/admin/projects/${otherLocale}/${otherData.id}`, {
                            method: 'PUT',
                            headers: {
                                'Content-Type': 'application/json',
                                Authorization: `Bearer ${token}`,
                            },
                            body: JSON.stringify({
                                ...otherData,
                                images: newImages,
                            }),
                        });
                        console.log(`${otherLocale} dilindeki projede görsel güncellendi`);
                    }
                }
            }
        } catch (error) {
            console.error('Diğer dildeki projenin görsellerini güncelleme hatası:', error);
        }
    };

    // Geçici görselleri güncelle
    const handleTempImagesChange = (newTempImages: string[]) => {
        setTempImages(newTempImages);
    };

    // Sayfa kapatıldığında geçici görselleri temizle
    useEffect(() => {
        return () => {
            // Sayfa kapatıldığında geçici görselleri sil
            tempImages.forEach(async imageUrl => {
                try {
                    const fileName = imageUrl.split('/').pop();
                    if (!fileName) return;

                    const token = localStorage.getItem('adminToken');
                    if (!token) return;

                    await fetch('/api/admin/deleteImage', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify({ fileName }),
                    });
                } catch (error) {
                    console.error('Geçici görsel silme hatası:', error);
                }
            });
        };
    }, [tempImages]);

    // Başlık değiştiğinde sadece slug'ı güncelle
    useEffect(() => {
        if (projectData.title) {
            const newSlug = slugify(projectData.title);
            setProjectData(prev => ({
                ...prev,
                id: newSlug,
            }));

            // Başlık değiştiğinde slug'ı kontrol et (düzenleme modunda originalId ile)
            debouncedCheckAndUpdateSlug(
                newSlug,
                activeLocale,
                suggestedSlug => {
                    setProjectData(prev => ({
                        ...prev,
                        id: suggestedSlug,
                    }));
                },
                savedOriginalId || undefined
            );
        }
    }, [projectData.title, activeLocale, savedOriginalId]);

    // İlk yüklemede site ayarlarından OG Görsel değerini al
    useEffect(() => {
        // Site ayarlarından varsayılan logoyu getir
        const fetchOgImageFromSiteConfig = async () => {
            try {
                const response = await fetch('/api/site-config');
                if (response.ok) {
                    const data = await response.json();
                    const logoUrl = data.logo || data.seo?.ogImage || '/logo.webp';
                    setSiteLogoUrl(logoUrl);
                }
            } catch (error) {
                console.error('Site logo URL alınamadı:', error);
            }
        };

        // SEO görselini site ayarlarından getir (henüz bir değer yoksa)
        if (projectData.seo && !projectData.seo.ogImage) {
            fetchOgImageFromSiteConfig();
        }
    }, [projectData.seo]);

    // Proje verilerini güncelle
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;

        // SEO alanları için nested update
        if (name.startsWith('seo.')) {
            const seoField = name.split('.')[1];
            setProjectData(prev => ({
                ...prev,
                seo: {
                    ...prev.seo,
                    [seoField]: value,
                },
            }));
        } else {
            setProjectData(prev => ({ ...prev, [name]: value }));
        }
    };

    // Teknoloji dizisini güncelle
    const handleTechChange = (index: number, value: string) => {
        const newTechnologies = [...projectData.technologies];
        newTechnologies[index] = value;
        setProjectData(prev => ({ ...prev, technologies: newTechnologies }));
    };

    // Yeni teknoloji alanı ekle
    const handleAddTechField = () => {
        setProjectData(prev => ({
            ...prev,
            technologies: [...prev.technologies, ''],
        }));
    };

    // Teknoloji alanını kaldır
    const handleRemoveTechField = (index: number) => {
        if (projectData.technologies.length <= 1) return;

        const newTechnologies = [...projectData.technologies];
        newTechnologies.splice(index, 1);
        setProjectData(prev => ({ ...prev, technologies: newTechnologies }));
    };

    // Sürükleme işlemleri için fonksiyonlar
    const handleDragStart = (index: number) => {
        setDraggedTechIndex(index);
    };

    const handleDragEnter = (index: number) => {
        if (draggedTechIndex === null || draggedTechIndex === index) return;

        const newTechnologies = [...projectData.technologies];
        const draggedItem = newTechnologies[draggedTechIndex];

        // Sürüklenen öğeyi çıkar ve yeni konuma ekle
        newTechnologies.splice(draggedTechIndex, 1);
        newTechnologies.splice(index, 0, draggedItem);

        // Sürüklenen öğenin yeni indeksini güncelle
        setDraggedTechIndex(index);

        // Teknoloji listesini güncelle
        setProjectData(prev => ({ ...prev, technologies: newTechnologies }));
    };

    const handleDragEnd = () => {
        setDraggedTechIndex(null);
    };

    // Manual olarak slug değişimi
    const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const newSlug = slugify(value);
        setProjectData(prev => ({
            ...prev,
            id: newSlug,
        }));

        // Manuel değişiklikten sonra da slug'ı kontrol et
        debouncedCheckAndUpdateSlug(
            newSlug,
            activeLocale,
            suggestedSlug => {
                setProjectData(prev => ({
                    ...prev,
                    id: suggestedSlug,
                }));
            },
            savedOriginalId || undefined
        );
    };

    // Başlıktan slug yenileme
    const regenerateSlug = () => {
        if (projectData.title) {
            const newSlug = slugify(projectData.title);

            // Yeniden oluşturulan slug'ı kontrol et ve güncelle
            debouncedCheckAndUpdateSlug(
                newSlug,
                activeLocale,
                suggestedSlug => {
                    setProjectData(prev => ({
                        ...prev,
                        id: suggestedSlug,
                    }));
                },
                savedOriginalId || undefined
            );

            setProjectData(prev => ({
                ...prev,
                id: newSlug,
            }));
        }
    };

    // Formu gönder
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        try {
            // Boş teknikleri temizle
            const technologies = projectData.technologies.filter(tech => tech.trim() !== '');

            // Boş görselleri temizle
            const images = projectData.images.filter(img => img.trim() !== '');

            // Gerekli alanları kontrol et
            if (!projectData.title.trim()) {
                throw new Error('Proje başlığı gereklidir');
            }

            if (!projectData.description.trim()) {
                throw new Error('Proje açıklaması gereklidir');
            }

            if (technologies.length === 0) {
                throw new Error('En az bir teknik eklemelisiniz');
            }

            if (images.length === 0) {
                throw new Error('En az bir görsel yüklemelisiniz');
            }

            const token = localStorage.getItem('adminToken');
            if (!token) {
                router.push('/admin/giris');
                return;
            }

            console.log('Form gönderiliyor:', {
                ...projectData,
                technologies,
                images,
                status: projectData.status,
            });

            // originalId varsa, onu kullanarak güncelleme yapalım (daha güvenilir)
            const updateUrl = savedOriginalId
                ? `/api/admin/projects/${activeLocale}/by-original-id/${savedOriginalId}`
                : `/api/admin/projects/${activeLocale}/${projectId}`;

            const response = await fetch(updateUrl, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    ...projectData,
                    technologies,
                    images,
                    seo: {
                        metaTitle: projectData.seo?.metaTitle || projectData.title || '',
                        metaDescription: projectData.seo?.metaDescription || '',
                        metaKeywords: projectData.seo?.metaKeywords || '',
                        ogTitle: projectData.seo?.ogTitle || projectData.title || '',
                        ogDescription: projectData.seo?.ogDescription || '',
                        ogImage:
                            projectData.seo?.ogImage ||
                            (images.length > 0 ? images[0] : siteLogoUrl),
                    },
                }),
            });

            if (response.ok) {
                // Proje başarıyla kaydedildiğinde geçici görselleri temizle
                setTempImages([]);
                router.push('/admin/projeler');
            } else {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Proje güncellenemedi');
            }
        } catch (err: any) {
            setError(err.message || 'Proje güncellenemedi');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Sayfa yüklendiğinde site URL'ini al
    useEffect(() => {
        const fetchSiteUrl = async () => {
            try {
                const response = await fetch('/api/site-config');
                if (response.ok) {
                    const data = await response.json();
                    setSiteUrl(data.siteUrl || 'eylulkurtcebe.com');
                }
            } catch (error) {
                console.error('Site URL alınamadı:', error);
                setSiteUrl(process.env.SITE_URL || 'eylulkurtcebe.com');
            }
        };

        fetchSiteUrl();
    }, []);

    // SEO alanlarını başlık ve açıklamadan otomatik doldur
    const generateSeoData = async () => {
        if (!projectData.title) {
            toast.error('SEO verilerini oluşturmak için önce başlık girmelisiniz.');
            return;
        }

        setIsGeneratingSeo(true);

        try {
            const seoData = await generateSeoContent(
                projectData.title.trim(),
                projectData.description.trim() || '',
                projectData.technologies.filter(tech => tech.trim() !== ''),
                activeLocale
            );

            // SEO verilerini güncelle
            setProjectData(prev => ({
                ...prev,
                seo: {
                    ...prev.seo,
                    ...seoData,
                    ogImage: prev.seo?.ogImage || '',
                },
            }));

            toast.success('SEO alanları başarıyla oluşturuldu.');
        } catch (error) {
            console.error('SEO verisi oluşturma hatası:', error);
            toast.error('SEO yapay zeka entegrasyonu başarısız oldu. Form verileri kullanıldı.');
        } finally {
            setIsGeneratingSeo(false);
        }
    };

    if (isLoading) {
        return (
            <div className="p-6">
                <h1 className="mb-6 text-2xl font-bold">Proje Düzenleniyor...</h1>
                <div className="animate-pulse">
                    <div className="w-1/4 h-4 mb-4 bg-gray-200 rounded"></div>
                    <div className="w-1/2 h-4 mb-4 bg-gray-200 rounded"></div>
                    <div className="w-3/4 h-4 mb-4 bg-gray-200 rounded"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Proje Düzenle</h1>
                <div className="flex space-x-2">
                    <Link
                        href="/admin/projeler"
                        className="px-4 py-2 text-white bg-gray-600 rounded transition-colors hover:bg-gray-700"
                    >
                        Geri Dön
                    </Link>
                    <button
                        onClick={toggleLocale}
                        className="px-4 py-2 text-white bg-blue-600 rounded transition-colors hover:bg-blue-700"
                        disabled={isSubmitting}
                    >
                        {activeLocale === 'tr' ? "İngilizce'ye Geç" : "Türkçe'ye Geç"}
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-red-900/20 p-3 mb-4 text-red-400 rounded border border-red-500">
                    {error}
                </div>
            )}

            {/* originalId bilgisi */}
            {savedOriginalId && (
                <div className="p-3 mb-4 text-xs text-gray-400 bg-gray-800 rounded border border-gray-600">
                    <span className="font-semibold">Original ID (Sistem ID):</span>{' '}
                    {savedOriginalId}
                    <p className="mt-1">
                        Bu ID, iki dildeki projeleri eşleştirmek için kullanılır ve değiştirilemez.
                    </p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block mb-2 font-medium">
                        Proje Başlığı:
                        <input
                            type="text"
                            name="title"
                            value={projectData.title}
                            onChange={handleChange}
                            className="w-full block px-3 py-2 mt-1 text-white bg-gray-800 rounded border border-gray-600 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 placeholder:text-gray-400"
                            required
                        />
                    </label>
                </div>

                <div>
                    <label className="block mb-2 font-medium">
                        Slug (URL):
                        <div className="flex items-center mt-1">
                            <input
                                type="text"
                                name="id"
                                value={projectData.id}
                                onChange={handleSlugChange}
                                className="flex-grow px-3 py-2 text-white bg-gray-800 rounded-l border border-gray-600 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 placeholder:text-gray-400"
                                placeholder="proje-slug-url"
                                required
                            />
                            <button
                                type="button"
                                onClick={regenerateSlug}
                                className="px-3 py-2 text-white bg-gray-700 rounded-r border border-gray-600 hover:bg-gray-600"
                                title="Başlıktan yeniden oluştur"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="w-5 h-5"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            </button>
                        </div>
                        <p className="mt-1 text-xs text-gray-400">
                            Bu değer, projenin URL'inde kullanılacak. Otomatik oluşturulur ancak
                            düzenlenebilir.
                        </p>
                    </label>
                </div>

                <div>
                    <label className="block mb-2 font-medium">
                        Proje Açıklaması:
                        <textarea
                            name="description"
                            value={projectData.description}
                            onChange={handleChange}
                            rows={5}
                            className="w-full block px-3 py-2 mt-1 text-white bg-gray-800 rounded border border-gray-600 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 placeholder:text-gray-400"
                            required
                        />
                    </label>
                </div>

                <div>
                    <div className="flex justify-between items-center mb-2">
                        <label className="font-medium">Kullanılan Teknikler:</label>
                        <button
                            type="button"
                            onClick={handleAddTechField}
                            className="px-2 py-1 text-sm text-white bg-gray-700 rounded transition-colors hover:bg-gray-600"
                        >
                            + Teknik Ekle
                        </button>
                    </div>
                    <p className="mb-2 text-xs text-gray-400">
                        Sıralamayı değiştirmek için teknolojileri sürükleyip bırakabilirsiniz.
                    </p>
                    <div className="p-2 mb-2 text-xs text-gray-400 bg-gray-800 rounded border border-gray-600">
                        <span className="block mb-1 font-medium">
                            Seramik teknikleri örnekleri:
                        </span>
                        <ul className="grid grid-cols-2 gap-1 md:grid-cols-3">
                            <li className="pl-0">Porselen</li>
                            <li className="pl-0">Kristal Sır</li>
                            <li className="pl-0">Mat Sır</li>
                            <li className="pl-0">Seladon</li>
                            <li className="pl-0">Yüksek Ateş</li>
                            <li className="pl-0">Raku Pişirimi</li>
                            <li className="pl-0">Elle Şekillendirme</li>
                            <li className="pl-0">Döküm Tekniği</li>
                            <li className="pl-0">Çark Tekniği</li>
                            <li className="pl-0">Sır Altı Dekorlama</li>
                            <li className="pl-0">Sır Üstü Dekorlama</li>
                            <li className="pl-0">Sgraffito</li>
                            <li className="pl-0">Terra Sigillata</li>
                            <li className="pl-0">Nerikomi</li>
                        </ul>
                    </div>

                    <div className="space-y-2">
                        {projectData.technologies.map((tech, index) => (
                            <div
                                key={index}
                                className={`flex items-center gap-2 p-1 rounded ${
                                    draggedTechIndex === index ? 'bg-gray-700' : ''
                                }`}
                                draggable
                                onDragStart={() => handleDragStart(index)}
                                onDragEnter={() => handleDragEnter(index)}
                                onDragOver={e => e.preventDefault()}
                                onDragEnd={handleDragEnd}
                            >
                                <div className="px-2 text-gray-400 cursor-move hover:text-gray-300">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="w-5 h-5"
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                </div>
                                <input
                                    ref={
                                        index === projectData.technologies.length - 1
                                            ? lastInputRef
                                            : null
                                    }
                                    type="text"
                                    value={tech}
                                    onChange={e => handleTechChange(index, e.target.value)}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleAddTechField();
                                        }
                                    }}
                                    placeholder="örn. Kristal Sır, Raku, Porselen"
                                    className="flex-grow px-3 py-2 text-white bg-gray-800 rounded border border-gray-600 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 placeholder:text-gray-400"
                                    required={index === 0}
                                />
                                {projectData.technologies.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveTechField(index)}
                                        className="p-2 text-red-400 transition-colors hover:text-red-500"
                                    >
                                        <svg
                                            className="w-5 h-5"
                                            fill="currentColor"
                                            viewBox="0 0 20 20"
                                        >
                                            <path
                                                fillRule="evenodd"
                                                d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block mb-2 font-medium">Yayın Durumu:</label>
                    <div className="flex items-center space-x-4">
                        <label className="inline-flex items-center">
                            <input
                                type="radio"
                                name="status"
                                checked={projectData.status === true}
                                onChange={() => setProjectData(prev => ({ ...prev, status: true }))}
                                className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 focus:ring-blue-500"
                            />
                            <span className="ml-2">Yayında</span>
                        </label>
                        <label className="inline-flex items-center">
                            <input
                                type="radio"
                                name="status"
                                checked={projectData.status === false}
                                onChange={() =>
                                    setProjectData(prev => ({ ...prev, status: false }))
                                }
                                className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 focus:ring-blue-500"
                            />
                            <span className="ml-2">Gizli</span>
                        </label>
                    </div>
                    <p className="mt-1 text-xs text-gray-400">
                        "Yayında" seçeneği içeriğin web sitesinde görünür olmasını sağlar. "Gizli"
                        seçeneği içeriği web sitesinde gizler.
                    </p>
                </div>

                <div>
                    <label className="block mb-2 font-medium">Proje Görselleri:</label>
                    <ImageUploader
                        images={projectData.images}
                        onChange={handleImagesChange}
                        onTempImagesChange={handleTempImagesChange}
                    />
                </div>

                {/* SEO Ayarları - SeoInputs komponenti ile değiştirildi */}
                <SeoInputs
                    seo={projectData.seo}
                    onChange={handleChange}
                    onGenerateSeo={generateSeoData}
                    isGeneratingSeo={isGeneratingSeo}
                    contentType="project"
                    locale={activeLocale}
                />

                {/* SEO Önizleme */}
                <SeoPreview
                    siteUrl={siteUrl}
                    path={activeLocale === 'tr' ? '/projeler' : '/en/projects'}
                    slug={projectData.slug}
                    seo={projectData.seo}
                    title={projectData.title}
                    description={projectData.description}
                    image={projectData.images[0] || null}
                    contentType="project"
                    previewTitle="SEO Önizleme"
                />

                <div className="flex justify-end pt-4 space-x-3">
                    <Link
                        href="/admin/projeler"
                        className="px-4 py-2 text-white bg-gray-700 rounded transition-colors hover:bg-gray-600"
                    >
                        İptal
                    </Link>
                    <button
                        type="submit"
                        className="px-4 py-2 text-white bg-blue-600 rounded transition-colors disabled:bg-blue-600 disabled:opacity-50 hover:bg-blue-700"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
                    </button>
                </div>
            </form>
        </div>
    );
}
