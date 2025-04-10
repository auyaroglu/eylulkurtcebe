'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { toast, ToastOptions } from 'react-toastify';
import {
    FaEye,
    FaTrash,
    FaSearch,
    FaSortAmountDown,
    FaSortAmountUp,
    FaChevronLeft,
    FaChevronRight,
    FaEnvelope,
    FaEnvelopeOpen,
    FaExclamationTriangle,
} from 'react-icons/fa';

// Tablo için e-posta türü
export interface Mail {
    _id: string;
    id: string;
    name: string;
    email: string;
    message: string;
    subject?: string;
    createdAt: string;
    readAt?: string;
    isRead: boolean;
}

interface MailsTableProps {
    mails: Mail[];
    onDelete: (id: string) => void;
    onMarkAsRead: (id: string, isRead: boolean) => void;
}

export default function MailsTable({ mails, onDelete, onMarkAsRead }: MailsTableProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [sortField, setSortField] = useState<'createdAt' | 'name' | 'isRead'>('createdAt');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc'); // Varsayılan olarak en yeniler önce
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
    const [filteredMails, setFilteredMails] = useState<Mail[]>([]);

    // Sayfalama değişkenleri
    const [currentPage, setCurrentPage] = useState(1);
    const mailsPerPage = 10;
    const [paginatedMails, setPaginatedMails] = useState<Mail[]>([]);
    const [totalPages, setTotalPages] = useState(1);

    // Mailleri filtrele ve sırala
    useEffect(() => {
        let result = [...mails];

        // Arama filtresini uygula
        if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            result = result.filter(
                mail =>
                    mail.name.toLowerCase().includes(searchLower) ||
                    mail.email.toLowerCase().includes(searchLower) ||
                    mail.message.toLowerCase().includes(searchLower) ||
                    (mail.subject && mail.subject.toLowerCase().includes(searchLower))
            );
        }

        // Sıralama uygula
        result.sort((a, b) => {
            if (sortField === 'name') {
                const nameA = a.name.toLowerCase();
                const nameB = b.name.toLowerCase();
                return sortDirection === 'asc'
                    ? nameA.localeCompare(nameB)
                    : nameB.localeCompare(nameA);
            } else if (sortField === 'isRead') {
                // İlk okunmamış e-postaları göster
                if (sortDirection === 'asc') {
                    // True değerler önce (okunmuşlar önce)
                    return a.isRead === b.isRead ? 0 : a.isRead ? -1 : 1;
                } else {
                    // False değerler önce (okunmamışlar önce)
                    return a.isRead === b.isRead ? 0 : a.isRead ? 1 : -1;
                }
            } else {
                // createdAt'e göre sırala
                const dateA = new Date(a.createdAt).getTime();
                const dateB = new Date(b.createdAt).getTime();
                return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
            }
        });

        setFilteredMails(result);
        // Sayfa değiştiğinde, sayfa 1'e dön
        setCurrentPage(1);
        // Toplam sayfa sayısını hesapla
        setTotalPages(Math.ceil(result.length / mailsPerPage));
    }, [mails, searchTerm, sortField, sortDirection]);

    // Sayfalama işlemleri
    useEffect(() => {
        const startIndex = (currentPage - 1) * mailsPerPage;
        const endIndex = startIndex + mailsPerPage;
        setPaginatedMails(filteredMails.slice(startIndex, endIndex));
    }, [filteredMails, currentPage]);

    // Sıralama değiştir
    const toggleSort = (field: 'createdAt' | 'name' | 'isRead') => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('desc');
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
        });
    };

    // E-posta içeriğini kısalt
    const truncateText = (text: string, maxLength: number = 100) => {
        if (text.length <= maxLength) return text;
        return text.slice(0, maxLength) + '...';
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

    // Modern toast bildirimi
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
        <div className="overflow-hidden bg-gray-800 rounded-lg">
            {/* Arama ve Filtre */}
            <div className="p-4 border-b border-gray-700">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="relative flex items-center">
                        <FaSearch className="absolute left-3 text-gray-500" />
                        <input
                            type="text"
                            placeholder="İsim, e-posta veya içerikte ara..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 w-full bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => toggleSort('isRead')}
                            className={`px-3 py-2 flex items-center text-sm rounded-md ${
                                sortField === 'isRead'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            }`}
                        >
                            <span className="mr-2">Okunma Durumu</span>
                            {sortField === 'isRead' &&
                                (sortDirection === 'asc' ? (
                                    <FaSortAmountUp />
                                ) : (
                                    <FaSortAmountDown />
                                ))}
                        </button>
                        <button
                            onClick={() => toggleSort('createdAt')}
                            className={`px-3 py-2 flex items-center text-sm rounded-md ${
                                sortField === 'createdAt'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            }`}
                        >
                            <span className="mr-2">Tarih</span>
                            {sortField === 'createdAt' &&
                                (sortDirection === 'asc' ? (
                                    <FaSortAmountUp />
                                ) : (
                                    <FaSortAmountDown />
                                ))}
                        </button>
                    </div>
                </div>
            </div>

            {/* Tablo */}
            <div className="overflow-x-auto">
                <table className="min-w-full border-collapse">
                    <thead>
                        <tr className="bg-gray-700 text-left">
                            <th className="p-4 text-xs font-medium text-gray-400 uppercase tracking-wider">
                                Durum
                            </th>
                            <th className="p-4 text-xs font-medium text-gray-400 uppercase tracking-wider">
                                <button
                                    onClick={() => toggleSort('name')}
                                    className="flex items-center text-left focus:outline-none"
                                >
                                    <span>Gönderen</span>
                                    {sortField === 'name' && (
                                        <span className="ml-1">
                                            {sortDirection === 'asc' ? (
                                                <FaSortAmountUp />
                                            ) : (
                                                <FaSortAmountDown />
                                            )}
                                        </span>
                                    )}
                                </button>
                            </th>
                            <th className="p-4 text-xs font-medium text-gray-400 uppercase tracking-wider">
                                Mesaj
                            </th>
                            <th className="p-4 text-xs font-medium text-gray-400 uppercase tracking-wider">
                                <button
                                    onClick={() => toggleSort('createdAt')}
                                    className="flex items-center text-left focus:outline-none"
                                >
                                    <span>Tarih</span>
                                    {sortField === 'createdAt' && (
                                        <span className="ml-1">
                                            {sortDirection === 'asc' ? (
                                                <FaSortAmountUp />
                                            ) : (
                                                <FaSortAmountDown />
                                            )}
                                        </span>
                                    )}
                                </button>
                            </th>
                            <th className="p-4 text-xs font-medium text-gray-400 uppercase tracking-wider">
                                İşlemler
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                        {paginatedMails.length > 0 ? (
                            paginatedMails.map(mail => (
                                <tr
                                    key={mail.id}
                                    className={`${
                                        mail.isRead ? 'bg-gray-800' : 'bg-gray-750'
                                    } hover:bg-gray-700 transition-colors`}
                                >
                                    <td className="p-4 whitespace-nowrap">
                                        <button
                                            onClick={() => onMarkAsRead(mail.id, !mail.isRead)}
                                            className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors"
                                            title={
                                                mail.isRead
                                                    ? 'Okunmadı olarak işaretle'
                                                    : 'Okundu olarak işaretle'
                                            }
                                        >
                                            {mail.isRead ? (
                                                <FaEnvelopeOpen className="text-green-400" />
                                            ) : (
                                                <FaEnvelope className="text-yellow-400" />
                                            )}
                                        </button>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex flex-col">
                                            <span
                                                className={`text-sm font-medium ${
                                                    !mail.isRead ? 'text-white' : 'text-gray-300'
                                                }`}
                                            >
                                                {mail.name}
                                            </span>
                                            <span className="text-xs text-gray-400">
                                                {mail.email}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <p className="text-sm text-gray-300">
                                            {mail.subject ? (
                                                <span className="font-medium">
                                                    {mail.subject}:{' '}
                                                </span>
                                            ) : null}
                                            {truncateText(mail.message)}
                                        </p>
                                    </td>
                                    <td className="p-4 whitespace-nowrap text-sm text-gray-300">
                                        {formatDate(mail.createdAt)}
                                    </td>
                                    <td className="p-4 whitespace-nowrap">
                                        <div className="flex space-x-2">
                                            <Link
                                                href={`/admin/mailler/detay/${mail.id}`}
                                                className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-700 transition-colors"
                                                title="Görüntüle"
                                            >
                                                <FaEye className="text-white" />
                                            </Link>
                                            <button
                                                onClick={() => toggleDeleteConfirm(mail.id)}
                                                className="flex items-center justify-center w-8 h-8 rounded-full bg-red-600 hover:bg-red-700 transition-colors"
                                                title="Sil"
                                            >
                                                <FaTrash className="text-white" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={5} className="p-4 text-center text-gray-400">
                                    {searchTerm
                                        ? 'Arama kriterlerine uygun mail bulunamadı.'
                                        : 'Henüz hiç mail yok.'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Sayfalama */}
            {totalPages > 1 && (
                <div className="flex justify-between items-center p-4 border-t border-gray-700">
                    <div className="text-sm text-gray-400">
                        Toplam <span className="font-medium">{filteredMails.length}</span> mail
                    </div>
                    <div className="flex space-x-1">
                        <button
                            onClick={() => changePage(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="flex items-center justify-center w-8 h-8 rounded-md bg-gray-700 text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600"
                        >
                            <FaChevronLeft className="text-sm" />
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                            <button
                                key={page}
                                onClick={() => changePage(page)}
                                className={`flex items-center justify-center w-8 h-8 rounded-md text-sm ${
                                    currentPage === page
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                }`}
                            >
                                {page}
                            </button>
                        ))}
                        <button
                            onClick={() => changePage(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="flex items-center justify-center w-8 h-8 rounded-md bg-gray-700 text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600"
                        >
                            <FaChevronRight className="text-sm" />
                        </button>
                    </div>
                </div>
            )}

            {/* Silme Onay Modalı */}
            {deleteConfirmId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="w-96 p-6 bg-gray-800 rounded-lg shadow-xl">
                        <div className="flex items-center mb-4 text-yellow-500">
                            <FaExclamationTriangle className="mr-2 text-xl" />
                            <h3 className="text-lg font-medium text-white">Maili Sil</h3>
                        </div>
                        <p className="mb-6 text-gray-300">
                            Bu maili silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
                        </p>
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => toggleDeleteConfirm(null)}
                                className="px-4 py-2 text-sm text-gray-300 bg-gray-700 rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400"
                            >
                                İptal
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="px-4 py-2 text-sm text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400"
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
