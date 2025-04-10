'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    // Sayfa yüklendiğinde eski token'ı temizle
    useEffect(() => {
        // Önce localStorage'dan token'ı sil, böylece tümüyle yeni bir oturum başlatalım
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || 'Giriş yapılırken bir hata oluştu');
                setLoading(false);
                return;
            }

            // Token'ı localStorage'a kaydet
            localStorage.setItem('adminToken', data.token);
            localStorage.setItem('adminUser', JSON.stringify(data.user));

            // Yönetim paneline yönlendir
            router.push('/admin');
        } catch (err) {
            setError('Bağlantı hatası oluştu');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900">
            <div className="bg-gray-800 p-10 rounded-lg shadow-xl w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-white mb-2">Yönetim Paneli</h1>
                    <p className="text-gray-400">Devam etmek için giriş yapın</p>
                </div>

                {error && (
                    <div className="bg-red-500 text-white p-3 rounded-md mb-6 text-sm">{error}</div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="mb-6">
                        <label
                            htmlFor="username"
                            className="block text-gray-400 mb-2 text-sm font-medium"
                        >
                            Kullanıcı Adı
                        </label>
                        <input
                            id="username"
                            type="text"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            className="w-full px-4 py-3 rounded-md bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>

                    <div className="mb-6">
                        <label
                            htmlFor="password"
                            className="block text-gray-400 mb-2 text-sm font-medium"
                        >
                            Şifre
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="w-full px-4 py-3 rounded-md bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <Link
                        href="/"
                        className="text-blue-400 hover:text-blue-300 text-sm transition-colors"
                    >
                        Ana Sayfaya Dön
                    </Link>
                </div>
            </div>
        </div>
    );
}
