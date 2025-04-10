'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';

interface ImageUploaderProps {
    images: string[];
    onChange: (newImages: string[]) => void;
    onTempImagesChange?: (newTempImages: string[]) => void;
    innerRef?: React.MutableRefObject<{
        uploadAllFiles: () => Promise<string[]>;
    } | null>;
}

export default function ImageUploader({
    images,
    onChange,
    onTempImagesChange,
    innerRef,
}: ImageUploaderProps) {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [draggedImageIndex, setDraggedImageIndex] = useState<number | null>(null);

    // Geçici dosyaları tutan state
    const [fileMap, setFileMap] = useState<Map<string, File>>(new Map());

    // LocalURL -> Dosya Adı eşlemesini izleyen state
    const [fileNames, setFileNames] = useState<Map<string, string>>(new Map());

    // URL formatla (istemci tarafında oluşturulan URL'leri işleyebilmek için)
    const formatImageUrl = (url: string): string => {
        if (!url) return '';
        // Eğer blob: ile başlıyorsa, bu tarayıcı tarafında oluşturulmuş bir URL'dir
        if (url.startsWith('blob:')) return url;
        // Diğer durumlar için eski formatlamayı kullan
        if (url.startsWith('http://') || url.startsWith('https://')) return url;
        return url.startsWith('/') ? url : `/${url}`;
    };

    // Kaydedilmiş projeyle ilişkili görsel var mı?
    const hasServerImages = images.some(url => !url.startsWith('blob:'));

    // Yeni resim ekleme işlemi
    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setUploading(true);
        setError(null);

        try {
            const newLocalUrls: string[] = [];
            const newFileMap = new Map(fileMap);
            const newFileNames = new Map(fileNames);

            // Her dosya için geçici URL oluştur
            for (let i = 0; i < files.length; i++) {
                const file = files[i];

                // İstemci tarafında bir URL oluştur
                const localUrl = URL.createObjectURL(file);
                newLocalUrls.push(localUrl);

                // Dosya ve adını sakla
                newFileMap.set(localUrl, file);

                // Benzersiz bir dosya adı oluştur (gerçek dosya adını saklarız)
                const fileName = `${Date.now()}_${i}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
                newFileNames.set(localUrl, fileName);
            }

            // State'leri güncelle
            setFileMap(newFileMap);
            setFileNames(newFileNames);

            // Görsel listesini güncelle
            const updatedImages = [...images, ...newLocalUrls];
            onChange(updatedImages);

            // Geçici görselleri bildir (sadece blob URL'ler)
            if (onTempImagesChange) {
                const tempImages = updatedImages.filter(url => url.startsWith('blob:'));
                onTempImagesChange(tempImages);
            }

            // Dosya alanını temizle
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        } catch (err: any) {
            setError(err.message || 'Görsel yüklenirken bir hata oluştu');
        } finally {
            setUploading(false);
        }
    };

    // Görsel kaldırma işlemi
    const handleRemove = async (index: number) => {
        try {
            const imageToRemove = images[index];

            // Eğer bu bir blob URL ise, bellekteki kaynağı serbest bırak
            if (imageToRemove.startsWith('blob:')) {
                URL.revokeObjectURL(imageToRemove);

                // Dosya eşlemesini güncelle
                const newFileMap = new Map(fileMap);
                newFileMap.delete(imageToRemove);
                setFileMap(newFileMap);

                // Dosya adı eşlemesini güncelle
                const newFileNames = new Map(fileNames);
                newFileNames.delete(imageToRemove);
                setFileNames(newFileNames);
            }
            // Eğer sunucuda kayıtlı bir dosyaysa ve düzenleme modundaysak, API'yi çağır
            else if (hasServerImages) {
                const fileName = imageToRemove.split('/').pop();
                if (!fileName) {
                    throw new Error('Geçersiz dosya adı');
                }

                const token = localStorage.getItem('adminToken');
                if (!token) {
                    throw new Error('Oturum bulunamadı, lütfen tekrar giriş yapın');
                }

                // Sunucudan görsel dosyasını sil API endpoint'ini çağır
                const response = await fetch('/api/admin/deleteImage', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ fileName }),
                });

                if (!response.ok) {
                    const data = await response.json();
                    console.error('Görsel silinirken hata:', data.error);
                }
            }

            // Görsel listesini güncelle
            const newImages = [...images];
            newImages.splice(index, 1);
            onChange(newImages);

            // Geçici görselleri güncelle
            if (onTempImagesChange) {
                const tempImages = newImages.filter(url => url.startsWith('blob:'));
                onTempImagesChange(tempImages);
            }
        } catch (error) {
            console.error('Görsel kaldırma hatası:', error);

            // Hata oluşsa bile kullanıcı arayüzünden görseli kaldır
            const newImages = [...images];
            newImages.splice(index, 1);
            onChange(newImages);

            // Geçici görselleri güncelle
            if (onTempImagesChange) {
                const tempImages = newImages.filter(url => url.startsWith('blob:'));
                onTempImagesChange(tempImages);
            }
        }
    };

    // Sürükleme işlemleri için fonksiyonlar
    const handleDragStart = (index: number) => {
        setDraggedImageIndex(index);
    };

    const handleDragEnter = (index: number) => {
        if (draggedImageIndex === null || draggedImageIndex === index) return;

        const newImages = [...images];
        const draggedItem = newImages[draggedImageIndex];

        // Sürüklenen öğeyi çıkar ve yeni konuma ekle
        newImages.splice(draggedImageIndex, 1);
        newImages.splice(index, 0, draggedItem);

        // Sürüklenen öğenin yeni indeksini güncelle
        setDraggedImageIndex(index);

        // Görsel listesini güncelle
        onChange(newImages);

        // Geçici görselleri güncelle
        if (onTempImagesChange) {
            const tempImages = newImages.filter(url => url.startsWith('blob:'));
            onTempImagesChange(tempImages);
        }
    };

    const handleDragEnd = () => {
        setDraggedImageIndex(null);
    };

    // Referans ile yükleme fonksiyonunu dışa aktar
    useEffect(() => {
        if (innerRef) {
            // uploadAllFiles fonksiyonunu burada tanımlıyoruz, böylece her zaman güncel fileMap ve images değerlerine erişebilecek
            const uploadAllFilesFunction = async (): Promise<string[]> => {
                setUploading(true);
                try {
                    const uploadedUrls: string[] = [];

                    console.log('Yükleme başladı, dosya sayısı:', fileMap.size);
                    console.log('FileMap içeriği:', [...fileMap.keys()]);
                    console.log('Şu anda ekranda görünen resimler:', images.length);

                    // Yüklenmesi gereken dosya yok mu?
                    if (fileMap.size === 0) {
                        console.log(
                            'Yüklenecek dosya yok, mevcut sunucu dosyaları döndürülüyor:',
                            images.filter(url => !url.startsWith('blob:')).length
                        );
                        return images.filter(url => !url.startsWith('blob:')); // Sadece sunucu dosyalarını döndür
                    }

                    // Tüm yerel dosyaları sunucuya yükle
                    for (const [localUrl, file] of fileMap.entries()) {
                        console.log(
                            'Yükleniyor:',
                            file.name,
                            'Boyut:',
                            file.size,
                            'Tür:',
                            file.type
                        );

                        try {
                            const formData = new FormData();
                            formData.append('file', file);
                            formData.append('type', 'project');

                            console.log('FormData oluşturuldu');

                            // FormData içeriğini kontrol et
                            for (const pair of (formData as any).entries()) {
                                console.log(
                                    'FormData içeriği:',
                                    pair[0],
                                    typeof pair[1],
                                    pair[1].name
                                );
                            }

                            const token = localStorage.getItem('adminToken');
                            if (!token) {
                                throw new Error('Oturum bulunamadı, lütfen tekrar giriş yapın');
                            }

                            console.log('API çağrısı yapılıyor: /api/admin/upload');
                            const response = await fetch('/api/admin/upload', {
                                method: 'POST',
                                body: formData,
                                headers: {
                                    Authorization: `Bearer ${token}`,
                                },
                            });

                            console.log('Yanıt durumu:', response.status, response.statusText);

                            if (!response.ok) {
                                const errorText = await response.text();
                                console.error('Görsel yükleme hatası:', errorText);
                                try {
                                    const data = JSON.parse(errorText);
                                    throw new Error(data.error || 'Görsel yüklenemedi');
                                } catch (parseError) {
                                    throw new Error(`Görsel yüklenemedi: ${response.statusText}`);
                                }
                            }

                            const data = await response.json();
                            uploadedUrls.push(data.url);
                            console.log('Başarıyla yüklendi:', data.url);

                            // URL'i serbest bırak
                            URL.revokeObjectURL(localUrl);
                        } catch (uploadError) {
                            console.error(`${file.name} dosyası yüklenirken hata:`, uploadError);
                            throw uploadError;
                        }
                    }

                    // Sunucuda zaten olan dosyaları ekle
                    const serverImages = images.filter(url => !url.startsWith('blob:'));
                    const allImages = [...serverImages, ...uploadedUrls];
                    console.log('Tüm görsel listesi:', allImages);
                    return allImages;
                } catch (error) {
                    console.error('Yükleme hatası:', error);
                    throw error;
                } finally {
                    setUploading(false);
                }
            };

            innerRef.current = {
                uploadAllFiles: uploadAllFilesFunction,
            };
            console.log('ImageUploader: Ref yükleme fonksiyonu dışa aktarıldı');
        }
    }, [innerRef, fileMap, images]);

    return (
        <div className="space-y-4">
            <p className="mb-2 text-xs text-gray-400">
                Görsel sırasını değiştirmek için resimleri sürükleyip bırakabilirsiniz. İlk görsel
                ana görsel olarak kullanılır.
            </p>
            <div className="flex flex-wrap gap-4">
                {images.map((url, index) => (
                    <div
                        key={index}
                        className={`relative group border border-gray-700 rounded-lg overflow-hidden w-32 h-32 ${
                            draggedImageIndex === index ? 'ring-2 ring-blue-500' : ''
                        }`}
                        draggable
                        onDragStart={() => handleDragStart(index)}
                        onDragEnter={() => handleDragEnter(index)}
                        onDragOver={e => e.preventDefault()}
                        onDragEnd={handleDragEnd}
                    >
                        <Image
                            src={formatImageUrl(url)}
                            alt={`Proje görseli ${index + 1}`}
                            width={128}
                            height={128}
                            className="w-full h-full object-cover"
                            unoptimized={url.startsWith('blob:')}
                        />
                        <div className="bg-black/70 absolute inset-0 flex flex-col justify-center items-center opacity-0 transition-opacity group-hover:opacity-100">
                            <div className="mb-2 text-white cursor-move">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="w-6 h-6"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                                    />
                                </svg>
                            </div>
                            <button
                                type="button"
                                onClick={() => handleRemove(index)}
                                className="p-1.5 rounded-full bg-red-500 hover:bg-red-600 text-white transition-colors"
                                title="Kaldır"
                            >
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"></path>
                                </svg>
                            </button>
                        </div>
                        {index === 0 && (
                            <div className="bg-blue-500/80 absolute right-0 bottom-0 left-0 py-1 text-xs text-center text-white">
                                Ana Görsel
                            </div>
                        )}
                    </div>
                ))}

                <label className="w-32 h-32 flex flex-col justify-center items-center rounded-lg border-2 border-gray-600 border-dashed transition-colors cursor-pointer hover:border-blue-500">
                    <svg
                        className="w-8 h-8 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        ></path>
                    </svg>
                    <span className="mt-2 text-sm text-gray-400">Görsel Ekle</span>
                    <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        multiple
                        className="hidden"
                        onChange={handleUpload}
                        disabled={uploading}
                    />
                </label>
            </div>

            {uploading && (
                <div className="flex items-center text-sm text-blue-400">
                    <svg
                        className="-ml-1 w-4 h-4 mr-2 text-blue-400 animate-spin"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                    >
                        <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                        ></circle>
                        <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                    </svg>
                    Görsel yükleniyor...
                </div>
            )}

            {error && (
                <div className="text-sm text-red-400">
                    <span className="font-medium">Hata:</span> {error}
                </div>
            )}

            <div className="text-xs text-gray-500">
                <p>• Maksimum dosya boyutu: 5MB</p>
                <p>• İzin verilen formatlar: JPEG, PNG, WebP, GIF</p>
                <p>• İlk görsel, projenin ana görseli olarak kullanılır</p>
                <p>• Önerilen görsel boyutları:</p>
                <ul className="mt-1 ml-4">
                    <li>- Ana liste görseli: 1200×800px (3:2 oranı)</li>
                    <li>- Proje detay görselleri: 1920×1080px (16:9 oranı)</li>
                    <li>- Thumbnail görseller: 600×600px (1:1 oranı)</li>
                </ul>
                <p className="mt-1">• WebP veya JPEG formatları web performansı için önerilir</p>
            </div>
        </div>
    );
}
