'use client';

import { Link, usePathname } from '@/i18n/navigation';
import { locales } from '@/i18n';
import { useAnimation } from '@/app/animation-context';
import { useParams } from 'next/navigation';
import { mapProjectId } from './ProjectIDMap';
import { useState, useEffect, useRef } from 'react';

// Kullanılan link türleri için özel tip tanımı
type LinkHref = '/' | '/projects' | { pathname: '/projects/[id]'; params: { id: string } };

interface LanguageSwitcherProps {
    lng: string;
}

export async function checkProjectAvailability(
    id: string,
    sourceLang: string,
    targetLang: string
): Promise<{ exists: boolean; targetId: string }> {
    try {
        // Statik önbelleğe alma için cache key oluştur
        const cacheKey = `project_${id}_${sourceLang}_${targetLang}`;

        // Tarayıcı tarafında çalışıyor muyuz kontrol et
        const isClient = typeof window !== 'undefined';

        // Önbellekten veri kontrolü yap (sadece client tarafında)
        if (isClient) {
            const cachedData = sessionStorage.getItem(cacheKey);
            if (cachedData) {
                return JSON.parse(cachedData);
            }
        }

        // İlk olarak kaynak dildeki projenin detaylarını getir (originalId'yi almak için)
        const sourceApiUrl = `/api/projects/${sourceLang}/${id}`;

        // Kaynak projeyi kontrol et
        const sourceResponse = await fetch(sourceApiUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            // 1 saat boyunca önbelleğe al (3600 saniye)
            next: { revalidate: 3600 },
        });

        if (!sourceResponse.ok) {
            console.log(`Kaynak proje bulunamadı: ${id} (${sourceLang})`);
            return { exists: false, targetId: '' };
        }

        // Kaynak projenin detaylarını al
        const sourceProjectData = await sourceResponse.json();

        if (!sourceProjectData || !sourceProjectData.originalId) {
            console.log(`Kaynak projede originalId bulunamadı: ${id}`);
            return { exists: false, targetId: id };
        }

        const originalId = sourceProjectData.originalId;

        // originalId kullanarak aynı projenin hedef dildeki karşılığını bul
        const targetApiUrl = `/api/projects/${targetLang}/by-original-id/${originalId}`;

        try {
            const targetResponse = await fetch(targetApiUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                // 1 saat boyunca önbelleğe al (3600 saniye)
                next: { revalidate: 3600 },
            });

            if (targetResponse.ok) {
                const targetData = await targetResponse.json();

                if (targetData && targetData.id && targetData.status === true) {
                    const result = { exists: true, targetId: targetData.id };

                    // Sonucu önbelleğe al (sadece client tarafında)
                    if (isClient) {
                        sessionStorage.setItem(cacheKey, JSON.stringify(result));
                    }

                    return result;
                }
            }

            console.log(
                `Hedef proje bulunamadı veya gizli: originalId=${originalId}, dil=${targetLang}`
            );
            return { exists: false, targetId: '' };
        } catch (error) {
            console.error(`Hedef proje API hatası:`, error);
            return { exists: false, targetId: '' };
        }
    } catch (error) {
        console.error('Proje erişilebilirlik kontrolü hatası:', error);
        return { exists: false, targetId: '' };
    }
}

