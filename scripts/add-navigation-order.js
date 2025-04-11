// add-navigation-order.js
// Bu script, Content koleksiyonundaki tüm navigasyon bağlantılarına order alanı ekler

require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');

// MongoDB bağlantı bilgileri
const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB;

async function run() {
    if (!uri) {
        console.error('MONGODB_URI çevresel değişkeni ayarlanmamış!');
        process.exit(1);
    }

    console.log("MongoDB'ye bağlanılıyor...");
    const client = new MongoClient(uri);

    try {
        await client.connect();
        console.log("MongoDB'ye başarıyla bağlandı!");

        const database = client.db(dbName);
        const contents = database.collection('contents');

        // Tüm içerikleri al
        const allContents = await contents.find({}).toArray();
        console.log(`${allContents.length} içerik bulundu.`);

        let updatedCount = 0;

        // Her içerik için işlem yap
        for (const content of allContents) {
            console.log(`İşleniyor: ${content.locale} dilindeki içerik`);

            // Nav links kontrolü
            if (content.nav && Array.isArray(content.nav.links)) {
                // Her bağlantıya sıra numarası ekle
                const updatedLinks = content.nav.links.map((link, index) => {
                    // Eğer order zaten varsa değiştirme, yoksa ekle
                    if (link.order === undefined) {
                        return { ...link, order: index };
                    }
                    return link;
                });

                // Değişiklikleri uygula
                const updateResult = await contents.updateOne(
                    { _id: content._id },
                    {
                        $set: {
                            'nav.links': updatedLinks,
                        },
                    }
                );

                if (updateResult.modifiedCount > 0) {
                    updatedCount++;
                    console.log(`${content.locale} dilindeki navigasyon bağlantıları güncellendi.`);
                } else {
                    console.log(
                        `${content.locale} dilindeki navigasyon bağlantıları zaten güncel.`
                    );
                }
            } else {
                console.log(`${content.locale} dilinde navigasyon bağlantıları bulunamadı.`);
            }
        }

        console.log(`İşlem tamamlandı. ${updatedCount} içerik güncellendi.`);
    } catch (err) {
        console.error('Hata oluştu:', err);
    } finally {
        await client.close();
        console.log('MongoDB bağlantısı kapatıldı.');
    }
}

run().catch(console.dir);
