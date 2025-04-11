'use client';

import { ContentSectionProps } from './types';

export default function ContactSection({
    content,
    setContent,
    handleContentChange,
}: ContentSectionProps) {
    if (!handleContentChange) return null;

    return (
        <div className="space-y-5 max-h-[500px] overflow-y-auto pr-2">
            <div className="grid grid-cols-1 gap-6">
                <div>
                    <label className="block mb-2 text-sm font-medium text-gray-400">Başlık</label>
                    <input
                        type="text"
                        value={content.contact?.title || ''}
                        onChange={e => handleContentChange('contact', 'title', e.target.value)}
                        className="w-full px-4 py-2 text-white bg-gray-700 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div>
                    <label className="block mb-2 text-sm font-medium text-gray-400">Açıklama</label>
                    <textarea
                        value={content.contact?.description || ''}
                        onChange={e =>
                            handleContentChange('contact', 'description', e.target.value)
                        }
                        rows={3}
                        className="w-full px-4 py-2 text-white bg-gray-700 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    ></textarea>
                </div>
            </div>
            <div className="p-5 bg-gray-800 rounded-md">
                <h4 className="mb-4 text-lg font-medium text-white">İletişim Bilgileri</h4>
                <div className="grid grid-cols-1 gap-4">
                    <div>
                        <label className="block mb-2 text-sm font-medium text-gray-400">
                            Başlık
                        </label>
                        <input
                            type="text"
                            value={content.contact?.info?.title || ''}
                            onChange={e => {
                                const updatedContent = { ...content };
                                if (!updatedContent.contact.info) {
                                    updatedContent.contact.info = {
                                        title: e.target.value,
                                        location: '',
                                    };
                                } else {
                                    updatedContent.contact.info.title = e.target.value;
                                }
                                setContent(updatedContent);
                            }}
                            className="w-full px-4 py-2 text-white bg-gray-700 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block mb-2 text-sm font-medium text-gray-400">
                            Konum
                        </label>
                        <input
                            type="text"
                            value={content.contact?.info?.location || ''}
                            onChange={e => {
                                const updatedContent = { ...content };
                                if (!updatedContent.contact.info) {
                                    updatedContent.contact.info = {
                                        title: '',
                                        location: e.target.value,
                                    };
                                } else {
                                    updatedContent.contact.info.location = e.target.value;
                                }
                                setContent(updatedContent);
                            }}
                            className="w-full px-4 py-2 text-white bg-gray-700 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
