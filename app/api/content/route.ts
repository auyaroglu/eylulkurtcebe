import { NextRequest, NextResponse } from 'next/server';
import { getContentFromDB } from '@/lib/server-actions';
import { headers } from 'next/headers';

// API rotası için cache ayarları
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
    try {
        // URL'den locale parametresini al
        const locale = request.nextUrl.searchParams.get('locale') || 'tr';

        // Veritabanından içerik verilerini getir
        const content = await getContentFromDB(locale);

        if (!content) {
            return NextResponse.json(
                { error: `${locale} için içerik bulunamadı` },
                { status: 404 }
            );
        }

        // Cache headers ekle (10 dakika)
        const response = NextResponse.json(content);
        response.headers.set('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=60');

        return response;
    } catch (error) {
        console.error('API hatası:', error);
        return NextResponse.json(
            { error: 'İçerik verilerini getirirken bir hata oluştu' },
            { status: 500 }
        );
    }
}
