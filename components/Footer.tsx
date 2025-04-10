'use client';

import { motion } from 'framer-motion';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/navigation';

// Footer bileşeni için props arayüzü
interface FooterProps {
    contentData?: any;
}

export default function Footer({ contentData }: FooterProps) {
    const t = useTranslations('footer');
    const locale = useLocale();
    const currentYear = new Date().getFullYear();

    // Contentdata yoksa varsayılan bağlantıları kullan
    const defaultLinks = [
        { href: '/#hero', label: locale === 'tr' ? 'Ana Sayfa' : 'Home' },
        { href: '/#about', label: locale === 'tr' ? 'Hakkımda' : 'About' },
        { href: '/#skills', label: locale === 'tr' ? 'Yetenekler' : 'Skills' },
        { href: '/#projects', label: locale === 'tr' ? 'Eserler' : 'Works' },
        { href: '/#contact', label: locale === 'tr' ? 'İletişim' : 'Contact' },
    ];

    // Dinamik verileri kontrol et ve varsayılan değerlerle birleştir
    const footerData = contentData?.footer || {};
    const description = footerData.description || t('description');
    const rights = footerData.rights || t('rights');

    const quickLinksTitle = footerData.quickLinks?.title || t('quickLinks');
    const links = footerData.quickLinks?.links || defaultLinks;

    const contactTitle = footerData.contact?.title || t('contact');

    // Sosyal medya bilgilerini doğrudan socialMedia nesnesinden al
    const socialEmail = footerData.socialMedia?.email || 'info@eylulkurtcebe.com';
    const socialLinkedin = footerData.socialMedia?.linkedin || '';
    const socialInstagram = footerData.socialMedia?.instagram || '';

    return (
        <footer className="relative py-8 bg-gray-900 dark:bg-gray-900 md:py-16 sm:py-12">
            <div className="to-primary/5 absolute inset-0 z-0 bg-gradient-to-b from-transparent dark:to-primary/10 dark:from-transparent">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f1a_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f1a_1px,transparent_1px)] bg-[size:54px_54px]" />
            </div>
            <div className="z-1 container relative py-4 sm:py-8">
                <div className="grid grid-cols-1 gap-8 mb-8 md:grid-cols-4 sm:grid-cols-2 sm:mb-12">
                    <div className="col-span-1 text-center sm:col-span-2 sm:text-left">
                        <h3 className="mb-4 text-xl font-bold sm:mb-6 sm:text-2xl">
                            Eylül Kurtcebe
                        </h3>
                        <p className="mx-auto max-w-md mb-4 text-gray-400 sm:mx-0 sm:mb-6">
                            {description}
                        </p>
                        <div className="flex justify-center space-x-4 sm:justify-start">
                            {socialLinkedin && (
                                <a
                                    href={
                                        socialLinkedin.includes('linkedin.com')
                                            ? socialLinkedin
                                            : `https://linkedin.com/in/${socialLinkedin}`
                                    }
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label="LinkedIn Profili"
                                    title={`LinkedIn: ${socialLinkedin}`}
                                    className="text-gray-400 transition-colors cursor-pointer hover:text-primary"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="w-5 h-5 sm:w-6 sm:h-6"
                                        fill="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                                    </svg>
                                </a>
                            )}
                            {socialEmail && (
                                <a
                                    href={`mailto:${socialEmail}`}
                                    aria-label="E-posta Gönder"
                                    title={`E-posta: ${socialEmail}`}
                                    className="text-gray-400 transition-colors cursor-pointer hover:text-primary"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="w-5 h-5 sm:w-6 sm:h-6"
                                        fill="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path d="M0 3v18h24v-18h-24zm21.518 2l-9.518 7.713-9.518-7.713h19.036zm-19.518 14v-11.817l10 8.104 10-8.104v11.817h-20z" />
                                    </svg>
                                </a>
                            )}
                            {socialInstagram && (
                                <a
                                    href={
                                        socialInstagram.includes('instagram.com')
                                            ? socialInstagram
                                            : `https://instagram.com/${socialInstagram}`
                                    }
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label="Instagram Profili"
                                    title={`Instagram: ${socialInstagram}`}
                                    className="text-gray-400 transition-colors cursor-pointer hover:text-primary"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="w-5 h-5 sm:w-6 sm:h-6"
                                        fill="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                                    </svg>
                                </a>
                            )}
                        </div>
                    </div>

                    <div className="text-center sm:text-left">
                        <h4 className="mb-3 text-base font-semibold sm:mb-4 sm:text-lg">
                            {quickLinksTitle}
                        </h4>
                        <ul className="space-y-3">
                            {links.map((item: any, index: number) => (
                                <li key={index}>
                                    <a
                                        href={item.url || item.href}
                                        className="text-gray-400 transition-colors cursor-pointer hover:text-primary"
                                    >
                                        {item.label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="text-center sm:text-left">
                        <h4 className="mb-3 text-base font-semibold sm:mb-4 sm:text-lg">
                            {contactTitle}
                        </h4>
                        <ul className="space-y-3">
                            <li className="flex justify-center items-center text-gray-400 sm:justify-start">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="text-primary w-5 h-5 mr-2"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                    />
                                </svg>
                                <a
                                    href={`mailto:${socialEmail}`}
                                    className="transition-colors cursor-pointer hover:text-primary"
                                >
                                    {socialEmail}
                                </a>
                            </li>
                            {socialLinkedin && (
                                <li className="flex justify-center items-center text-gray-400 sm:justify-start">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="text-primary w-5 h-5 mr-2"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z"
                                        />
                                        <circle cx="4" cy="4" r="2" />
                                    </svg>
                                    <a
                                        href={
                                            socialLinkedin.includes('linkedin.com')
                                                ? socialLinkedin
                                                : `https://linkedin.com/in/${socialLinkedin}`
                                        }
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="transition-colors cursor-pointer hover:text-primary"
                                    >
                                        LinkedIn
                                    </a>
                                </li>
                            )}
                            {socialInstagram && (
                                <li className="flex justify-center items-center text-gray-400 sm:justify-start">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="text-primary w-5 h-5 mr-2"
                                        fill="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"></path>
                                    </svg>
                                    <a
                                        href={
                                            socialInstagram.includes('instagram.com')
                                                ? socialInstagram
                                                : `https://instagram.com/${socialInstagram}`
                                        }
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="transition-colors cursor-pointer hover:text-primary"
                                    >
                                        Instagram
                                    </a>
                                </li>
                            )}
                        </ul>
                    </div>
                </div>

                <div className="pt-6 border-t border-gray-800 sm:pt-8">
                    <p className="text-sm text-center text-gray-500 sm:text-base">
                        &copy; {currentYear} Eylül Kurtcebe. {rights}
                    </p>
                </div>
            </div>
        </footer>
    );
}
