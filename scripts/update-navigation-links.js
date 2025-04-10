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
 * Navigasyon yapısını güncelleyen migration
 */
async function updateNavigationStructure() {
    try {
        await connectToDatabase();
        console.log('Veritabanına bağlandı. Navigasyon yapısı güncelleniyor...');

        // İlk olarak mevcut içerikleri fetch et
        const trContent = await mongoose.connection.db
            .collection('contents')
            .findOne({ locale: 'tr' });
        if (!trContent) {
            console.error('Türkçe içerik bulunamadı');
            return;
        }

        const enContent = await mongoose.connection.db
            .collection('contents')
            .findOne({ locale: 'en' });
        if (!enContent) {
            console.error('İngilizce içerik bulunamadı');
            return;
        }

        console.log('Mevcut içerikler alındı, navigasyon yapısı güncelleniyor...');

        // Türkçe içeriğin navigasyon yapısını güncelle
        const trNav = trContent.nav;
        const updatedTrNav = {
            links: [
                { label: trNav.home || 'Ana Sayfa', url: '/#hero' },
                { label: trNav.about || 'Hakkımda', url: '/#about' },
                { label: trNav.skills || 'Yetenekler', url: '/#skills' },
                { label: trNav.projects || 'Eserler', url: '/projeler' },
                { label: trNav.contact || 'İletişim', url: '/#contact' },
            ],
        };

        // İngilizce içeriğin navigasyon yapısını güncelle
        const enNav = enContent.nav;
        const updatedEnNav = {
            links: [
                { label: enNav.home || 'Home', url: '/#hero' },
                { label: enNav.about || 'About', url: '/#about' },
                { label: enNav.skills || 'Skills', url: '/#skills' },
                { label: enNav.projects || 'Works', url: '/en/projects' },
                { label: enNav.contact || 'Contact', url: '/#contact' },
            ],
        };

        // Veritabanında doğrudan güncellemeleri yap
        await mongoose.connection.db
            .collection('contents')
            .updateOne({ locale: 'tr' }, { $set: { nav: updatedTrNav } });
        console.log('Türkçe navigasyon güncellemesi tamamlandı');

        await mongoose.connection.db
            .collection('contents')
            .updateOne({ locale: 'en' }, { $set: { nav: updatedEnNav } });
        console.log('İngilizce navigasyon güncellemesi tamamlandı');

        console.log('Navigasyon yapısı başarıyla güncellendi!');
    } catch (error) {
        console.error('Navigasyon güncelleme hatası:', error);
    } finally {
        // Bağlantıyı kapat
        await mongoose.connection.close();
        console.log('Veritabanı bağlantısı kapatıldı');
    }
}

// Migration'ı çalıştır
updateNavigationStructure()
    .then(() => {
        console.log('İşlem tamamlandı');
        process.exit(0);
    })
    .catch(error => {
        console.error('İşlem sırasında hata oluştu:', error);
        process.exit(1);
    });
