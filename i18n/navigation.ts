import { createNavigation } from 'next-intl/navigation';
import { locales, defaultLocale } from '.';

// Dillere göre sayfa yolları
export const pathnames = {
    '/': '/',
    '/projects': {
        en: '/projects',
        tr: '/projeler',
    },
    '/projects/[id]': {
        en: '/projects/[id]',
        tr: '/projeler/[id]',
    },
    // Admin yolları
    '/admin': '/admin',
    '/admin/giris': '/admin/giris',
    '/admin/projeler': '/admin/projeler',
    '/admin/projeler/yeni': '/admin/projeler/yeni',
    '/admin/projeler/duzenle/[id]': '/admin/projeler/duzenle/[id]',
    '/admin/icerikler': '/admin/icerikler',
};

export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation({
    locales,
    defaultLocale,
    pathnames,
    localePrefix: 'as-needed',
});
