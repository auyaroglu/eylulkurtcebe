'use client';

import { useState, useEffect, useRef, createRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import ImageUploader from '@/components/admin/ImageUploader';
import SeoPreview from '@/components/admin/SeoPreview';
import SeoInputs from '@/components/admin/SeoInputs';
import { slugify, debouncedCheckAndUpdateSlug } from '@/lib/utils';
import { toast } from 'react-toastify';
import { addProject, generateSeoContent } from '@/lib/server-actions';

export default function NewProject() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [activeLocale, setActiveLocale] = useState(searchParams?.get('locale') || 'tr');
    const lastInputRef = useRef<HTMLInputElement>(null);
    const imageUploaderRef = useRef<{
        uploadAllFiles: () => Promise<string[]>;
    } | null>(null);

    // SEO formu - boş form değerlerini içerir
    const emptySeoForm = {
        metaTitle: '',
        metaDescription: '',
        metaKeywords: '',
        ogTitle: '',
        ogDescription: '',
        ogImage: '',
    };

    // Yeni proje formu - ilk değerleri boş olarak ayarla
    const [projectData, setProjectData] = useState({
        title: '',
        slug: '',
        description: '',
        content: '',
        technologies: [''],
        images: [] as string[],
        featuredImage: '',
        status: true,
        seo: emptySeoForm,
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [draggedTechIndex, setDraggedTechIndex] = useState<number | null>(null);

    // SEO otomatik doldurma fonksiyonu
    const [isGeneratingSeo, setIsGeneratingSeo] = useState(false);

    // Önizleme için site URL'i state'i
    const [siteUrl, setSiteUrl] = useState(process.env.SITE_URL || 'eylulkurtcebe.com');

    // Site logo URL'ini tutan değişken
    const [siteLogoUrl, setSiteLogoUrl] = useState('/logo.webp');

    // Locale değiştiğinde URL'i ve varsayılan yayın durumunu güncelle
    useEffect(() => {
        router.push(`/admin/projeler/yeni?locale=${activeLocale}`);

        // Locale'e göre varsayılan yayın durumunu ayarla
        setProjectData(prev => ({
            ...prev,
            status: activeLocale === 'tr', // Türkçe ise yayında, İngilizce ise gizli
        }));
    }, [activeLocale, router]);

    // Başlık değiştiğinde sadece slug'ı güncelle, SEO alanlarını otomatik doldurma
    useEffect(() => {
        if (projectData.title) {
            const newSlug = slugify(projectData.title);
            setProjectData(prev => ({
                ...prev,
                slug: newSlug,
            }));

            // Başlık değiştiğinde slug'ı kontrol et ve benzersiz hale getir
            debouncedCheckAndUpdateSlug(newSlug, activeLocale, suggestedSlug => {
                setProjectData(prev => ({
                    ...prev,
                    slug: suggestedSlug,
                }));
            });
        }
    }, [projectData.title, activeLocale]);

    // İlk yüklemede site ayarlarından OG Görsel değerini al
    useEffect(() => {
        // Site ayarlarından varsayılan logoyu getir
        const fetchOgImageFromSiteConfig = async () => {
            try {
                // Admin token'ı al
                const token = localStorage.getItem('adminToken');

                // Token yoksa login sayfasına yönlendirme yapma, sadece default logo kullan
                if (!token) {
                    console.log('Admin token bulunamadı, varsayılan logo kullanılacak');
                    setProjectData(prev => ({
                        ...prev,
                        seo: {
                            ...prev.seo,
                            ogImage: '/logo.webp',
                        },
                    }));
                    return;
                }

                const response = await fetch('/api/admin/site-config', {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (response.ok) {
                    const siteConfig = await response.json();
                    // Site ayarlarından OG Görsel değerini al
                    if (siteConfig && siteConfig.seo && siteConfig.seo.ogImage) {
                        console.log('Site ayarlarından OG Görsel alındı:', siteConfig.seo.ogImage);
                        setProjectData(prev => ({
                            ...prev,
                            seo: {
                                ...prev.seo,
                                ogImage: siteConfig.seo.ogImage,
                            },
                        }));
                    } else {
                        // Site ayarlarında OG Görsel yoksa varsayılan logo kullan
                        const defaultLogoPath = '/logo.webp';
                        console.log(
                            'Site ayarlarında OG Görsel bulunamadı, varsayılan kullanılıyor:',
                            defaultLogoPath
                        );
                        setProjectData(prev => ({
                            ...prev,
                            seo: {
                                ...prev.seo,
                                ogImage: defaultLogoPath,
                            },
                        }));
                    }
                } else {
                    console.error('Site ayarları alınamadı, HTTP hata kodu:', response.status);
                    // API hatası durumunda varsayılan logo kullan
                    setProjectData(prev => ({
                        ...prev,
                        seo: {
                            ...prev.seo,
                            ogImage: '/logo.webp',
                        },
                    }));
                }
            } catch (error) {
                console.error('Site ayarları yüklenirken hata oluştu:', error);
                // Hata durumunda varsayılan logo kullan
                setProjectData(prev => ({
                    ...prev,
                    seo: {
                        ...prev.seo,
                        ogImage: '/logo.webp',
                    },
                }));
            }
        };

        // SEO görselini site ayarlarından getir
        if (!projectData.seo.ogImage) {
            fetchOgImageFromSiteConfig();
        }
    }, []);

    // Yeni teknik eklendiğinde son input'a focus ol
    useEffect(() => {
        if (lastInputRef.current) {
            lastInputRef.current.focus();
        }
    }, [projectData.technologies.length]);

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

    // Slug'ı manuel olarak güncelle
    const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = e.target;
        const newSlug = slugify(value);
        setProjectData(prev => ({ ...prev, slug: newSlug }));

        // Manuel değişiklikten sonra da slug'ı kontrol et
        debouncedCheckAndUpdateSlug(newSlug, activeLocale, suggestedSlug => {
            setProjectData(prev => ({
                ...prev,
                slug: suggestedSlug,
            }));
        });
    };

    // Slug'ı başlıktan yeniden oluştur
    const regenerateSlug = () => {
        if (projectData.title) {
            const newSlug = slugify(projectData.title);

            // Yeniden oluşturulan slug'ı kontrol et ve güncelle
            debouncedCheckAndUpdateSlug(newSlug, activeLocale, suggestedSlug => {
                setProjectData(prev => ({
                    ...prev,
                    slug: suggestedSlug,
                }));
            });

            setProjectData(prev => ({
                ...prev,
                slug: newSlug,
            }));
        }
    };

    // Teknik dizisini güncelle
    const handleTechChange = (index: number, value: string) => {
        const newTechnologies = [...projectData.technologies];
        newTechnologies[index] = value;
        setProjectData(prev => ({ ...prev, technologies: newTechnologies }));
    };

    // Yeni teknik alanı ekle
    const handleAddTechField = () => {
        setProjectData(prev => ({
            ...prev,
            technologies: [...prev.technologies, ''],
        }));
    };

    // Teknik alanını kaldır
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

        // Teknik listesini güncelle
        setProjectData(prev => ({ ...prev, technologies: newTechnologies }));
    };

    const handleDragEnd = () => {
        setDraggedTechIndex(null);
    };

    // Görsel dizisini güncelle
    const handleImagesChange = (newImages: string[]) => {
        setProjectData(prev => ({ ...prev, images: newImages }));
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

            // Gerekli alanları kontrol et - Türkçe için başlık zorunlu
            if (activeLocale === 'tr' && !projectData.title.trim()) {
                throw new Error('Türkçe proje başlığı gereklidir');
            }

            if (activeLocale === 'tr' && !projectData.description.trim()) {
                throw new Error('Türkçe proje açıklaması gereklidir');
            }

            if (activeLocale === 'tr' && technologies.length === 0) {
                throw new Error('Türkçe projede en az bir teknik eklemelisiniz');
            }

            // İngilizce içerik opsiyonel, ancak başlık girilmişse diğer içeriklerin de girilmesi gerekli
            if (
                activeLocale === 'en' &&
                projectData.title.trim() &&
                !projectData.description.trim()
            ) {
                throw new Error('İngilizce başlık girildiyse, açıklama da girilmelidir');
            }

            if (activeLocale === 'en' && projectData.title.trim() && technologies.length === 0) {
                throw new Error('İngilizce başlık girildiyse, en az bir teknik de eklenmelidir');
            }

            // Slug kontrolü
            if (!projectData.slug.trim()) {
                throw new Error('Geçerli bir slug değeri gereklidir.');
            }

            // Görseller her dil için zorunlu
            if (images.length === 0) {
                throw new Error('En az bir görsel yüklemelisiniz');
            }

            const token = localStorage.getItem('adminToken');
            if (!token) {
                router.push('/admin/giris');
                return;
            }

            console.log('Form gönderimi başlatılıyor. Proje verileri:', {
                ...projectData,
                technologies,
                imageCount: images.length,
            });

            // Önce görüntüleri sunucuya yükle
            let uploadedImageUrls: string[] = [];

            // Burada ref'in doğru şekilde ayarlanıp ayarlanmadığını kontrol et
            console.log('imageUploaderRef var mı?', !!imageUploaderRef);
            console.log('imageUploaderRef.current var mı?', !!imageUploaderRef.current);

            if (imageUploaderRef.current) {
                console.log('uploadAllFiles var mı?', !!imageUploaderRef.current.uploadAllFiles);

                try {
                    console.log('Resimleri yükleme başlatılıyor...');
                    uploadedImageUrls = await imageUploaderRef.current.uploadAllFiles();
                    console.log('Resimler başarıyla yüklendi:', uploadedImageUrls);
                } catch (uploadError: any) {
                    console.error('Görseller yüklenirken hata:', uploadError);
                    throw new Error(`Görseller yüklenirken hata: ${uploadError.message}`);
                }
            } else {
                console.error('ImageUploader referansı bulunamadı!');
                throw new Error('Görseller yüklenemedi: Sistem hatası (ref bulunamadı)');
            }

            console.log('API çağrısı hazırlanıyor:', `/api/admin/projects/${activeLocale}`);

            // Görseller yüklendikten sonra projeyi kaydet
            const response = await fetch(`/api/admin/projects/${activeLocale}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    title: projectData.title,
                    description: projectData.description,
                    technologies,
                    images: uploadedImageUrls, // Sunucuya yüklenen görsel URL'lerini kullan
                    status: projectData.status,
                    id: projectData.slug, // id değeri olarak slug'ı kullan
                    seo: {
                        metaTitle: projectData.seo.metaTitle || projectData.title || '',
                        metaDescription: projectData.seo.metaDescription || '',
                        metaKeywords: projectData.seo.metaKeywords || '',
                        ogTitle: projectData.seo.ogTitle || projectData.title || '',
                        ogDescription: projectData.seo.ogDescription || '',
                        ogImage:
                            projectData.seo.ogImage ||
                            (uploadedImageUrls.length > 0 ? uploadedImageUrls[0] : siteLogoUrl), // Site ayarlarından gelen logo URL'i
                    },
                }),
            });

            console.log('API yanıtı:', response.status, response.statusText);

            if (response.ok) {
                const result = await response.json();
                console.log('Proje başarıyla eklendi:', result);
                router.push('/admin/projeler');
            } else {
                const errorData = await response.json();
                console.error('API hata yanıtı:', errorData);
                throw new Error(errorData.error || 'Proje eklenemedi');
            }
        } catch (err: any) {
            setError(err.message || 'Proje eklenemedi');
            console.error('Proje ekleme hatası:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Locali değiştir
    const toggleLocale = () => {
        const newLocale = activeLocale === 'tr' ? 'en' : 'tr';
        setActiveLocale(newLocale);
    };

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

    // Site ayarlarından logo URL'ini çeken fonksiyon
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

    // Sayfa yüklendiğinde logo URL'ini çek
    useEffect(() => {
        fetchOgImageFromSiteConfig();
    }, []);

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Yeni Proje Ekle</h1>
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
                                name="slug"
                                value={projectData.slug}
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
                        Sıralamayı değiştirmek için teknikleri sürükleyip bırakabilirsiniz.
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
                    <label className="block mb-2 font-medium">Proje Görselleri:</label>
                    <ImageUploader
                        images={projectData.images}
                        onChange={handleImagesChange}
                        innerRef={imageUploaderRef}
                    />
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
                        {activeLocale === 'tr'
                            ? '"Yayında" seçeneği içeriğin web sitesinde görünür olmasını sağlar. "Gizli" seçeneği içeriği web sitesinde gizler. Türkçe içerikler varsayılan olarak "Yayında" ayarlanır.'
                            : '"Yayında" seçeneği içeriğin web sitesinde görünür olmasını sağlar. "Gizli" seçeneği içeriği web sitesinde gizler. İngilizce içerikler varsayılan olarak "Gizli" ayarlanır.'}
                    </p>
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
                        {isSubmitting ? 'Kaydediliyor...' : 'Projeyi Ekle'}
                    </button>
                </div>
            </form>
        </div>
    );
}
