'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { toast, ToastOptions } from 'react-toastify';
import { FaArrowLeft, FaTrash, FaExclamationTriangle } from 'react-icons/fa';

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

export default function ContactFormDetail() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;
    const [contactForm, setContactForm] = useState<ContactForm | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

    // İletişim formu detaylarını yükle
    useEffect(() => {
        async function fetchContactFormDetail() {
            try {
                setIsLoading(true);
                const token = localStorage.getItem('adminToken');

                if (!token) {
                    router.push('/admin/giris');
                    return;
                }

                const response = await fetch(`/api/admin/contact-forms/${id}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (response.ok) {
                    const data = await response.json();
                    setContactForm(data.form);

                    // Eğer form okunmamışsa, okundu olarak işaretle
                    if (data.form && !data.form.isRead) {
                        markAsRead();
                    }
                } else {
                    console.error('İletişim formu detayları alınamadı');
                    showModernToast('error', 'İletişim formu bulunamadı');
                    router.push('/admin/mailler');
                }
            } catch (error) {
                console.error('İletişim formu detayları yükleme hatası:', error);
                showModernToast('error', 'Bağlantı hatası');
                router.push('/admin/mailler');
            } finally {
                setIsLoading(false);
            }
        }

        if (id) {
            fetchContactFormDetail();
        }
    }, [id, router]);

    // İletişim formunu okundu olarak işaretle
    const markAsRead = async () => {
        try {
            const token = localStorage.getItem('adminToken');

            if (!token) {
                router.push('/admin/giris');
                return;
            }

            const response = await fetch(`/api/admin/contact-forms/${id}/read`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ isRead: true }),
            });

            if (response.ok) {
                // Formu güncelle
                setContactForm(prev => (prev ? { ...prev, isRead: true } : null));
            } else {
                console.error('İletişim formu güncellenemedi');
            }
        } catch (error) {
            console.error('İletişim formu güncelleme hatası:', error);
        }
    };

    // İletişim formu silme
    const deleteContactForm = async () => {
        try {
            const token = localStorage.getItem('adminToken');

            if (!token) {
                router.push('/admin/giris');
                return;
            }

            const response = await fetch(`/api/admin/contact-forms/${id}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.ok) {
                showModernToast('success', 'İletişim formu başarıyla silindi');
                router.push('/admin/mailler');
            } else {
                const errorData = await response.json();
                showModernToast(
                    'error',
                    `İletişim formu silinemedi: ${errorData.error || 'Bilinmeyen hata'}`
                );
            }
        } catch (error) {
            showModernToast(
                'error',
                `Hata: ${error instanceof Error ? error.message : 'İletişim formu silinemedi'}`
            );
        }
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
            second: '2-digit',
        });
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

    // Silme dialogunu aç/kapa
    const toggleDeleteConfirm = (id: string | null) => {
        setDeleteConfirmId(id);
    };

    // Silme işlemini gerçekleştir
    const confirmDelete = () => {
        deleteContactForm();
        setDeleteConfirmId(null);
    };

    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                    <Link
                        href="/admin/mailler"
                        className="p-2 text-gray-400 bg-gray-800 rounded-md hover:bg-gray-700 hover:text-white"
                    >
                        <FaArrowLeft className="w-5 h-5" />
                    </Link>
                    <h1 className="text-2xl font-bold text-white">İletişim Formu Detayı</h1>
                </div>

                {!isLoading && contactForm && (
                    <button
                        onClick={() => toggleDeleteConfirm(id)}
                        className="flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                    >
                        <FaTrash className="w-4 h-4 mr-2" />
                        Sil
                    </button>
                )}
            </div>

            {isLoading ? (
                <div className="p-6 bg-gray-800 rounded-lg">
                    <div className="space-y-4 animate-pulse">
                        <div className="w-full h-10 bg-gray-700 rounded-md"></div>
                        <div className="w-full h-32 bg-gray-700 rounded-md"></div>
                        <div className="w-full h-10 bg-gray-700 rounded-md"></div>
                    </div>
                </div>
            ) : contactForm ? (
                <div className="overflow-hidden bg-gray-800 rounded-lg">
                    <div className="p-6">
                        <div className="flex flex-col space-y-6">
                            {/* Üst Bilgiler */}
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div className="p-4 bg-gray-700 rounded-lg">
                                    <h3 className="mb-2 text-sm font-medium text-gray-400">
                                        Gönderen
                                    </h3>
                                    <p className="text-lg font-medium text-white">
                                        {contactForm.name}
                                    </p>
                                </div>
                                <div className="p-4 bg-gray-700 rounded-lg">
                                    <h3 className="mb-2 text-sm font-medium text-gray-400">
                                        E-posta
                                    </h3>
                                    <p className="text-lg font-medium text-blue-400">
                                        {contactForm.email}
                                    </p>
                                </div>
                            </div>

                            {/* Tarih ve Durum */}
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div className="p-4 bg-gray-700 rounded-lg">
                                    <h3 className="mb-2 text-sm font-medium text-gray-400">
                                        Tarih
                                    </h3>
                                    <p className="text-lg font-medium text-white">
                                        {formatDate(contactForm.createdAt)}
                                    </p>
                                </div>
                                <div className="p-4 bg-gray-700 rounded-lg">
                                    <h3 className="mb-2 text-sm font-medium text-gray-400">
                                        Durum
                                    </h3>
                                    <span
                                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                            contactForm.isRead
                                                ? 'bg-green-200 text-green-800'
                                                : 'bg-blue-200 text-blue-800'
                                        }`}
                                    >
                                        {contactForm.isRead ? 'Okundu' : 'Okunmadı'}
                                    </span>
                                </div>
                            </div>

                            {/* Mesaj İçeriği */}
                            <div className="p-4 bg-gray-700 rounded-lg">
                                <h3 className="mb-2 text-sm font-medium text-gray-400">Mesaj</h3>
                                <div className="p-4 bg-gray-900 rounded-md">
                                    <p className="whitespace-pre-wrap text-white">
                                        {contactForm.message}
                                    </p>
                                </div>
                            </div>

                            {/* Teknik Bilgiler */}
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div className="p-4 bg-gray-700 rounded-lg">
                                    <h3 className="mb-2 text-sm font-medium text-gray-400">
                                        IP Adresi
                                    </h3>
                                    <p className="text-sm text-gray-300">{contactForm.ipAddress}</p>
                                </div>
                                <div className="p-4 bg-gray-700 rounded-lg">
                                    <h3 className="mb-2 text-sm font-medium text-gray-400">
                                        Tarayıcı Bilgisi
                                    </h3>
                                    <p className="text-sm text-gray-300">{contactForm.userAgent}</p>
                                </div>
                            </div>

                            {/* Hızlı Yanıt Butonu */}
                            <div className="flex justify-center mt-4">
                                <a
                                    href={`mailto:${contactForm.email}?subject=Yanıt: ${contactForm.name}`}
                                    className="px-6 py-3 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                                >
                                    E-posta ile Yanıtla
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="p-8 text-center bg-gray-800 rounded-lg">
                    <h2 className="text-xl text-gray-400">İletişim formu bulunamadı.</h2>
                </div>
            )}

            {/* Silme onay dialogu */}
            {deleteConfirmId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="p-6 mx-4 bg-gray-800 rounded-lg shadow-xl sm:max-w-md sm:mx-auto">
                        <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
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
