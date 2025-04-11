'use client';

import { ContentSectionProps } from './types';

export default function NavigationSection({ content, setContent }: ContentSectionProps) {
    return (
        <div className="space-y-6">
            <h4 className="mb-4 text-lg font-medium text-white">Navigasyon Bağlantıları</h4>

            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                {content.nav?.links?.map((link: any, index: number) => (
                    <div
                        key={index}
                        className="grid grid-cols-1 gap-4 p-4 rounded-lg border border-gray-700 md:grid-cols-2"
                    >
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
                        <div className="flex justify-end md:col-span-2">
                            <button
                                type="button"
                                onClick={() => {
                                    const updatedLinks = content.nav.links.filter(
                                        (_: any, i: number) => i !== index
                                    );
                                    setContent({
                                        ...content,
                                        nav: {
                                            ...content.nav,
                                            links: updatedLinks,
                                        },
                                    });
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
                        const newLinks = [...(content.nav?.links || []), { label: '', url: '' }];
                        setContent({
                            ...content,
                            nav: {
                                ...content.nav,
                                links: newLinks,
                            },
                        });
                    }}
                    className="px-4 py-2 text-sm text-white bg-blue-600 rounded focus:outline-none hover:bg-blue-700"
                >
                    Yeni Bağlantı Ekle
                </button>
            </div>
        </div>
    );
}
