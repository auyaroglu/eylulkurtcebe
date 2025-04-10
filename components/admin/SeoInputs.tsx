import React from 'react';

interface SeoInputsProps {
    seo: {
        metaTitle?: string;
        metaDescription?: string;
        metaKeywords?: string;
        ogTitle?: string;
        ogDescription?: string;
        ogImage?: string;
    };
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    onGenerateSeo?: () => void;
    isGeneratingSeo?: boolean;
    contentType?: 'project' | 'blog' | 'page';
    locale?: string;
}

// SEO alanları için karakter limitleri
const CHARACTER_LIMITS = {
    metaTitle: 60,
    metaDescription: 155,
    ogTitle: 60,
    ogDescription: 155,
};

const SeoInputs: React.FC<SeoInputsProps> = ({
    seo,
    onChange,
    onGenerateSeo,
    isGeneratingSeo = false,
    contentType = 'project',
    locale = 'tr',
}) => {
    // İçerik türüne göre metinleri belirle
    const getPlaceholders = () => {
        if (contentType === 'project') {
            return {
                metaTitle: 'Meta başlık (boş bırakılırsa proje başlığı kullanılır)',
                metaDescription:
                    'Meta açıklama (boş bırakılırsa proje açıklaması kısaltılarak kullanılır)',
                metaKeywords: 'Anahtar kelimeler (virgülle ayırın)',
                ogTitle: 'Sosyal medya başlığı (boş bırakılırsa meta başlık kullanılır)',
                ogDescription: 'Sosyal medya açıklaması (boş bırakılırsa meta açıklama kullanılır)',
                ogImage:
                    "Sosyal medya görseli URL'si (boş bırakılırsa ilk proje görseli kullanılır)",
            };
        } else if (contentType === 'blog') {
            return {
                metaTitle: 'Meta başlık (boş bırakılırsa yazı başlığı kullanılır)',
                metaDescription:
                    'Meta açıklama (boş bırakılırsa yazı özeti kısaltılarak kullanılır)',
                metaKeywords: 'Anahtar kelimeler (virgülle ayırın)',
                ogTitle: 'Sosyal medya başlığı (boş bırakılırsa meta başlık kullanılır)',
                ogDescription: 'Sosyal medya açıklaması (boş bırakılırsa meta açıklama kullanılır)',
                ogImage: "Sosyal medya görseli URL'si (boş bırakılırsa blog görseli kullanılır)",
            };
        } else {
            return {
                metaTitle: 'Meta başlık (boş bırakılırsa sayfa başlığı kullanılır)',
                metaDescription:
                    'Meta açıklama (boş bırakılırsa sayfa içeriği kısaltılarak kullanılır)',
                metaKeywords: 'Anahtar kelimeler (virgülle ayırın)',
                ogTitle: 'Sosyal medya başlığı (boş bırakılırsa meta başlık kullanılır)',
                ogDescription: 'Sosyal medya açıklaması (boş bırakılırsa meta açıklama kullanılır)',
                ogImage: "Sosyal medya görseli URL'si (boş bırakılırsa sayfa görseli kullanılır)",
            };
        }
    };

    const placeholders = getPlaceholders();

    // Boş değerleri güvenli bir şekilde ayarla
    const safeValues = {
        metaTitle: seo?.metaTitle || '',
        metaDescription: seo?.metaDescription || '',
        metaKeywords: seo?.metaKeywords || '',
        ogTitle: seo?.ogTitle || '',
        ogDescription: seo?.ogDescription || '',
        ogImage: seo?.ogImage || '',
    };

    // Karakter limiti durumuna göre renk belirleme
    const getCharCountColor = (fieldName: keyof typeof CHARACTER_LIMITS, length: number) => {
        const limit = CHARACTER_LIMITS[fieldName];
        const percentage = (length / limit) * 100;

        if (percentage <= 80) return 'text-green-500'; // %80'den az - iyi (yeşil)
        if (percentage <= 100) return 'text-yellow-500'; // %80-%100 arası - dikkatli (sarı)
        return 'text-red-500'; // %100'den fazla - aşım (kırmızı)
    };

    return (
        <div className="p-6 bg-gray-800 rounded-lg">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-medium text-white">SEO Ayarları</h2>
                {onGenerateSeo && (
                    <button
                        type="button"
                        onClick={onGenerateSeo}
                        className="flex items-center gap-2 px-4 py-2 text-white bg-indigo-600 rounded-md transition-colors disabled:opacity-50 hover:bg-indigo-700"
                        disabled={isGeneratingSeo}
                    >
                        {isGeneratingSeo ? (
                            <>
                                <svg
                                    className="w-5 h-5 animate-spin"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                    ></circle>
                                    <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                    ></path>
                                </svg>
                                <span>Oluşturuluyor...</span>
                            </>
                        ) : (
                            <>
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="w-5 h-5"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                                <span>
                                    {locale === 'tr'
                                        ? 'SEO İçeriğini Oluştur'
                                        : 'Generate SEO Content'}
                                </span>
                            </>
                        )}
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                    <div className="mb-4">
                        <label className="block mb-2 text-sm font-medium text-gray-400">
                            Meta Başlık
                        </label>
                        <input
                            type="text"
                            name="seo.metaTitle"
                            value={safeValues.metaTitle}
                            onChange={onChange}
                            placeholder={placeholders.metaTitle}
                            className="w-full px-4 py-2 text-white bg-gray-700 rounded-md border border-gray-600"
                            maxLength={CHARACTER_LIMITS.metaTitle * 1.5} // Sert limit olarak max uzunluğun 1.5 katı
                        />
                        <div className="flex justify-between mt-1">
                            <p
                                className={`text-xs ${getCharCountColor(
                                    'metaTitle',
                                    safeValues.metaTitle.length
                                )}`}
                            >
                                {safeValues.metaTitle.length}/{CHARACTER_LIMITS.metaTitle} karakter
                            </p>
                            <p className="text-xs text-gray-500">
                                İdeal: {CHARACTER_LIMITS.metaTitle} karakter
                            </p>
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="block mb-2 text-sm font-medium text-gray-400">
                            Meta Açıklama
                        </label>
                        <textarea
                            name="seo.metaDescription"
                            value={safeValues.metaDescription}
                            onChange={onChange}
                            placeholder={placeholders.metaDescription}
                            className="w-full h-24 px-4 py-2 text-white bg-gray-700 rounded-md border border-gray-600"
                            maxLength={CHARACTER_LIMITS.metaDescription * 1.5} // Sert limit olarak max uzunluğun 1.5 katı
                        />
                        <div className="flex justify-between mt-1">
                            <p
                                className={`text-xs ${getCharCountColor(
                                    'metaDescription',
                                    safeValues.metaDescription.length
                                )}`}
                            >
                                {safeValues.metaDescription.length}/
                                {CHARACTER_LIMITS.metaDescription} karakter
                            </p>
                            <p className="text-xs text-gray-500">
                                İdeal: {CHARACTER_LIMITS.metaDescription} karakter
                            </p>
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="block mb-2 text-sm font-medium text-gray-400">
                            Meta Anahtar Kelimeler
                        </label>
                        <input
                            type="text"
                            name="seo.metaKeywords"
                            value={safeValues.metaKeywords}
                            onChange={onChange}
                            placeholder={placeholders.metaKeywords}
                            className="w-full px-4 py-2 text-white bg-gray-700 rounded-md border border-gray-600"
                        />
                        <p className="mt-1 text-xs text-gray-500">
                            Önerilen: 5-10 anahtar kelime (virgülle ayrılmış)
                        </p>
                    </div>
                </div>

                <div>
                    <div className="mb-4">
                        <label className="block mb-2 text-sm font-medium text-gray-400">
                            OG Başlık
                        </label>
                        <input
                            type="text"
                            name="seo.ogTitle"
                            value={safeValues.ogTitle}
                            onChange={onChange}
                            placeholder={placeholders.ogTitle}
                            className="w-full px-4 py-2 text-white bg-gray-700 rounded-md border border-gray-600"
                            maxLength={CHARACTER_LIMITS.ogTitle * 1.5} // Sert limit olarak max uzunluğun 1.5 katı
                        />
                        <div className="flex justify-between mt-1">
                            <p
                                className={`text-xs ${getCharCountColor(
                                    'ogTitle',
                                    safeValues.ogTitle.length
                                )}`}
                            >
                                {safeValues.ogTitle.length}/{CHARACTER_LIMITS.ogTitle} karakter
                            </p>
                            <p className="text-xs text-gray-500">
                                İdeal: {CHARACTER_LIMITS.ogTitle} karakter
                            </p>
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="block mb-2 text-sm font-medium text-gray-400">
                            OG Açıklama
                        </label>
                        <textarea
                            name="seo.ogDescription"
                            value={safeValues.ogDescription}
                            onChange={onChange}
                            placeholder={placeholders.ogDescription}
                            className="w-full h-24 px-4 py-2 text-white bg-gray-700 rounded-md border border-gray-600"
                            maxLength={CHARACTER_LIMITS.ogDescription * 1.5} // Sert limit olarak max uzunluğun 1.5 katı
                        />
                        <div className="flex justify-between mt-1">
                            <p
                                className={`text-xs ${getCharCountColor(
                                    'ogDescription',
                                    safeValues.ogDescription.length
                                )}`}
                            >
                                {safeValues.ogDescription.length}/{CHARACTER_LIMITS.ogDescription}{' '}
                                karakter
                            </p>
                            <p className="text-xs text-gray-500">
                                İdeal: {CHARACTER_LIMITS.ogDescription} karakter
                            </p>
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="block mb-2 text-sm font-medium text-gray-400">
                            OG Görsel URL'si
                        </label>
                        <input
                            type="text"
                            name="seo.ogImage"
                            value={safeValues.ogImage}
                            onChange={onChange}
                            placeholder={placeholders.ogImage}
                            className="w-full px-4 py-2 text-white bg-gray-700 rounded-md border border-gray-600"
                        />
                        <p className="mt-1 text-xs text-gray-500">
                            Önerilen: 1200x630 piksel görsel
                        </p>
                    </div>
                </div>
            </div>

            <div className="p-3 mt-4 bg-gray-900 rounded-md border border-gray-600">
                <h3 className="mb-2 text-sm font-medium text-gray-400">SEO İpuçları</h3>
                <ul className="space-y-1 text-xs text-gray-500">
                    <li>
                        • Meta başlık: {CHARACTER_LIMITS.metaTitle} karakterden kısa olmalı, anahtar
                        kelimeler öne yerleştirilmeli
                    </li>
                    <li>
                        • Meta açıklama: {CHARACTER_LIMITS.metaDescription} karakterden kısa olmalı,
                        eyleme geçirici ifadeler içermeli
                    </li>
                    <li>
                        • Anahtar kelimeler: İçerikle ilgili, hedef kitlenizin arayabileceği
                        terimler olmalı
                    </li>
                    <li>
                        • OG içeriği: Sosyal medyada paylaşıldığında görünecek içerik, dikkat çekici
                        olmalı
                    </li>
                </ul>
            </div>
        </div>
    );
};

export default SeoInputs;
