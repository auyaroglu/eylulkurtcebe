'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Stats {
    projectCount: number;
    trContentUpdated: string | null;
    enContentUpdated: string | null;
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<Stats>({
        projectCount: 0,
        trContentUpdated: null,
        enContentUpdated: null,
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchStats() {
            try {
                const token = localStorage.getItem('adminToken');

                if (!token) return;

                // API'den istatistikleri al
                const response = await fetch('/api/admin/stats', {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (response.ok) {
                    const data = await response.json();
                    setStats(data);
                }
            } catch (error) {
                console.error('İstatistikler alınırken hata oluştu:', error);
            } finally {
                setIsLoading(false);
            }
        }

        fetchStats();
    }, []);

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white">Yönetim Paneli</h1>
                <p className="text-gray-400 mt-2">Sitenizi buradan yönetebilirsiniz.</p>
            </div>

            {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-gray-800 p-6 rounded-lg animate-pulse">
                            <div className="h-4 bg-gray-700 rounded w-3/4 mb-3"></div>
                            <div className="h-8 bg-gray-700 rounded w-1/2"></div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="bg-gradient-to-br from-blue-900 to-blue-700 p-6 rounded-lg shadow-lg">
                        <h3 className="text-lg font-medium text-blue-200">Toplam Proje</h3>
                        <p className="text-3xl font-bold text-white mt-2">{stats.projectCount}</p>
                        <div className="mt-4">
                            <Link
                                href="/admin/projeler"
                                className="text-blue-200 hover:text-white text-sm inline-flex items-center transition-colors"
                            >
                                Projeleri Yönet
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-4 w-4 ml-1"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 5l7 7-7 7"
                                    />
                                </svg>
                            </Link>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-purple-900 to-purple-700 p-6 rounded-lg shadow-lg">
                        <h3 className="text-lg font-medium text-purple-200">Türkçe İçerik</h3>
                        <p className="text-sm text-purple-300 mt-2">
                            Son güncelleme:{' '}
                            {stats.trContentUpdated
                                ? new Date(stats.trContentUpdated).toLocaleString('tr-TR')
                                : 'Bilinmiyor'}
                        </p>
                        <div className="mt-4">
                            <Link
                                href="/admin/icerikler?locale=tr"
                                className="text-purple-200 hover:text-white text-sm inline-flex items-center transition-colors"
                            >
                                İçerikleri Düzenle
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-4 w-4 ml-1"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 5l7 7-7 7"
                                    />
                                </svg>
                            </Link>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-green-900 to-green-700 p-6 rounded-lg shadow-lg">
                        <h3 className="text-lg font-medium text-green-200">İngilizce İçerik</h3>
                        <p className="text-sm text-green-300 mt-2">
                            Son güncelleme:{' '}
                            {stats.enContentUpdated
                                ? new Date(stats.enContentUpdated).toLocaleString('tr-TR')
                                : 'Bilinmiyor'}
                        </p>
                        <div className="mt-4">
                            <Link
                                href="/admin/icerikler?locale=en"
                                className="text-green-200 hover:text-white text-sm inline-flex items-center transition-colors"
                            >
                                İçerikleri Düzenle
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-4 w-4 ml-1"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 5l7 7-7 7"
                                    />
                                </svg>
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            <div className="mt-12">
                <h2 className="text-xl font-semibold text-white mb-4">Hızlı İşlemler</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Link
                        href="/admin/projeler/yeni"
                        className="bg-gray-800 p-4 rounded-lg hover:bg-gray-700 transition-colors flex items-center"
                    >
                        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center mr-3">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5 text-white"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                />
                            </svg>
                        </div>
                        <div>
                            <h3 className="font-medium text-white">Yeni Proje</h3>
                            <p className="text-sm text-gray-400">
                                Portfolyonuza yeni proje ekleyin
                            </p>
                        </div>
                    </Link>

                    <Link
                        href="/admin/icerikler"
                        className="bg-gray-800 p-4 rounded-lg hover:bg-gray-700 transition-colors flex items-center"
                    >
                        <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center mr-3">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5 text-white"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                />
                            </svg>
                        </div>
                        <div>
                            <h3 className="font-medium text-white">İçerik Düzenle</h3>
                            <p className="text-sm text-gray-400">Site içeriklerini güncelleyin</p>
                        </div>
                    </Link>

                    <Link
                        href="/admin/ayarlar"
                        className="bg-gray-800 p-4 rounded-lg hover:bg-gray-700 transition-colors flex items-center"
                    >
                        <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center mr-3">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5 text-white"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                                />
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                            </svg>
                        </div>
                        <div>
                            <h3 className="font-medium text-white">Ayarlar</h3>
                            <p className="text-sm text-gray-400">Sistem ayarlarını yapılandırın</p>
                        </div>
                    </Link>
                </div>
            </div>
        </div>
    );
}
