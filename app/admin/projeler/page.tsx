'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { toast, ToastOptions } from 'react-toastify';
import { FaCheck, FaExclamationTriangle } from 'react-icons/fa';
import ProjectsTable, { Project } from '@/components/admin/ProjectsTable';

export default function ProjectsManagement() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [activeLocale, setActiveLocale] = useState(searchParams?.get('locale') || 'tr');
    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Locale değiştiğinde URL'i güncelle
    useEffect(() => {
        router.push(`/admin/projeler?locale=${activeLocale}`);
    }, [activeLocale, router]);

    // Projeleri yükle
    useEffect(() => {
        async function fetchProjects() {
            try {
                setIsLoading(true);
                const token = localStorage.getItem('adminToken');

                if (!token) {
                    router.push('/admin/giris');
                    return;
                }

                const response = await fetch(`/api/admin/projects/${activeLocale}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (response.ok) {
                    const data = await response.json();

                    // Her projeye varsayılan order (sıralama) değeri ekle
                    // Eğer order alanı yoksa, sıra değerini index olarak ata
                    const projectsWithOrder = (data.list || []).map(
                        (project: Project, index: number) => ({
                            ...project,
                            order: project.order !== undefined ? project.order : index,
                        })
                    );

                    // Projeleri order değerine göre sırala
                    projectsWithOrder.sort((a: Project, b: Project) => a.order - b.order);

                    setProjects(projectsWithOrder);
                } else {
                    console.error('Projeler alınamadı');
                }
            } catch (error) {
                console.error('Projeler yükleme hatası:', error);
            } finally {
                setIsLoading(false);
            }
        }

        fetchProjects();
    }, [activeLocale, router]);

    // Proje silme
    const deleteProject = async (id: string) => {
        try {
            const token = localStorage.getItem('adminToken');

            if (!token) {
                router.push('/admin/giris');
                return;
            }

            const response = await fetch(`/api/admin/projects/${activeLocale}/${id}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.ok) {
                // Projeyi listeden kaldır
                setProjects(prevProjects => prevProjects.filter(p => p.id !== id));
                // Modern toast bildirimi göster
                showModernToast('success', 'Proje başarıyla silindi');
            } else {
                const errorData = await response.json();
                showModernToast(
                    'error',
                    `Proje silinemedi: ${errorData.error || 'Bilinmeyen hata'}`
                );
            }
        } catch (error) {
            showModernToast(
                'error',
                `Hata: ${error instanceof Error ? error.message : 'Proje silinemedi'}`
            );
        }
    };

    // Modern ve şık toast bildirimi gösterme fonksiyonu
    const showModernToast = (type: 'success' | 'error' | 'info' | 'warning', message: string) => {
        const toastOptions: ToastOptions = {
            position: 'bottom-right',
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            closeButton: true,
            style: {
                borderRadius: '12px',
            },
        };

        toast[type](
            <div className="flex flex-col">
                <span className="text-sm font-medium">{message}</span>
            </div>,
            toastOptions
        );
    };

    return (
        <div className="p-6">
            <div className="mb-6">
                <div className="flex flex-col gap-4 mb-6 md:flex-row md:justify-between md:items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-white">Proje Yönetimi</h1>
                        <p className="mt-2 text-gray-400">Portfolyo projelerinizi yönetin</p>
                    </div>

                    <div className="flex items-center">
                        {/* Dil seçimi */}
                        <div className="mr-3">
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

                        {/* Yeni Proje butonu */}
                        <Link
                            href={`/admin/projeler/yeni?locale=${activeLocale}`}
                            className="flex items-center px-[14px] py-[7px] text-[14px] mt-[21px] font-medium text-white bg-green-600 rounded-md transition-colors hover:bg-green-700"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="w-5 h-5 mr-2"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                                    clipRule="evenodd"
                                />
                            </svg>
                            Yeni Proje
                        </Link>
                    </div>
                </div>
            </div>

            {isLoading ? (
                <div className="p-6 bg-gray-800 rounded-lg">
                    <div className="space-y-4 animate-pulse">
                        <div className="w-full h-10 bg-gray-700 rounded-md"></div>
                        <div className="w-full h-10 bg-gray-700 rounded-md"></div>
                        <div className="w-full h-10 bg-gray-700 rounded-md"></div>
                        <div className="w-full h-10 bg-gray-700 rounded-md"></div>
                        <div className="w-full h-10 bg-gray-700 rounded-md"></div>
                    </div>
                </div>
            ) : (
                <ProjectsTable
                    projects={projects}
                    onDelete={deleteProject}
                    activeLocale={activeLocale}
                />
            )}
        </div>
    );
}
