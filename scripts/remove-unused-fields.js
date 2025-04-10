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

// Ana fonksiyon
const removeUnusedFields = async () => {
    try {
        console.log('MongoDB bağlantısı yapılıyor...');
        await connectToDatabase();
        console.log('Bağlantı başarılı. Gereksiz alanları silme işlemi başlıyor...');

        // Koleksiyonları tanımla
        const Project =
            mongoose.models.Project ||
            mongoose.model('Project', new mongoose.Schema({}, { strict: false }));
        const ProjectTranslation =
            mongoose.models.ProjectTranslation ||
            mongoose.model('ProjectTranslation', new mongoose.Schema({}, { strict: false }));

        // Projelerden demo alanlarını kaldır
        console.log('Projelerden demo alanları kaldırılıyor...');
        await Project.updateMany({}, { $unset: { demo: 1 } });
        console.log('Demo alanları projelerden kaldırıldı.');

        // ProjectTranslation'dan demo alanını kaldır
        console.log('Proje çevirilerinden demo alanı kaldırılıyor...');
        await ProjectTranslation.updateMany({}, { $unset: { demo: 1 } });
        console.log('Demo alanı proje çevirilerinden kaldırıldı.');

        console.log('Gereksiz alanlar başarıyla kaldırıldı.');
        process.exit(0);
    } catch (error) {
        console.error('Gereksiz alanları kaldırırken hata oluştu:', error);
        process.exit(1);
    }
};

// Script'i çalıştır
removeUnusedFields();
