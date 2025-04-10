'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useAnimation } from '@/app/animation-context';
import Pagination from './Pagination';
import { Fancybox } from '@fancyapps/ui';
import '@fancyapps/ui/dist/fancybox/fancybox.css';

// Sayfa başına gösterilecek proje sayısı
const PROJECTS_PER_PAGE = 6;

// Proje tipi tanımı
export interface Project {
    id: string;
    originalId?: string;
    title: string;
    description: string;
    images: string[];
    technologies: string[];
    demo?: string;
}

export default function ProjectsPage({
    lng,
    projects,
    itemsPerPage = 9,
}: {
    lng: string;
    projects: Project[];
    itemsPerPage?: number;
}) {
    const t = useTranslations('projects');
    const locale = useLocale();
    const { animationKey } = useAnimation();
    const [currentPage, setCurrentPage] = useState(1);
    const [activeFilter, setActiveFilter] = useState('all');

    // lng yoksa locale'i kullan
    const safeLng = lng || locale;

    // Tüm projeleri props'tan al
    const allProjects = projects;

    // Filtreleme işlemleri için kullanılabilecek teknolojileri topla
    const allTechnologies: string[] = [];
    if (allProjects && allProjects.length > 0) {
        allProjects.forEach(project => {
            if (project.technologies && Array.isArray(project.technologies)) {
                project.technologies.forEach(tech => {
                    if (!allTechnologies.includes(tech)) {
                        allTechnologies.push(tech);
                    }
                });
            }
        });
    }

    // Filtre uygula
    const filteredProjects = allProjects?.filter(project => {
        if (activeFilter === 'all') return true;
        return project.technologies?.includes(activeFilter);
    });

    // Sayfalama için projeleri böl
    const totalPages = Math.ceil((filteredProjects?.length || 0) / itemsPerPage);
    const paginatedProjects = filteredProjects?.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // URL formatla (next/image için)
    const formatImageUrl = (url: string): string => {
        if (!url) return '';
        if (url.startsWith('http://') || url.startsWith('https://')) return url;
        return url.startsWith('/') ? url : `/${url}`;
    };

    // Sayfa değiştiğinde en üste kaydır
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [currentPage]);

    // Lightbox bağlantılarını etkinleştir
    useEffect(() => {
        Fancybox.bind('[data-fancybox]', {
            // Basit lightbox ayarları
        });

        // Temizlik fonksiyonu
        return () => {
            Fancybox.unbind('[data-fancybox]');
            Fancybox.close();
        };
    }, [paginatedProjects]);

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

    // Filtre değiştiğinde ilk sayfaya dön
    const handleFilterChange = (filter: string) => {
        setActiveFilter(filter);
        setCurrentPage(1);
    };

    return (
        <section className="py-20 lg:py-32">
            <div className="container mx-auto px-4 py-10">
                <motion.div
                    key={`projects-page-${safeLng}-${animationKey}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mb-10 text-center sm:mb-16"
                >
                    <h1 className="heading mb-4 text-3xl font-bold sm:mb-6 sm:text-4xl">
                        {t('projectsPage.title')}
                    </h1>
                    <p className="mx-auto max-w-3xl text-gray-400 dark:text-gray-400 sm:text-lg">
                        {t('projectsPage.description')}
                    </p>

                    {/* Filtreleme Seçenekleri */}
                    {allTechnologies.length > 0 && (
                        <div className="mt-10">
                            <h3 className="mb-4 text-lg font-medium">
                                {t('projectsPage.filters.title')}
                            </h3>
                            <div className="flex flex-wrap justify-center gap-2">
                                <button
                                    onClick={() => handleFilterChange('all')}
                                    className={`px-4 py-2 text-sm rounded-full transition-colors ${
                                        activeFilter === 'all'
                                            ? 'bg-indigo-600 text-white'
                                            : 'bg-white/5 hover:bg-indigo-600/50'
                                    }`}
                                >
                                    {t('projectsPage.filters.all')}
                                </button>
                                {allTechnologies.map(tech => (
                                    <button
                                        key={tech}
                                        onClick={() => handleFilterChange(tech)}
                                        className={`px-4 py-2 text-sm rounded-full transition-colors ${
                                            activeFilter === tech
                                                ? 'bg-indigo-600 text-white'
                                                : 'bg-white/5 hover:bg-indigo-600/50'
                                        }`}
                                    >
                                        {tech}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </motion.div>

                {paginatedProjects && paginatedProjects.length > 0 ? (
                    <motion.div
                        key={`projects-grid-${safeLng}-${activeFilter}-${currentPage}-${animationKey}`}
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="grid grid-cols-1 gap-8 lg:grid-cols-3 md:grid-cols-2"
                    >
                        {paginatedProjects.map(project => (
                            <motion.div
                                key={`project-card-${project.id}-${safeLng}-${animationKey}`}
                                variants={itemVariants}
                                className="bg-white/5 overflow-hidden shadow-lg backdrop-blur-sm group dark:bg-black/5 [background:linear-gradient(45deg,#080b11,theme(colors.slate.800)_50%,#172033)_padding-box,conic-gradient(from_var(--border-angle),theme(colors.slate.600/.48)_80%,_theme(colors.indigo.500)_86%,_theme(colors.indigo.300)_90%,_theme(colors.indigo.500)_94%,_theme(colors.slate.600/.48))_border-box] rounded-xl sm:rounded-2xl border border-transparent animate-border p-4 sm:p-6"
                            >
                                <div className="project-image-container mb-4">
                                    {/* Ana görsel - Lightbox için tıklanabilir */}
                                    {project.images && project.images.length > 0 && (
                                        <div
                                            className="h-64 overflow-hidden relative mb-4 rounded-lg md:h-72"
                                            data-fancybox={`gallery-${project.id}`}
                                            data-src={formatImageUrl(project.images[0])}
                                        >
                                            <Image
                                                src={formatImageUrl(project.images[0])}
                                                alt={`${project.title} - Ana Görsel`}
                                                fill
                                                style={{ objectFit: 'cover' }}
                                                className="transition-opacity duration-300 cursor-pointer hover:opacity-90"
                                                loading="lazy"
                                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                                placeholder="blur"
                                                blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiNjY2NjY2MiIC8+PC9zdmc+"
                                            />

                                            {/* Resim sayısı göstergesi */}
                                            {project.images.length > 1 && (
                                                <div className="bg-black/50 absolute right-2 bottom-2 px-2 py-1 text-xs text-white rounded">
                                                    1/{project.images.length}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Diğer görseller için gizli lightbox bağlantıları */}
                                    <div className="hidden">
                                        {project.images &&
                                            project.images
                                                .slice(1)
                                                .map((img, idx) => (
                                                    <a
                                                        key={idx}
                                                        data-fancybox={`gallery-${project.id}`}
                                                        href={formatImageUrl(img)}
                                                    />
                                                ))}
                                    </div>

                                    {/* Proje bilgileri */}
                                    <Link
                                        href={{
                                            pathname: '/projects/[id]',
                                            params: { id: project.id },
                                        }}
                                        className="transition-colors hover:text-indigo-300"
                                    >
                                        <h3 className="mb-2 text-lg font-semibold sm:text-xl">
                                            {project.title}
                                        </h3>
                                    </Link>
                                    <p className="mb-4 text-sm text-gray-400 dark:text-gray-400 sm:text-base">
                                        {project.description}
                                    </p>
                                </div>

                                <div className="mt-4">
                                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                                        {Array.isArray(project.technologies) &&
                                            project.technologies.map((tech, techIndex) => (
                                                <span
                                                    key={techIndex}
                                                    className="bg-gray-100/10 px-2 py-1 text-xs font-medium rounded-full backdrop-blur-sm dark:bg-gray-700/10 sm:px-3 sm:text-sm"
                                                >
                                                    {tech}
                                                </span>
                                            ))}
                                    </div>

                                    <div className="mt-6">
                                        <Link
                                            href={{
                                                pathname: '/projects/[id]',
                                                params: { id: project.id },
                                            }}
                                            className="inline-flex items-center text-indigo-400 transition-colors hover:text-indigo-300"
                                        >
                                            {t('demo')}
                                            <svg
                                                className="w-4 h-4 ml-1"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M14 5l7 7m0 0l-7 7m7-7H3"
                                                />
                                            </svg>
                                        </Link>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                ) : (
                    <div className="py-20 text-center">
                        <p className="text-gray-400">{t('projectsPage.noProjects')}</p>
                    </div>
                )}

                {/* Sayfalama */}
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                />

                {/* Ana Sayfaya Dön */}
                <div className="mt-16 text-center">
                    <Link
                        href="/"
                        className="inline-flex items-center text-indigo-400 transition-colors hover:text-indigo-300"
                    >
                        <svg
                            className="w-4 h-4 mr-1"
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
                        {t('projectsPage.backToHome')}
                    </Link>
                </div>
            </div>
        </section>
    );
}
