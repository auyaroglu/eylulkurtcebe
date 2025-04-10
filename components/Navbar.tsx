'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import LanguageSwitcher from './LanguageSwitcher';
import { Link } from '@/i18n/navigation';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { getContent } from '@/lib/api';

type NavLink = {
    label: string;
    url: string;
};

type NavbarProps = {
    lng?: string;
};

export default function Navbar({ lng }: NavbarProps) {
    const t = useTranslations('nav');
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [activeSection, setActiveSection] = useState('');
    const [scrollPosition, setScrollPosition] = useState(0);
    const [navLinks, setNavLinks] = useState<NavLink[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    // Navigasyon bağlantılarını dil bazında yükle
    useEffect(() => {
        async function fetchNavLinks() {
            try {
                setIsLoading(true);
                const locale = lng || 'tr';
                const data = await getContent(locale);

                if (data && data.nav && Array.isArray(data.nav.links)) {
                    setNavLinks(data.nav.links);
                } else {
                    // Fallback bağlantılar
                    setNavLinks([
                        { label: t('home'), url: '/#hero' },
                        { label: t('about'), url: '/#about' },
                        { label: t('skills'), url: '/#skills' },
                        { label: t('projects'), url: '/projeler' },
                        { label: t('contact'), url: '/#contact' },
                    ]);
                }
            } catch (error) {
                console.error('Navigasyon bağlantıları yükleme hatası:', error);
                // Fallback bağlantılar
                setNavLinks([
                    { label: t('home'), url: '/#hero' },
                    { label: t('about'), url: '/#about' },
                    { label: t('skills'), url: '/#skills' },
                    { label: t('projects'), url: '/projeler' },
                    { label: t('contact'), url: '/#contact' },
                ]);
            } finally {
                setIsLoading(false);
            }
        }

        fetchNavLinks();
    }, [lng, t]);

    // Hash ile belirtilen bölüme kaydırma işlemi için
    useEffect(() => {
        // Sayfa yüklendiğinde hash kontrolü
        if (typeof window !== 'undefined') {
            // URL'den hash kısmını al
            const hash = window.location.hash;

            if (hash) {
                // Hash değeri varsa, 100ms bekleyerek DOM'un yüklenmesini bekle
                setTimeout(() => {
                    const element = document.getElementById(hash.replace('#', ''));
                    if (element) {
                        // Smooth scroll ile hedef elemana kaydır
                        element.scrollIntoView({ behavior: 'smooth' });
                    }
                }, 100);
            }
        }
    }, [pathname]); // Pathname değiştiğinde tekrar çalıştır

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);

            // Aktif bölümü belirle
            const sections = navLinks
                .filter(link => link.url.startsWith('/#'))
                .map(link => link.url.replace('/#', ''));

            const current = sections.find(section => {
                const element = document.getElementById(section);
                if (element) {
                    const rect = element.getBoundingClientRect();
                    return rect.top <= 100 && rect.bottom >= 100;
                }
                return false;
            });

            setActiveSection(current || '');
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [navLinks]);

    // Body scroll kontrolü - Geliştirilmiş
    useEffect(() => {
        if (isMenuOpen) {
            // Mevcut scroll pozisyonunu kaydet
            setScrollPosition(window.pageYOffset);

            // Body'yi sabit pozisyonda tut
            const body = document.body;
            body.style.overflow = 'hidden';
            body.style.position = 'fixed';
            body.style.top = `-${scrollPosition}px`;
            body.style.width = '100%';

            // iOS için ek dokunma engelleme
            document.addEventListener('touchmove', preventScroll, { passive: false });
        } else {
            // Sayfayı normal duruma getir
            const body = document.body;
            body.style.removeProperty('overflow');
            body.style.removeProperty('position');
            body.style.removeProperty('top');
            body.style.removeProperty('width');

            // Kaydettiğimiz pozisyona geri dön
            window.scrollTo(0, scrollPosition);

            // iOS için dokunma engelini kaldır
            document.removeEventListener('touchmove', preventScroll);
        }

        return () => {
            // Component unmount olduğunda dokunma engelini kaldır
            document.removeEventListener('touchmove', preventScroll);

            // Body stillerini temizle
            const body = document.body;
            body.style.removeProperty('overflow');
            body.style.removeProperty('position');
            body.style.removeProperty('top');
            body.style.removeProperty('width');
        };
    }, [isMenuOpen, scrollPosition]);

    // Dokunma ile kaydırmayı engelleyen fonksiyon
    const preventScroll = (e: TouchEvent) => {
        e.preventDefault();
    };

    // Menüyü aç/kapat
    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    const menuVariants = {
        closed: {
            opacity: 0,
            transition: {
                staggerChildren: 0.05,
                staggerDirection: -1,
            },
        },
        open: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.2,
            },
        },
    };

    const itemVariants = {
        closed: {
            opacity: 0,
            y: 20,
        },
        open: {
            opacity: 1,
            y: 0,
            transition: {
                ease: [0.6, 0.05, 0.01, 0.99],
                duration: 0.6,
            },
        },
    };

    // Admin menüsünün içine Mesajlar linki ekle
    const adminMenuItems = [
        { href: '/admin', label: 'Panel', icon: 'home' },
        { href: '/admin/icerikler', label: 'İçerikler', icon: 'file-text' },
        { href: '/admin/projeler', label: 'Projeler', icon: 'grid' },
        { href: '/admin/mailler', label: 'Mesajlar', icon: 'mail' },
        { href: '/admin/ayarlar', label: 'Ayarlar', icon: 'settings' },
    ];

    if (isLoading) {
        return (
            <motion.header
                className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
                    isScrolled
                        ? 'bg-[#f9fafb]/80 dark:bg-[#111827]/90 backdrop-blur-md py-3 sm:py-4 shadow-md'
                        : 'py-4 sm:py-6'
                }`}
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="container mx-auto flex justify-between items-center px-5">
                    <Link
                        href="/"
                        className="text-primary relative z-50 text-xl font-bold sm:text-2xl"
                    >
                        Eylül<span className="text-[#111827] dark:text-[#f9fafb]">Kurtcebe</span>
                    </Link>
                    <div className="flex items-center space-x-4">
                        <LanguageSwitcher lng={lng || 'tr'} />
                    </div>
                </div>
            </motion.header>
        );
    }

    return (
        <motion.header
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
                isScrolled
                    ? 'bg-[#f9fafb]/80 dark:bg-[#111827]/90 backdrop-blur-md py-3 sm:py-4 shadow-md'
                    : 'py-4 sm:py-6'
            }`}
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <div className="container mx-auto flex justify-between items-center px-5">
                <Link href="/" className="text-primary relative z-50 text-xl font-bold sm:text-2xl">
                    Eylül<span className="text-[#111827] dark:text-[#f9fafb]">Kurtcebe</span>
                </Link>

                {/* Desktop Navigation */}
                <div className="hidden items-center space-x-4 md:flex">
                    <nav className="flex space-x-8">
                        {navLinks.map((link, index) => {
                            const isHashLink = link.url.startsWith('/#');
                            const sectionId = isHashLink ? link.url.replace('/#', '') : '';

                            return (
                                <a
                                    key={index}
                                    href={link.url}
                                    className={`text-[#111827] dark:text-[#f9fafb] hover:text-primary dark:hover:text-primary transition-colors relative ${
                                        activeSection === sectionId
                                            ? 'text-primary font-medium'
                                            : ''
                                    }`}
                                >
                                    {link.label}
                                    {activeSection === sectionId && (
                                        <motion.span
                                            className="absolute -bottom-1 left-0 w-full h-0.5 bg-primary rounded-full"
                                            layoutId="navIndicator"
                                        />
                                    )}
                                </a>
                            );
                        })}
                    </nav>
                    <LanguageSwitcher lng={lng || 'tr'} />
                </div>

                {/* Mobile Menu Button */}
                <div className="flex items-center space-x-2 md:hidden">
                    <LanguageSwitcher lng={lng || 'tr'} />
                    <button
                        className="text-[#111827] dark:text-[#f9fafb] relative z-50 w-10 h-10 flex items-center justify-center"
                        onClick={toggleMenu}
                        aria-label="Toggle menu"
                    >
                        <div className="w-6 h-6 relative">
                            <span
                                className={`absolute h-0.5 w-6 bg-current transform transition-all duration-300 ease-in-out ${
                                    isMenuOpen ? 'rotate-45 translate-y-0' : 'translate-y-[-8px]'
                                }`}
                            />
                            <span
                                className={`absolute h-0.5 w-6 bg-current transform transition-all duration-300 ease-in-out ${
                                    isMenuOpen ? 'opacity-0' : 'opacity-100'
                                }`}
                            />
                            <span
                                className={`absolute h-0.5 w-6 bg-current transform transition-all duration-300 ease-in-out ${
                                    isMenuOpen ? '-rotate-45 translate-y-0' : 'translate-y-[8px]'
                                }`}
                            />
                        </div>
                    </button>
                </div>

                {/* Mobile Menu */}
                <AnimatePresence>
                    {isMenuOpen && (
                        <motion.div
                            className="fixed inset-0 bg-[#111827]/95 z-40 flex items-center justify-center"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <motion.nav
                                className="w-full max-w-lg flex flex-col justify-center items-center p-8 space-y-8"
                                variants={menuVariants}
                                initial="closed"
                                animate="open"
                                exit="closed"
                            >
                                {navLinks.map((link, index) => (
                                    <motion.div key={index} variants={itemVariants}>
                                        <a
                                            href={link.url}
                                            className="text-2xl font-medium text-white transition-colors hover:text-primary"
                                            onClick={() => setIsMenuOpen(false)}
                                        >
                                            {link.label}
                                        </a>
                                    </motion.div>
                                ))}
                            </motion.nav>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.header>
    );
}
