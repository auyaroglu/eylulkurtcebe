import { Inter, Roboto_Mono } from 'next/font/google';

// Tüm proje için sabit font konfigürasyonu
export const inter = Inter({
    subsets: ['latin'],
    display: 'swap',
    variable: '--font-inter',
});

export const robotoMono = Roboto_Mono({
    subsets: ['latin'],
    display: 'swap',
    variable: '--font-roboto-mono',
});

// Font stilleri için CSS değişkenlerini kullan
export const fontStyles = {
    sans: 'var(--font-inter)',
    mono: 'var(--font-roboto-mono)',
};
