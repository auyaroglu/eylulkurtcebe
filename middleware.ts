import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './i18n';
import { pathnames } from './i18n/navigation';
import { NextResponse, NextRequest } from 'next/server';

// next-intl middleware
const intlMiddleware = createMiddleware({
    // Desteklenen diller
    locales,
    // Varsayılan dil
    defaultLocale,
    // Dillere göre yollar
    pathnames,
    // Kullanıcının tercih ettiği dili hatırla
    localePrefix: 'as-needed',
});

// Ana middleware fonksiyonu
export default async function middleware(request: NextRequest) {
    // Admin sayfaları için sadece robots header ekle, intl middleware'i çalıştırma
    if (request.nextUrl.pathname.startsWith('/admin')) {
        const response = NextResponse.next();
        response.headers.set('X-Robots-Tag', 'noindex, nofollow');
        return response;
    }

    // Diğer sayfalar için intl middleware'i çalıştır
    return intlMiddleware(request);
}

// Middleware'in çalışacağı yolları belirle
export const config = {
    // Tüm istekleri yakala, ancak API ve statik dosyaları hariç tut
    matcher: [
        // Sadece dil yönlendirmesi için path eşleştirmesi:
        '/((?!api|_next|admin|.*\\..*).*)', // dil desteği sadece ana site rotaları için
        // Admin için sadece header eklemek için:
        '/admin/:path*', // admin rotaları için sadece header ekle
    ],
};
