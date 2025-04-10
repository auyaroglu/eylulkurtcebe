import { unlink, access } from 'fs/promises';
import { constants } from 'fs';
import path from 'path';

/**
 * Sunucuda bulunan bir resim dosyasını siler
 * @param imageUrl Silinecek resmin tam URL'i
 * @returns Promise<boolean> İşlem başarılı oldu mu
 */
export async function deleteImageFile(imageUrl: string): Promise<boolean> {
    try {
        // Resim URL'i geçerli mi kontrol et
        if (!imageUrl || typeof imageUrl !== 'string') {
            console.error("Geçersiz resim URL'i:", imageUrl);
            return false;
        }

        // URL'i parçalara ayır - /uploads/images/logo_file.jpg veya /images/site/logo_123.jpg
        const urlParts = imageUrl.split('/').filter(Boolean);

        // URL'den dizin bilgisi çıkar
        let directory;
        let fileName;

        // Farklı dizin yapılarını kontrol et
        if (urlParts.includes('uploads') && urlParts.includes('images')) {
            const uploadIndex = urlParts.indexOf('uploads');
            directory = path.join('public', ...urlParts.slice(uploadIndex, urlParts.length - 1));
            fileName = urlParts[urlParts.length - 1];
        } else if (urlParts.includes('images')) {
            const imagesIndex = urlParts.indexOf('images');
            directory = path.join('public', ...urlParts.slice(imagesIndex, urlParts.length - 1));
            fileName = urlParts[urlParts.length - 1];
        } else {
            console.error('Desteklenmeyen dizin yapısı:', imageUrl);
            return false;
        }

        // Güvenlik kontrolü: dosya adının güvenli olduğundan emin ol
        if (fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) {
            console.error('Geçersiz dosya adı:', fileName);
            return false;
        }

        // Tam dosya yolunu oluştur
        const filePath = path.join(process.cwd(), directory, fileName);

        // Dosyanın var olup olmadığını kontrol et
        try {
            await access(filePath, constants.F_OK);
        } catch (err) {
            console.log(`Dosya bulunamadı: ${filePath}`);
            return false;
        }

        // Dosyayı sil
        await unlink(filePath);
        console.log(`Dosya silindi: ${filePath}`);
        return true;
    } catch (error) {
        console.error('Dosya silinirken hata oluştu:', error);
        return false;
    }
}
