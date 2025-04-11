'use client';

// Verilen ID'yi kaynak dilden hedef dile dönüştürür - artık API tabanlı çalışacak
export function mapProjectId(id: string, sourceLang: string, targetLang: string): string {
    if (sourceLang === targetLang) {
        return id; // Dil değişmiyorsa ID de değişmez
    }

    // API tabanlı ID eşleştirmeye geçtiğimiz için bu fonksiyon artık
    // sadece çağrı uyumluluğu için kalıyor, içerik checkProjectAvailability'ye taşındı
    return id;
}

// Çevrilmiş projenin varlığını ve durumunu kontrol eder
// Client componentlerinden kullanılabilecek şekilde fetch API ile
export async function checkProjectAvailability(
    id: string,
    sourceLang: string,
    targetLang: string
): Promise<{ exists: boolean; targetId: string }> {
    try {
        // console.log(`Dil Geçişi Kontrolü: ${id} (${sourceLang}) -> ? (${targetLang})`);

        // İlk olarak kaynak dildeki projenin detaylarını getir (originalId'yi almak için)
        const sourceApiUrl = `/api/projects/${sourceLang}/${id}`;

        // Kaynak projeyi kontrol et
        // console.log(`Kaynak proje kontrolü: ${sourceApiUrl}`);
        const sourceResponse = await fetch(sourceApiUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            next: { revalidate: 0 }, // Her seferinde yeni veri almak için
        });

        if (!sourceResponse.ok) {
            console.log(`Kaynak proje bulunamadı: ${id} (${sourceLang})`);
            return { exists: false, targetId: '' };
        }

        // Kaynak projenin detaylarını al
        const sourceProjectData = await sourceResponse.json();

        if (!sourceProjectData || !sourceProjectData.originalId) {
            console.log(`Kaynak projede originalId bulunamadı: ${id}`);
            return { exists: false, targetId: id };
        }

        const originalId = sourceProjectData.originalId;
        // console.log(`Proje originalId: ${originalId}`);

        // originalId kullanarak aynı projenin hedef dildeki karşılığını bul
        const targetApiUrl = `/api/projects/${targetLang}/by-original-id/${originalId}`;

        try {
            // console.log(`Hedef proje kontrolü: ${targetApiUrl}`);
            const targetResponse = await fetch(targetApiUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                next: { revalidate: 0 },
            });

            if (targetResponse.ok) {
                const targetData = await targetResponse.json();
                // console.log(`Hedef proje bulundu:`, targetData);

                if (targetData && targetData.id && targetData.status === true) {
                    // console.log(`Geçiş yapılacak ID: ${targetData.id}`);
                    return { exists: true, targetId: targetData.id };
                }
            }

            console.log(
                `Hedef proje bulunamadı veya gizli: originalId=${originalId}, dil=${targetLang}`
            );
            return { exists: false, targetId: '' };
        } catch (error) {
            console.error(`Hedef proje API hatası:`, error);
            return { exists: false, targetId: '' };
        }
    } catch (error) {
        console.error('Proje erişilebilirlik kontrolü hatası:', error);
        return { exists: false, targetId: '' };
    }
}
