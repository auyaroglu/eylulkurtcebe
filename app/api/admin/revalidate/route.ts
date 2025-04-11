import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { withAuth } from '@/lib/auth-middleware';

// Admin API rotası için yeniden doğrulama (revalidation) işlemi
async function handler(req: NextRequest, user: any) {
    try {
        const { searchParams } = req.nextUrl;
        const path = searchParams.get('path');
        const tag = searchParams.get('tag');
        const locale = searchParams.get('locale');

        // Revalidate sonuçlarını saklayacak dizi
        const results = {
            paths: [] as string[],
            tags: [] as string[],
            success: true,
        };

        // Belirli bir yol için revalidate
        if (path) {
            try {
                revalidatePath(path, 'layout');
                revalidatePath(path, 'page');
                results.paths.push(path);
            } catch (error) {
                console.error(`Yol için revalidate hatası (${path}):`, error);
            }
        }

        // Belirli bir etiket için revalidate
        if (tag) {
            try {
                revalidateTag(tag);
                results.tags.push(tag);
            } catch (error) {
                console.error(`Etiket için revalidate hatası (${tag}):`, error);
            }
        }

        // Tümü için revalidate
        if (!path && !tag && locale) {
            // Öncelikle dil-spesifik yolları temizleyelim
            const pathsToRevalidate = [
                '/',
                `/${locale}`,
                `/${locale}/projects`,
                '/api/admin/content',
                `/api/admin/content/${locale}`,
                `/api/content/${locale}`,
                `/api/content`,
            ];

            // Etiketleri temizleyelim
            const tagsToRevalidate = [
                'content',
                'navigation',
                `content-${locale}`,
                `navigation-${locale}`,
                'site-content',
                'footer',
            ];

            // Yolları revalidate edelim
            for (const p of pathsToRevalidate) {
                try {
                    revalidatePath(p, 'layout');
                    revalidatePath(p, 'page');
                    results.paths.push(p);
                } catch (error) {
                    console.error(`Yol için revalidate hatası (${p}):`, error);
                }
            }

            // Etiketleri revalidate edelim
            for (const t of tagsToRevalidate) {
                try {
                    revalidateTag(t);
                    results.tags.push(t);
                } catch (error) {
                    console.error(`Etiket için revalidate hatası (${t}):`, error);
                }
            }
        }

        return NextResponse.json({
            revalidated: true,
            timestamp: Date.now(),
            ...results,
        });
    } catch (error) {
        console.error('Revalidate hatası:', error);
        return NextResponse.json(
            {
                revalidated: false,
                error: 'Revalidate işlemi sırasında bir hata oluştu',
            },
            { status: 500 }
        );
    }
}

export const GET = withAuth(handler);
