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

// User modelini oluştur
const UserSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            minlength: 3,
        },
        password: {
            type: String,
            required: true,
            minlength: 6,
        },
        isAdmin: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

// bcrypt kütüphanesini kullanarak şifre hashleme
const bcrypt = require('bcryptjs');

// Şifre karşılaştırma metodu
UserSchema.methods.comparePassword = async function (password) {
    return bcrypt.compare(password, this.password);
};

// Model oluşturma
const User = mongoose.models.User || mongoose.model('User', UserSchema);

// Admin kullanıcısı oluşturma
const createAdminUser = async () => {
    try {
        console.log('MongoDB bağlantısı yapılıyor...');
        await connectToDatabase();
        console.log('Bağlantı başarılı. Admin kullanıcısı oluşturuluyor...');

        // Kullanıcı zaten var mı kontrol et
        const existingUser = await User.findOne({ username: 'admin' });

        if (existingUser) {
            console.log('Admin kullanıcısı zaten mevcut!');
            process.exit(0);
        }

        // Şifreyi hashle
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('Test.123!', salt);

        // Yeni admin kullanıcısı oluştur
        const adminUser = new User({
            username: 'admin',
            password: hashedPassword,
            isAdmin: true,
        });

        // Kullanıcıyı kaydet
        await adminUser.save();

        console.log('Admin kullanıcısı başarıyla oluşturuldu!');
        console.log('Kullanıcı adı: admin');
        console.log('Şifre: Test.123!');

        process.exit(0);
    } catch (error) {
        console.error('Admin kullanıcısı oluşturulurken hata oluştu:', error);
        process.exit(1);
    }
};

// Script'i çalıştır
createAdminUser();
