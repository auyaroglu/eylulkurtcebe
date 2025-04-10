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

// Slugify fonksiyonu - Türkçe karakterleri destekler
function slugify(text) {
    if (!text) return '';

    // Türkçe karakterleri değiştir
    const turkishMap = {
        ı: 'i',
        ğ: 'g',
        ü: 'u',
        ş: 's',
        ö: 'o',
        ç: 'c',
        İ: 'I',
        Ğ: 'G',
        Ü: 'U',
        Ş: 'S',
        Ö: 'O',
        Ç: 'C',
    };

    // Türkçe karakterleri dönüştür
    let result = text.replace(/[ıİğĞüÜşŞöÖçÇ]/g, match => turkishMap[match]);

    // Metni küçük harfe çevir ve diğer dönüşümleri yap
    return result
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\-]/g, '-') // Alfanümerik olmayan her karakteri tire ile değiştir
        .replace(/\-+/g, '-') // Birden fazla tireyi tek tireye dönüştür
        .replace(/^\-|\-$/g, ''); // Baştaki ve sondaki tireleri kaldır
}

// ID'leri slug formatına dönüştürme
async function convertIdsToSlug() {
    try {
        // Mevcut projeleri bul
        console.log('Mevcut projeler bulunuyor...');
        const existingProjects = await Project.find({});
        console.log(`${existingProjects.length} mevcut proje bulundu.`);

        if (existingProjects.length === 0) {
            console.log('Güncellenecek proje bulunamadı.');
            return true;
        }

        const projectMap = new Map(); // Çakışmaları kontrol etmek için
        let updateCount = 0;

        // İşleme sırasında kullanılmış slugları takip et
        const usedSlugs = new Set();

        // Önce her projeyi incele ve olası slugları hesapla
        for (const project of existingProjects) {
            if (!project.title) {
                console.log(
                    `${project.locale}/${project.id} ID'li projenin başlığı yok, slug oluşturulamadı.`
                );
                continue;
            }

            // Başlıktan slug oluştur
            let newSlug = slugify(project.title);

            // Eğer slug daha önce kullanılmışsa, sonuna numara ekle
            if (usedSlugs.has(`${project.locale}-${newSlug}`)) {
                let counter = 1;
                let tempSlug = `${newSlug}-${counter}`;

                while (usedSlugs.has(`${project.locale}-${tempSlug}`)) {
                    counter++;
                    tempSlug = `${newSlug}-${counter}`;
                }

                newSlug = tempSlug;
            }

            // Slug'ı kullanıldı olarak işaretle
            usedSlugs.add(`${project.locale}-${newSlug}`);

            // Projeyi ve yeni slug'ı kaydet
            projectMap.set(project._id.toString(), {
                oldId: project.id,
                newId: newSlug,
                locale: project.locale,
            });
        }

        // Şimdi projeleri güncelle
        for (const [projectId, data] of projectMap.entries()) {
            console.log(
                `${data.locale}/${data.oldId} -> ${data.locale}/${data.newId} olarak güncelleniyor...`
            );

            await Project.updateOne(
                { _id: new mongoose.Types.ObjectId(projectId) },
                { $set: { id: data.newId } }
            );

            updateCount++;
            console.log(`Proje başarıyla güncellendi.`);
        }

        console.log(`Toplam ${updateCount} projenin ID alanı slug formatına dönüştürüldü.`);
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

        console.log('ID alanları slug formatına dönüştürülüyor...');
        await convertIdsToSlug();
        console.log('Dönüşüm işlemi başarıyla tamamlandı.');

        console.log('İşlem başarıyla tamamlandı.');
        process.exit(0);
    } catch (error) {
        console.error('Bir hata oluştu:', error);
        process.exit(1);
    }
}

runScript();
