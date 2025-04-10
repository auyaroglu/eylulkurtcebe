import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import User from '@/models/User';
import { withAuth } from '@/lib/auth-middleware';

// Şifre değiştirme işlemi
async function changePasswordHandler(request: NextRequest, user: any) {
    try {
        // Veritabanı bağlantısı
        await connectToDatabase();

        // İstek gövdesini al
        const body = await request.json();
        const { currentPassword, newPassword } = body;

        // Validasyon kontrolü
        if (!currentPassword || !newPassword) {
            return NextResponse.json(
                { error: 'Mevcut şifre ve yeni şifre gereklidir' },
                { status: 400 }
            );
        }

        if (newPassword.length < 6) {
            return NextResponse.json(
                { error: 'Yeni şifre en az 6 karakter uzunluğunda olmalıdır' },
                { status: 400 }
            );
        }

        // Kullanıcıyı bul
        // @ts-ignore - Mongoose tip sorunlarını görmezden gel
        const foundUser = await User.findById(user.id);
        if (!foundUser) {
            return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 });
        }

        // Mevcut şifreyi kontrol et
        const isMatch = await foundUser.comparePassword(currentPassword);
        if (!isMatch) {
            return NextResponse.json({ error: 'Mevcut şifre yanlış' }, { status: 400 });
        }

        // Şifreyi güncelle
        foundUser.password = newPassword;
        await foundUser.save();

        return NextResponse.json(
            { success: true, message: 'Şifre başarıyla güncellendi' },
            { status: 200 }
        );
    } catch (error) {
        console.error('Şifre değiştirme hatası:', error);
        return NextResponse.json(
            { error: 'Sunucu hatası, şifre değiştirilemedi' },
            { status: 500 }
        );
    }
}

export const PUT = withAuth(changePasswordHandler);
