import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import ContactForm from '@/models/ContactForm';
import SiteConfig from '@/models/SiteConfig';
import { z } from 'zod';
import { rateLimit } from '@/lib/utils';
import mongoose from 'mongoose';

// Form doğrulama şeması
const contactSchema = z.object({
    name: z.string().min(2, 'İsim en az 2 karakter olmalıdır').max(100, 'İsim çok uzun'),
    email: z.string().email('Geçerli bir e-posta adresi giriniz'),
    message: z.string().min(10, 'Mesaj en az 10 karakter olmalıdır').max(1000, 'Mesaj çok uzun'),
});

export async function POST(req: NextRequest) {
    // IP adresine göre rate limiting uygula
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    const { success, limit, remaining, reset } = await rateLimit(ip, 5); // 5 istek / dakika

    if (!success) {
        return NextResponse.json(
            { error: 'Çok fazla istek gönderdiniz. Lütfen daha sonra tekrar deneyin.' },
            {
                status: 429,
                headers: {
                    'X-RateLimit-Limit': limit.toString(),
                    'X-RateLimit-Remaining': remaining.toString(),
                    'X-RateLimit-Reset': reset.toString(),
                },
            }
        );
    }

    try {
        // İstek gövdesini al ve doğrula
        const body = await req.json();

        // Form verilerini doğrula
        const result = contactSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json(
                { error: 'Form verilerinde hatalar var', details: result.error.format() },
                { status: 400 }
            );
        }

        const { name, email, message } = result.data;

        // Honeypot kontrolü (eğer client-side'da uygulanmışsa)
        if (body.honeypot) {
            // Bot tespit edildi, ama başarılı yanıt dön (bot'a ipucu verme)
            return NextResponse.json({ success: true });
        }

        // Veritabanına bağlan
        await connectToDatabase();

        // MongoDB koleksiyonlarına doğrudan erişim
        const db = mongoose.connection;
        const contactFormsCollection = db.collection('contactforms');
        const siteConfigCollection = db.collection('siteconfigs');

        // Site ayarlarını al
        const siteConfig = await siteConfigCollection.findOne();
        const contactEmail = siteConfig?.contactEmail || 'info@eylulkurtcebe.com';

        // Form verisini veritabanına kaydet
        await contactFormsCollection.insertOne({
            name,
            email,
            message,
            ipAddress: ip,
            userAgent,
            isRead: false,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        // Brevo API ile e-posta gönder
        const apiKey = process.env.BREVO_API_KEY;

        if (!apiKey) {
            console.error('BREVO_API_KEY bulunamadı');
            return NextResponse.json({ error: 'E-posta gönderme hatası' }, { status: 500 });
        }

        // Brevo API'ye gönderilecek veriler
        const data = {
            sender: { email: contactEmail },
            to: [{ email: contactEmail }],
            subject: `Yeni İletişim Formu: ${name}`,
            htmlContent: `
        <h2>Yeni İletişim Formu Mesajı</h2>
        <p><strong>İsim:</strong> ${name}</p>
        <p><strong>E-posta:</strong> ${email}</p>
        <p><strong>Mesaj:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
        <hr>
        <p><small>IP: ${ip}</small></p>
        <p><small>User Agent: ${userAgent}</small></p>
      `,
        };

        // Brevo API'ye istek gönder
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                accept: 'application/json',
                'api-key': apiKey,
                'content-type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            console.error('Brevo API hatası:', await response.text());
            // Veritabanına kaydettik ama e-posta gönderimi başarısız oldu
            return NextResponse.json(
                { success: true, warning: 'Form kaydedildi ama e-posta gönderilemedi' },
                { status: 200 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('İletişim formu hatası:', error);
        return NextResponse.json({ error: 'İşlem sırasında bir hata oluştu' }, { status: 500 });
    }
}
