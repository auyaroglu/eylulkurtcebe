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
    },
    { timestamps: true }
);

// locale ve id birlikte benzersiz olmalı
ProjectSchema.index({ locale: 1, id: 1 }, { unique: true });

const Project = mongoose.models.Project || mongoose.model('Project', ProjectSchema);

// Status alanını güncelleme
async function updateStatusField() {
    try {
        // Mevcut projeleri bul
        console.log('Mevcut projeler bulunuyor...');
        const existingProjects = await Project.find({});
        console.log(`${existingProjects.length} mevcut proje bulundu.`);

        if (existingProjects.length === 0) {
            console.log('Güncellenecek proje bulunamadı.');
            return true;
        }

        // İşlenen originalId'leri tutmak için bir set oluşturalım (çift güncelleme olmaması için)
        const processedOriginalIds = new Set();

        // Her bir projeyi güncelle
        let updateCount = 0;

        // Önce Türkçe projeleri işleyelim
        for (const project of existingProjects) {
            if (project.locale !== 'tr') continue;

            const locale = project.locale;
            const id = project.id;
            const originalId = project.originalId;

            if (processedOriginalIds.has(originalId)) {
                console.log(`${originalId} daha önce işlenmiş, atlıyorum.`);
                continue;
            }

            console.log(`Güncelleniyor: ${locale}/${id} (originalId: ${originalId})`);

            // Türkçe için status = true
            await Project.updateOne({ originalId }, { $set: { status: true } });

            console.log(`${originalId} originalId'li Türkçe proje 'Yayında' olarak güncellendi.`);
            processedOriginalIds.add(originalId);
            updateCount++;

            // Aynı originalId ile İngilizce karşılığını bul ve güncelle
            const enProject = existingProjects.find(
                p => p.locale === 'en' && p.originalId === originalId
            );

            if (enProject) {
                console.log(`Güncelleniyor: en/${enProject.id} (originalId: ${originalId})`);
                await Project.updateOne({ locale: 'en', originalId }, { $set: { status: false } });
                console.log(
                    `${originalId} originalId'li İngilizce proje 'Gizli' olarak güncellendi.`
                );
                updateCount++;
            } else {
                console.log(`${originalId} için İngilizce karşılık bulunamadı.`);
            }
        }

        console.log(`Toplam ${updateCount} projenin status alanı güncellendi.`);
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

        console.log('Status alanı ekleniyor...');
        await updateStatusField();
        console.log('Status alanı başarıyla eklendi.');

        console.log('İşlem başarıyla tamamlandı.');
        process.exit(0);
    } catch (error) {
        console.error('Bir hata oluştu:', error);
        process.exit(1);
    }
}

runScript();
