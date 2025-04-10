'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import ToastProvider from '@/components/ToastProvider';

// İkonlar
const HomeIcon = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-5 h-5"
    >
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
        <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
);

const ContentIcon = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-5 h-5"
    >
        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
);

const ProjectIcon = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-5 h-5"
    >
        <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
    </svg>
);

const SettingsIcon = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-5 h-5"
    >
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
);

const LogoutIcon = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-5 h-5"
    >
        <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
);

const ExternalLinkIcon = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-4 h-4"
    >
        <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
        <polyline points="15 3 21 3 21 9" />
        <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
);

const MailIcon = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-5 h-5"
    >
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
    </svg>
);

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const router = useRouter();
    const pathname = usePathname();

    // JWT token'ının geçerliliğini kontrol eden fonksiyon
    const validateToken = useCallback(async () => {
        const token = localStorage.getItem('adminToken');

        if (!token) {
            return false;
        }

        try {
            // Token'ın geçerliliğini kontrol etmek için bir API çağrısı yapalım
            const response = await fetch('/api/admin/validate-token', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                // Token geçersiz veya süresi dolmuş, token'ı localStorage'dan temizle
                localStorage.removeItem('adminToken');
                return false;
            }

            return true;
        } catch (error) {
            console.error('Token doğrulama hatası:', error);
            // Hata durumunda da token'ı temizle
            localStorage.removeItem('adminToken');
            return false;
        }
    }, []);

    useEffect(() => {
        // Yalnızca client-side'da çalıştır
        const checkAuth = async () => {
            setIsLoading(true);

            // Giriş sayfasında değilsek token kontrolü yap
            if (pathname !== '/admin/giris') {
                const isValid = await validateToken();

                if (!isValid) {
                    // Token geçerli değilse giriş sayfasına yönlendir
                    router.push('/admin/giris');
                    setIsAuthenticated(false);
                } else {
                    setIsAuthenticated(true);
                }
            } else if (localStorage.getItem('adminToken')) {
                // Giriş sayfasındayız ve token var, token geçerliliğini kontrol et
                const isValid = await validateToken();

                // Token geçerliyse admin paneline yönlendir
                if (isValid) {
                    router.push('/admin');
                }
            }

            setIsLoading(false);
        };

        checkAuth();
    }, [pathname, router, validateToken]);

    // Giriş sayfası için farklı layout
    if (pathname === '/admin/giris') {
        return <>{children}</>;
    }

    // Henüz doğrulama yapılmadıysa yükleniyor göster
    if (isLoading) {
        return (
            <div className="min-h-screen flex justify-center items-center bg-gray-900">
                <div className="flex flex-col items-center">
                    <div className="w-16 h-16 mb-4 rounded-full border-t-2 border-b-2 border-blue-500 animate-spin"></div>
                    <p className="text-blue-500 animate-pulse">Yükleniyor...</p>
                </div>
            </div>
        );
    }

    // Doğrulanmamışsa içeriği gösterme
    if (!isAuthenticated) {
        return null;
    }

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    return (
        <div className="min-h-screen bg-[#0e1117] text-white flex">
            {/* Sidebar Arkaplanı - Gradient ve Noise Efekti */}
            <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className={`fixed inset-0 bg-black/50 z-20 md:hidden ${
                    isSidebarOpen ? 'block' : 'hidden'
                }`}
                onClick={() => setIsSidebarOpen(false)}
            />

            {/* Sidebar */}
            <motion.div
                initial={{ x: -100 }}
                animate={{ x: 0 }}
                className={`bg-[#0f1623] ${
                    isCollapsed ? 'w-20' : 'w-72'
                } transition-all duration-300 fixed left-0 top-0 h-full z-30 border-r border-gray-800 backdrop-blur-lg bg-opacity-90`}
                style={{
                    backgroundImage: `
                        radial-gradient(circle at 100% 100%, rgba(59, 130, 246, 0.1) 0, transparent 25%),
                        radial-gradient(circle at 0% 0%, rgba(168, 85, 247, 0.1) 0, transparent 25%)
                    `,
                }}
            >
                <div className="relative flex justify-between items-center p-6 border-b border-gray-800">
                    {/* Arka plan sparkle efekti */}
                    <div className="overflow-hidden absolute inset-0">
                        <div
                            className="w-1 h-1 absolute top-1/3 left-1/4 bg-blue-500 rounded-full animate-ping"
                            style={{ animationDuration: '3s' }}
                        ></div>
                        <div
                            className="w-1 h-1 absolute right-1/4 bottom-1/3 bg-purple-500 rounded-full animate-ping"
                            style={{ animationDuration: '4s' }}
                        ></div>
                    </div>

                    <div className={`relative ${isCollapsed ? 'hidden' : 'block'}`}>
                        <h1 className="from-blue-400 to-purple-500 text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r">
                            Yönetim Paneli
                        </h1>
                    </div>

                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="relative z-10 rounded-full p-1.5 hover:bg-gray-800 transition-colors"
                        title={isCollapsed ? 'Menüyü genişlet' : 'Menüyü daralt'}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="w-5 h-5 text-gray-400"
                        >
                            {isCollapsed ? (
                                <>
                                    <polyline points="9 6 15 12 9 18" />
                                </>
                            ) : (
                                <>
                                    <polyline points="15 6 9 12 15 18" />
                                </>
                            )}
                        </svg>
                    </button>
                </div>

                <nav className={`mt-6 ${isCollapsed ? 'px-2' : 'px-4'}`}>
                    <div className="space-y-2">
                        <NavItem href="/admin" icon={<HomeIcon />} exact isCollapsed={isCollapsed}>
                            Özet
                        </NavItem>
                        <NavItem
                            href="/admin/icerikler"
                            icon={<ContentIcon />}
                            isCollapsed={isCollapsed}
                        >
                            İçerik Yönetimi
                        </NavItem>
                        <NavItem
                            href="/admin/projeler"
                            icon={<ProjectIcon />}
                            isCollapsed={isCollapsed}
                        >
                            Proje Yönetimi
                        </NavItem>
                        <NavItem
                            href="/admin/mailler"
                            icon={<MailIcon />}
                            isCollapsed={isCollapsed}
                        >
                            İletişim Formları
                        </NavItem>
                        <NavItem
                            href="/admin/ayarlar"
                            icon={<SettingsIcon />}
                            isCollapsed={isCollapsed}
                        >
                            Ayarlar
                        </NavItem>
                    </div>

                    <div
                        className={`mt-10 pt-6 border-t border-gray-800/50 ${
                            isCollapsed ? 'px-0 text-center' : ''
                        }`}
                    >
                        <button
                            onClick={() => {
                                localStorage.removeItem('adminToken');
                                localStorage.removeItem('adminUser');
                                router.push('/admin/giris');
                            }}
                            className={`flex items-center ${
                                isCollapsed ? 'justify-center p-3' : 'px-4 py-3'
                            } text-sm w-full rounded-lg font-medium text-red-400 hover:bg-red-500/10 transition-colors group`}
                            title={isCollapsed ? 'Çıkış Yap' : ''}
                        >
                            <span
                                className={`${
                                    isCollapsed ? 'mr-0' : 'mr-3'
                                } group-hover:translate-x-px transition-transform`}
                            >
                                <LogoutIcon />
                            </span>
                            {!isCollapsed && <span>Çıkış Yap</span>}
                        </button>
                    </div>
                </nav>
            </motion.div>

            {/* Ana içerik */}
            <div
                className={`flex-1 flex flex-col ${
                    isCollapsed ? 'ml-20' : 'ml-0 md:ml-72'
                } transition-all duration-300`}
            >
                {/* Üst bar */}
                <header className="relative bg-[#0f1623]/80 backdrop-blur-md border-b border-gray-800 py-4 px-6 flex items-center">
                    <button
                        onClick={toggleSidebar}
                        className="text-gray-400 transition-colors focus:outline-none hover:text-white md:hidden"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="w-6 h-6"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 6h16M4 12h16M4 18h16"
                            />
                        </svg>
                    </button>

                    <div className="flex-1"></div>

                    <Link
                        href="/"
                        target="_blank"
                        className="flex items-center px-4 py-2 text-gray-300 rounded-lg border border-gray-800 transition-all hover:bg-gray-800/30 hover:text-white hover:border-gray-700"
                    >
                        <ExternalLinkIcon />
                        <span className="ml-2 text-sm font-medium">Siteyi Görüntüle</span>
                    </Link>
                </header>

                {/* İçerik alanı */}
                <main className="flex-1 overflow-y-auto p-6 bg-[#0e1117]">{children}</main>
            </div>

            <ToastProvider />
        </div>
    );
}

