import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

// JWT token'ı doğrulama
export interface AuthResult {
    isAuthenticated: boolean;
    userId?: string;
    error?: string;
}

export async function verifyAuth(request: Request): Promise<AuthResult> {
    try {
        // Authorization header'ından Bearer token'ı çıkar
        const authHeader = request.headers.get('Authorization');

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return { isAuthenticated: false, error: 'Geçersiz token formatı' };
        }

        const token = authHeader.split(' ')[1];
        const secret = process.env.JWT_SECRET;

        if (!secret) {
            console.error('JWT_SECRET tanımlanmamış!');
            return { isAuthenticated: false, error: 'Sunucu yapılandırma hatası' };
        }

        // JWT token'ı doğrula
        const decoded = jwt.verify(token, secret) as jwt.JwtPayload;

        if (!decoded || !decoded.userId) {
            return { isAuthenticated: false, error: 'Geçersiz token' };
        }

        // Başarılı doğrulama
        return {
            isAuthenticated: true,
            userId: decoded.userId,
        };
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            return { isAuthenticated: false, error: 'Token süresi doldu' };
        } else if (error instanceof jwt.JsonWebTokenError) {
            return { isAuthenticated: false, error: 'Geçersiz token' };
        }

        console.error('Token doğrulama hatası:', error);
        return { isAuthenticated: false, error: 'Doğrulama başarısız' };
    }
}
