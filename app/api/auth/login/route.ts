import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import User from '@/models/User';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// Manuel şifre karşılaştırma fonksiyonu
async function comparePassword(hashedPassword: string, plainPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
}

export async function POST(request: NextRequest) {
    try {
        const { username, password } = await request.json();

        // Validasyon
        if (!username || !password) {
            return NextResponse.json(
                { error: 'Kullanıcı adı ve şifre gereklidir' },
                { status: 400 }
            );
        }

        // Veritabanına bağlan
        await connectToDatabase();

        // MongoDB koleksiyonuna doğrudan erişim
        const db = mongoose.connection;
        const usersCollection = db.collection('users');

        // Kullanıcıyı bul
        const user = await usersCollection.findOne({ username });

        if (!user) {
            return NextResponse.json(
                { error: 'Geçersiz kullanıcı adı veya şifre' },
                { status: 401 }
            );
        }

        // Şifreyi kontrol et
        const isPasswordValid = await comparePassword(user.password, password);

        if (!isPasswordValid) {
            return NextResponse.json(
                { error: 'Geçersiz kullanıcı adı veya şifre' },
                { status: 401 }
            );
        }

        // JWT secretı doğrula
        if (!process.env.JWT_SECRET) {
            return NextResponse.json({ error: 'Sunucu yapılandırma hatası' }, { status: 500 });
        }

        // JWT token oluştur
        const token = jwt.sign(
            {
                id: user._id,
                username: user.username,
                isAdmin: user.isAdmin,
            },
            process.env.JWT_SECRET,
            { expiresIn: '12h' }
        );

        // Yanıt döndür
        return NextResponse.json({
            message: 'Giriş başarılı',
            user: {
                id: user._id,
                username: user.username,
                isAdmin: user.isAdmin,
            },
            token,
        });
    } catch (error) {
        console.error('Giriş hatası:', error);
        return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
    }
}
