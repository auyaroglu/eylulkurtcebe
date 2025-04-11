'use client';

import { ContentSectionProps } from './types';
import { useState } from 'react';

export default function SkillsSection({
    content,
    setContent,
    handleContentChange,
}: ContentSectionProps) {
    if (!handleContentChange) return null;

    const [activeCategory, setActiveCategory] = useState<string | null>('frontend');

    // Kategori renkleri
    const categoryColors = {
        frontend: 'border-blue-500 bg-blue-500/10',
        backend: 'border-green-500 bg-green-500/10',
        database: 'border-purple-500 bg-purple-500/10',
    };

    const categories = [
        { id: 'frontend', label: 'Seramik Teknikleri', icon: '🏺' },
        { id: 'backend', label: 'Malzeme Bilgisi', icon: '🧱' },
        { id: 'database', label: 'Tasarım', icon: '🎨' },
    ];

    // Yetenek ekle fonksiyonu
    const addSkill = (categoryId: string) => {
        const updatedContent = { ...content };
        if (!updatedContent.skills.categories[categoryId].skills) {
            updatedContent.skills.categories[categoryId].skills = [];
        }
        updatedContent.skills.categories[categoryId].skills.push({
            name: '',
            level: 80,
        });
        setContent(updatedContent);
    };

    // Yetenek sil fonksiyonu
    const removeSkill = (categoryId: string, index: number) => {
        const updatedContent = { ...content };
        updatedContent.skills.categories[categoryId].skills.splice(index, 1);
        setContent(updatedContent);
    };

    // Yetenek güncelleme fonksiyonu
    const updateSkill = (categoryId: string, index: number, field: string, value: any) => {
        const updatedContent = { ...content };
        updatedContent.skills.categories[categoryId].skills[index][field] =
            field === 'level' ? Number(value) : value;
        setContent(updatedContent);
    };

    // Kategori başlığını güncelleme fonksiyonu
    const updateCategoryTitle = (categoryId: string, value: string) => {
        const updatedContent = { ...content };
        if (!updatedContent.skills.categories[categoryId]) {
            updatedContent.skills.categories[categoryId] = {
                title: value,
                skills: [],
            };
        } else {
            updatedContent.skills.categories[categoryId].title = value;
        }
        setContent(updatedContent);
    };

    return (
        <div className="space-y-6">
            {/* Başlık ve açıklama */}
            <div className="mb-6 space-y-4">
                <div>
                    <label className="block mb-2 text-sm font-medium text-gray-400">Başlık</label>
                    <input
                        type="text"
                        value={content.skills?.title || ''}
                        onChange={e => handleContentChange('skills', 'title', e.target.value)}
                        className="w-full px-4 py-2 text-white bg-gray-700 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div>
                    <label className="block mb-2 text-sm font-medium text-gray-400">Açıklama</label>
                    <textarea
                        value={content.skills?.description || ''}
                        onChange={e => handleContentChange('skills', 'description', e.target.value)}
                        rows={3}
                        className="w-full px-4 py-2 text-white bg-gray-700 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    ></textarea>
                </div>
            </div>

            {/* Kategori sekmeleri */}
            <div className="flex flex-wrap gap-2 mb-4">
                {categories.map(category => (
                    <button
                        key={category.id}
                        onClick={() => setActiveCategory(category.id)}
                        className={`px-4 py-2 rounded-md border text-sm font-medium transition-all
                            ${
                                activeCategory === category.id
                                    ? `${
                                          categoryColors[category.id as keyof typeof categoryColors]
                                      } border-opacity-70 text-white`
                                    : 'border-gray-600 bg-gray-700 text-gray-300 hover:bg-gray-650'
                            }`}
                    >
                        <span className="mr-2">{category.icon}</span>
                        {category.label}
                    </button>
                ))}
            </div>

            {/* Aktif kategori içeriği */}
            {categories.map(category => (
                <div
                    key={category.id}
                    className={`${activeCategory === category.id ? 'block' : 'hidden'}`}
                >
                    <div
                        className={`p-5 rounded-md border-l-4 ${
                            categoryColors[category.id as keyof typeof categoryColors]
                        } bg-gray-800`}
                    >
                        <div className="flex items-center mb-4">
                            <span className="text-xl mr-2">{category.icon}</span>
                            <h4 className="text-lg font-medium text-white">{category.label}</h4>
                        </div>

                        <div className="mb-3">
                            <label className="block mb-2 text-sm font-medium text-gray-400">
                                Kategori Başlığı
                            </label>
                            <input
                                type="text"
                                value={content.skills?.categories?.[category.id]?.title || ''}
                                onChange={e => updateCategoryTitle(category.id, e.target.value)}
                                className="w-full px-4 py-2 text-white bg-gray-700 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div className="mb-3">
                            <div className="flex justify-between items-center mb-2">
                                <h5 className="text-md font-medium text-gray-300">Yetenekler</h5>
                                <span className="text-sm text-gray-400">
                                    {content.skills?.categories?.[category.id]?.skills?.length || 0}{' '}
                                    yetenek
                                </span>
                            </div>

                            <div className="space-y-3 max-h-[320px] overflow-y-auto pr-2 custom-scrollbar">
                                {(content.skills?.categories?.[category.id]?.skills || []).map(
                                    (skill: any, index: number) => (
                                        <div
                                            key={`${category.id}-skill-${index}`}
                                            className="bg-gray-750 p-4 rounded-md border border-gray-700 hover:border-gray-600 transition-all"
                                        >
                                            <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
                                                <div className="md:col-span-5">
                                                    <label className="block mb-2 text-sm font-medium text-gray-400">
                                                        Yetenek Adı
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={skill.name || ''}
                                                        onChange={e =>
                                                            updateSkill(
                                                                category.id,
                                                                index,
                                                                'name',
                                                                e.target.value
                                                            )
                                                        }
                                                        className="w-full px-4 py-2 text-white bg-gray-700 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    />
                                                </div>
                                                <div className="md:col-span-5">
                                                    <label className="block mb-2 text-sm font-medium text-gray-400">
                                                        Seviye: {skill.level}%
                                                    </label>
                                                    <div className="flex items-center space-x-2">
                                                        <input
                                                            type="range"
                                                            min="0"
                                                            max="100"
                                                            value={skill.level || 0}
                                                            onChange={e =>
                                                                updateSkill(
                                                                    category.id,
                                                                    index,
                                                                    'level',
                                                                    e.target.value
                                                                )
                                                            }
                                                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                                                        />
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            max="100"
                                                            value={skill.level || 0}
                                                            onChange={e =>
                                                                updateSkill(
                                                                    category.id,
                                                                    index,
                                                                    'level',
                                                                    e.target.value
                                                                )
                                                            }
                                                            className="w-16 px-2 py-1 text-white bg-gray-700 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="flex items-end md:col-span-2">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            removeSkill(category.id, index)
                                                        }
                                                        className="px-3 py-2 w-full text-sm text-red-400 bg-red-400/10 border border-red-400/30 rounded hover:bg-red-400/20 transition-colors"
                                                    >
                                                        <span className="flex items-center justify-center">
                                                            <svg
                                                                xmlns="http://www.w3.org/2000/svg"
                                                                className="h-4 w-4"
                                                                fill="none"
                                                                viewBox="0 0 24 24"
                                                                stroke="currentColor"
                                                            >
                                                                <path
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                    strokeWidth={2}
                                                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                                                />
                                                            </svg>
                                                        </span>
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Seviye göstergesi */}
                                            <div className="mt-3 bg-gray-700 w-full h-1.5 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full ${
                                                        category.id === 'frontend'
                                                            ? 'bg-blue-500'
                                                            : category.id === 'backend'
                                                            ? 'bg-green-500'
                                                            : 'bg-purple-500'
                                                    }`}
                                                    style={{ width: `${skill.level || 0}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    )
                                )}

                                {content.skills?.categories?.[category.id]?.skills?.length ===
                                    0 && (
                                    <div className="flex flex-col items-center justify-center p-6 text-gray-500 border border-dashed border-gray-700 rounded-md">
                                        <p className="mb-2">
                                            Bu kategoride henüz yetenek bulunmuyor
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => addSkill(category.id)}
                            className="mt-4 flex items-center justify-center w-full px-4 py-3 text-sm text-white bg-gray-700 rounded-md border border-gray-600 hover:bg-gray-650 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4 mr-2"
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
                            Yeni Yetenek Ekle
                        </button>
                    </div>
                </div>
            ))}

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 8px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: rgba(31, 41, 55, 0.5);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(75, 85, 99, 0.8);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(107, 114, 128, 0.8);
                }
                input[type='range']::-webkit-slider-thumb {
                    appearance: none;
                    width: 16px;
                    height: 16px;
                    border-radius: 50%;
                    background: #3b82f6;
                    cursor: pointer;
                }
            `}</style>
        </div>
    );
}
