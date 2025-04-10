// update-site-config.js - Site ayarları koleksiyonunu yeni yapıya güncelleme scripti
const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB bağlantısı
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('MONGODB_URI ortam değişkeni tanımlanmamış');
    process.exit(1);
}

// Önceki Site ayarları şeması (referans için)
const OldSiteConfigSchema = new mongoose.Schema(
    {
        contactEmail: { type: String, required: true, trim: true },
        displayEmail: { type: String, required: true, trim: true },
        seo: {
            title: { type: String, required: true, trim: true },
            description: { type: String, required: true, trim: true },
            keywords: { type: String, required: true, trim: true },
            ogImage: { type: String, required: false, trim: true },
        },
        pagination: {
            itemsPerPage: { type: Number, default: 9, min: 3, max: 30 },
        },
        robotsEnabled: { type: Boolean, default: false },
    },
    { timestamps: true }
);

// Yeni Site ayarları şeması
const NewSiteConfigSchema = new mongoose.Schema(
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

        // Koleksiyonları tanımla
        const OldSiteConfig = mongoose.model('SiteConfig', OldSiteConfigSchema, 'siteconfigs');

        // Mevcut tüm siteconfigs için bu şemayı kaldır (migrate için)
        if (mongoose.models.SiteConfig) {
            delete mongoose.models.SiteConfig;
        }

        const NewSiteConfig = mongoose.model('SiteConfig', NewSiteConfigSchema, 'siteconfigs');

        // Mevcut config kontrolü
        const existingConfig = await OldSiteConfig.findOne({});

        if (existingConfig) {
            console.log('Mevcut ayarlar bulundu. Güncelleme yapılıyor...');

            // Verileri dönüştür - mevcut title/description/keywords Türkçe olarak kabul edilecek
            // İngilizce için temel çeviriler oluştur
            const updateData = {
                contactEmail: existingConfig.contactEmail,
                displayEmail: existingConfig.displayEmail,
                logo: existingConfig.logo || existingConfig.seo?.ogImage || '/logo.webp', // Varsayılan logo
                seo: {
                    title: {
                        tr: existingConfig.seo?.title || 'Eylül Kurtcebe - Kişisel Portfolyo',
                        en: 'Eylul Kurtcebe - Personal Portfolio',
                    },
                    description: {
                        tr:
                            existingConfig.seo?.description ||
                            'Eylül Kurtcebe kişisel portfolyo sitesi. İç mimarlık, tasarım ve diğer projeler.',
                        en: 'Eylul Kurtcebe personal portfolio site. Interior architecture, design and other projects.',
                    },
                    keywords: {
                        tr:
                            existingConfig.seo?.keywords ||
                            'iç mimarlık, tasarım, portfolyo, eylül kurtcebe',
                        en: 'interior architecture, design, portfolio, eylul kurtcebe',
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
            const result = await NewSiteConfig.findByIdAndUpdate(existingConfig._id, updateData, {
                new: true,
                upsert: true,
            });

            console.log('Site ayarları güncellendi:');
            console.log(JSON.stringify(result, null, 2));
        } else {
            console.log('Mevcut site ayarı bulunamadı.');

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
            const newConfig = await NewSiteConfig.create(defaultConfig);
            console.log('Varsayılan site ayarları oluşturuldu:');
            console.log(JSON.stringify(newConfig, null, 2));
        }

        console.log('Güncelleme işlemi tamamlandı.');
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