interface NavItemProps {
    href: string;
    icon: React.ReactNode;
    children: React.ReactNode;
    exact?: boolean;
    isCollapsed?: boolean;
}

function NavItem({ href, icon, children, exact, isCollapsed }: NavItemProps) {
    const pathname = usePathname() || '';
    const isActive = exact ? pathname === href : pathname.startsWith(href);

    return (
        <Link
            href={href}
            className={`flex items-center ${
                isCollapsed ? 'justify-center p-3' : 'px-4 py-3'
            } rounded-lg text-sm font-medium transition-all group
                ${
                    isActive
                        ? 'from-blue-600/20 to-purple-600/20 text-white bg-gradient-to-r border-l-2 border-blue-500'
                        : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200'
                }
            `}
            title={isCollapsed ? String(children) : ''}
        >
            <motion.span
                className={`${isCollapsed ? 'mr-0' : 'mr-3'} ${
                    isActive ? 'text-blue-400' : 'text-gray-500 group-hover:text-gray-300'
                }`}
                whileHover={{ scale: 1.1 }}
                transition={{ duration: 0.2 }}
            >
                {icon}
            </motion.span>
            {!isCollapsed && <span>{children}</span>}

            {isActive && !isCollapsed && (
                <motion.span
                    layoutId="activeNavIndicator"
                    className="ml-auto w-2 h-2 bg-blue-500 rounded-full"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                />
            )}
        </Link>
    );
}
