import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * Verilen metni URL ve SEO dostu bir slug formatına dönüştürür.
 * Türkçe karakterleri destekler, boşlukları tire ile değiştirir ve özel karakterleri kaldırır.
 * @param text Slug'a dönüştürülecek metin
 * @returns Slug formatında metin
 */
export function slugify(text: string): string {
    if (!text) return '';

    // Türkçe karakterleri değiştir
    const turkishMap: { [key: string]: string } = {
        ı: 'i',
        ğ: 'g',
        ü: 'u',
        ş: 's',
        ö: 'o',
        ç: 'c',
        İ: 'I',
        Ğ: 'G',
        Ü: 'U',
        Ş: 'S',
        Ö: 'O',
        Ç: 'C',
    };

    // Türkçe karakterleri dönüştür
    let result = text.replace(/[ıİğĞüÜşŞöÖçÇ]/g, match => turkishMap[match]);

    // Metni küçük harfe çevir ve diğer dönüşümleri yap
    return result
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\-]/g, '-') // Alfanümerik olmayan her karakteri tire ile değiştir
        .replace(/\-+/g, '-') // Birden fazla tireyi tek tireye dönüştür
        .replace(/^\-|\-$/g, ''); // Baştaki ve sondaki tireleri kaldır
}

// In-memory rate limiter
const rateLimits = new Map<string, { count: number; resetTime: number }>();

/**
 * Belirli bir anahtar için istek sayısını sınırlar (rate limiting)
 * @param key Sınırlamak istediğimiz anahtar (örn: IP adresi)
 * @param maxRequests Belirli bir zaman diliminde izin verilen maksimum istek sayısı
 * @param windowMs Zaman dilimi (milisaniye cinsinden), varsayılan 60 saniye
 * @returns Başarı durumu ve limit bilgileri
 */
export async function rateLimit(
    key: string,
    maxRequests: number,
    windowMs: number = 60 * 1000
): Promise<{
    success: boolean;
    limit: number;
    remaining: number;
    reset: number;
}> {
    const now = Date.now();
    const currentLimit = rateLimits.get(key) || { count: 0, resetTime: now + windowMs };

    // Zaman dilimi geçtiyse sıfırla
    if (now > currentLimit.resetTime) {
        currentLimit.count = 0;
        currentLimit.resetTime = now + windowMs;
    }

    // İstek sayısını artır
    currentLimit.count += 1;
    rateLimits.set(key, currentLimit);

    // Kalan istek sayısı
    const remaining = Math.max(0, maxRequests - currentLimit.count);

    return {
        success: currentLimit.count <= maxRequests,
        limit: maxRequests,
        remaining,
        reset: currentLimit.resetTime,
    };
}

/**
 * Bir fonksiyonu debounce yapar
 * @param func Çalıştırılacak fonksiyon
 * @param wait Bekleme süresi (ms)
 * @returns Debounce edilmiş fonksiyon
 */
export function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number = 500
): (...args: Parameters<T>) => void {
    let timeout: ReturnType<typeof setTimeout> | null = null;

    return function (this: any, ...args: Parameters<T>) {
        const context = this;

        if (timeout !== null) {
            clearTimeout(timeout);
        }

        timeout = setTimeout(() => {
            func.apply(context, args);
            timeout = null;
        }, wait);
    };
}

/**
 * Slug'ın benzersiz olup olmadığını kontrol eder ve öneride bulunur
 * @param slug Kontrol edilecek slug
 * @param locale Dil kodunu temsil eder
 * @param originalId Düzenleme durumunda bu slug'ın ait olduğu projenin ID'si
 * @returns Promise<{isAvailable: boolean, suggestedSlug?: string}>
 */
export async function checkSlugAvailability(
    slug: string,
    locale: string,
    originalId?: string
): Promise<{ isAvailable: boolean; suggestedSlug?: string }> {
    try {
        const token = localStorage.getItem('adminToken');
        if (!token) {
            throw new Error('Oturum bulunamadı');
        }

        let url = `/api/admin/projects/slug-check?slug=${slug}&locale=${locale}`;

        // Düzenleme modunda ise originalId ekle
        if (originalId) {
            url += `&originalId=${originalId}`;
        }

        const response = await fetch(url, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (response.ok) {
            return await response.json();
        } else {
            throw new Error('Slug kontrolü sırasında bir hata oluştu');
        }
    } catch (error) {
        console.error('Slug kontrolü hatası:', error);
        // Hata durumunda, kullanıcıya başka bir slug kullanmasını öneren varsayılan bir değer döndür
        return { isAvailable: false, suggestedSlug: `${slug}-${Date.now().toString().slice(-4)}` };
    }
}

/**
 * Debounce mekanizması ile slug kontrol ve güncelleme yapar
 * @param slug Kontrol edilecek slug
 * @param locale Dil kodunu temsil eder
 * @param originalId Düzenleme durumunda bu slug'ın ait olduğu projenin ID'si
 * @param updateFunction Slug değiştiğinde çağrılacak güncelleme fonksiyonu
 */
export const debouncedCheckAndUpdateSlug = debounce(
    async (
        slug: string,
        locale: string,
        updateFunction: (suggestedSlug: string) => void,
        originalId?: string
    ) => {
        try {
            const result = await checkSlugAvailability(slug, locale, originalId);

            // Eğer slug kullanılıyorsa ve önerilen bir slug varsa, güncelleme fonksiyonunu çağır
            if (!result.isAvailable && result.suggestedSlug) {
                console.log(`Slug "${slug}" zaten kullanımda. Önerilen: "${result.suggestedSlug}"`);
                updateFunction(result.suggestedSlug);
            }
        } catch (error) {
            console.error('Debounced slug kontrolü hatası:', error);
        }
    },
    500 // 500ms debounce süresi
);
