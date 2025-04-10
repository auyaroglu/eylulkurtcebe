'use client';

import { Link, usePathname } from '@/i18n/navigation';
import { locales } from '@/i18n';
import { useAnimation } from '@/app/animation-context';
import { useParams } from 'next/navigation';
import { mapProjectId, checkProjectAvailability } from './ProjectIDMap';
import { useState, useEffect, useRef } from 'react';

// Kullanılan link türleri için özel tip tanımı
type LinkHref = '/' | '/projects' | { pathname: '/projects/[id]'; params: { id: string } };

interface LanguageSwitcherProps {
    lng: string;
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

        if (
            lastCheckedRef.current.id === currentId &&
            lastCheckedRef.current.pathname === pathname &&
            lastCheckedRef.current.lng === lng
        ) {
            // console.log('Dil geçişi kontrolleri zaten yapıldı, tekrarlanmıyor.');
            return;
        }

        // Mevcut durumu kaydet
        lastCheckedRef.current = { id: currentId, pathname, lng };

        const checkLinks = async () => {
            setIsLoading(true);
            const links: Record<string, LinkHref> = {};

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

            setTargetLinks(links);
            setIsLoading(false);
        };

        checkLinks();
    }, [params, pathname, lng, languages]);

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
