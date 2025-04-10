import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export interface JwtPayload {
    id: string;
    username: string;
    isAdmin: boolean;
}

/**
 * JWT token'ı doğrulayan middleware
 * @param request - Next.js isteği
 * @returns NextResponse
 */
export async function validateToken(request: NextRequest) {
    try {
        // Auth header'dan token'ı al
        const authHeader = request.headers.get('authorization');

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return {
                isValid: false,
                error: "Yetkilendirme token'ı bulunamadı",
                statusCode: 401,
            };
        }

        const token = authHeader.split(' ')[1];

        if (!process.env.JWT_SECRET) {
            return {
                isValid: false,
                error: 'Sunucu yapılandırma hatası',
                statusCode: 500,
            };
        }

        // Token'ı doğrula
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET) as JwtPayload;

        if (!decodedToken.isAdmin) {
            return {
                isValid: false,
                error: 'Yetkisiz erişim',
                statusCode: 403,
            };
        }

        return {
            isValid: true,
            user: decodedToken,
        };
    } catch (error) {
        console.error('Token doğrulama hatası:', error);

        if (error instanceof jwt.JsonWebTokenError) {
            return {
                isValid: false,
                error: 'Geçersiz token',
                statusCode: 401,
            };
        }

        if (error instanceof jwt.TokenExpiredError) {
            return {
                isValid: false,
                error: 'Token süresi doldu',
                statusCode: 401,
            };
        }

        return {
            isValid: false,
            error: 'Sunucu hatası',
            statusCode: 500,
        };
    }
}

/**
 * API rotalarını koruyan middleware
 */
export function withAuth(handler: Function) {
    return async function (request: NextRequest, ...args: any[]) {
        const validation = await validateToken(request);

        if (!validation.isValid) {
            return NextResponse.json(
                { error: validation.error },
                { status: validation.statusCode }
            );
        }

        // İsteği geçerli kullanıcı bilgisiyle devam ettir
        return handler(request, validation.user, ...args);
    };
}
