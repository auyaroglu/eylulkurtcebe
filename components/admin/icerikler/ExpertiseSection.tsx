'use client';

import { ContentSectionProps } from './types';
import IconSelector from './IconSelector';

export default function ExpertiseSection({
    content,
    setContent,
    handleContentChange,
}: ContentSectionProps) {
    if (!handleContentChange || !content?.expertise) return null;

    return (
        <div className="max-h-[500px] overflow-y-auto pr-2">
            <div className="grid grid-cols-1 gap-4 mb-4 md:grid-cols-2">
                <div>
                    <label htmlFor="expertise-title" className="block mb-1 text-sm font-medium">
                        Başlık
                    </label>
                    <input
                        id="expertise-title"
                        type="text"
                        className="w-full px-4 py-2 text-sm bg-gray-800 rounded-md border-gray-700 focus:border-blue-500 focus:ring-blue-500"
                        value={content.expertise.title || ''}
                        onChange={e => handleContentChange('expertise', 'title', e.target.value)}
                    />
                </div>
                <div>
                    <label
                        htmlFor="expertise-description"
                        className="block mb-1 text-sm font-medium"
                    >
                        Açıklama
                    </label>
                    <input
                        id="expertise-description"
                        type="text"
                        className="w-full px-4 py-2 text-sm bg-gray-800 rounded-md border-gray-700 focus:border-blue-500 focus:ring-blue-500"
                        value={content.expertise.description || ''}
                        onChange={e =>
                            handleContentChange('expertise', 'description', e.target.value)
                        }
                    />
                </div>
            </div>

            <h3 className="mt-6 mb-3 text-lg font-medium">Uzmanlık Kategorileri</h3>
            {(content.expertise.categories || []).map((category: any, index: number) => (
                <div key={index} className="p-4 mb-6 bg-gray-800 rounded-lg border border-gray-700">
                    <div className="grid grid-cols-1 gap-4 mb-4 md:grid-cols-2">
                        <div>
                            <label
                                htmlFor={`expertise-category-${index}-title`}
                                className="block mb-1 text-sm font-medium"
                            >
                                Kategori Başlığı
                            </label>
                            <input
                                id={`expertise-category-${index}-title`}
                                type="text"
                                className="w-full px-4 py-2 text-sm bg-gray-700 rounded-md border-gray-700 focus:border-blue-500 focus:ring-blue-500"
                                value={category.title || ''}
                                onChange={e => {
                                    const updatedCategories = [...content.expertise.categories];
                                    updatedCategories[index] = {
                                        ...updatedCategories[index],
                                        title: e.target.value,
                                    };
                                    setContent({
                                        ...content,
                                        expertise: {
                                            ...content.expertise,
                                            categories: updatedCategories,
                                        },
                                    });
                                }}
                            />
                        </div>
                        <div>
                            <label
                                htmlFor={`expertise-category-${index}-icon`}
                                className="block mb-1 text-sm font-medium"
                            >
                                İkon Seçimi
                            </label>
                            <IconSelector
                                value={category.icon || 'flask'}
                                onChange={icon => {
                                    const updatedCategories = [...content.expertise.categories];
                                    updatedCategories[index] = {
                                        ...updatedCategories[index],
                                        icon,
                                    };
                                    setContent({
                                        ...content,
                                        expertise: {
                                            ...content.expertise,
                                            categories: updatedCategories,
                                        },
                                    });
                                }}
                            />
                        </div>
                    </div>
                    <div>
                        <label
                            htmlFor={`expertise-category-${index}-description`}
                            className="block mb-1 text-sm font-medium"
                        >
                            Açıklama
                        </label>
                        <textarea
                            id={`expertise-category-${index}-description`}
                            rows={3}
                            className="w-full px-4 py-2 text-sm bg-gray-700 rounded-md border-gray-700 focus:border-blue-500 focus:ring-blue-500"
                            value={category.description || ''}
                            onChange={e => {
                                const updatedCategories = [...content.expertise.categories];
                                updatedCategories[index] = {
                                    ...updatedCategories[index],
                                    description: e.target.value,
                                };
                                setContent({
                                    ...content,
                                    expertise: {
                                        ...content.expertise,
                                        categories: updatedCategories,
                                    },
                                });
                            }}
                        />
                    </div>
                    <button
                        type="button"
                        className="px-3 py-1 mt-3 text-xs bg-red-700 rounded hover:bg-red-600"
                        onClick={() => {
                            const updatedCategories = [...content.expertise.categories];
                            updatedCategories.splice(index, 1);
                            setContent({
                                ...content,
                                expertise: {
                                    ...content.expertise,
                                    categories: updatedCategories,
                                },
                            });
                        }}
                    >
                        Kategoriyi Sil
                    </button>
                </div>
            ))}
            <button
                type="button"
                className="px-4 py-2 mb-4 text-sm bg-blue-700 rounded hover:bg-blue-600"
                onClick={() => {
                    const categories = content.expertise.categories || [];
                    setContent({
                        ...content,
                        expertise: {
                            ...content.expertise,
                            categories: [
                                ...categories,
                                {
                                    title: '',
                                    description: '',
                                    icon: 'flask',
                                },
                            ],
                        },
                    });
                }}
            >
                Yeni Kategori Ekle
            </button>
        </div>
    );
}
