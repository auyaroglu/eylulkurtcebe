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

/**
 * JSON dosyalarındaki skills verisini MongoDB'ye aktaran fonksiyon
 */
async function migrateSkillsFromJsonToMongoDB() {
    try {
        await connectToDatabase();
        console.log('MongoDB bağlantısı kuruldu. Skills verisi aktarılıyor...');

        // JSON dosyalarından verileri oku
        const trJsonPath = path.join(__dirname, '..', 'messages', 'tr.json');
        const enJsonPath = path.join(__dirname, '..', 'messages', 'en.json');

        if (!fs.existsSync(trJsonPath) || !fs.existsSync(enJsonPath)) {
            console.error('JSON dosyaları bulunamadı');
            return;
        }

        const trData = JSON.parse(fs.readFileSync(trJsonPath, 'utf8'));
        const enData = JSON.parse(fs.readFileSync(enJsonPath, 'utf8'));

        // Türkçe içeriği güncelle
        const trContent = await mongoose.connection.db
            .collection('contents')
            .findOne({ locale: 'tr' });

        if (trContent) {
            // tr.json'dan alınan skills verilerini içeriğe ekle
            const trSkills = trData.skills;
            await mongoose.connection.db
                .collection('contents')
                .updateOne({ locale: 'tr' }, { $set: { skills: trSkills } });
            console.log('Türkçe içeriğe skills verisi aktarıldı');
        } else {
            console.error('Türkçe içerik veritabanında bulunamadı');
        }

        // İngilizce içeriği güncelle
        const enContent = await mongoose.connection.db
            .collection('contents')
            .findOne({ locale: 'en' });

        if (enContent) {
            // en.json'dan alınan skills verilerini içeriğe ekle
            const enSkills = enData.skills;
            await mongoose.connection.db
                .collection('contents')
                .updateOne({ locale: 'en' }, { $set: { skills: enSkills } });
            console.log('İngilizce içeriğe skills verisi aktarıldı');
        } else {
            console.error('İngilizce içerik veritabanında bulunamadı');
        }

        console.log("Skills verisi JSON dosyalarından MongoDB'ye başarıyla aktarıldı");
    } catch (error) {
        console.error('Skills verisi aktarma hatası:', error);
    } finally {
        // Bağlantıyı kapat
        await mongoose.connection.close();
        console.log('Veritabanı bağlantısı kapatıldı');
    }
}

// Migration'ı çalıştır
migrateSkillsFromJsonToMongoDB()
    .then(() => {
        console.log('İşlem tamamlandı');
        process.exit(0);
    })
    .catch(error => {
        console.error('İşlem sırasında hata oluştu:', error);
        process.exit(1);
    });
