// create-site-config.js - Site ayarları koleksiyonu için migrasyon scripti
const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB bağlantısı
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('MONGODB_URI ortam değişkeni tanımlanmamış');
    process.exit(1);
}

// Site ayarları şeması
const SiteConfigSchema = new mongoose.Schema(
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

// Migrasyon işlemini gerçekleştir
async function run() {
    try {
        // MongoDB'ye bağlan
        console.log("MongoDB'ye bağlanılıyor...");
        await mongoose.connect(MONGODB_URI);
        console.log('Veritabanına bağlantı başarılı');

        // Koleksiyon oluştur
        const SiteConfig =
            mongoose.models.SiteConfig || mongoose.model('SiteConfig', SiteConfigSchema);

        // Mevcut config kontrolü
        const existingConfig = await SiteConfig.findOne({});

        if (existingConfig) {
            console.log('Site ayarları zaten mevcut.');
            console.log('Mevcut ayarları güncelleme yapılıyor...');

            // Mevcut veriyi alıp yapı değişikliklerini uygula
            const updatedConfig = {
                contactEmail: existingConfig.contactEmail,
                displayEmail: existingConfig.displayEmail,
                logo: existingConfig.logo || '/logo.webp', // Varsayılan logo
                seo: {
                    title: {
                        tr: existingConfig.seo?.title || 'Eylül Kurtcebe - Kişisel Portfolyo',
                        en: existingConfig.seo?.title ? 'Eylul Kurtcebe - Personal Portfolio' : '',
                    },
                    description: {
                        tr:
                            existingConfig.seo?.description ||
                            'Eylül Kurtcebe kişisel portfolyo sitesi. İç mimarlık, tasarım ve diğer projeler.',
                        en: existingConfig.seo?.description
                            ? 'Eylul Kurtcebe personal portfolio site. Interior architecture, design and other projects.'
                            : '',
                    },
                    keywords: {
                        tr:
                            existingConfig.seo?.keywords ||
                            'iç mimarlık, tasarım, portfolyo, eylül kurtcebe',
                        en: existingConfig.seo?.keywords
                            ? 'interior architecture, design, portfolio, eylul kurtcebe'
                            : '',
                    },
                    ogImage: existingConfig.seo?.ogImage || '/logo.webp',
                },
                pagination: {
                    itemsPerPage: existingConfig.pagination?.itemsPerPage || 9,
                },
                robotsEnabled:
                    existingConfig.robotsEnabled !== undefined
                        ? existingConfig.robotsEnabled
                        : false,
            };

            // Veritabanını güncelle
            await SiteConfig.findByIdAndUpdate(existingConfig._id, updatedConfig);
            console.log('Site ayarları güncellendi.');
        } else {
            // Varsayılan site ayarlarını oluştur
            const defaultConfig = {
                contactEmail: 'info@eylulkurtcebe.com',
                displayEmail: 'info@eylulkurtcebe.com',
                logo: '/logo.webp',
                seo: {
                    title: {
                        tr: 'Eylül Kurtcebe - Kişisel Portfolyo',
                        en: 'Eylul Kurtcebe - Personal Portfolio',
                    },
                    description: {
                        tr: 'Eylül Kurtcebe kişisel portfolyo sitesi. İç mimarlık, tasarım ve diğer projeler.',
                        en: 'Eylul Kurtcebe personal portfolio site. Interior architecture, design and other projects.',
                    },
                    keywords: {
                        tr: 'iç mimarlık, tasarım, portfolyo, eylül kurtcebe',
                        en: 'interior architecture, design, portfolio, eylul kurtcebe',
                    },
                    ogImage: '/logo.webp',
                },
                pagination: {
                    itemsPerPage: 9,
                },
                robotsEnabled: false,
            };

            // SiteConfig koleksiyonuna varsayılan veriyi ekle
            const newConfig = await SiteConfig.create(defaultConfig);
            console.log('Varsayılan site ayarları oluşturuldu:', newConfig);
        }

        console.log('İşlem tamamlandı.');
    } catch (error) {
        console.error('İşlem sırasında hata oluştu:', error);
    } finally {
        // Bağlantıyı kapat
        await mongoose.connection.close();
        console.log('Veritabanı bağlantısı kapatıldı');
        process.exit(0);
    }
}

// Migrasyon scriptini çalıştır
run();
