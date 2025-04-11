'use client';

import { useState, useCallback } from 'react';
import { FaSortAmountDown, FaSortAmountUp, FaSave, FaBars } from 'react-icons/fa';
import { ContentSectionProps } from './types';
import { toast, ToastOptions } from 'react-toastify';

export default function NavigationSection({ content, setContent }: ContentSectionProps) {
    const [draggedLinkIndex, setDraggedLinkIndex] = useState<number | null>(null);
    const [linksChanged, setLinksChanged] = useState(false);
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

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

    // Sıralama düzenini değiştir
    const toggleSortDirection = () => {
        setSortDirection(prev => {
            const newDirection = prev === 'asc' ? 'desc' : 'asc';

            // Bağlantıları sırala
            const sortedLinks = [...content.nav.links].sort((a, b) => {
                if (newDirection === 'asc') {
                    return a.order - b.order;
                } else {
                    return b.order - a.order;
                }
            });

            // Bağlantıları güncelle
            setContent({
                ...content,
                nav: {
                    ...content.nav,
                    links: sortedLinks,
                },
            });

            return newDirection;
        });
    };

    // Sürükleme başlangıcı
    const handleDragStart = (index: number) => {
        setDraggedLinkIndex(index);
    };

    // Sürükleme hedefine gelindiğinde
    const handleDragEnter = (index: number) => {
        if (draggedLinkIndex === null || draggedLinkIndex === index) return;

        // Mevcut bağlantılar
        const updatedLinks = [...content.nav.links];
        const draggedLink = updatedLinks[draggedLinkIndex];

        // Bağlantıyı taşı
        updatedLinks.splice(draggedLinkIndex, 1);
        updatedLinks.splice(index, 0, draggedLink);

        // Yeni order değerlerini ata
        updatedLinks.forEach((link, idx) => {
            link.order = idx;
        });

        // Bağlantıları güncelle
        setContent({
            ...content,
            nav: {
                ...content.nav,
                links: updatedLinks,
            },
        });

        setDraggedLinkIndex(index);
        setLinksChanged(true);
    };

    // Sürükleme bittiğinde
    const handleDragEnd = () => {
        setDraggedLinkIndex(null);
    };

    // Değişiklikleri kaydet
    const saveOrderChanges = useCallback(() => {
        // Burada başka bir API çağrısı yapılması gerekmiyor çünkü
        // içerik zaten ana içerik yönetimi sayfasındaki handleSave fonksiyonu ile kaydedilecek
        showModernToast(
            'success',
            'Yeni sıralama kaydedilecek. Lütfen sayfanın altındaki Kaydet butonuna tıklayın.'
        );
        setLinksChanged(false);
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-4">
                <h4 className="text-lg font-medium text-white">Navigasyon Bağlantıları</h4>

                <div className="flex space-x-2">
                    {/* Sıralama değiştirme butonu */}
                    <button
                        type="button"
                        onClick={toggleSortDirection}
                        className="flex items-center px-3 py-1 text-sm text-white bg-gray-700 rounded hover:bg-gray-600"
                        title={sortDirection === 'asc' ? 'Artan sırada' : 'Azalan sırada'}
                    >
                        {sortDirection === 'asc' ? (
                            <FaSortAmountUp className="mr-1" />
                        ) : (
                            <FaSortAmountDown className="mr-1" />
                        )}
                        Sırala
                    </button>

                    {/* Değişiklikleri kaydet butonu */}
                    {linksChanged && (
                        <button
                            type="button"
                            onClick={saveOrderChanges}
                            className="flex items-center px-3 py-1 text-sm text-white bg-green-600 rounded hover:bg-green-700"
                        >
                            <FaSave className="mr-1" />
                            Sıralamayı Kaydet
                        </button>
                    )}
                </div>
            </div>

            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                {content.nav?.links?.map((link: any, index: number) => (
                    <div
                        key={index}
                        draggable
                        onDragStart={() => handleDragStart(index)}
                        onDragEnter={() => handleDragEnter(index)}
                        onDragOver={e => e.preventDefault()}
                        onDragEnd={handleDragEnd}
                        className={`grid grid-cols-1 gap-4 p-4 rounded-lg border ${
                            draggedLinkIndex === index
                                ? 'border-blue-500 bg-blue-900/20'
                                : 'border-gray-700'
                        } md:grid-cols-[auto,1fr,1fr,auto] cursor-move transition-colors duration-200`}
                    >
                        <div className="flex justify-center items-center text-gray-400">
                            <FaBars className="text-lg" />
                            <span className="ml-2 text-sm">{link.order}</span>
                        </div>

                        <div>
                            <label className="block mb-2 text-sm font-medium text-gray-400">
                                Etiket
                            </label>
                            <input
                                type="text"
                                value={link.label}
                                onChange={e => {
                                    const updatedLinks = [...content.nav.links];
                                    updatedLinks[index].label = e.target.value;
                                    setContent({
                                        ...content,
                                        nav: {
                                            ...content.nav,
                                            links: updatedLinks,
                                        },
                                    });
                                }}
                                className="w-full px-4 py-2 text-white bg-gray-700 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block mb-2 text-sm font-medium text-gray-400">
                                Bağlantı URL
                            </label>
                            <input
                                type="text"
                                value={link.url}
                                onChange={e => {
                                    const updatedLinks = [...content.nav.links];
                                    updatedLinks[index].url = e.target.value;
                                    setContent({
                                        ...content,
                                        nav: {
                                            ...content.nav,
                                            links: updatedLinks,
                                        },
                                    });
                                }}
                                className="w-full px-4 py-2 text-white bg-gray-700 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Örn: /#hero, /projeler, https://example.com"
                            />
                        </div>

                        <div className="flex justify-end items-center">
                            <button
                                type="button"
                                onClick={() => {
                                    const updatedLinks = content.nav.links.filter(
                                        (_: any, i: number) => i !== index
                                    );

                                    // Kalan bağlantıları yeniden sırala
                                    updatedLinks.forEach((link, idx) => {
                                        link.order = idx;
                                    });

                                    setContent({
                                        ...content,
                                        nav: {
                                            ...content.nav,
                                            links: updatedLinks,
                                        },
                                    });
                                    setLinksChanged(true);
                                }}
                                className="px-3 py-1 text-sm text-red-400 bg-gray-800 rounded focus:outline-none hover:bg-gray-700"
                            >
                                Sil
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex justify-end">
                <button
                    type="button"
                    onClick={() => {
                        // Mevcut bağlantılar
                        const currentLinks = [...(content.nav?.links || [])];
                        // Yeni bağlantı, order değeri en son elemanın order değeri + 1 olacak
                        const newOrder =
                            currentLinks.length > 0
                                ? Math.max(...currentLinks.map(link => link.order)) + 1
                                : 0;

                        const newLinks = [
                            ...currentLinks,
                            {
                                label: '',
                                url: '',
                                order: newOrder,
                            },
                        ];

                        setContent({
                            ...content,
                            nav: {
                                ...content.nav,
                                links: newLinks,
                            },
                        });
                        setLinksChanged(true);
                    }}
                    className="px-4 py-2 text-sm text-white bg-blue-600 rounded focus:outline-none hover:bg-blue-700"
                >
                    Yeni Bağlantı Ekle
                </button>
            </div>
        </div>
    );
}
