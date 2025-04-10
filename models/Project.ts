import mongoose, { Schema, Document } from 'mongoose';

// SEO alanları için interface
interface ISeo {
    metaTitle: string;
    metaDescription: string;
    metaKeywords: string;
    ogTitle: string;
    ogDescription: string;
    ogImage: string;
}

// Proje modelinin yapısı
export interface IProject extends Document {
    locale: string; // 'tr' veya 'en'
    id: string; // Slug formatında benzersiz ID (örn: porselen-tabak)
    originalId: string; // İki dildeki proje çiftlerini eşleştirmek için kullanılan benzersiz ID
    title: string;
    description: string;
    images: string[];
    technologies: string[];
    order: number; // Projenin sıralama değeri
    status: boolean; // Projenin yayında olup olmadığı
    seo: ISeo; // SEO alanları
    createdAt: Date;
    updatedAt: Date;
}

// Proje şeması
const ProjectSchema: Schema = new Schema(
    {
        locale: {
            type: String,
            required: true,
            enum: ['tr', 'en'],
            index: true, // locale'e göre arama hızlı olsun
        },
        id: {
            type: String,
            required: true,
            description: 'Slug formatında benzersiz tanımlayıcı',
        },
        originalId: {
            type: String,
            required: true,
            index: true, // originalId'ye göre arama hızlı olsun
        },
        title: {
            type: String,
            required: function (this: any) {
                return this.locale === 'tr'; // Sadece Türkçe için zorunlu
            },
            default: '',
        },
        description: {
            type: String,
            required: function (this: any) {
                return this.locale === 'tr'; // Sadece Türkçe için zorunlu
            },
            default: '',
        },
        images: [{ type: String, required: true }],
        technologies: {
            type: [String],
            validate: {
                validator: function (this: any, techs: string[]) {
                    // Türkçe için en az bir teknoloji zorunlu, İngilizce için boş olabilir
                    return this.locale === 'en' || (techs && techs.length > 0);
                },
                message: 'En az bir teknoloji eklemelisiniz (sadece TR içerik için gerekli)',
            },
            default: [],
        },
        order: { type: Number, default: 0 }, // Varsayılan sıralama değeri 0
        status: {
            type: Boolean,
            default: function (this: any) {
                // Türkçe için varsayılan olarak "yayında" (true), İngilizce için "gizli" (false)
                return this.locale === 'tr';
            },
        }, // Yayında mı değil mi (true: yayında, false: gizli)
        seo: {
            metaTitle: { type: String, default: '' },
            metaDescription: { type: String, default: '' },
            metaKeywords: { type: String, default: '' },
            ogTitle: { type: String, default: '' },
            ogDescription: { type: String, default: '' },
            ogImage: { type: String, default: '' },
        },
    },
    {
        timestamps: true,
        strict: false, // Şemada tanımlanmamış alanların da kaydedilmesine izin ver
    }
);

// locale ve id birlikte benzersiz olmalı
ProjectSchema.index({ locale: 1, id: 1 }, { unique: true });

// Model oluşturma (eğer mongoose henüz initialize edilmediyse)
export default mongoose.models.Project || mongoose.model<IProject>('Project', ProjectSchema);
