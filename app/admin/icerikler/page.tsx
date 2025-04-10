'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function ContentManagement() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [activeLocale, setActiveLocale] = useState(searchParams?.get('locale') || 'tr');
    const [content, setContent] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [expandedSection, setExpandedSection] = useState<string | null>('nav');

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
                    <div className="mb-8 space-y-5">
                        {/* Navigasyon */}
                        <ContentSection
                            title="Navigasyon"
                            isExpanded={expandedSection === 'nav'}
                            onToggle={() => toggleSection('nav')}
                        >
                            <div className="space-y-6">
                                <h4 className="mb-4 text-lg font-medium text-white">
                                    Navigasyon Bağlantıları
                                </h4>

                                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                                    {content.nav?.links?.map((link: any, index: number) => (
                                        <div
                                            key={index}
                                            className="grid grid-cols-1 gap-4 p-4 rounded-lg border border-gray-700 md:grid-cols-2"
                                        >
                                            <div>
                                                <label className="block mb-2 text-sm font-medium text-gray-400">
                                                    Etiket
                                                </label>
                                                <input
                                                    type="text"
                                                    value={link.label}
                                                    onChange={e => {
                                                        const updatedLinks = [...content.nav.links];
                                                        updatedLinks[index].label = e.target.value;
                                                        setContent({
                                                            ...content,
                                                            nav: {
                                                                ...content.nav,
                                                                links: updatedLinks,
                                                            },
                                                        });
                                                    }}
                                                    className="w-full px-4 py-2 text-white bg-gray-700 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block mb-2 text-sm font-medium text-gray-400">
                                                    Bağlantı URL
                                                </label>
                                                <input
                                                    type="text"
                                                    value={link.url}
                                                    onChange={e => {
                                                        const updatedLinks = [...content.nav.links];
                                                        updatedLinks[index].url = e.target.value;
                                                        setContent({
                                                            ...content,
                                                            nav: {
                                                                ...content.nav,
                                                                links: updatedLinks,
                                                            },
                                                        });
                                                    }}
                                                    className="w-full px-4 py-2 text-white bg-gray-700 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    placeholder="Örn: /#hero, /projeler, https://example.com"
                                                />
                                            </div>
                                            <div className="flex justify-end md:col-span-2">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const updatedLinks =
                                                            content.nav.links.filter(
                                                                (_: any, i: number) => i !== index
                                                            );
                                                        setContent({
                                                            ...content,
                                                            nav: {
                                                                ...content.nav,
                                                                links: updatedLinks,
                                                            },
                                                        });
                                                    }}
                                                    className="px-3 py-1 text-sm text-red-400 bg-gray-800 rounded focus:outline-none hover:bg-gray-700"
                                                >
                                                    Sil
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex justify-end">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const newLinks = [
                                                ...(content.nav?.links || []),
                                                { label: '', url: '' },
                                            ];
                                            setContent({
                                                ...content,
                                                nav: {
                                                    ...content.nav,
                                                    links: newLinks,
                                                },
                                            });
                                        }}
                                        className="px-4 py-2 text-sm text-white bg-blue-600 rounded focus:outline-none hover:bg-blue-700"
                                    >
                                        Yeni Bağlantı Ekle
                                    </button>
                                </div>
                            </div>
                        </ContentSection>

                        {/* Hero Bölümü */}
                        <ContentSection
                            title="Ana Bölüm (Hero)"
                            isExpanded={expandedSection === 'hero'}
                            onToggle={() => toggleSection('hero')}
                        >
                            <div className="grid grid-cols-1 gap-6">
                                {Object.entries(content.hero).map(([key, value]) => (
                                    <div key={key} className="w-full">
                                        <label className="block mb-2 text-sm font-medium text-gray-400">
                                            {key.charAt(0).toUpperCase() + key.slice(1)}
                                        </label>
                                        {key === 'description' ? (
                                            <textarea
                                                value={value as string}
                                                onChange={e =>
                                                    handleContentChange('hero', key, e.target.value)
                                                }
                                                rows={4}
                                                className="w-full px-4 py-2 text-white bg-gray-700 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            ></textarea>
                                        ) : (
                                            <input
                                                type="text"
                                                value={value as string}
                                                onChange={e =>
                                                    handleContentChange('hero', key, e.target.value)
                                                }
                                                className="w-full px-4 py-2 text-white bg-gray-700 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </ContentSection>

                        {/* Hakkında */}
                        <ContentSection
                            title="Hakkında"
                            isExpanded={expandedSection === 'about'}
                            onToggle={() => toggleSection('about')}
                        >
                            <div className="space-y-5 max-h-[500px] overflow-y-auto">
                                {/* Ana alanlar */}
                                <div className="grid grid-cols-1 gap-6">
                                    <div>
                                        <label className="block mb-2 text-sm font-medium text-gray-400">
                                            Başlık
                                        </label>
                                        <input
                                            type="text"
                                            value={content.about.title}
                                            onChange={e =>
                                                handleContentChange(
                                                    'about',
                                                    'title',
                                                    e.target.value
                                                )
                                            }
                                            className="w-full px-4 py-2 text-white bg-gray-700 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block mb-2 text-sm font-medium text-gray-400">
                                            Açıklama
                                        </label>
                                        <textarea
                                            value={content.about.description}
                                            onChange={e =>
                                                handleContentChange(
                                                    'about',
                                                    'description',
                                                    e.target.value
                                                )
                                            }
                                            rows={5}
                                            className="w-full px-4 py-2 text-white bg-gray-700 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        ></textarea>
                                    </div>
                                </div>

                                {/* Deneyim */}
                                <div className="p-5 bg-gray-800 rounded-md">
                                    <h4 className="mb-4 text-lg font-medium text-white">Deneyim</h4>
                                    <div className="grid grid-cols-1 gap-4">
                                        <div>
                                            <label className="block mb-2 text-sm font-medium text-gray-400">
                                                Başlık
                                            </label>
                                            <input
                                                type="text"
                                                value={content.about.experience.title}
                                                onChange={e =>
                                                    handleContentChange(
                                                        'about',
                                                        'experience.title',
                                                        e.target.value
                                                    )
                                                }
                                                className="w-full px-4 py-2 text-white bg-gray-700 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block mb-2 text-sm font-medium text-gray-400">
                                                Açıklama
                                            </label>
                                            <textarea
                                                value={content.about.experience.description}
                                                onChange={e =>
                                                    handleContentChange(
                                                        'about',
                                                        'experience.description',
                                                        e.target.value
                                                    )
                                                }
                                                rows={4}
                                                className="w-full px-4 py-2 text-white bg-gray-700 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            ></textarea>
                                        </div>
                                    </div>
                                </div>

                                {/* Eğitim */}
                                <div className="p-5 bg-gray-800 rounded-md">
                                    <h4 className="mb-4 text-lg font-medium text-white">Eğitim</h4>
                                    <div className="grid grid-cols-1 gap-4">
                                        <div>
                                            <label className="block mb-2 text-sm font-medium text-gray-400">
                                                Başlık
                                            </label>
                                            <input
                                                type="text"
                                                value={content.about.education.title}
                                                onChange={e =>
                                                    handleContentChange(
                                                        'about',
                                                        'education.title',
                                                        e.target.value
                                                    )
                                                }
                                                className="w-full px-4 py-2 text-white bg-gray-700 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block mb-2 text-sm font-medium text-gray-400">
                                                Açıklama
                                            </label>
                                            <textarea
                                                value={content.about.education.description}
                                                onChange={e =>
                                                    handleContentChange(
                                                        'about',
                                                        'education.description',
                                                        e.target.value
                                                    )
                                                }
                                                rows={4}
                                                className="w-full px-4 py-2 text-white bg-gray-700 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            ></textarea>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </ContentSection>

                        {/* Footer */}
                        <ContentSection
                            title="Footer"
                            isExpanded={expandedSection === 'footer'}
                            onToggle={() => toggleSection('footer')}
                        >
                            <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2">
                                {/* Genel Bilgiler */}
                                <div>
                                    <h4 className="mb-4 text-lg font-medium text-white">
                                        Genel Bilgiler
                                    </h4>
                                    <div className="grid grid-cols-1 gap-4">
                                        <div>
                                            <label className="block mb-2 text-sm font-medium text-gray-400">
                                                Açıklama
                                            </label>
                                            <textarea
                                                value={content.footer.description}
                                                onChange={e =>
                                                    handleContentChange(
                                                        'footer',
                                                        'description',
                                                        e.target.value
                                                    )
                                                }
                                                rows={3}
                                                className="w-full px-4 py-2 text-white bg-gray-700 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            ></textarea>
                                        </div>
                                        <div>
                                            <label className="block mb-2 text-sm font-medium text-gray-400">
                                                Telif Hakkı Metni
                                            </label>
                                            <input
                                                type="text"
                                                value={content.footer.rights}
                                                onChange={e =>
                                                    handleContentChange(
                                                        'footer',
                                                        'rights',
                                                        e.target.value
                                                    )
                                                }
                                                className="w-full px-4 py-2 text-white bg-gray-700 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Hızlı Bağlantılar */}
                                <div className="p-5 bg-gray-800 rounded-md">
                                    <h4 className="mb-4 text-lg font-medium text-white">
                                        Hızlı Bağlantılar
                                    </h4>
                                    <div>
                                        <label className="block mb-2 text-sm font-medium text-gray-400">
                                            Başlık
                                        </label>
                                        <input
                                            type="text"
                                            value={content.footer.quickLinks?.title || ''}
                                            onChange={e => {
                                                const updatedContent = { ...content };
                                                if (!updatedContent.footer.quickLinks) {
                                                    updatedContent.footer.quickLinks = {
                                                        title: e.target.value,
                                                        links: [],
                                                    };
                                                } else {
                                                    updatedContent.footer.quickLinks.title =
                                                        e.target.value;
                                                }
                                                setContent(updatedContent);
                                            }}
                                            className="w-full px-4 py-2 text-white bg-gray-700 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>

                                    <div className="mt-4">
                                        <label className="block mb-2 text-sm font-medium text-gray-400">
                                            Bağlantılar
                                        </label>

                                        {Array.isArray(content.footer.quickLinks?.links) &&
                                            content.footer.quickLinks.links.map(
                                                (link: any, index: number) => (
                                                    <div
                                                        key={index}
                                                        className="bg-gray-750 flex items-center gap-2 p-2 mb-2 rounded-md"
                                                    >
                                                        <div className="flex-grow">
                                                            <div className="flex gap-2 mb-2">
                                                                <input
                                                                    type="text"
                                                                    value={link.label}
                                                                    placeholder="Etiket"
                                                                    onChange={e => {
                                                                        const updatedContent = {
                                                                            ...content,
                                                                        };
                                                                        updatedContent.footer.quickLinks.links[
                                                                            index
                                                                        ].label = e.target.value;
                                                                        setContent(updatedContent);
                                                                    }}
                                                                    className="flex-1 px-3 py-1 text-sm text-white bg-gray-700 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                                />
                                                                <input
                                                                    type="text"
                                                                    value={link.url}
                                                                    placeholder="URL"
                                                                    onChange={e => {
                                                                        const updatedContent = {
                                                                            ...content,
                                                                        };
                                                                        updatedContent.footer.quickLinks.links[
                                                                            index
                                                                        ].url = e.target.value;
                                                                        setContent(updatedContent);
                                                                    }}
                                                                    className="flex-1 px-3 py-1 text-sm text-white bg-gray-700 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                                />
                                                            </div>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const updatedContent = {
                                                                    ...content,
                                                                };
                                                                updatedContent.footer.quickLinks.links.splice(
                                                                    index,
                                                                    1
                                                                );
                                                                setContent(updatedContent);
                                                            }}
                                                            className="p-1 text-gray-400 rounded hover:text-white hover:bg-gray-700"
                                                        >
                                                            <svg
                                                                xmlns="http://www.w3.org/2000/svg"
                                                                className="w-5 h-5"
                                                                viewBox="0 0 20 20"
                                                                fill="currentColor"
                                                            >
                                                                <path
                                                                    fillRule="evenodd"
                                                                    d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                                                                    clipRule="evenodd"
                                                                />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                )
                                            )}

                                        <button
                                            type="button"
                                            onClick={() => {
                                                const updatedContent = { ...content };
                                                if (!updatedContent.footer.quickLinks) {
                                                    updatedContent.footer.quickLinks = {
                                                        title: 'Hızlı Bağlantılar',
                                                        links: [],
                                                    };
                                                }
                                                if (
                                                    !Array.isArray(
                                                        updatedContent.footer.quickLinks.links
                                                    )
                                                ) {
                                                    updatedContent.footer.quickLinks.links = [];
                                                }
                                                updatedContent.footer.quickLinks.links.push({
                                                    label: '',
                                                    url: '',
                                                });
                                                setContent(updatedContent);
                                            }}
                                            className="w-full px-4 py-2 mt-2 text-sm font-medium text-white bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 hover:bg-gray-600"
                                        >
                                            + Bağlantı Ekle
                                        </button>
                                    </div>
                                </div>

                                {/* İletişim Bilgileri */}
                                <div className="p-5 bg-gray-800 rounded-md">
                                    <h4 className="mb-4 text-lg font-medium text-white">
                                        İletişim
                                    </h4>
                                    <div className="grid grid-cols-1 gap-4">
                                        <div>
                                            <label className="block mb-2 text-sm font-medium text-gray-400">
                                                Başlık
                                            </label>
                                            <input
                                                type="text"
                                                value={content.footer.contact?.title || ''}
                                                onChange={e => {
                                                    const updatedContent = { ...content };
                                                    if (!updatedContent.footer.contact) {
                                                        updatedContent.footer.contact = {
                                                            title: e.target.value,
                                                            email: '',
                                                            location: '',
                                                            instagram: '',
                                                        };
                                                    } else {
                                                        updatedContent.footer.contact.title =
                                                            e.target.value;
                                                    }
                                                    setContent(updatedContent);
                                                }}
                                                className="w-full px-4 py-2 text-white bg-gray-700 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        {/* <div>
                                            <label className="block mb-2 text-sm font-medium text-gray-400">
                                                E-posta
                                            </label>
                                            <input
                                                type="email"
                                                value={content.footer.contact?.email || ''}
                                                onChange={e => {
                                                    const updatedContent = { ...content };
                                                    if (!updatedContent.footer.contact) {
                                                        updatedContent.footer.contact = {
                                                            title: '',
                                                            email: e.target.value,
                                                            location: '',
                                                            instagram: '',
                                                        };
                                                    } else {
                                                        updatedContent.footer.contact.email =
                                                            e.target.value;
                                                    }
                                                    setContent(updatedContent);
                                                }}
                                                className="w-full px-4 py-2 text-white bg-gray-700 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block mb-2 text-sm font-medium text-gray-400">
                                                Konum
                                            </label>
                                            <input
                                                type="text"
                                                value={content.footer.contact?.location || ''}
                                                onChange={e => {
                                                    const updatedContent = { ...content };
                                                    if (!updatedContent.footer.contact) {
                                                        updatedContent.footer.contact = {
                                                            title: '',
                                                            email: '',
                                                            location: e.target.value,
                                                            instagram: '',
                                                        };
                                                    } else {
                                                        updatedContent.footer.contact.location =
                                                            e.target.value;
                                                    }
                                                    setContent(updatedContent);
                                                }}
                                                className="w-full px-4 py-2 text-white bg-gray-700 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block mb-2 text-sm font-medium text-gray-400">
                                                Instagram Kullanıcı Adı
                                            </label>
                                            <input
                                                type="text"
                                                value={content.footer.contact?.instagram || ''}
                                                onChange={e => {
                                                    const updatedContent = { ...content };
                                                    if (!updatedContent.footer.contact) {
                                                        updatedContent.footer.contact = {
                                                            title: '',
                                                            email: '',
                                                            location: '',
                                                            instagram: e.target.value,
                                                        };
                                                    } else {
                                                        updatedContent.footer.contact.instagram =
                                                            e.target.value;
                                                    }
                                                    setContent(updatedContent);
                                                }}
                                                className="w-full px-4 py-2 text-white bg-gray-700 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div> */}
                                    </div>
                                </div>

                                {/* Sosyal Medya */}
                                <div className="p-5 bg-gray-800 rounded-md">
                                    <h4 className="mb-4 text-lg font-medium text-white">
                                        Sosyal Medya
                                    </h4>
                                    <div className="grid grid-cols-1 gap-4">
                                        <div>
                                            <label className="block mb-2 text-sm font-medium text-gray-400">
                                                E-posta
                                            </label>
                                            <input
                                                type="email"
                                                value={content.footer.socialMedia?.email || ''}
                                                onChange={e => {
                                                    const updatedContent = { ...content };
                                                    if (!updatedContent.footer.socialMedia) {
                                                        updatedContent.footer.socialMedia = {
                                                            email: e.target.value,
                                                            linkedin: '',
                                                            instagram: '',
                                                        };
                                                    } else {
                                                        updatedContent.footer.socialMedia.email =
                                                            e.target.value;
                                                    }
                                                    setContent(updatedContent);
                                                }}
                                                className="w-full px-4 py-2 text-white bg-gray-700 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block mb-2 text-sm font-medium text-gray-400">
                                                LinkedIn Kullanıcı Adı
                                            </label>
                                            <input
                                                type="text"
                                                value={content.footer.socialMedia?.linkedin || ''}
                                                onChange={e => {
                                                    const updatedContent = { ...content };
                                                    if (!updatedContent.footer.socialMedia) {
                                                        updatedContent.footer.socialMedia = {
                                                            email: '',
                                                            linkedin: e.target.value,
                                                            instagram: '',
                                                        };
                                                    } else {
                                                        updatedContent.footer.socialMedia.linkedin =
                                                            e.target.value;
                                                    }
                                                    setContent(updatedContent);
                                                }}
                                                className="w-full px-4 py-2 text-white bg-gray-700 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block mb-2 text-sm font-medium text-gray-400">
                                                Instagram Kullanıcı Adı
                                            </label>
                                            <input
                                                type="text"
                                                value={content.footer.socialMedia?.instagram || ''}
                                                onChange={e => {
                                                    const updatedContent = { ...content };
                                                    if (!updatedContent.footer.socialMedia) {
                                                        updatedContent.footer.socialMedia = {
                                                            email: '',
                                                            linkedin: '',
                                                            instagram: e.target.value,
                                                        };
                                                    } else {
                                                        updatedContent.footer.socialMedia.instagram =
                                                            e.target.value;
                                                    }
                                                    setContent(updatedContent);
                                                }}
                                                className="w-full px-4 py-2 text-white bg-gray-700 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </ContentSection>
                    </div>

                    {/* Kaydet butonu */}
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

// İçerik bölümü komponenti
interface ContentSectionProps {
    title: string;
    isExpanded: boolean;
    onToggle: () => void;
    children: React.ReactNode;
}

function ContentSection({ title, isExpanded, onToggle, children }: ContentSectionProps) {
    return (
        <div className="overflow-hidden rounded-lg border border-gray-700">
            <button
                className="w-full flex justify-between items-center px-6 py-4 text-left bg-gray-800 focus:outline-none hover:bg-gray-750"
                onClick={onToggle}
            >
                <h3 className="text-lg font-medium text-white">{title}</h3>
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`h-5 w-5 text-gray-400 transform transition-transform ${
                        isExpanded ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                    />
                </svg>
            </button>

            <div
                className={`overflow-hidden transition-all ${
                    isExpanded ? 'max-h-screen' : 'max-h-0'
                }`}
            >
                <div className="p-6 bg-gray-800">{children}</div>
            </div>
        </div>
    );
}
