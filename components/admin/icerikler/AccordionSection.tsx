'use client';

import { AccordionSectionProps } from './types';

export default function AccordionSection({
    title,
    isExpanded,
    onToggle,
    children,
}: AccordionSectionProps) {
    return (
        <div className="overflow-hidden rounded-lg border border-gray-700">
            <button
                className="w-full flex justify-between items-center px-6 py-4 text-left bg-gray-800 focus:outline-none hover:bg-gray-750"
                onClick={onToggle}
            >
                <h3 className="text-lg font-medium text-white">{title}</h3>
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`h-5 w-5 text-gray-400 transform transition-transform ${
                        isExpanded ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                    />
                </svg>
            </button>

            <div
                className={`overflow-hidden transition-all ${
                    isExpanded ? 'max-h-screen' : 'max-h-0'
                }`}
            >
                <div className="p-6 bg-gray-800">{children}</div>
            </div>
        </div>
    );
}
