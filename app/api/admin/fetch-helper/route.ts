import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';

// Bu API, Next.js'in fetch API ile kullanılan tag temelli revalidasyon sistemini açıklar
// Tam doküman: https://nextjs.org/docs/app/api-reference/functions/fetch

async function handler(req: NextRequest, user: any) {
    try {
        const response = {
            title: 'Next.js Fetch API ve Tag Temelli Revalidasyon',
            description:
                "Bu kılavuz, Next.js'te fetch API ile tag temelli revalidasyon kullanımını açıklar.",
            examples: [
                {
                    title: "Client Component'te kullanım",
                    code: `
// Client Component
'use client';

import { useEffect, useState } from 'react';

export default function ClientDataFetcher() {
  const [data, setData] = useState(null);
  
  useEffect(() => {
    async function fetchData() {
      // Client Component'te cache ve tags kullanılamaz
      const res = await fetch('/api/content/tr');
      const contentData = await res.json();
      setData(contentData);
    }
    
    fetchData();
  }, []);
  
  return <div>{/* Data display */}</div>;
}
                    `,
                },
                {
                    title: "Server Component'te kullanım",
                    code: `
// Server Component
export default async function ServerDataFetcher() {
  // 👇 Server Component'te fetch API ile tag kullanımı
  const data = await fetch('https://api.example.com/data', {
    next: { 
      tags: ['content', 'navigation'],
      revalidate: 3600 // 1 saat
    }
  }).then(res => res.json());
  
  return <div>{/* Data display */}</div>;
}
                    `,
                },
                {
                    title: 'Tag temelli revalidasyon',
                    code: `
// Belirli bir etiketi revalidate etmek için
// app/api/revalidate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';

export async function GET(request: NextRequest) {
  const tag = request.nextUrl.searchParams.get('tag');
  
  if (tag) {
    revalidateTag(tag);
    return NextResponse.json({ revalidated: true, tag });
  }
  
  return NextResponse.json({ revalidated: false, error: 'Tag gerekli' });
}
                    `,
                },
                {
                    title: 'Mongoose ile kullanım',
                    description:
                        'Mongoose ile doğrudan Next.js tag sistemi kullanılamaz, ancak bir cache layer ekleyebilirsiniz',
                    code: `
// MongoDB/Mongoose ile veri çekme ve önbellekleme
import { cache } from 'react';

export const getContentFromDB = cache(async (locale: string) => {
  // Mongoose sorgusu...
  const content = await Content.findOne({ locale }).lean();
  
  // Sonraki kullanım için önbelleğe alınır
  return content;
});

// Server Component içerisinde kullanım
export default async function ContentPage() {
  const content = await getContentFromDB('tr');
  
  // fetch ile API'ye yapılan isteklerde tag kullanılabilir
  const apiContent = await fetch('/api/content/tr', {
    next: { tags: ['content'] }
  }).then(res => res.json());
  
  return <div>{/* ... */}</div>;
}
                    `,
                },
                {
                    title: 'Projenizdeki kullanım için revalidasyon stratejisi',
                    description: 'Şu şekilde bir strateji izleyebilirsiniz:',
                    steps: [
                        'Server-side verileri React cache ile önbelleğe alın',
                        'Admin panelinden içerik güncellemelerinde kapsamlı revalidasyon yapın',
                        'Her içerik türü için ayrı etiketler kullanın (content, navigation, projects)',
                        'Dil-spesifik etiketler de ekleyin (content-tr, content-en)',
                        'İçerik güncellendiğinde hem path hem de tag bazlı revalidasyon yapın',
                    ],
                },
            ],
            conclusion:
                "Next.js'te etkili önbellek yönetimi için, hem react cache kullanımını, hem fetch API'de next.tags özelliğini, hem de revalidatePath/revalidateTag fonksiyonlarını birlikte düşünmelisiniz.",
        };

        return NextResponse.json(response);
    } catch (error) {
        console.error('Fetch Helper API hatası:', error);
        return NextResponse.json(
            { error: 'Rehber oluşturulurken bir hata oluştu' },
            { status: 500 }
        );
    }
}

export const GET = withAuth(handler);
