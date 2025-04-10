import mongoose, { Schema, Document } from 'mongoose';

// Site ayarları veri modeli
export interface ISiteConfig extends Document {
    contactEmail: string; // İletişim formları için e-posta
    displayEmail: string; // Sitede görüntülenecek e-posta
    logo: string; // Site logosu
    seo: {
        title: {
            tr: string; // Türkçe başlık
            en: string; // İngilizce başlık
        };
        description: {
            tr: string; // Türkçe açıklama
            en: string; // İngilizce açıklama
        };
        keywords: {
            tr: string; // Türkçe anahtar kelimeler
            en: string; // İngilizce anahtar kelimeler
        };
        ogImage: string; // Open Graph resmi
    };
    pagination: {
        itemsPerPage: number; // Sayfa başına gösterilecek öğe sayısı
    };
    robotsEnabled: boolean; // Arama motorları için robots ayarı
}

// Site ayarları şeması
const SiteConfigSchema: Schema = new Schema(
    {
        contactEmail: { type: String, required: true, trim: true },
        displayEmail: { type: String, required: true, trim: true },
        logo: { type: String, required: false, trim: true },
        seo: {
            title: {
                tr: { type: String, required: true, trim: true },
                en: { type: String, required: true, trim: true },
            },
            description: {
                tr: { type: String, required: true, trim: true },
                en: { type: String, required: true, trim: true },
            },
            keywords: {
                tr: { type: String, required: true, trim: true },
                en: { type: String, required: true, trim: true },
            },
            ogImage: { type: String, required: false, trim: true },
        },
        pagination: {
            itemsPerPage: { type: Number, default: 9, min: 3, max: 30 },
        },
        robotsEnabled: { type: Boolean, default: false },
    },
    { timestamps: true }
);

// Model oluşturma
export default mongoose.models.SiteConfig ||
    mongoose.model<ISiteConfig>('SiteConfig', SiteConfigSchema);
