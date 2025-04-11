'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useAnimation } from '@/app/animation-context';
import { Fancybox } from '@fancyapps/ui';
import '@fancyapps/ui/dist/fancybox/fancybox.css';
import { useEffect, useState } from 'react';

interface Project {
    id: string;
    title: string;
    description: string;
    images: string[];
    technologies: string[];
    demo?: string;
}

interface ProjectDetailPageProps {
    lng: string;
    projectId: string;
    initialProject?: any;
    initialContent?: any;
}

export default function ProjectDetailPage({
    lng,
    projectId,
    initialProject,
    initialContent,
}: ProjectDetailPageProps) {
    const t = useTranslations('projects');
    const locale = useLocale();
    const { animationKey } = useAnimation();
    const [activeImage, setActiveImage] = useState(0);

    // lng yoksa locale'i kullan
    const safeLng = lng || locale;

    // Projeler ve ilişkili projeler
    const currentProject = initialProject || null;

    // URL formatla (next/image için)
    const formatImageUrl = (url: string): string => {
        if (!url) return '';
        if (url.startsWith('http://') || url.startsWith('https://')) return url;
        return url.startsWith('/') ? url : `/${url}`;
    };

    // İlişkili projeleri bul - Sunucudan gelen veri ile çalış
    let relatedProjects: Project[] = [];

    if (initialProject && initialContent?.projects?.list) {
        // Tüm projeleri al
        const allProjects = initialContent.projects.list;

        // İlişkili projeleri bul (aynı teknolojilere sahip olanlar)
        relatedProjects = allProjects
            .filter((project: Project) => {
                if (project.id === projectId) return false; // Mevcut projeyi dahil etme

                // Ortak teknolojileri kontrol et
                if (Array.isArray(currentProject.technologies)) {
                    return project.technologies.some((tech: string) =>
                        currentProject.technologies.includes(tech)
                    );
                }

                return false;
            })
            .slice(0, 3); // Maksimum 3 ilişkili proje göster
    }

    // Lightbox bağlantılarını etkinleştir
    useEffect(() => {
        if (currentProject) {
            Fancybox.bind('[data-fancybox]', {
                // Basit lightbox ayarları
            });

            // Temizlik fonksiyonu
            return () => {
                Fancybox.unbind('[data-fancybox]');
                Fancybox.close();
            };
        }
    }, [currentProject]);

    // Sayfa değişkenleri
    const detailTexts = initialContent?.projects?.detail || {
        backToProjects: t('detail.backToProjects'),
        technologies: t('detail.technologies'),
        gallery: t('detail.gallery'),
        relatedProjects: t('detail.relatedProjects'),
    };

    // Animasyon varyantları
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
            },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.5,
            },
        },
    };

    if (!currentProject) {
        return null; // Sunucu tarafında 404 döndürülecek, burada boş bileşen göster
    }

    return (
        <section className="px-4 py-16 lg:py-24 min-lg:px-0">
            <div className="container mx-auto p-6 [background:linear-gradient(45deg,#080b11,theme(colors.slate.800)_50%,#172033)_padding-box,conic-gradient(from_var(--border-angle),theme(colors.slate.600/.48)_80%,_theme(colors.indigo.500)_86%,_theme(colors.indigo.300)_90%,_theme(colors.indigo.500)_94%,_theme(colors.slate.600/.48))_border-box] rounded-xl sm:rounded-2xl border border-transparent animate-border">
                {/* Üst Başlık ve Geri Butonu */}
                <motion.div
                    key={`project-header-${projectId}-${safeLng}-${animationKey}`}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="flex flex-col mb-12 sm:flex-row sm:justify-between sm:items-center"
                >
                    <Link
                        href="/projects"
                        className="inline-flex items-center mb-4 text-indigo-400 transition-colors hover:text-indigo-300 sm:mb-0"
                    >
                        <svg
                            className="w-4 h-4 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M10 19l-7-7m0 0l7-7m-7 7h18"
                            />
                        </svg>
                        {detailTexts.backToProjects}
                    </Link>

                    {currentProject.demo && (
                        <a
                            href={currentProject.demo}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-500/30 transition-all"
                        >
                            <span>Canlı Demo</span>
                            <svg
                                className="w-4 h-4 ml-2"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                />
                            </svg>
                        </a>
                    )}
                </motion.div>

                <div className="flex flex-col lg:flex-row lg:gap-12">
                    {/* Sol Taraf - Görsel Galerisi */}
                    <motion.div
                        className="mb-10 lg:w-3/5 lg:mb-0"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        {currentProject.images && currentProject.images.length > 0 && (
                            <div className="space-y-6">
                                {/* Ana Görsel */}
                                <div
                                    className="aspect-video relative rounded-xl overflow-hidden shadow-xl [background:linear-gradient(45deg,#080b11,theme(colors.slate.800)_50%,#172033)_padding-box,conic-gradient(from_var(--border-angle),theme(colors.slate.600/.48)_80%,_theme(colors.indigo.500)_86%,_theme(colors.indigo.300)_90%,_theme(colors.indigo.500)_94%,_theme(colors.slate.600/.48))_border-box] border border-transparent animate-border"
                                    data-fancybox="project-gallery"
                                    data-src={formatImageUrl(currentProject.images[activeImage])}
                                >
                                    <Image
                                        src={formatImageUrl(currentProject.images[activeImage])}
                                        alt={`${currentProject.title} - Ana Görsel`}
                                        fill
                                        priority={true}
                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 75vw, 50vw"
                                        className="object-contain"
                                        loading="eager"
                                    />
                                </div>

                                {/* Küçük görsel önizlemeleri */}
                                <div className="grid grid-cols-4 gap-2 sm:gap-3">
                                    {currentProject.images.map((image, index) => (
                                        <button
                                            key={`thumb-${index}`}
                                            onClick={() => setActiveImage(index)}
                                            className={`aspect-video relative rounded-lg overflow-hidden transition-all ${
                                                activeImage === index
                                                    ? 'ring-4 ring-indigo-500 scale-[1.02]'
                                                    : 'ring-2 ring-gray-700/50 hover:ring-indigo-500/50'
                                            }`}
                                        >
                                            <Image
                                                src={formatImageUrl(image)}
                                                alt={`${currentProject.title} - Görsel ${
                                                    index + 1
                                                }`}
                                                fill
                                                sizes="(max-width: 768px) 20vw, 10vw"
                                                className="object-cover"
                                                loading={index < 4 ? 'eager' : 'lazy'}
                                            />
                                        </button>
                                    ))}
                                </div>

                                {/* Lightbox için diğer görseller (gizli) */}
                                <div className="hidden">
                                    {currentProject.images
                                        .filter((_: string, idx: number) => idx !== activeImage)
                                        .map((img: string, idx: number) => (
                                            <a
                                                key={idx}
                                                data-fancybox="project-gallery"
                                                href={formatImageUrl(img)}
                                            />
                                        ))}
                                </div>
                            </div>
                        )}
                    </motion.div>

                    {/* Sağ Taraf - Proje Bilgileri */}
                    <motion.div
                        className="lg:w-2/5"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                    >
                        <div className="space-y-8">
                            {/* Başlık ve Açıklama */}
                            <div className="space-y-4">
                                <h1 className="heading text-3xl font-bold lg:text-4xl">
                                    {currentProject.title}
                                </h1>
                                <p className="text-lg text-gray-400">
                                    {currentProject.description}
                                </p>
                            </div>

                            {/* Teknolojiler */}
                            {currentProject.technologies &&
                                currentProject.technologies.length > 0 && (
                                    <div className="space-y-4">
                                        <h3 className="text-xl font-bold text-indigo-300">
                                            {detailTexts.technologies}
                                        </h3>
                                        <div className="flex flex-wrap gap-2">
                                            {currentProject.technologies.map(
                                                (tech: string, index: number) => (
                                                    <span
                                                        key={index}
                                                        className="bg-indigo-900/30 text-indigo-200 px-3 py-1.5 text-sm font-medium rounded-full backdrop-blur-sm border border-indigo-500/20"
                                                    >
                                                        {tech}
                                                    </span>
                                                )
                                            )}
                                        </div>
                                    </div>
                                )}

                            {/* Proje Özellikleri - Opsiyonel */}
                            {currentProject.features &&
                                Array.isArray(currentProject.features) &&
                                currentProject.features.length > 0 && (
                                    <div className="space-y-4">
                                        <h3 className="text-xl font-bold text-indigo-300">
                                            Özellikler
                                        </h3>
                                        <ul className="pl-6 space-y-2 text-gray-300">
                                            {currentProject.features.map(
                                                (feature: string, index: number) => (
                                                    <li key={index} className="flex items-start">
                                                        <svg
                                                            className="w-5 h-5 text-indigo-400 mr-2 mt-0.5 flex-shrink-0"
                                                            fill="currentColor"
                                                            viewBox="0 0 20 20"
                                                        >
                                                            <path
                                                                fillRule="evenodd"
                                                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                                                clipRule="evenodd"
                                                            />
                                                        </svg>
                                                        <span>{feature}</span>
                                                    </li>
                                                )
                                            )}
                                        </ul>
                                    </div>
                                )}
                        </div>
                    </motion.div>
                </div>

                {/* İlişkili Projeler */}
                {relatedProjects && relatedProjects.length > 0 && (
                    <div className="mt-16">
                        <h3 className="text-xl font-medium mb-6">{detailTexts.relatedProjects}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {relatedProjects.map((project: Project) => (
                                <Link
                                    key={`related-${project.id}`}
                                    href={{
                                        pathname: '/projects/[id]',
                                        params: { id: project.id },
                                    }}
                                    className="bg-white/5 group overflow-hidden rounded-xl transition-transform hover:scale-[1.02] hover:shadow-xl"
                                    prefetch={true}
                                >
                                    {project.images && project.images.length > 0 && (
                                        <div className="aspect-video relative">
                                            <Image
                                                src={formatImageUrl(project.images[0])}
                                                alt={project.title}
                                                fill
                                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 25vw"
                                                className="object-cover transition-transform group-hover:scale-105"
                                                loading="lazy"
                                            />
                                        </div>
                                    )}
                                    <div className="p-4">
                                        <h4 className="font-medium text-lg mb-2 text-white">
                                            {project.title}
                                        </h4>
                                        <p className="text-sm text-gray-300 line-clamp-2">
                                            {project.description}
                                        </p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}
