'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

// Modüler bileşenler
import NavigationSection from '@/components/admin/icerikler/NavigationSection';
import HeroSection from '@/components/admin/icerikler/HeroSection';
import AboutSection from '@/components/admin/icerikler/AboutSection';
import SkillsSection from '@/components/admin/icerikler/SkillsSection';
import ExpertiseSection from '@/components/admin/icerikler/ExpertiseSection';
import ContactSection from '@/components/admin/icerikler/ContactSection';
import FooterSection from '@/components/admin/icerikler/FooterSection';
import AccordionSection from '@/components/admin/icerikler/AccordionSection';

export default function ContentManagement() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [activeLocale, setActiveLocale] = useState(searchParams?.get('locale') || 'tr');
    const [content, setContent] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [expandedSection, setExpandedSection] = useState<string | null>(null);

    // Locale değiştiğinde URL'i güncelle
    useEffect(() => {
        router.push(`/admin/icerikler?locale=${activeLocale}`);
    }, [activeLocale, router]);

    // İçerik verilerini yükle
    useEffect(() => {
        async function fetchContent() {
            try {
                setIsLoading(true);
                const token = localStorage.getItem('adminToken');

                if (!token) {
                    router.push('/admin/giris');
                    return;
                }

                const response = await fetch(`/api/admin/content/${activeLocale}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (response.ok) {
                    const data = await response.json();
                    setContent(data);
                } else {
                    console.error('İçerik alınamadı');
                }
            } catch (error) {
                console.error('İçerik yükleme hatası:', error);
            } finally {
                setIsLoading(false);
            }
        }

        fetchContent();
    }, [activeLocale, router]);

    // İçeriği kaydet
    const handleSave = async () => {
        try {
            setIsSaving(true);
            setSaveStatus('idle');

            const token = localStorage.getItem('adminToken');

            if (!token) {
                router.push('/admin/giris');
                return;
            }

            // Sosyal medya bilgilerini TR ve EN içeriğinde aynı yap
            const updatedContent = { ...content };

            // Eğer footer.socialMedia mevcutsa
            if (updatedContent.footer?.socialMedia) {
                // Bu bilgileri hatırla
                const socialMediaInfo = { ...updatedContent.footer.socialMedia };

                // Diğer dil için içeriği hazırla
                const otherLocale = activeLocale === 'tr' ? 'en' : 'tr';

                try {
                    // Diğer dilin içeriğini al
                    const otherResponse = await fetch(`/api/admin/content/${otherLocale}`, {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    });

                    if (otherResponse.ok) {
                        const otherData = await otherResponse.json();
                        // Diğer dile aynı sosyal medya bilgilerini uygula
                        otherData.footer.socialMedia = socialMediaInfo;

                        // Diğer dili güncelle
                        const updateOtherResponse = await fetch(
                            `/api/admin/content/${otherLocale}`,
                            {
                                method: 'PUT',
                                headers: {
                                    'Content-Type': 'application/json',
                                    Authorization: `Bearer ${token}`,
                                },
                                body: JSON.stringify(otherData),
                            }
                        );

                        if (!updateOtherResponse.ok) {
                            console.error(
                                `${otherLocale} için sosyal medya bilgileri eşitlenemedi`
                            );
                        }
                    }
                } catch (error) {
                    console.error('Sosyal medya bilgileri eşitleme hatası:', error);
                }
            }

            // Aktif dili güncelle
            const response = await fetch(`/api/admin/content/${activeLocale}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(content),
            });

            if (response.ok) {
                // İçerik güncellendikten sonra önbelleği temizle
                await revalidateCache(activeLocale);

                setSaveStatus('success');
                setTimeout(() => setSaveStatus('idle'), 3000);
            } else {
                const error = await response.json();
                console.error('İçerik kaydedilemedi:', error);
                setSaveStatus('error');
            }
        } catch (error) {
            console.error('İçerik kaydetme hatası:', error);
            setSaveStatus('error');
        } finally {
            setIsSaving(false);
        }
    };

    // Önbelleği temizleme fonksiyonu
    const revalidateCache = async locale => {
        try {
            const token = localStorage.getItem('adminToken');
            if (!token) return;

            // İçerik ve site ayarları etiketlerini temizle
            const tagsToRevalidate = [
                'content',
                'navigation',
                'navigation-order', // Navigasyon sıralaması için özel etiket
                `content-${locale}`,
                `navigation-${locale}`,
                'site-content',
                'footer',
                'site-settings',
                'site-config',
            ];

            // Her bir etiketi ayrı ayrı revalidate et
            for (const tag of tagsToRevalidate) {
                try {
                    const tagResponse = await fetch(`/api/admin/revalidate?tag=${tag}`, {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    });

                    if (tagResponse.ok) {
                        console.log(`${tag} etiketi başarıyla temizlendi.`);
                    }
                } catch (tagError) {
                    console.error(`${tag} etiketi temizlenirken hata:`, tagError);
                }
            }

            // Navigasyon içeren önemli yolları temizle
            const pathsToRevalidate = [
                '/',
                `/${locale}`,
                `/${locale}/projects`,
                `/${locale}/contact`,
                '/api/navigation',
                `/api/navigation/${locale}`,
            ];

            // Her bir yolu temizle
            for (const path of pathsToRevalidate) {
                try {
                    const pathResponse = await fetch(`/api/admin/revalidate?path=${path}`, {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    });

                    if (pathResponse.ok) {
                        console.log(`${path} yolu başarıyla temizlendi.`);
                    }
                } catch (pathError) {
                    console.error(`${path} yolu temizlenirken hata:`, pathError);
                }
            }

            // Yolları da revalidate et
            const response = await fetch(`/api/admin/revalidate?locale=${locale}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.ok) {
                console.log('Önbellek başarıyla temizlendi.');
                return true;
            } else {
                console.error('Önbellek temizleme hatası.');
                return false;
            }
        } catch (error) {
            console.error('Önbellek temizleme sırasında hata:', error);
            return false;
        }
    };

    // Site ön yüzünü yeni sekmede açma fonksiyonu
    const previewSite = async () => {
        // Önbellek temizleme işlemini başlat
        setIsSaving(true);

        try {
            // Önce API çağrısı ile sunucu önbelleğini temizle
            const prevCacheCleared = await revalidateCache(activeLocale);

            if (prevCacheCleared) {
                console.log('Ön izleme için önbellek temizlendi.');

                // SWR önbelleğini de temizle - localStorage'a bir sinyal bırak
                try {
                    // Şu anki zaman damgası ile revalidate sinyali ekle
                    const timestamp = Date.now().toString();
                    localStorage.setItem('swr-revalidate-timestamp', timestamp);
                    localStorage.setItem('swr-revalidate-content', 'true');

                    // SWR cache anahtarlarını temizleme sinyali ekle
                    localStorage.setItem(
                        'swr-clear-keys',
                        JSON.stringify([
                            `/api/content?locale=${activeLocale}`,
                            `/api/navigation?locale=${activeLocale}`,
                            `/api/site-settings`,
                        ])
                    );

                    console.log('SWR önbelleği için revalidate sinyali eklendi');

                    // Diğer sekmelere sinyal göndermek için bir storage event tetikle
                    window.dispatchEvent(
                        new StorageEvent('storage', {
                            key: 'swr-revalidate-timestamp',
                            newValue: timestamp,
                        })
                    );
                } catch (err) {
                    console.error('SWR revalidate sinyali eklenirken hata:', err);
                }

                // Yeni sekmede site önizlemesini aç
                window.open(`/${activeLocale}`, '_blank');
            } else {
                console.error('Önbellek temizlenemedi.');
            }
        } catch (error) {
            console.error('Önbellek temizleme sırasında hata:', error);
        } finally {
            setIsSaving(false);
        }
    };

    // İçerik değişikliklerini takip et
    const handleContentChange = (section: string, field: string, value: string) => {
        setContent((prevContent: any) => {
            if (!prevContent) return prevContent;

            // Basit alan
            if (!field.includes('.')) {
                return {
                    ...prevContent,
                    [section]: {
                        ...prevContent[section],
                        [field]: value,
                    },
                };
            }

            // İç içe alan (örn: form.title)
            const [parentField, childField] = field.split('.');
            return {
                ...prevContent,
                [section]: {
                    ...prevContent[section],
                    [parentField]: {
                        ...prevContent[section][parentField],
                        [childField]: value,
                    },
                },
            };
        });
    };

    // Accordion başlığını tıklandığında aç/kapat
    const toggleSection = (section: string) => {
        setExpandedSection(expandedSection === section ? null : section);
    };

    if (isLoading) {
        return (
            <div className="p-8">
                <div className="w-1/4 h-8 mb-8 bg-gray-700 rounded animate-pulse"></div>
                <div className="space-y-6">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="p-6 bg-gray-800 rounded-lg animate-pulse">
                            <div className="w-1/2 h-4 mb-4 bg-gray-700 rounded"></div>
                            <div className="space-y-3">
                                <div className="h-12 bg-gray-700 rounded"></div>
                                <div className="h-12 bg-gray-700 rounded"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white">İçerik Yönetimi</h1>
                    <p className="mt-2 text-gray-400">Site içeriklerini düzenleyin</p>
                </div>

                {/* Dil seçimi */}
                <div className="flex items-center">
                    <span className="mr-3 text-sm text-gray-400">Dil:</span>
                    <div className="overflow-hidden flex bg-gray-800 rounded-md">
                        <button
                            onClick={() => setActiveLocale('tr')}
                            className={`px-4 py-2 text-sm font-medium ${
                                activeLocale === 'tr'
                                    ? 'bg-blue-600 text-white'
                                    : 'text-gray-300 hover:bg-gray-700'
                            }`}
                        >
                            Türkçe
                        </button>
                        <button
                            onClick={() => setActiveLocale('en')}
                            className={`px-4 py-2 text-sm font-medium ${
                                activeLocale === 'en'
                                    ? 'bg-blue-600 text-white'
                                    : 'text-gray-300 hover:bg-gray-700'
                            }`}
                        >
                            English
                        </button>
                    </div>
                </div>
            </div>

            {!content ? (
                <div className="p-4 mb-6 text-white bg-red-500 rounded-md">
                    İçerik bulunamadı veya yüklenemedi.
                </div>
            ) : (
                <>
                    <div className="flex flex-col space-y-4">
                        <AccordionSection
                            title="Navigasyon"
                            isExpanded={expandedSection === 'nav'}
                            onToggle={() => toggleSection('nav')}
                        >
                            <NavigationSection content={content} setContent={setContent} />
                        </AccordionSection>

                        <AccordionSection
                            title="Ana Bölüm (Hero)"
                            isExpanded={expandedSection === 'hero'}
                            onToggle={() => toggleSection('hero')}
                        >
                            <HeroSection
                                content={content}
                                setContent={setContent}
                                handleContentChange={handleContentChange}
                            />
                        </AccordionSection>

                        <AccordionSection
                            title="Hakkında"
                            isExpanded={expandedSection === 'about'}
                            onToggle={() => toggleSection('about')}
                        >
                            <AboutSection
                                content={content}
                                setContent={setContent}
                                handleContentChange={handleContentChange}
                            />
                        </AccordionSection>

                        <AccordionSection
                            title="Yetenekler"
                            isExpanded={expandedSection === 'skills'}
                            onToggle={() => toggleSection('skills')}
                        >
                            <SkillsSection
                                content={content}
                                setContent={setContent}
                                handleContentChange={handleContentChange}
                            />
                        </AccordionSection>

                        <AccordionSection
                            title="Uzmanlık Alanları"
                            isExpanded={expandedSection === 'expertise'}
                            onToggle={() => toggleSection('expertise')}
                        >
                            <ExpertiseSection
                                content={content}
                                setContent={setContent}
                                handleContentChange={handleContentChange}
                            />
                        </AccordionSection>

                        <AccordionSection
                            title="İletişim"
                            isExpanded={expandedSection === 'contact'}
                            onToggle={() => toggleSection('contact')}
                        >
                            <ContactSection
                                content={content}
                                setContent={setContent}
                                handleContentChange={handleContentChange}
                            />
                        </AccordionSection>

                        <AccordionSection
                            title="Footer"
                            isExpanded={expandedSection === 'footer'}
                            onToggle={() => toggleSection('footer')}
                        >
                            <FooterSection
                                content={content}
                                setContent={setContent}
                                handleContentChange={handleContentChange}
                            />
                        </AccordionSection>
                    </div>

                    <div className="sticky bottom-4 flex justify-end">
                        <div className="flex items-center p-4 space-x-4 bg-gray-800 rounded-lg shadow-lg">
                            {saveStatus === 'success' && (
                                <div className="flex items-center text-sm text-green-400">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="w-5 h-5 mr-1"
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                    Kaydedildi
                                </div>
                            )}

                            {saveStatus === 'error' && (
                                <div className="flex items-center text-sm text-red-400">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="w-5 h-5 mr-1"
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                    Hata Oluştu
                                </div>
                            )}

                            <button
                                onClick={previewSite}
                                disabled={isSaving}
                                className="flex items-center px-4 py-2 mr-2 text-sm font-medium text-white bg-green-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-green-500 hover:bg-green-700"
                            >
                                {isSaving ? (
                                    <span className="w-4 h-4 mr-2 rounded-full border-t-2 border-b-2 border-white animate-spin"></span>
                                ) : (
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="w-4 h-4 mr-2"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                        />
                                    </svg>
                                )}
                                {isSaving
                                    ? 'Önbellek Temizleniyor...'
                                    : 'Önbelleği Temizle ve Görüntüle'}
                            </button>

                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="flex items-center px-6 py-2 font-medium text-white bg-blue-600 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 hover:bg-blue-700"
                            >
                                {isSaving && (
                                    <span className="w-4 h-4 mr-2 rounded-full border-t-2 border-b-2 border-white animate-spin"></span>
                                )}
                                {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
