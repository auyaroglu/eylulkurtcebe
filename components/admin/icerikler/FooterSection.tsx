'use client';

import { ContentSectionProps } from './types';

export default function FooterSection({
    content,
    setContent,
    handleContentChange,
}: ContentSectionProps) {
    if (!handleContentChange) return null;

    return (
        <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2">
            <div>
                <h4 className="mb-4 text-lg font-medium text-white">Genel Bilgiler</h4>
                <div className="grid grid-cols-1 gap-4">
                    <div>
                        <label className="block mb-2 text-sm font-medium text-gray-400">
                            Açıklama
                        </label>
                        <textarea
                            value={content.footer.description}
                            onChange={e =>
                                handleContentChange('footer', 'description', e.target.value)
                            }
                            rows={3}
                            className="w-full px-4 py-2 text-white bg-gray-700 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        ></textarea>
                    </div>
                    <div>
                        <label className="block mb-2 text-sm font-medium text-gray-400">
                            Telif Hakkı Metni
                        </label>
                        <input
                            type="text"
                            value={content.footer.rights}
                            onChange={e => handleContentChange('footer', 'rights', e.target.value)}
                            className="w-full px-4 py-2 text-white bg-gray-700 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>
            </div>

            <div className="p-5 bg-gray-800 rounded-md">
                <h4 className="mb-4 text-lg font-medium text-white">Hızlı Bağlantılar</h4>
                <div>
                    <label className="block mb-2 text-sm font-medium text-gray-400">Başlık</label>
                    <input
                        type="text"
                        value={content.footer.quickLinks?.title || ''}
                        onChange={e => {
                            const updatedContent = { ...content };
                            if (!updatedContent.footer.quickLinks) {
                                updatedContent.footer.quickLinks = {
                                    title: e.target.value,
                                    links: [],
                                };
                            } else {
                                updatedContent.footer.quickLinks.title = e.target.value;
                            }
                            setContent(updatedContent);
                        }}
                        className="w-full px-4 py-2 text-white bg-gray-700 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div className="mt-4">
                    <label className="block mb-2 text-sm font-medium text-gray-400">
                        Bağlantılar
                    </label>

                    {Array.isArray(content.footer.quickLinks?.links) &&
                        content.footer.quickLinks.links.map((link: any, index: number) => (
                            <div
                                key={index}
                                className="bg-gray-750 flex items-center gap-2 p-2 mb-2 rounded-md"
                            >
                                <div className="flex-grow">
                                    <div className="flex gap-2 mb-2">
                                        <input
                                            type="text"
                                            value={link.label}
                                            placeholder="Etiket"
                                            onChange={e => {
                                                const updatedContent = {
                                                    ...content,
                                                };
                                                updatedContent.footer.quickLinks.links[
                                                    index
                                                ].label = e.target.value;
                                                setContent(updatedContent);
                                            }}
                                            className="flex-1 px-3 py-1 text-sm text-white bg-gray-700 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                        <input
                                            type="text"
                                            value={link.url}
                                            placeholder="URL"
                                            onChange={e => {
                                                const updatedContent = {
                                                    ...content,
                                                };
                                                updatedContent.footer.quickLinks.links[index].url =
                                                    e.target.value;
                                                setContent(updatedContent);
                                            }}
                                            className="flex-1 px-3 py-1 text-sm text-white bg-gray-700 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        const updatedContent = {
                                            ...content,
                                        };
                                        updatedContent.footer.quickLinks.links.splice(index, 1);
                                        setContent(updatedContent);
                                    }}
                                    className="p-1 text-gray-400 rounded hover:text-white hover:bg-gray-700"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="w-5 h-5"
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                </button>
                            </div>
                        ))}

                    <button
                        type="button"
                        onClick={() => {
                            const updatedContent = { ...content };
                            if (!updatedContent.footer.quickLinks) {
                                updatedContent.footer.quickLinks = {
                                    title: 'Hızlı Bağlantılar',
                                    links: [],
                                };
                            }
                            if (!Array.isArray(updatedContent.footer.quickLinks.links)) {
                                updatedContent.footer.quickLinks.links = [];
                            }
                            updatedContent.footer.quickLinks.links.push({
                                label: '',
                                url: '',
                            });
                            setContent(updatedContent);
                        }}
                        className="w-full px-4 py-2 mt-2 text-sm font-medium text-white bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 hover:bg-gray-600"
                    >
                        + Bağlantı Ekle
                    </button>
                </div>
            </div>

            <div className="p-5 bg-gray-800 rounded-md">
                <h4 className="mb-4 text-lg font-medium text-white">İletişim</h4>
                <div className="grid grid-cols-1 gap-4">
                    <div>
                        <label className="block mb-2 text-sm font-medium text-gray-400">
                            Başlık
                        </label>
                        <input
                            type="text"
                            value={content.footer.contact?.title || ''}
                            onChange={e => {
                                const updatedContent = { ...content };
                                if (!updatedContent.footer.contact) {
                                    updatedContent.footer.contact = {
                                        title: e.target.value,
                                        email: '',
                                        location: '',
                                        instagram: '',
                                    };
                                } else {
                                    updatedContent.footer.contact.title = e.target.value;
                                }
                                setContent(updatedContent);
                            }}
                            className="w-full px-4 py-2 text-white bg-gray-700 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>
            </div>

            <div className="p-5 bg-gray-800 rounded-md">
                <h4 className="mb-4 text-lg font-medium text-white">Sosyal Medya</h4>
                <div className="grid grid-cols-1 gap-4">
                    <div>
                        <label className="block mb-2 text-sm font-medium text-gray-400">
                            E-posta
                        </label>
                        <input
                            type="email"
                            value={content.footer.socialMedia?.email || ''}
                            onChange={e => {
                                const updatedContent = { ...content };
                                if (!updatedContent.footer.socialMedia) {
                                    updatedContent.footer.socialMedia = {
                                        email: e.target.value,
                                        linkedin: '',
                                        instagram: '',
                                    };
                                } else {
                                    updatedContent.footer.socialMedia.email = e.target.value;
                                }
                                setContent(updatedContent);
                            }}
                            className="w-full px-4 py-2 text-white bg-gray-700 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block mb-2 text-sm font-medium text-gray-400">
                            LinkedIn Kullanıcı Adı
                        </label>
                        <input
                            type="text"
                            value={content.footer.socialMedia?.linkedin || ''}
                            onChange={e => {
                                const updatedContent = { ...content };
                                if (!updatedContent.footer.socialMedia) {
                                    updatedContent.footer.socialMedia = {
                                        email: '',
                                        linkedin: e.target.value,
                                        instagram: '',
                                    };
                                } else {
                                    updatedContent.footer.socialMedia.linkedin = e.target.value;
                                }
                                setContent(updatedContent);
                            }}
                            className="w-full px-4 py-2 text-white bg-gray-700 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block mb-2 text-sm font-medium text-gray-400">
                            Instagram Kullanıcı Adı
                        </label>
                        <input
                            type="text"
                            value={content.footer.socialMedia?.instagram || ''}
                            onChange={e => {
                                const updatedContent = { ...content };
                                if (!updatedContent.footer.socialMedia) {
                                    updatedContent.footer.socialMedia = {
                                        email: '',
                                        linkedin: '',
                                        instagram: e.target.value,
                                    };
                                } else {
                                    updatedContent.footer.socialMedia.instagram = e.target.value;
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
