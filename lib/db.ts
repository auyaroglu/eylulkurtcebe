import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI!;

// Global bağlantı durumu takibi için değişken
let cachedConnection: typeof mongoose | null = null;
let connectionPromise: Promise<typeof mongoose> | null = null;

// Mongoose'un debug mesajlarını kapat
mongoose.set('debug', false);

// Mongoose bağlantı seçenekleri
const options: mongoose.ConnectOptions = {
    maxPoolSize: 10, // Bağlantı havuzundaki maksimum bağlantı sayısı
    minPoolSize: 2, // Minimum bağlantı sayısı
    serverSelectionTimeoutMS: 5000, // Sunucu seçim zaman aşımı
    socketTimeoutMS: 45000, // Soket zaman aşımı
    connectTimeoutMS: 10000, // Bağlantı zaman aşımı
};

if (!MONGODB_URI) {
    throw new Error('MONGODB_URI çevre değişkeni tanımlanmamış');
}

/**
 * Singleton veritabanı bağlantısı - yeni bağlantı açmak yerine mevcut olanı kullanır
 */
export async function connectToDatabase(): Promise<typeof mongoose> {
    // Zaten bağlantı kurulmuşsa onu döndür
    if (mongoose.connection.readyState === 1) {
        return mongoose;
    }

    // Zaten bir bağlantı açma işlemi devam ediyorsa, onu bekle ve döndür
    if (connectionPromise) {
        return connectionPromise;
    }

    // Yeni bir bağlantı oluştur
    try {
        connectionPromise = mongoose.connect(MONGODB_URI, options);
        cachedConnection = await connectionPromise;

        // Bağlantı başarıyla kurulduğunda
        mongoose.connection.on('connected', () => {
            console.log('MongoDB bağlantısı başarıyla kuruldu');
        });

        // Bağlantı hatasında
        mongoose.connection.on('error', err => {
            console.error('MongoDB bağlantı hatası:', err);
        });

        // Uygulama kapatıldığında bağlantıyı kapat
        process.on('SIGINT', async () => {
            await mongoose.connection.close();
            process.exit(0);
        });

        return cachedConnection;
    } catch (error) {
        console.error('MongoDB bağlantısı kurulamadı:', error);
        connectionPromise = null;
        throw error;
    }
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
