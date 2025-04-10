// Desteklenen diller
export const locales = ['tr', 'en'] as const;
export type Locale = (typeof locales)[number];

// Varsayılan dil
export const defaultLocale: Locale = 'tr';

export function getLocalePartsFrom(path: string) {
  const pathnameParts = path.split('/');
  const locale = pathnameParts[1] as Locale;
  
  if (!locales.includes(locale)) {
    return {
      locale: defaultLocale,
      pathname: path
    };
  }
  
  return {
    locale,
    pathname: pathnameParts.slice(2).join('/') || '/'
  };
} 