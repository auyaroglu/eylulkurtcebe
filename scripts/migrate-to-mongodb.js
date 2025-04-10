const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB bağlantısı
const connectToDatabase = async () => {
    if (!process.env.MONGODB_URI) {
        throw new Error('MONGODB_URI ortam değişkeni tanımlanmamış');
    }

    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB bağlantısı başarılı');
    } catch (error) {
        console.error('MongoDB bağlantı hatası:', error);
        throw error;
    }
};

// Modelleri tanımla
const ContentSchema = new mongoose.Schema(
    {
        locale: { type: String, required: true, enum: ['tr', 'en'], unique: true },
        nav: {
            home: { type: String, required: true },
            about: { type: String, required: true },
            skills: { type: String, required: true },
            projects: { type: String, required: true },
            contact: { type: String, required: true },
        },
        hero: {
            title: { type: String, required: true },
            description: { type: String, required: true },
            contactButton: { type: String, required: true },
            projectsButton: { type: String, required: true },
        },
        about: {
            title: { type: String, required: true },
            description: { type: String, required: true },
            experience: {
                title: { type: String, required: true },
                description: { type: String, required: true },
            },
            education: {
                title: { type: String, required: true },
                description: { type: String, required: true },
            },
        },
        skills: {
            title: { type: String, required: true },
            description: { type: String, required: true },
            categories: {
                frontend: {
                    title: { type: String, required: true },
                    skills: [
                        {
                            name: { type: String, required: true },
                            level: { type: Number, required: true, min: 0, max: 100 },
                        },
                    ],
                },
                backend: {
                    title: { type: String, required: true },
                    skills: [
                        {
                            name: { type: String, required: true },
                            level: { type: Number, required: true, min: 0, max: 100 },
                        },
                    ],
                },
                database: {
                    title: { type: String, required: true },
                    skills: [
                        {
                            name: { type: String, required: true },
                            level: { type: Number, required: true, min: 0, max: 100 },
                        },
                    ],
                },
            },
        },
        contact: {
            title: { type: String, required: true },
            description: { type: String, required: true },
            info: {
                title: { type: String, required: true },
                location: { type: String, required: true },
            },
            form: {
                title: { type: String, required: true },
                name: { type: String, required: true },
                email: { type: String, required: true },
                message: { type: String, required: true },
                submit: { type: String, required: true },
            },
        },
        footer: {
            description: { type: String, required: true },
            quickLinks: { type: String, required: true },
            contact: { type: String, required: true },
            location: { type: String, required: true },
            rights: { type: String, required: true },
        },
    },
    { timestamps: true }
);

const ProjectSchema = new mongoose.Schema(
    {
        locale: { type: String, required: true, enum: ['tr', 'en'] },
        id: { type: String, required: true },
        originalId: { type: String, required: true },
        title: { type: String, required: true },
        description: { type: String, required: true },
        images: [{ type: String, required: true }],
        technologies: [{ type: String, required: true }],
        demo: { type: String },
    },
    { timestamps: true }
);

// locale ve id birlikte benzersiz olmalı
ProjectSchema.index({ locale: 1, id: 1 }, { unique: true });

const ProjectTranslationSchema = new mongoose.Schema(
    {
        locale: { type: String, required: true, enum: ['tr', 'en'], unique: true },
        title: { type: String, required: true },
        description: { type: String, required: true },
        demo: { type: String, required: true },
        viewAll: { type: String, required: true },
        pagination: {
            previous: { type: String, required: true },
            next: { type: String, required: true },
            page: { type: String, required: true },
            of: { type: String, required: true },
        },
        projectsPage: {
            title: { type: String, required: true },
            description: { type: String, required: true },
            backToHome: { type: String, required: true },
            noProjects: { type: String, required: true },
            filters: {
                all: { type: String, required: true },
                title: { type: String, required: true },
            },
        },
        detail: {
            backToProjects: { type: String, required: true },
            technologies: { type: String, required: true },
            gallery: { type: String, required: true },
            relatedProjects: { type: String, required: true },
        },
        idMapping: { type: Map, of: String, required: true },
    },
    { timestamps: true }
);

// Modelleri oluştur
const Content = mongoose.models.Content || mongoose.model('Content', ContentSchema);
const Project = mongoose.models.Project || mongoose.model('Project', ProjectSchema);
const ProjectTranslation =
    mongoose.models.ProjectTranslation ||
    mongoose.model('ProjectTranslation', ProjectTranslationSchema);

// JSON dosyalarını okuma
const readJsonFile = filePath => {
    const fullPath = path.join(process.cwd(), filePath);
    const fileContent = fs.readFileSync(fullPath, 'utf8');
    return JSON.parse(fileContent);
};

