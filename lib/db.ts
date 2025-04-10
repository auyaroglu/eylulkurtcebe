import mongoose from 'mongoose';

if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI ortam değişkeni tanımlanmamış');
}

const MONGODB_URI = process.env.MONGODB_URI;

/**
 * Global değişkenler
 */
interface Global {
    mongoose: {
        conn: typeof mongoose | null;
        promise: Promise<typeof mongoose> | null;
    };
}

// TypeScript global bildirimi
declare const global: Global;

// Mongoose cache tanımı
let cached = global.mongoose;

if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

/**
 * Veritabanına bağlanmak için kullanılan fonksiyon
 * @returns Mongoose bağlantısı
 */
export async function connectToDatabase() {
    if (cached.conn) {
        return cached.conn;
    }

    if (!cached.promise) {
        const opts = {
            bufferCommands: false,
        };

        cached.promise = mongoose.connect(MONGODB_URI, opts).then(mongoose => {
            console.log('MongoDB bağlantısı başarılı');
            return mongoose;
        });
    }

    try {
        cached.conn = await cached.promise;
    } catch (e) {
        cached.promise = null;
        console.error('MongoDB bağlantı hatası:', e);
        throw e;
    }

    return cached.conn;
}

/**
 * Veritabanından tüm projeleri getiren fonksiyon
 * @param lng Dil kodu
 * @returns Projelerin listesi
 */
export async function getProjectsFromDatabase(lng: string) {
    try {
        await connectToDatabase();

        // Veritabanı modelini alıp projeleri sorgula
        // Not: Bu model yapınıza göre değişebilir
        const Project =
            mongoose.models.Project ||
            mongoose.model(
                'Project',
                new mongoose.Schema({
                    id: String,
                    originalId: String,
                    locale: String,
                    title: String,
                    description: String,
                    images: [String],
                    technologies: [String],
                    demo: String,
                    createdAt: Date,
                    updatedAt: Date,
                })
            );

        // Proje sıralamasına göre sırala ve dile göre filtrele
        // Veritabanı yapınıza göre aşağıdaki sorgu şekillerinden birini kullanabilirsiniz
        let query = { locale: lng };

        // 1. Eğer projeler 'language' alanı ile saklanıyorsa:
        // query = { language: lng };

        // 2. Eğer projeler 'locale' alanı ile saklanıyorsa (Şu anda bu kullanılıyor):
        // query = { locale: lng };

        // 3. Eğer projeler dile özgü alanlara sahipse (örn. title_en, title_tr):
        // query = {}; // Tüm projeleri çek, sonra kodda filtreleme yap

        // 4. Eğer projeler dil bazlı altkoleksiyonlara sahipse:
        // query = { 'translations.language': lng };

        // Veritabanı yapınıza en uygun sorguyu seçin ve diğerlerini yorum satırı yapın
        const db = mongoose.connection;
        const projectsCollection = db.collection('projects');
        const projects = await projectsCollection.find(query).sort({ order: 1 }).toArray();

        // MongoDB lean() kullanıldığında dönen belge tiplemesi
        type LeanDocument = {
            _id: any; // lean() ile dönen belgede _id herhangi bir tipte olabilir
            [key: string]: any; // diğer tüm alanlar
        };

        return projects.map((project: LeanDocument) => ({
            id: project.id || '',
            originalId: project.originalId || '',
            title: project.title || '',
            description: project.description || '',
            images: project.images || [],
            technologies: project.technologies || [],
            demo: project.demo || '',
        }));
    } catch (error) {
        console.error('Projeler getirilirken veritabanı hatası:', error);
        return [];
    }
}

export default connectToDatabase;
