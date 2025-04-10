'use server';

import { connectToDatabase } from '../db';
import Project from '@/models/Project';
import { revalidatePath } from 'next/cache';
import mongoose from 'mongoose';

/**
 * Tüm projelere order alanı ekleyen migration
 * Bu fonksiyon, order alanı olmayan tüm projelere varsayılan bir order değeri atar.
 */
export async function addOrderFieldToProjects() {
    try {
        await connectToDatabase();

        // MongoDB koleksiyonuna doğrudan erişim
        const db = mongoose.connection;
        const projectsCollection = db.collection('projects');

        // Tüm diller için çalıştır
        const locales = ['tr', 'en'];
        let totalUpdated = 0;

        for (const locale of locales) {
            console.log(`${locale} dilindeki projeler için order alanı ekleniyor...`);

            // Mevcut projeleri getir
            const projects = await projectsCollection
                .find({ locale })
                .sort({ createdAt: -1 })
                .toArray();
            console.log(`${projects.length} proje bulundu.`);

            // İlk olarak, doğrudan updateMany ile orijinal dökümanları güncelle
            // Bu şekilde koleksiyondaki tüm dokümanlar güncellenecek
            if (projects.length > 0) {
                const bulkOps = projects.map((project, i) => ({
                    updateOne: {
                        filter: { _id: project._id },
                        update: { $set: { order: i } },
                    },
                }));

                // Bulk update işlemi gerçekleştir
                if (bulkOps.length > 0) {
                    console.log(`${bulkOps.length} adet proje için toplu güncelleme yapılıyor...`);
                    const bulkResult = await projectsCollection.bulkWrite(bulkOps);
                    console.log('Bulk update sonucu:', bulkResult);

                    if (bulkResult.modifiedCount) {
                        totalUpdated += bulkResult.modifiedCount;
                    }
                }
            }

            // Şemayı tamamen yeniden uygula ve manuel olarak tüm projeleri güncelle
            for (let i = 0; i < projects.length; i++) {
                const project = projects[i];

                // Şema güncelleme işlemi: findOneAndUpdate kullanarak dokümanı tamamen yenile
                const result = await projectsCollection.findOneAndUpdate(
                    { _id: project._id },
                    {
                        $set: {
                            order: i,
                            // Diğer tüm alanları da ekle (şemayı zorla)
                            locale: project.locale,
                            id: project.id,
                            originalId: project.originalId,
                            title: project.title,
                            description: project.description,
                            images: project.images,
                            technologies: project.technologies,
                            updatedAt: new Date(),
                        },
                    },
                    {
                        returnDocument: 'after',
                        upsert: true, // Eğer bulunamazsa oluştur
                    }
                );

                console.log(`Proje manuel olarak güncellendi: ${project.id}, order: ${i}`);
            }

            // Kontrol amaçlı kayıtları yeniden oku
            const updatedProjects = await projectsCollection
                .find({ locale })
                .project({ id: 1, title: 1, order: 1 })
                .toArray();
            console.log('Güncellenmiş projeler:', updatedProjects);
        }

        // Cache'i temizle
        revalidatePath('/', 'layout');
        revalidatePath('/tr', 'layout');
        revalidatePath('/en', 'layout');
        revalidatePath('/tr/projects', 'layout');
        revalidatePath('/en/projects', 'layout');

        return {
            success: true,
            message: `Migration tamamlandı. Toplam ${totalUpdated} proje güncellendi.`,
        };
    } catch (error) {
        console.error('Migration hatası:', error);
        return {
            success: false,
            message: `Migration sırasında bir hata oluştu: ${
                error instanceof Error ? error.message : 'Bilinmeyen hata'
            }`,
        };
    }
}
