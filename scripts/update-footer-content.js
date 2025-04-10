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
 * Footer yapısını güncelleyen migration
 */
async function updateFooterStructure() {
    try {
        await connectToDatabase();
        console.log('Veritabanına bağlandı. Footer yapısı güncelleniyor...');

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

        console.log('Mevcut içerikler alındı, footer yapısı güncelleniyor...');

        // TR içeriğinin footer yapısını güncelle
        const updatedTrFooter = {
            description: trContent.footer.description || 'Site ile ilgili açıklama',
            quickLinks: {
                title: trContent.footer.quickLinks || 'Hızlı Bağlantılar',
                links: [
                    { label: 'Ana Sayfa', url: '/#hero' },
                    { label: 'Hakkımda', url: '/#about' },
                    { label: 'Yetenekler', url: '/#skills' },
                    { label: 'Eserler', url: '/#projects' },
                    { label: 'İletişim', url: '/#contact' },
                ],
            },
            contact: {
                title: trContent.footer.contact || 'İletişim',
                email: 'info@eylulkurtcebe.com',
                location: trContent.footer.location || 'İstanbul, Türkiye',
                instagram: 'eylulkurtcebe',
            },
            socialMedia: {
                email: 'info@eylulkurtcebe.com',
                linkedin: 'eylul-kurtcebe',
                instagram: 'eylulkurtcebe',
            },
            rights: trContent.footer.rights || 'Tüm hakları saklıdır.',
        };

        // EN içeriğinin footer yapısını güncelle
        const updatedEnFooter = {
            description: enContent.footer.description || 'Website description',
            quickLinks: {
                title: enContent.footer.quickLinks || 'Quick Links',
                links: [
                    { label: 'Home', url: '/#hero' },
                    { label: 'About', url: '/#about' },
                    { label: 'Skills', url: '/#skills' },
                    { label: 'Works', url: '/#projects' },
                    { label: 'Contact', url: '/#contact' },
                ],
            },
            contact: {
                title: enContent.footer.contact || 'Contact',
                email: 'info@eylulkurtcebe.com',
                location: enContent.footer.location || 'Istanbul, Turkey',
                instagram: 'eylulkurtcebe',
            },
            socialMedia: {
                email: 'info@eylulkurtcebe.com',
                linkedin: 'eylul-kurtcebe',
                instagram: 'eylulkurtcebe',
            },
            rights: enContent.footer.rights || 'All rights reserved.',
        };

        // Veritabanında doğrudan güncellemeleri yap
        await mongoose.connection.db
            .collection('contents')
            .updateOne({ locale: 'tr' }, { $set: { footer: updatedTrFooter } });
        console.log('Türkçe footer güncellemesi tamamlandı');

        await mongoose.connection.db
            .collection('contents')
            .updateOne({ locale: 'en' }, { $set: { footer: updatedEnFooter } });
        console.log('İngilizce footer güncellemesi tamamlandı');

        console.log('Footer yapısı başarıyla güncellendi!');
    } catch (error) {
        console.error('Footer güncelleme hatası:', error);
    } finally {
        // Bağlantıyı kapat
        await mongoose.connection.close();
        console.log('Veritabanı bağlantısı kapatıldı');
    }
}

// Migration'ı çalıştır
updateFooterStructure()
    .then(() => {
        console.log('İşlem tamamlandı');
        process.exit(0);
    })
    .catch(error => {
        console.error('İşlem sırasında hata oluştu:', error);
        process.exit(1);
    });
