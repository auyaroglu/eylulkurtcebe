'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast, ToastOptions } from 'react-toastify';
import { FaCheck, FaExclamationTriangle, FaEye, FaTrash } from 'react-icons/fa';

interface ContactForm {
    _id: string;
    name: string;
    email: string;
    message: string;
    ipAddress: string;
    userAgent: string;
    isRead: boolean;
    createdAt: string;
    updatedAt: string;
}

export default function ContactFormsManagement() {
    const router = useRouter();
    const [contactForms, setContactForms] = useState<ContactForm[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
    const itemsPerPage = 10;

    // İletişim formlarını yükle
    useEffect(() => {
        async function fetchContactForms() {
            try {
                setIsLoading(true);
                const token = localStorage.getItem('adminToken');

                if (!token) {
                    router.push('/admin/giris');
                    return;
                }

                const url = `/api/admin/contact-forms?page=${currentPage}&limit=${itemsPerPage}${
                    searchTerm ? `&search=${encodeURIComponent(searchTerm)}` : ''
                }`;

                console.log(`İletişim formları yükleniyor: ${url}`);

                const response = await fetch(url, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (response.ok) {
                    const data = await response.json();
                    console.log(
                        `Yüklenen form sayısı: ${data.forms.length}, Toplam sayfa: ${data.totalPages}`
                    );

                    setContactForms(data.forms);
                    setTotalPages(data.totalPages);

                    // Eğer mevcut sayfa, toplam sayfa sayısından büyükse, son sayfaya git
                    if (currentPage > data.totalPages && data.totalPages > 0) {
                        console.log(`Sayfa düzeltiliyor: ${currentPage} -> ${data.totalPages}`);
                        setCurrentPage(data.totalPages);
                    }
                } else {
                    const errorData = await response.json();
                    console.error('İletişim formları yüklenemedi:', errorData);
                    showModernToast(
                        'error',
                        `İletişim formları yüklenemedi: ${errorData.error || 'API hatası'}`
                    );
                    setContactForms([]);
                    setTotalPages(1);
                }
            } catch (error) {
                console.error('İletişim formları yükleme hatası:', error);
                showModernToast('error', 'İletişim formları yüklenirken bir hata oluştu');
                setContactForms([]);
                setTotalPages(1);
            } finally {
                setIsLoading(false);
            }
        }

        fetchContactForms();
    }, [currentPage, router, searchTerm, itemsPerPage]);

    // İletişim formu silme
    const deleteContactForm = async (id: string) => {
        try {
            const token = localStorage.getItem('adminToken');

            if (!token) {
                router.push('/admin/giris');
                return;
            }

            console.log(`İletişim formu silme isteği gönderiliyor: ${id}`);

            const response = await fetch(`/api/admin/contact-forms/${id}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const responseData = await response.json();
            console.log('Silme yanıtı:', responseData);

            if (response.ok) {
                // İletişim formunu listeden kaldır
                setContactForms(prevForms => prevForms.filter(form => form._id !== id));
                // Modern toast bildirimi göster
                showModernToast('success', 'İletişim formu başarıyla silindi');

                // Mevcut sayfada form kalmadıysa ve başka sayfalar varsa önceki sayfaya dön
                if (contactForms.length === 1 && currentPage > 1) {
                    setCurrentPage(prevPage => prevPage - 1);
                }
            } else {
                console.error(`Silme hatası: ${responseData.error || 'Bilinmeyen hata'}`);
                showModernToast(
                    'error',
                    `İletişim formu silinemedi: ${responseData.error || 'Bilinmeyen hata'}`
                );

                // 404 hatası durumunda liste görünümünden elementi kaldır
                // Formu fiziksel olarak bulamasak bile kullanıcının görmemesi için
                if (response.status === 404) {
                    console.log("Form bulunamadı ama UI'dan kaldırılıyor");
                    setContactForms(prevForms => prevForms.filter(form => form._id !== id));
                    showModernToast('info', 'Form zaten silinmiş, liste güncellendi');
                }
            }
        } catch (error) {
            console.error('Silme işlemi hatası:', error);
            showModernToast(
                'error',
                `Hata: ${error instanceof Error ? error.message : 'İletişim formu silinemedi'}`
            );
        } finally {
            // Silme işlemi dialog'unu kapat
            setDeleteConfirmId(null);
        }
    };

    // Form detaylarını görüntüle ve "okundu" olarak işaretle
    const viewContactForm = (id: string) => {
        router.push(`/admin/mailler/detay/${id}`);
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

    // Tarih formatla
    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('tr-TR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    // Silme dialogunu aç/kapa
    const toggleDeleteConfirm = (id: string | null) => {
        setDeleteConfirmId(id);
    };

    // Silme işlemini gerçekleştir
    const confirmDelete = () => {
        if (deleteConfirmId) {
            deleteContactForm(deleteConfirmId);
            setDeleteConfirmId(null);
        }
    };

    // Sayfa değiştirme işlevi
    const changePage = (page: number) => {
        if (page < 1 || page > totalPages) return;
        setCurrentPage(page);
    };

    // Arama filtresini uygula
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setCurrentPage(1); // Arama yapınca 1. sayfaya dön
    };

    return (
        <div className="p-6">
            <div className="mb-6">
                <div className="flex flex-col gap-4 mb-6 md:flex-row md:justify-between md:items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-white">İletişim Formları</h1>
                        <p className="mt-2 text-gray-400">
                            İletilen iletişim formlarını görüntüleyin
                        </p>
                    </div>

                    <div className="flex items-center">
                        <form onSubmit={handleSearch} className="flex">
                            <input
                                type="text"
                                placeholder="Ara..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="px-4 py-2 text-sm text-white bg-gray-800 rounded-l-md border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button
                                type="submit"
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-r-md focus:outline-none focus:ring-2 focus:ring-blue-500 hover:bg-blue-700"
                            >
                                Ara
                            </button>
                        </form>
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
                <div className="overflow-hidden bg-gray-800 rounded-lg">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-700">
                            <thead className="bg-gray-900">
                                <tr>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-400 uppercase"
                                    >
                                        İsim
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-400 uppercase"
                                    >
                                        E-posta
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-400 uppercase"
                                    >
                                        Tarih
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-400 uppercase"
                                    >
                                        Durum
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-xs font-medium tracking-wider text-right text-gray-400 uppercase"
                                    >
                                        İşlemler
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-gray-800 divide-y divide-gray-700">
                                {contactForms.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="px-6 py-4 text-center text-gray-400"
                                        >
                                            Hiç iletişim formu bulunamadı.
                                        </td>
                                    </tr>
                                ) : (
                                    contactForms.map(form => (
                                        <tr
                                            key={form._id}
                                            className={`hover:bg-gray-700 transition-colors ${
                                                !form.isRead ? 'bg-blue-900/10' : ''
                                            }`}
                                        >
                                            <td className="px-6 py-4 text-sm font-medium text-white whitespace-nowrap">
                                                {form.name}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-300 whitespace-nowrap">
                                                {form.email}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-300 whitespace-nowrap">
                                                {formatDate(form.createdAt)}
                                            </td>
                                            <td className="px-6 py-4 text-sm whitespace-nowrap">
                                                <span
                                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                        form.isRead
                                                            ? 'bg-green-200 text-green-800'
                                                            : 'bg-blue-200 text-blue-800'
                                                    }`}
                                                >
                                                    {form.isRead ? 'Okundu' : 'Okunmadı'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-right whitespace-nowrap">
                                                <div className="flex justify-end space-x-2">
                                                    <button
                                                        onClick={() => viewContactForm(form._id)}
                                                        className="p-1 text-blue-400 rounded hover:bg-gray-600"
                                                        title="Görüntüle"
                                                    >
                                                        <FaEye size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            toggleDeleteConfirm(form._id)
                                                        }
                                                        className="p-1 text-red-400 rounded hover:bg-gray-600"
                                                        title="Sil"
                                                    >
                                                        <FaTrash size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Sayfalama kontrolü */}
                    {totalPages > 1 && (
                        <div className="flex justify-between items-center px-4 py-3 bg-gray-700 border-t border-gray-600 sm:px-6">
                            <div className="flex flex-1 justify-between sm:hidden">
                                <button
                                    onClick={() => changePage(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className={`relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                                        currentPage === 1
                                            ? 'text-gray-500 bg-gray-800 cursor-not-allowed'
                                            : 'text-white bg-gray-800 hover:bg-gray-900'
                                    }`}
                                >
                                    Önceki
                                </button>
                                <button
                                    onClick={() => changePage(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className={`relative inline-flex items-center px-4 py-2 ml-3 text-sm font-medium rounded-md ${
                                        currentPage === totalPages
                                            ? 'text-gray-500 bg-gray-800 cursor-not-allowed'
                                            : 'text-white bg-gray-800 hover:bg-gray-900'
                                    }`}
                                >
                                    Sonraki
                                </button>
                            </div>
                            <div className="hidden sm:flex sm:flex-1 sm:justify-between sm:items-center">
                                <div>
                                    <p className="text-sm text-gray-300">
                                        <span className="font-medium">{currentPage}</span> /{' '}
                                        <span className="font-medium">{totalPages}</span> sayfa
                                        {contactForms.length > 0 && (
                                            <span className="ml-2">
                                                (toplam: {contactForms.length} öğe)
                                            </span>
                                        )}
                                    </p>
                                </div>
                                <div>
                                    <nav
                                        className="-space-x-px isolate inline-flex rounded-md shadow-sm"
                                        aria-label="Sayfalama"
                                    >
                                        <button
                                            onClick={() => changePage(currentPage - 1)}
                                            disabled={currentPage === 1}
                                            className={`relative inline-flex items-center px-2 py-2 text-sm font-medium rounded-l-md ${
                                                currentPage === 1
                                                    ? 'text-gray-500 bg-gray-800 cursor-not-allowed'
                                                    : 'text-white bg-gray-800 hover:bg-gray-900'
                                            }`}
                                        >
                                            <span className="sr-only">Önceki</span>
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                className="w-5 h-5"
                                                viewBox="0 0 20 20"
                                                fill="currentColor"
                                            >
                                                <path
                                                    fillRule="evenodd"
                                                    d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                                                    clipRule="evenodd"
                                                />
                                            </svg>
                                        </button>

                                        {/* Sayfa numaraları - 5'ten fazla sayfa varsa akıllı sayfalama göster */}
                                        {totalPages <= 5 ? (
                                            // 5 veya daha az sayfa varsa tüm sayfaları göster
                                            Array.from({ length: totalPages }, (_, i) => i + 1).map(
                                                page => (
                                                    <button
                                                        key={page}
                                                        onClick={() => changePage(page)}
                                                        className={`relative inline-flex items-center px-4 py-2 text-sm font-medium ${
                                                            currentPage === page
                                                                ? 'z-10 bg-blue-600 text-white focus:z-20'
                                                                : 'text-gray-300 bg-gray-800 hover:bg-gray-700'
                                                        }`}
                                                    >
                                                        {page}
                                                    </button>
                                                )
                                            )
                                        ) : (
                                            // 5'ten fazla sayfa varsa akıllı sayfalama göster
                                            <>
                                                {/* İlk sayfa her zaman görünsün */}
                                                <button
                                                    onClick={() => changePage(1)}
                                                    className={`relative inline-flex items-center px-4 py-2 text-sm font-medium ${
                                                        currentPage === 1
                                                            ? 'z-10 bg-blue-600 text-white focus:z-20'
                                                            : 'text-gray-300 bg-gray-800 hover:bg-gray-700'
                                                    }`}
                                                >
                                                    1
                                                </button>

                                                {/* Eğer başlangıçta boşluk varsa ... göster */}
                                                {currentPage > 3 && (
                                                    <span className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-300 bg-gray-800">
                                                        ...
                                                    </span>
                                                )}

                                                {/* Mevcut sayfanın etrafındaki sayfaları göster */}
                                                {Array.from({ length: totalPages }, (_, i) => i + 1)
                                                    .filter(
                                                        page => page !== 1 && page !== totalPages
                                                    ) // İlk ve son sayfaları hariç tut
                                                    .filter(
                                                        page =>
                                                            page === currentPage - 1 ||
                                                            page === currentPage ||
                                                            page === currentPage + 1
                                                    )
                                                    .map(page => (
                                                        <button
                                                            key={page}
                                                            onClick={() => changePage(page)}
                                                            className={`relative inline-flex items-center px-4 py-2 text-sm font-medium ${
                                                                currentPage === page
                                                                    ? 'z-10 bg-blue-600 text-white focus:z-20'
                                                                    : 'text-gray-300 bg-gray-800 hover:bg-gray-700'
                                                            }`}
                                                        >
                                                            {page}
                                                        </button>
                                                    ))}

                                                {/* Eğer sonda boşluk varsa ... göster */}
                                                {currentPage < totalPages - 2 && (
                                                    <span className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-300 bg-gray-800">
                                                        ...
                                                    </span>
                                                )}

                                                {/* Son sayfa her zaman görünsün */}
                                                <button
                                                    onClick={() => changePage(totalPages)}
                                                    className={`relative inline-flex items-center px-4 py-2 text-sm font-medium ${
                                                        currentPage === totalPages
                                                            ? 'z-10 bg-blue-600 text-white focus:z-20'
                                                            : 'text-gray-300 bg-gray-800 hover:bg-gray-700'
                                                    }`}
                                                >
                                                    {totalPages}
                                                </button>
                                            </>
                                        )}

                                        <button
                                            onClick={() => changePage(currentPage + 1)}
                                            disabled={currentPage === totalPages}
                                            className={`relative inline-flex items-center px-2 py-2 text-sm font-medium rounded-r-md ${
                                                currentPage === totalPages
                                                    ? 'text-gray-500 bg-gray-800 cursor-not-allowed'
                                                    : 'text-white bg-gray-800 hover:bg-gray-900'
                                            }`}
                                        >
                                            <span className="sr-only">Sonraki</span>
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                className="w-5 h-5"
                                                viewBox="0 0 20 20"
                                                fill="currentColor"
                                            >
                                                <path
                                                    fillRule="evenodd"
                                                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                                                    clipRule="evenodd"
                                                />
                                            </svg>
                                        </button>
                                    </nav>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Silme onay dialogu */}
            {deleteConfirmId && (
                <div className="bg-opacity-50 fixed inset-0 z-50 flex justify-center items-center bg-black">
                    <div className="p-6 mx-4 bg-gray-800 rounded-lg shadow-xl sm:mx-auto sm:max-w-md">
                        <div className="mx-auto w-12 h-12 flex justify-center items-center mb-4 bg-red-100 rounded-full">
                            <FaExclamationTriangle className="w-6 h-6 text-red-600" />
                        </div>
                        <h3 className="mb-2 text-lg font-bold text-center text-white">
                            İletişim Formunu Sil
                        </h3>
                        <p className="mb-6 text-center text-gray-300">
                            Bu iletişim formunu silmek istediğinizden emin misiniz? Bu işlem geri
                            alınamaz.
                        </p>
                        <div className="flex justify-center space-x-3">
                            <button
                                onClick={() => toggleDeleteConfirm(null)}
                                className="px-4 py-2 text-sm font-medium text-gray-200 bg-gray-600 rounded-md hover:bg-gray-700"
                            >
                                İptal
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
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
