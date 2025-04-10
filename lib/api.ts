/**
 * API üzerinden içerik verilerini getiren yardımcı fonksiyon
 * @param locale - Dil kodu (tr, en)
 */
export async function getContent(locale: string) {
    try {
        const response = await fetch(`/api/content/${locale}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            cache: 'no-store', // Her zaman güncel veri al
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('İçerik alınamadı:', error);
            return null;
        }

        return await response.json();
    } catch (error) {
        console.error('İçerik getirme hatası:', error);
        return null;
    }
}

/**
 * API üzerinden proje verilerini getiren yardımcı fonksiyon
 * @param locale - Dil kodu (tr, en)
 * @param projectId - (Opsiyonel) Tekil bir proje ID'si
 */
export async function getProjects(locale: string, projectId?: string) {
    try {
        const url = projectId
            ? `/api/projects/${locale}?id=${projectId}`
            : `/api/projects/${locale}`;

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            cache: 'no-store', // Her zaman güncel veri al
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('Projeler alınamadı:', error);
            return null;
        }

        return await response.json();
    } catch (error) {
        console.error('Projeler getirme hatası:', error);
        return null;
    }
}
