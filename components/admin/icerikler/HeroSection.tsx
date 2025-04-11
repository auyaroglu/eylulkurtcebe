'use client';

import { ContentSectionProps } from './types';

export default function HeroSection({ content, handleContentChange }: ContentSectionProps) {
    if (!handleContentChange) return null;

    return (
        <div className="grid grid-cols-1 gap-6 max-h-[500px] overflow-y-auto pr-2">
            {Object.entries(content.hero).map(([key, value]) => (
                <div key={key} className="w-full">
                    <label className="block mb-2 text-sm font-medium text-gray-400">
                        {key.charAt(0).toUpperCase() + key.slice(1)}
                    </label>
                    {key === 'description' ? (
                        <textarea
                            value={value as string}
                            onChange={e => handleContentChange('hero', key, e.target.value)}
                            rows={4}
                            className="w-full px-4 py-2 text-white bg-gray-700 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        ></textarea>
                    ) : (
                        <input
                            type="text"
                            value={value as string}
                            onChange={e => handleContentChange('hero', key, e.target.value)}
                            className="w-full px-4 py-2 text-white bg-gray-700 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    )}
                </div>
            ))}
        </div>
    );
}