// Ana fonksiyon
const migrateToMongoDB = async () => {
    try {
        console.log('MongoDB bağlantısı yapılıyor...');
        await connectToDatabase();
        console.log('Bağlantı başarılı. Veri taşıma işlemi başlıyor...');

        // JSON dosyalarını oku
        const trContent = readJsonFile('messages/tr.json');
        const enContent = readJsonFile('messages/en.json');

        // İçerik verilerini ayıklama
        const extractContentData = (content, locale) => {
            return {
                locale,
                nav: content.nav,
                hero: content.hero,
                about: content.about,
                skills: content.skills,
                contact: content.contact,
                footer: content.footer,
            };
        };

        // Proje çevirilerini ayıklama
        const extractProjectTranslations = (content, locale) => {
            const { projects } = content;
            return {
                locale,
                title: projects.title,
                description: projects.description,
                demo: projects.demo,
                viewAll: projects.viewAll,
                pagination: projects.pagination,
                projectsPage: projects.projectsPage,
                detail: projects.detail,
                idMapping: projects.idMapping,
            };
        };

        // Projeleri ayıklama
        const extractProjects = (content, locale) => {
            return content.projects.list.map(project => ({
                locale,
                id: project.id,
                originalId: project.originalId,
                title: project.title,
                description: project.description,
                images: project.images,
                technologies: project.technologies,
                demo: project.demo,
            }));
        };

        // Content kaydetme
        console.log('İçerik verileri aktarılıyor...');
        const trContentData = extractContentData(trContent, 'tr');
        const enContentData = extractContentData(enContent, 'en');

        // Mevcut içerikleri sil ve yeniden oluştur (upsert)
        await Content.findOneAndUpdate({ locale: 'tr' }, trContentData, {
            upsert: true,
            new: true,
        });
        await Content.findOneAndUpdate({ locale: 'en' }, enContentData, {
            upsert: true,
            new: true,
        });
        console.log('İçerikler aktarıldı.');

        // Proje çevirilerini kaydetme
        console.log('Proje çevirileri aktarılıyor...');
        const trProjectTranslations = extractProjectTranslations(trContent, 'tr');
        const enProjectTranslations = extractProjectTranslations(enContent, 'en');

        await ProjectTranslation.findOneAndUpdate({ locale: 'tr' }, trProjectTranslations, {
            upsert: true,
            new: true,
        });
        await ProjectTranslation.findOneAndUpdate({ locale: 'en' }, enProjectTranslations, {
            upsert: true,
            new: true,
        });
        console.log('Proje çevirileri aktarıldı.');

        // Projeleri kaydetme
        console.log('Projeler aktarılıyor...');
        const trProjects = extractProjects(trContent, 'tr');
        const enProjects = extractProjects(enContent, 'en');

        // Önce tüm projeleri sil
        await Project.deleteMany({});

        // Sonra yeniden ekle
        for (const project of trProjects) {
            await Project.create(project);
        }

        for (const project of enProjects) {
            await Project.create(project);
        }

        console.log('Projeler aktarıldı.');

        console.log('Veri aktarımı tamamlandı.');
        process.exit(0);
    } catch (error) {
        console.error('Veri aktarımı sırasında hata oluştu:', error);
        process.exit(1);
    }
};

// Tüm projeleri MongoDB'ye aktar
async function migrateProjects() {
    try {
        // JSON dosyalarını oku
        const trData = readJsonFile('messages/tr.json');
        const enData = readJsonFile('messages/en.json');

        // Mevcut projeleri bul ve güncelle
        console.log('Mevcut projeler bulunuyor...');
        const existingProjects = await Project.find({});
        console.log(`${existingProjects.length} mevcut proje bulundu.`);

        // Her bir projeyi güncelle
        for (const project of existingProjects) {
            const locale = project.locale;
            const id = project.id;

            console.log(`Güncelleniyor: ${locale}/${id}`);

            // Varsayılan yayın durumunu ayarla
            const status = locale === 'tr' ? true : false;

            // Projeyi güncelle
            await Project.updateOne({ locale, id }, { $set: { status } });

            console.log(
                `${locale}/${id} ID'li projenin status değeri '${
                    status ? 'Yayında' : 'Gizli'
                }' olarak güncellendi.`
            );
        }

        return true;
    } catch (error) {
        console.error('Projeleri güncellerken hata:', error);
        return false;
    }
}

// Script'i çalıştır
async function runMigration() {
    try {
        console.log('MongoDB bağlantısı yapılıyor...');
        await connectToDatabase();
        console.log('Bağlantı başarılı.');

        console.log('Projeler aktarılıyor...');
        await migrateProjects();
        console.log('Projeler başarıyla aktarıldı.');

        console.log('Veri taşıma işlemi başarıyla tamamlandı.');
        process.exit(0);
    } catch (error) {
        console.error('Veri taşıma sırasında bir hata oluştu:', error);
        process.exit(1);
    }
}

runMigration();
