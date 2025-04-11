import { NextRequest, NextResponse } from 'next/server';
import { getProjectsFromDB } from '@/lib/server-actions';

// API rotası için cache ayarları
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
    try {
        // URL'den locale ve id parametrelerini al
        const locale = request.nextUrl.searchParams.get('locale') || 'tr';
        const projectId = request.nextUrl.searchParams.get('id') || undefined;

        // Veritabanından proje verilerini getir
        const projects = await getProjectsFromDB(locale, projectId);

        if (!projects) {
            return NextResponse.json(
                { error: `${locale} için proje verileri bulunamadı` },
                { status: 404 }
            );
        }

        // Cache headers ekle (15 dakika)
        const response = NextResponse.json(projects);
        response.headers.set('Cache-Control', 'public, s-maxage=900, stale-while-revalidate=60');

        return response;
    } catch (error) {
        console.error('API hatası:', error);
        return NextResponse.json(
            { error: 'Proje verilerini getirirken bir hata oluştu' },
            { status: 500 }
        );
    }
}
