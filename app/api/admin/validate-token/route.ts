import { NextRequest, NextResponse } from 'next/server';
import { validateToken } from '@/lib/auth-middleware';

export async function GET(request: NextRequest) {
    try {
        // Token'ı doğrula
        const validation = await validateToken(request);

        if (!validation.isValid) {
            return NextResponse.json(
                { error: validation.error },
                { status: validation.statusCode }
            );
        }

        // Token geçerliyse kullanıcı bilgilerini dön
        // validation.isValid true olduğunda validation.user de tanımlı olacak
        return NextResponse.json({
            success: true,
            user: {
                username: validation.user?.username || '',
                isAdmin: validation.user?.isAdmin || false,
            },
        });
    } catch (error) {
        console.error('Token doğrulama hatası:', error);
        return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
    }
}
