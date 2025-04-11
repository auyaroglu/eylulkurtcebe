'use client';

import { ContentSectionProps } from './types';

export default function AboutSection({ content, handleContentChange }: ContentSectionProps) {
    if (!handleContentChange) return null;

    return (
        <div className="space-y-5 max-h-[500px] overflow-y-auto pr-2">
            <div className="grid grid-cols-1 gap-6">
                <div>
                    <label className="block mb-2 text-sm font-medium text-gray-400">Başlık</label>
                    <input
                        type="text"
                        value={content.about.title}
                        onChange={e => handleContentChange('about', 'title', e.target.value)}
                        className="w-full px-4 py-2 text-white bg-gray-700 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div>
                    <label className="block mb-2 text-sm font-medium text-gray-400">Açıklama</label>
                    <textarea
                        value={content.about.description}
                        onChange={e => handleContentChange('about', 'description', e.target.value)}
                        rows={5}
                        className="w-full px-4 py-2 text-white bg-gray-700 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    ></textarea>
                </div>
            </div>

            <div className="p-5 bg-gray-800 rounded-md">
                <h4 className="mb-4 text-lg font-medium text-white">Deneyim</h4>
                <div className="grid grid-cols-1 gap-4">
                    <div>
                        <label className="block mb-2 text-sm font-medium text-gray-400">
                            Başlık
                        </label>
                        <input
                            type="text"
                            value={content.about.experience.title}
                            onChange={e =>
                                handleContentChange('about', 'experience.title', e.target.value)
                            }
                            className="w-full px-4 py-2 text-white bg-gray-700 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block mb-2 text-sm font-medium text-gray-400">
                            Açıklama
                        </label>
                        <textarea
                            value={content.about.experience.description}
                            onChange={e =>
                                handleContentChange(
                                    'about',
                                    'experience.description',
                                    e.target.value
                                )
                            }
                            rows={4}
                            className="w-full px-4 py-2 text-white bg-gray-700 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        ></textarea>
                    </div>
                </div>
            </div>

            <div className="p-5 bg-gray-800 rounded-md">
                <h4 className="mb-4 text-lg font-medium text-white">Eğitim</h4>
                <div className="grid grid-cols-1 gap-4">
                    <div>
                        <label className="block mb-2 text-sm font-medium text-gray-400">
                            Başlık
                        </label>
                        <input
                            type="text"
                            value={content.about.education.title}
                            onChange={e =>
                                handleContentChange('about', 'education.title', e.target.value)
                            }
                            className="w-full px-4 py-2 text-white bg-gray-700 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block mb-2 text-sm font-medium text-gray-400">
                            Açıklama
                        </label>
                        <textarea
                            value={content.about.education.description}
                            onChange={e =>
                                handleContentChange(
                                    'about',
                                    'education.description',
                                    e.target.value
                                )
                            }
                            rows={4}
                            className="w-full px-4 py-2 text-white bg-gray-700 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        ></textarea>
                    </div>
                </div>
            </div>
        </div>
    );
}
