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

// Proje modeli
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
        order: { type: Number, default: 0 },
        status: { type: Boolean, default: false },
        seo: {
            metaTitle: { type: String, default: '' },
            metaDescription: { type: String, default: '' },
            metaKeywords: { type: String, default: '' },
            ogTitle: { type: String, default: '' },
            ogDescription: { type: String, default: '' },
            ogImage: { type: String, default: '' },
        },
    },
    { timestamps: true }
);

// locale ve id birlikte benzersiz olmalı
ProjectSchema.index({ locale: 1, id: 1 }, { unique: true });

const Project = mongoose.models.Project || mongoose.model('Project', ProjectSchema);

// SEO alanlarını ekleme
async function addSeoFields() {
    try {
        // Mevcut projeleri bul
        console.log('Mevcut projeler bulunuyor...');
        const existingProjects = await Project.find({});
        console.log(`${existingProjects.length} mevcut proje bulundu.`);

        if (existingProjects.length === 0) {
            console.log('Güncellenecek proje bulunamadı.');
            return true;
        }

        // Her bir projeyi güncelle
        let updateCount = 0;

        for (const project of existingProjects) {
            const locale = project.locale;
            const id = project.id;

            // SEO alanları için varsayılan değerler oluştur
            const defaultSeo = {
                metaTitle: project.title,
                metaDescription:
                    project.description.substring(0, 155) +
                    (project.description.length > 155 ? '...' : ''),
                metaKeywords: project.technologies.join(', '),
                ogTitle: project.title,
                ogDescription:
                    project.description.substring(0, 155) +
                    (project.description.length > 155 ? '...' : ''),
                ogImage: project.images.length > 0 ? project.images[0] : '',
            };

            console.log(`Güncelleniyor: ${locale}/${id}`);

            // Update işlemi
            await Project.updateOne({ locale, id }, { $set: { seo: defaultSeo } });

            console.log(`${locale}/${id} için SEO alanları başarıyla eklendi.`);
            updateCount++;
        }

        console.log(`Toplam ${updateCount} projenin SEO alanları güncellendi.`);
        return true;
    } catch (error) {
        console.error('Projeleri güncellerken hata:', error);
        return false;
    }
}

// Script'i çalıştır
async function runScript() {
    try {
        console.log('MongoDB bağlantısı yapılıyor...');
        await connectToDatabase();
        console.log('Bağlantı başarılı.');

        console.log('SEO alanları ekleniyor...');
        await addSeoFields();
        console.log('SEO alanları başarıyla eklendi.');

        console.log('İşlem başarıyla tamamlandı.');
        process.exit(0);
    } catch (error) {
        console.error('Bir hata oluştu:', error);
        process.exit(1);
    }
}

runScript();
