import { getRequestConfig } from 'next-intl/server';
import { locales, defaultLocale } from './index';

export default getRequestConfig(async ({ locale }) => {
    // locale null veya undefined ise varsayılan dili kullan
    const localeStr = typeof locale === 'string' ? locale : defaultLocale;

    // Dil destekleniyor mu kontrolü
    const isValidLocale = locales.includes(localeStr as any);

    // Geçerli veya geçersiz, her durumda bir dil döndür (404 yerine)
    const finalLocale = isValidLocale ? localeStr : defaultLocale;

    try {
        return {
            locale: finalLocale,
            messages: (await import(`../messages/${finalLocale}.json`)).default,
        };
    } catch (error) {
        console.error(`Dil mesajları yüklenirken hata: ${finalLocale}`, error);

        // Hiçbir şekilde mesaj bulunamazsa boş bir nesne döndür
        return {
            locale: finalLocale,
            messages: {},
        };
    }
});
