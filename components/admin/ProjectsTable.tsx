'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { toast, ToastOptions } from 'react-toastify';
import {
    FaEdit,
    FaTrash,
    FaSearch,
    FaSortAmountDown,
    FaSortAmountUp,
    FaChevronLeft,
    FaChevronRight,
    FaSave,
    FaCheck,
    FaExclamationTriangle,
} from 'react-icons/fa';

// Tablo için proje türü
export interface Project {
    _id: string;
    id: string;
    originalId: string; // İki dil arasında eşleştirme için
    title: string;
    description: string;
    images: string[];
    technologies: string[];
    locale: string;
    createdAt: string;
    updatedAt: string;
    order: number; // Sıralama için ekledik
    status: boolean; // Yayında mı değil mi?
    demo?: string;
}

interface ProjectsTableProps {
    projects: Project[];
    onDelete: (id: string) => void;
    activeLocale: string;
}

export default function ProjectsTable({ projects, onDelete, activeLocale }: ProjectsTableProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [sortField, setSortField] = useState<'title' | 'createdAt' | 'order'>('order');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
    const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
    const [draggedProjectIndex, setDraggedProjectIndex] = useState<number | null>(null);
    const [projectsChanged, setProjectsChanged] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Sayfalama değişkenleri
    const [currentPage, setCurrentPage] = useState(1);
    const projectsPerPage = 10;
    const [paginatedProjects, setPaginatedProjects] = useState<Project[]>([]);
    const [totalPages, setTotalPages] = useState(1);

    // Projeleri filtrele ve sırala
    useEffect(() => {
        let result = [...projects];

        // Arama filtresini uygula
        if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            result = result.filter(
                project =>
                    project.title.toLowerCase().includes(searchLower) ||
                    project.description.toLowerCase().includes(searchLower) ||
                    project.technologies.some(tech => tech.toLowerCase().includes(searchLower))
            );
        }

        // Sıralama uygula
        result.sort((a, b) => {
            if (sortField === 'title') {
                const titleA = a.title.toLowerCase();
                const titleB = b.title.toLowerCase();
                return sortDirection === 'asc'
                    ? titleA.localeCompare(titleB)
                    : titleB.localeCompare(titleA);
            } else if (sortField === 'order') {
                // Önce order alanına göre sırala
                return sortDirection === 'asc' ? a.order - b.order : b.order - a.order;
            } else {
                const dateA = new Date(a.createdAt).getTime();
                const dateB = new Date(b.createdAt).getTime();
                return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
            }
        });

        setFilteredProjects(result);
        // Sayfa değiştiğinde, sayfa 1'e dön
        setCurrentPage(1);
        // Toplam sayfa sayısını hesapla
        setTotalPages(Math.ceil(result.length / projectsPerPage));
    }, [projects, searchTerm, sortField, sortDirection]);

    // Sayfalama işlemleri
    useEffect(() => {
        const startIndex = (currentPage - 1) * projectsPerPage;
        const endIndex = startIndex + projectsPerPage;
        setPaginatedProjects(filteredProjects.slice(startIndex, endIndex));
    }, [filteredProjects, currentPage]);

    // URL düzeltme yardımcı fonksiyonu
    const formatImageUrl = (url: string): string => {
        if (!url) return '';
        if (url.startsWith('http://') || url.startsWith('https://')) return url;
        return url.startsWith('/') ? url : `/${url}`;
    };

    // Sıralama değiştir
    const toggleSort = (field: 'order') => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    // Tarih formatla
    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('tr-TR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    // Silme dialogunu aç/kapa
    const toggleDeleteConfirm = (id: string | null) => {
        setDeleteConfirmId(id);
    };

    // Silme işlemini gerçekleştir
    const confirmDelete = () => {
        if (deleteConfirmId) {
            onDelete(deleteConfirmId);
            setDeleteConfirmId(null);
        }
    };

    // Sayfa değiştirme işlevi
    const changePage = (page: number) => {
        if (page < 1 || page > totalPages) return;
        setCurrentPage(page);
    };

    // Sürükleme başlangıcı
    const handleDragStart = (index: number) => {
        setDraggedProjectIndex(index);
    };

    // Sürükleme hedefine gelindiğinde
    const handleDragEnter = (index: number) => {
        if (draggedProjectIndex === null || draggedProjectIndex === index) return;

        // Mevcut sayfada görünen projeler
        const visibleProjects = [...paginatedProjects];
        const allProjects = [...filteredProjects];

        // Sayfadaki indeksleri global indekslere dönüştür
        const startIdx = (currentPage - 1) * projectsPerPage;
        const globalDraggedIndex = startIdx + draggedProjectIndex;
        const globalTargetIndex = startIdx + index;

        // Sürüklenen öğe
        const draggedProject = allProjects[globalDraggedIndex];

        // Projeler arasında order değerlerini güncelle
        allProjects.splice(globalDraggedIndex, 1);
        allProjects.splice(globalTargetIndex, 0, draggedProject);

        // Yeni order değerlerini ata
        allProjects.forEach((project, idx) => {
            project.order = idx;
        });

        // Filtrelenmiş projeleri güncelle
        setFilteredProjects(allProjects);
        setDraggedProjectIndex(index);
        setProjectsChanged(true);
    };

    // Sürükleme bittiğinde
    const handleDragEnd = () => {
        setDraggedProjectIndex(null);
    };

    // Admin token'ı localStorage'dan alma fonksiyonu
    const getToken = () => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('adminToken');
        }
        return null;
    };

    // Değişiklikleri kaydet
    const saveOrderChanges = async () => {
        setIsSaving(true);

        try {
            const token = getToken();

            if (!token) {
                throw new Error('Oturum bilgisi bulunamadı');
            }

            // Sıralanmış projelerin yeni sıralamasını hesapla
            const updatedProjects = [...filteredProjects];
            updatedProjects.forEach((project, index) => {
                project.order = index;
            });

            // Göndermek için order datası hazırla
            const orderData = updatedProjects.map(project => ({
                id: project.id,
                order: project.order,
            }));

            // API endpoint ile dene
            try {
                const response = await fetch('/api/admin/projects/order', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        locale: activeLocale,
                        orders: orderData,
                    }),
                });

                const responseData = await response.json();

                if (!response.ok) {
                    throw new Error(responseData.error || 'Sıralama kaydedilemedi');
                }

                // Modern toast bildirimi göster
                showModernToast('success', 'Proje sıralaması kaydedildi');
                setProjectsChanged(false);
            } catch (apiError) {
                // API başarısız olursa, server action dene
                try {
                    // Server action modülünü dinamik olarak import et
                    const { updateProjectsOrder } = await import('@/lib/server-actions');

                    // Server action'ı çağır
                    const result = await updateProjectsOrder(orderData, activeLocale);

                    if (result?.success) {
                        showModernToast('success', 'Proje sıralaması kaydedildi');
                        setProjectsChanged(false);
                    } else {
                        throw new Error(
                            result?.error || 'Server action ile kaydetme başarısız oldu'
                        );
                    }
                } catch (serverActionError) {
                    throw serverActionError; // Ana catch bloğunda yakalanacak
                }
            }
        } catch (error) {
            showModernToast(
                'error',
                `Hata: ${error instanceof Error ? error.message : 'Sıralama kaydedilemedi'}`
            );
        } finally {
            setIsSaving(false);
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

    // Durum değiştirme fonksiyonu
    const toggleProjectStatus = async (projectId: string, currentStatus: boolean) => {
        try {
            setIsSaving(true);
            const token = getToken();
            if (!token) return;

            const project = filteredProjects.find(p => p.id === projectId);
            if (!project) return;

            const response = await fetch(`/api/admin/projects/${activeLocale}/${projectId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    ...project,
                    status: !currentStatus,
                }),
            });

            if (response.ok) {
                // Projeyi listede güncelle
                const updatedProjects = filteredProjects.map(p => {
                    if (p.id === projectId) {
                        return { ...p, status: !currentStatus };
                    }
                    return p;
                });
                setFilteredProjects(updatedProjects);

                showModernToast(
                    'success',
                    `Proje ${!currentStatus ? 'yayına alındı' : 'yayından kaldırıldı'}`
                );
            } else {
                const errorData = await response.json();
                showModernToast(
                    'error',
                    `Durum değiştirilemedi: ${errorData.error || 'Bilinmeyen hata'}`
                );
            }
        } catch (error) {
            showModernToast(
                'error',
                `Hata: ${error instanceof Error ? error.message : 'Durum değiştirilemedi'}`
            );
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="bg-gray-800 rounded-lg overflow-hidden">
            {/* Arama ve filtre alanı */}
            <div className="p-4 bg-gray-700">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="relative flex-grow max-w-md">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <FaSearch className="text-gray-400" />
                        </div>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            placeholder="Proje ara..."
                            className="bg-gray-800 border border-gray-600 text-white w-full pl-10 pr-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div className="flex items-center space-x-4">
                        {projectsChanged && (
                            <button
                                onClick={saveOrderChanges}
                                disabled={isSaving}
                                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
                            >
                                {isSaving ? (
                                    <>
                                        <svg
                                            className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                        >
                                            <circle
                                                className="opacity-25"
                                                cx="12"
                                                cy="12"
                                                r="10"
                                                stroke="currentColor"
                                                strokeWidth="4"
                                            ></circle>
                                            <path
                                                className="opacity-75"
                                                fill="currentColor"
                                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                            ></path>
                                        </svg>
                                        Kaydediliyor...
                                    </>
                                ) : (
                                    <>
                                        <FaSave className="mr-2" />
                                        Değişiklikleri Kaydet
                                    </>
                                )}
                            </button>
                        )}

                        <div className="text-sm text-gray-300">
                            <span className="mr-2">Toplam:</span>
                            <span className="font-medium">{filteredProjects.length} proje</span>
                        </div>
                    </div>
                </div>

                {/* Sürükle bırak bilgilendirmesi */}
                <div className="mt-2 text-xs text-gray-400 italic">
                    Projelerin sırasını değiştirmek için satırları sürükleyip bırakabilirsiniz.
                    Değişiklikleri kaydetmeyi unutmayın.
                </div>
            </div>

            {/* Tablo */}
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-700">
                    <thead className="bg-gray-700">
                        <tr>
                            <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer"
                                onClick={() => toggleSort('order')}
                            >
                                <div className="flex items-center">
                                    <span>Sıra</span>
                                    {sortField === 'order' && (
                                        <span className="ml-1">
                                            {sortDirection === 'asc' ? (
                                                <FaSortAmountUp className="text-blue-400" />
                                            ) : (
                                                <FaSortAmountDown className="text-blue-400" />
                                            )}
                                        </span>
                                    )}
                                </div>
                            </th>
                            <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                            >
                                Görsel
                            </th>
                            <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                            >
                                Başlık
                            </th>
                            <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                            >
                                TEKNİKLER
                            </th>
                            <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                            >
                                Durum
                            </th>
                            <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                            >
                                Oluşturulma
                            </th>
                            <th
                                scope="col"
                                className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider"
                            >
                                İşlemler
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-gray-800 divide-y divide-gray-700">
                        {paginatedProjects.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-10 text-center text-gray-400">
                                    {searchTerm ? (
                                        <div>
                                            <p className="font-medium text-lg">
                                                Arama sonucu bulunamadı
                                            </p>
                                            <p className="mt-2">
                                                "{searchTerm}" için sonuç bulunamadı.
                                            </p>
                                        </div>
                                    ) : (
                                        <div>
                                            <p className="font-medium text-lg">Henüz proje yok</p>
                                            <p className="mt-2">
                                                İlk projenizi eklemek için "Yeni Proje" butonuna
                                                tıklayın.
                                            </p>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ) : (
                            paginatedProjects.map((project, index) => (
                                <tr
                                    key={project._id}
                                    className={`hover:bg-gray-750 ${
                                        draggedProjectIndex === index
                                            ? 'bg-gray-700 opacity-70'
                                            : ''
                                    }`}
                                    draggable
                                    onDragStart={() => handleDragStart(index)}
                                    onDragEnter={() => handleDragEnter(index)}
                                    onDragOver={e => e.preventDefault()}
                                    onDragEnd={handleDragEnd}
                                >
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 cursor-move">
                                        <div className="flex items-center">
                                            <span className="text-gray-400 mr-2">
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    className="h-5 w-5"
                                                    viewBox="0 0 20 20"
                                                    fill="currentColor"
                                                >
                                                    <path
                                                        fillRule="evenodd"
                                                        d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                                                        clipRule="evenodd"
                                                    />
                                                </svg>
                                            </span>
                                            {project.order + 1}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex-shrink-0 h-10 w-10 relative rounded-md overflow-hidden">
                                            {project.images && project.images.length > 0 ? (
                                                <Image
                                                    src={formatImageUrl(project.images[0])}
                                                    alt={project.title}
                                                    width={40}
                                                    height={40}
                                                    className="h-10 w-10 rounded-md object-cover"
                                                />
                                            ) : (
                                                <div className="h-10 w-10 rounded-md bg-gray-700 flex items-center justify-center text-gray-400">
                                                    <svg
                                                        className="h-6 w-6"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        stroke="currentColor"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                                        />
                                                    </svg>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <Link
                                                href={`/admin/projeler/duzenle/${project.id}?locale=${project.locale}`}
                                                className="text-sm font-medium text-white hover:text-indigo-300 transition-colors"
                                            >
                                                {project.title}
                                            </Link>
                                            <span className="text-xs text-gray-400">
                                                {project.description.length > 70
                                                    ? `${project.description.substring(0, 70)}...`
                                                    : project.description}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-wrap gap-1">
                                            {project.technologies.map((tech, techIndex) => (
                                                <span
                                                    key={techIndex}
                                                    className="inline-flex px-2 py-1 text-xs font-medium rounded-md bg-gray-700 text-gray-300"
                                                >
                                                    {tech}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <button
                                            onClick={() =>
                                                toggleProjectStatus(project.id, project.status)
                                            }
                                            className={`px-2 py-1 text-xs font-medium rounded-full transition-colors ${
                                                project.status
                                                    ? 'bg-green-900/30 text-green-400 hover:bg-green-900/50'
                                                    : 'bg-red-900/30 text-red-400 hover:bg-red-900/50'
                                            }`}
                                        >
                                            {project.status ? 'Yayında' : 'Gizli'}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                        {formatDate(project.createdAt)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex justify-end items-center space-x-2">
                                            <Link
                                                href={`/admin/projeler/duzenle/${project.id}?locale=${project.locale}`}
                                                className="text-indigo-400 hover:text-indigo-300 transition-colors"
                                                title="Düzenle"
                                            >
                                                <FaEdit />
                                            </Link>
                                            <button
                                                onClick={() => toggleDeleteConfirm(project.id)}
                                                className="text-red-400 hover:text-red-300 transition-colors"
                                                title="Sil"
                                            >
                                                <FaTrash />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Sayfalama */}
            {totalPages > 1 && (
                <div className="px-6 py-3 flex justify-between items-center border-t border-gray-700">
                    <div>
                        <p className="text-sm text-gray-400">
                            Toplam <span className="font-medium">{filteredProjects.length}</span>{' '}
                            projeden{' '}
                            <span className="font-medium">
                                {(currentPage - 1) * projectsPerPage + 1}-
                                {Math.min(currentPage * projectsPerPage, filteredProjects.length)}
                            </span>{' '}
                            arası gösteriliyor
                        </p>
                    </div>
                    <div className="flex gap-1">
                        <button
                            onClick={() => changePage(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="p-2 rounded-md border border-gray-600 bg-gray-800 text-gray-400 hover:text-white hover:border-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <FaChevronLeft className="h-4 w-4" />
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                            <button
                                key={page}
                                onClick={() => changePage(page)}
                                className={`px-3 py-1 rounded-md ${
                                    currentPage === page
                                        ? 'bg-blue-600 text-white'
                                        : 'border border-gray-600 bg-gray-800 text-gray-400 hover:text-white hover:border-gray-500'
                                }`}
                            >
                                {page}
                            </button>
                        ))}
                        <button
                            onClick={() => changePage(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="p-2 rounded-md border border-gray-600 bg-gray-800 text-gray-400 hover:text-white hover:border-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <FaChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* Silme onayı modalı */}
            {deleteConfirmId && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-gray-800 rounded-lg p-6 max-w-md mx-auto">
                        <h3 className="text-xl font-bold text-white mb-4">Projeyi Sil</h3>
                        <p className="text-gray-300 mb-6">
                            Bu projeyi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
                        </p>
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => toggleDeleteConfirm(null)}
                                className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors"
                            >
                                İptal
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                            >
                                Sil
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
