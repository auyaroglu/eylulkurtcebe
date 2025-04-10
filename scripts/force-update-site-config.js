// force-update-site-config.js - Mevcut site ayarlarını silip yeni şema ile oluşturan script
const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB bağlantısı
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('MONGODB_URI ortam değişkeni tanımlanmamış');
    process.exit(1);
}

// Yeni Site ayarları şeması
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

        // Eskiyi oku ve gerekli bilgileri al
        let oldCollection;
        try {
            oldCollection = mongoose.connection.collection('siteconfigs');
            const existingConfig = await oldCollection.findOne({});
            console.log('Mevcut ayarlar bulundu:', existingConfig);

            // Mevcut koleksiyonu temizle
            console.log('Mevcut site ayarları koleksiyonu temizleniyor...');
            await oldCollection.deleteMany({});
            console.log('Mevcut koleksiyon temizlendi.');

            // Yeni modeli tanımla
            const SiteConfig = mongoose.model('SiteConfig', SiteConfigSchema);

            // Eski verilerden yeni formata dönüştür
            const newConfig = {
                contactEmail: existingConfig.contactEmail || 'info@eylulkurtcebe.com',
                displayEmail: existingConfig.displayEmail || 'info@eylulkurtcebe.com',
                logo: existingConfig.logo || '/logo.webp',
                seo: {
                    title: {
                        tr:
                            typeof existingConfig.seo?.title === 'string'
                                ? existingConfig.seo.title
                                : existingConfig.seo?.title?.tr ||
                                  'Eylül Kurtcebe - Kişisel Portfolyo',
                        en: existingConfig.seo?.title?.en || 'Eylul Kurtcebe - Personal Portfolio',
                    },
                    description: {
                        tr:
                            typeof existingConfig.seo?.description === 'string'
                                ? existingConfig.seo.description
                                : existingConfig.seo?.description?.tr ||
                                  'Eylül Kurtcebe kişisel portfolyo sitesi. İç mimarlık, tasarım ve diğer projeler.',
                        en:
                            existingConfig.seo?.description?.en ||
                            'Eylul Kurtcebe personal portfolio site. Interior architecture, design and other projects.',
                    },
                    keywords: {
                        tr:
                            typeof existingConfig.seo?.keywords === 'string'
                                ? existingConfig.seo.keywords
                                : existingConfig.seo?.keywords?.tr ||
                                  'iç mimarlık, tasarım, portfolyo, eylül kurtcebe',
                        en:
                            existingConfig.seo?.keywords?.en ||
                            'interior architecture, design, portfolio, eylul kurtcebe',
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
                createdAt: existingConfig.createdAt || new Date(),
                updatedAt: new Date(),
            };

            // Yeni ayarları oluştur
            const result = await SiteConfig.create(newConfig);
            console.log('Yeni yapıda site ayarları oluşturuldu:');
            console.log(JSON.stringify(result, null, 2));
        } catch (error) {
            console.error('Mevcut site ayarları bulunamadı veya işleme hatası:', error);

            // Yeni modeli tanımla
            const SiteConfig = mongoose.model('SiteConfig', SiteConfigSchema);

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

            // Yeni ayarları oluştur
            const result = await SiteConfig.create(defaultConfig);
            console.log('Varsayılan site ayarları oluşturuldu:');
            console.log(JSON.stringify(result, null, 2));
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
