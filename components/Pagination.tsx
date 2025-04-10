'use client';

import { useTranslations } from 'next-intl';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

export default function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
    const t = useTranslations('projects.pagination');

    // Sayfa sayısı 1'e eşit veya daha küçükse pagination gösterme
    if (totalPages <= 1) return null;

    // Gösterilecek sayfa linklerini hazırla
    const getPageNumbers = () => {
        const pageNumbers = [];
        const maxPagesToShow = 5; // Gösterilecek maksimum sayfa numarası

        if (totalPages <= maxPagesToShow) {
            // Toplam sayfa sayısı az ise hepsini göster
            for (let i = 1; i <= totalPages; i++) {
                pageNumbers.push(i);
            }
        } else {
            // Toplam sayfa sayısı fazla ise akıllı bir şekilde göster
            if (currentPage <= 3) {
                // Başlangıçta 1, 2, 3, ..., son
                for (let i = 1; i <= 4; i++) {
                    pageNumbers.push(i);
                }
                pageNumbers.push('ellipsis');
                pageNumbers.push(totalPages);
            } else if (currentPage >= totalPages - 2) {
                // Sonda 1, ..., son-2, son-1, son
                pageNumbers.push(1);
                pageNumbers.push('ellipsis');
                for (let i = totalPages - 3; i <= totalPages; i++) {
                    pageNumbers.push(i);
                }
            } else {
                // Ortada 1, ..., current-1, current, current+1, ..., son
                pageNumbers.push(1);
                pageNumbers.push('ellipsis');
                for (let i = currentPage - 1; i <= currentPage + 1; i++) {
                    pageNumbers.push(i);
                }
                pageNumbers.push('ellipsis');
                pageNumbers.push(totalPages);
            }
        }

        return pageNumbers;
    };

    const pageNumbers = getPageNumbers();

    return (
        <div className="flex items-center justify-center space-x-1 sm:space-x-2 mt-12">
            {/* Önceki Sayfaya Git */}
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`px-3 py-2 rounded text-sm sm:text-base transition-colors ${
                    currentPage === 1
                        ? 'opacity-50 cursor-not-allowed bg-gray-700/20'
                        : 'hover:bg-indigo-600 bg-indigo-500/20'
                }`}
                aria-label={t('previous')}
            >
                <svg
                    className="w-4 h-4 sm:w-5 sm:h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 19l-7-7 7-7"
                    />
                </svg>
            </button>

            {/* Sayfa Numaraları */}
            {pageNumbers.map((pageNumber, index) =>
                pageNumber === 'ellipsis' ? (
                    <span key={`ellipsis-${index}`} className="px-3 py-2">
                        ...
                    </span>
                ) : (
                    <button
                        key={`page-${pageNumber}`}
                        onClick={() => typeof pageNumber === 'number' && onPageChange(pageNumber)}
                        className={`px-3 py-2 rounded text-sm sm:text-base transition-colors ${
                            pageNumber === currentPage
                                ? 'bg-indigo-600 text-white'
                                : 'hover:bg-indigo-600/40 hover:text-white bg-white/5'
                        }`}
                    >
                        {pageNumber}
                    </button>
                )
            )}

            {/* Sonraki Sayfaya Git */}
            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`px-3 py-2 rounded text-sm sm:text-base transition-colors ${
                    currentPage === totalPages
                        ? 'opacity-50 cursor-not-allowed bg-gray-700/20'
                        : 'hover:bg-indigo-600 bg-indigo-500/20'
                }`}
                aria-label={t('next')}
            >
                <svg
                    className="w-4 h-4 sm:w-5 sm:h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                    />
                </svg>
            </button>

            {/* Sayfa Bilgisi */}
            <div className="ml-2 text-xs text-gray-400 sm:text-sm">
                {t('page')} {currentPage} {t('of')} {totalPages}
            </div>
        </div>
    );
}