export default function LanguageSwitcher({ lng }: LanguageSwitcherProps) {
    const pathname = usePathname();
    const params = useParams();
    const { resetAnimations } = useAnimation();
    const [targetLinks, setTargetLinks] = useState<Record<string, LinkHref>>({});
    const [isLoading, setIsLoading] = useState(true);

    // Son kontrolü kaydetmek için ref kullan - böylece gereksiz API çağrılarını önleriz
    const lastCheckedRef = useRef<{
        id?: string;
        pathname?: string;
        lng?: string;
        result?: Record<string, LinkHref>;
    }>({});

    const languages = [
        { code: 'tr', name: 'Türkçe' },
        { code: 'en', name: 'English' },
    ];

    // Dil değiştirme işlemi
    const handleLanguageChange = (locale: string) => {
        if (locale === lng) return; // Zaten seçili dili tekrar seçiyorsa işlem yapma

        // Animasyonları sıfırlayarak yeniden başlamalarını sağlayalım
        setTimeout(() => {
            resetAnimations();
        }, 200);
    };

    // Proje sayfalarında geçerli bağlantıları kontrol et
    useEffect(() => {
        // İçerik değişmemişse tekrar kontrol etmeyi engelle
        const currentId =
            params && 'id' in params
                ? Array.isArray(params.id)
                    ? params.id[0]
                    : String(params.id)
                : undefined;

        // Önceki sonuç varsa ve aynı içerik için kontrol ediliyorsa, hemen onu göster
        if (
            lastCheckedRef.current.id === currentId &&
            lastCheckedRef.current.pathname === pathname &&
            lastCheckedRef.current.lng === lng &&
            lastCheckedRef.current.result
        ) {
            setTargetLinks(lastCheckedRef.current.result);
            setIsLoading(false);

            // Arka planda verileri yenilemek için ayrı bir asenkron işlem başlat
            // Bu sayede kullanıcı arayüzü hemen gösterilir, veriler arka planda güncellenir
            setTimeout(() => {
                checkLinks(true);
            }, 2000);

            return;
        }

        // Veri yoksa veya değiştiyse yeni kontrol yap
        checkLinks(false);
    }, [params, pathname, lng]);

    // Bağlantıları kontrol eden yardımcı fonksiyon
    const checkLinks = async (isBackgroundRefresh = false) => {
        if (!isBackgroundRefresh) {
            setIsLoading(true);
        }

        const links: Record<string, LinkHref> = {};
        const currentId =
            params && 'id' in params
                ? Array.isArray(params.id)
                    ? params.id[0]
                    : String(params.id)
                : undefined;

        for (const lang of languages) {
            if (lang.code === lng) continue; // Aktif dil için link kontrolüne gerek yok

            // Eğer URL'de id parametresi varsa (proje detay sayfası)
            if (params && 'id' in params) {
                try {
                    const paramId = Array.isArray(params.id) ? params.id[0] : String(params.id);
                    // Diğer dildeki proje varlığını ve durumunu kontrol et
                    const result = await checkProjectAvailability(paramId, lng, lang.code);

                    if (result.exists) {
                        // Proje varsa ve yayındaysa, o projeye yönlendir
                        links[lang.code] = {
                            pathname: '/projects/[id]',
                            params: { id: result.targetId },
                        };
                    } else {
                        // Proje yoksa veya gizliyse, ana sayfaya yönlendir
                        links[lang.code] = '/';
                    }
                } catch (error) {
                    console.error('Dil geçişi kontrolü hatası:', error);
                    links[lang.code] = '/'; // Hata durumunda ana sayfaya yönlendir
                }
            } else if (pathname.includes('/projects') || pathname.includes('/projeler')) {
                // Projeler ana sayfasındaysa
                links[lang.code] = '/projects';
            } else {
                // Diğer sayfalarda
                links[lang.code] = '/';
            }
        }

        // Sonuçları kaydet
        setTargetLinks(links);

        // Ref'te son kontrolü sakla
        lastCheckedRef.current = {
            id: currentId,
            pathname,
            lng,
            result: links,
        };

        if (!isBackgroundRefresh) {
            setIsLoading(false);
        }
    };

    // Yükleme durumunda dil geçişlerini devre dışı bırakabilirsiniz
    if (isLoading && params && 'id' in params) {
        return (
            <div className="border-white/20 overflow-hidden flex rounded-md border">
                {languages.map(language =>
                    language.code === lng ? (
                        <button
                            key={language.code}
                            className="px-3 py-1.5 text-sm font-medium uppercase transition-colors bg-primary text-white"
                            title={language.name}
                            aria-label={`Aktif dil: ${language.name}`}
                        >
                            {language.code}
                        </button>
                    ) : (
                        <button
                            key={language.code}
                            className="px-3 py-1.5 text-sm font-medium uppercase transition-colors opacity-50 text-gray-300"
                            disabled
                            title="Yükleniyor..."
                        >
                            {language.code}
                        </button>
                    )
                )}
            </div>
        );
    }

    return (
        <div className="border-white/20 overflow-hidden flex rounded-md border">
            {languages.map(language =>
                language.code === lng ? (
                    <button
                        key={language.code}
                        className="px-3 py-1.5 text-sm font-medium uppercase transition-colors bg-primary text-white"
                        title={language.name}
                        aria-label={`Aktif dil: ${language.name}`}
                    >
                        {language.code}
                    </button>
                ) : (
                    <Link
                        key={language.code}
                        href={targetLinks[language.code] || '/'}
                        locale={language.code}
                        onClick={() => handleLanguageChange(language.code)}
                        className="px-3 py-1.5 text-sm font-medium uppercase transition-colors text-gray-300 hover:text-white hover:bg-white/10"
                        title={language.name}
                        aria-label={`Dili ${language.name} olarak değiştir`}
                    >
                        {language.code}
                    </Link>
                )
            )}
        </div>
    );
}
