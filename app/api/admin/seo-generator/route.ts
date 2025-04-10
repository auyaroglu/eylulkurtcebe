import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

// Token doğrulama
async function verifyToken(token: string): Promise<boolean> {
    try {
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            throw new Error('JWT_SECRET is not defined');
        }

        jwt.verify(token, secret);
        return true;
    } catch (error) {
        console.error('Token verification error:', error);
        return false;
    }
}

export async function POST(req: NextRequest) {
    try {
        // Token doğrulama
        const authHeader = req.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.split(' ')[1];
        const isValidToken = await verifyToken(token);

        if (!isValidToken) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // İstek verilerini al
        const { title, description, technologies, locale } = await req.json();

        // Gerekli verilerin kontrolü
        if (!title || !description) {
            return NextResponse.json(
                { error: 'Başlık ve açıklama alanları gereklidir' },
                { status: 400 }
            );
        }

        // SEO içerik oluşturucu fonksiyonunu çağır
        const seoData = await generateSeoContent(title, description, technologies, locale);

        return NextResponse.json(seoData);
    } catch (error) {
        console.error('SEO içeriği oluşturulurken hata:', error);
        return NextResponse.json({ error: 'SEO içeriği oluşturulamadı' }, { status: 500 });
    }
}

// SEO içerik oluşturucu fonksiyonu
async function generateSeoContent(
    title: string,
    description: string,
    technologies: string[],
    locale: string
) {
    try {
        // HuggingFace API anahtarını al
        const apiKey = process.env.NEXT_PUBLIC_HUGGINGFACE_API_KEY;

        if (!apiKey) {
            console.warn(
                'NEXT_PUBLIC_HUGGINGFACE_API_KEY bulunamadı, temel SEO içeriği oluşturuluyor.'
            );
            return {
                metaTitle: '',
                metaDescription: '',
                metaKeywords: '',
                ogTitle: '',
                ogDescription: '',
            };
        }

        const isEnglish = locale === 'en';

        // Prompt hazırla - dile göre farklı prompt kullan
        const prompt = isEnglish
            ? `Generate SEO metadata for a project with the following details:
              Title: ${title}
              Description: ${description}
              Technologies: ${technologies.join(', ')}
              
              Please provide the following fields:
              1. Meta Title (max 60 characters)
              2. Meta Description (max 160 characters)
              3. Meta Keywords (comma separated)
              4. OG Title (max 60 characters)
              5. OG Description (max 160 characters)
              
              Format your response as clear labeled fields with values, like:
              Meta Title: [your meta title]
              Meta Description: [your meta description]`
            : `Şu bilgilere sahip bir proje için SEO meta verileri oluştur:
              Başlık: ${title}
              Açıklama: ${description}
              Teknolojiler: ${technologies.join(', ')}
              
              Lütfen aşağıdaki alanları sağla:
              1. Meta Başlık (maksimum 60 karakter)
              2. Meta Açıklama (maksimum 160 karakter)
              3. Meta Anahtar Kelimeler (virgülle ayrılmış)
              4. OG Başlık (maksimum 60 karakter)
              5. OG Açıklama (maksimum 160 karakter)
              
              Yanıtını şöyle formatla:
              Meta Başlık: [meta başlık]
              Meta Açıklama: [meta açıklama]`;

        // Hugging Face API'ye istek gönder
        const response = await fetch(
            'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2',
            {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    inputs: prompt,
                    parameters: {
                        max_new_tokens: 250,
                        temperature: 0.7,
                        top_p: 0.9,
                        do_sample: true,
                    },
                }),
            }
        );

        if (!response.ok) {
            console.warn('Hugging Face API yanıt vermedi, boş değerler dönüyorum.');
            return {
                metaTitle: '',
                metaDescription: '',
                metaKeywords: '',
                ogTitle: '',
                ogDescription: '',
            };
        }

        const data = await response.json();

        if (!data || !data[0] || !data[0].generated_text) {
            console.warn('Hugging Face API geçersiz yanıt verdi, boş değerler dönüyorum.');
            return {
                metaTitle: '',
                metaDescription: '',
                metaKeywords: '',
                ogTitle: '',
                ogDescription: '',
            };
        }

        // AI yanıtını işle
        const generatedText = data[0].generated_text;

        // AI yanıtını ayrıştır - İngilizce veya Türkçe için farklı ayrıştırma mantığı
        const lines = generatedText.split('\n').filter((line: string) => line.trim() !== '');

        // Başlangıçta boş değerler ayarla
        let metaTitle = '';
        let metaDescription = '';
        let metaKeywords = '';
        let ogTitle = '';
        let ogDescription = '';

        // AI yanıtındaki verileri bul
        for (const line of lines) {
            const lowerLine = line.toLowerCase();

            if (lowerLine.includes('meta title') || lowerLine.includes('meta başlık')) {
                metaTitle = extractValue(line);
            } else if (
                lowerLine.includes('meta description') ||
                lowerLine.includes('meta açıklama')
            ) {
                metaDescription = extractValue(line);
            } else if (lowerLine.includes('meta keywords') || lowerLine.includes('meta anahtar')) {
                metaKeywords = extractValue(line);
            } else if (lowerLine.includes('og title') || lowerLine.includes('og başlık')) {
                ogTitle = extractValue(line);
            } else if (lowerLine.includes('og description') || lowerLine.includes('og açıklama')) {
                ogDescription = extractValue(line);
            }
        }

        // Eğer OG alanları boşsa Meta alanlarını kullan
        if (!ogTitle) ogTitle = metaTitle;
        if (!ogDescription) ogDescription = metaDescription;

        return {
            metaTitle,
            metaDescription,
            metaKeywords,
            ogTitle,
            ogDescription,
        };
    } catch (error) {
        console.error('SEO içeriği oluşturulurken hata:', error);
        return {
            metaTitle: '',
            metaDescription: '',
            metaKeywords: '',
            ogTitle: '',
            ogDescription: '',
        };
    }
}

// AI yanıtından değer çıkarma yardımcı fonksiyonu
function extractValue(line: string): string {
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) return '';

    let value = line.substring(colonIndex + 1).trim();

    // Başlangıçtaki "1. ", "2. " gibi sıralama numaralarını kaldır
    value = value.replace(/^\d+\.\s*/, '');

    // Tırnak işaretlerini kaldır
    value = value.replace(/^["']|["']$/g, '');

    return value;
}

// Temel SEO içeriği oluşturma yedek fonksiyonu
function generateBasicSeoContent(
    title: string,
    description: string,
    technologies: string[],
    locale: string
) {
    const isEnglish = locale === 'en';
    const domain = 'eylulkurtcebe.com';

    return {
        metaTitle: '',
        metaDescription: '',
        metaKeywords: '',
        ogTitle: '',
        ogDescription: '',
    };
}
