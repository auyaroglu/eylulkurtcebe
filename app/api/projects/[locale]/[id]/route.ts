import { NextRequest, NextResponse } from 'next/server';
import { getProjectsFromDB } from '@/lib/server-actions';

// Yeni API route yapısı kullanılıyor
export async function GET(request, { params }) {
    try {
        // Paramları al
        const awaitedParams = await params;
        const locale = awaitedParams?.locale || '';
        const id = awaitedParams?.id || '';

        console.log(`API çağrısı alındı: locale=${locale}, id=${id}`);

        // Belirtilen dil ve ID için projeyi getir
        const project = await getProjectsFromDB(locale, id);

        // Proje bulunamadıysa 404 döndür
        if (!project) {
            console.log(`Proje bulunamadı: ${locale}/${id}`);
            return NextResponse.json(
                { error: `${locale} dilinde ${id} ID'si ile proje bulunamadı` },
                { status: 404 }
            );
        }

        console.log(`Proje bulundu: ${project.id}, status=${project.status}`);

        // CORS başlığı ekleyelim
        return NextResponse.json(
            {
                id: project.id,
                status: project.status,
                originalId: project.originalId, // Dil geçişleri için originalId eklendi
            },
            {
                status: 200,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET',
                    'Access-Control-Allow-Headers': 'Content-Type',
                },
            }
        );
    } catch (error) {
        console.error('API hatası:', error);

        return NextResponse.json(
            { error: 'Proje detayları getirilirken bir hata oluştu' },
            { status: 500 }
        );
    }
}
