'use client';

import { useRef } from 'react';
import Image from 'next/image';
import { motion, useInView } from 'framer-motion';
import { useTranslations, useLocale } from 'next-intl';
import { useAnimation } from '@/app/animation-context';
import { Fancybox } from '@fancyapps/ui';
import '@fancyapps/ui/dist/fancybox/fancybox.css';
import { Link } from '@/i18n/navigation';

// Fancybox basit lightbox yapılandırması
Fancybox.bind('[data-fancybox]', {
    // Basit lightbox ayarları
});

// Ana sayfada gösterilecek maksimum proje sayısı
const HOME_PROJECT_LIMIT = 3;

interface Project {
    id: string;
    title: string;
    description: string;
    images: string[];
    technologies: string[];
    demo?: string;
}

interface ProjectsData {
    title?: string;
    description?: string;
    viewAll?: string;
    list?: Project[];
}

interface ProjectsProps {
    lng: string;
    projectsData?: ProjectsData;
}

export default function Projects({ lng, projectsData }: ProjectsProps) {
    const t = useTranslations('projects');
    const locale = useLocale();
    const { animationKey } = useAnimation();
    const ref = useRef(null);
    const isInView = useInView(ref, { once: false, amount: 0.01 });

    // lng yoksa locale'i kullan
    const safeLng = lng || locale;

    // Animasyon varyantları
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.2,
            },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.8,
            },
        },
    };

    // Veritabanı verileri varsa onları kullan, yoksa translation'dan al
    let allProjects: Project[] = [];
    let projectTitle = '';
    let projectDescription = '';
    let viewAllText = '';

    if (projectsData && projectsData.list) {
        allProjects = projectsData.list;
        projectTitle = projectsData.title || t('title');
        projectDescription = projectsData.description || t('description');
        viewAllText = projectsData.viewAll || t('viewAll');
    } else {
        // Fallback: Localization dosyasından projeler datası alınıyor
        allProjects = t.raw('list') as Project[];
        projectTitle = t('title');
        projectDescription = t('description');
        viewAllText = t('viewAll');
    }

    // Ana sayfada gösterilecek projeler (ilk 3 proje)
    const featuredProjects = allProjects?.slice(0, HOME_PROJECT_LIMIT);

    // URL formatla (next/image için)
    const formatImageUrl = (url: string): string => {
        if (!url) return '';
        if (url.startsWith('http://') || url.startsWith('https://')) return url;
        return url.startsWith('/') ? url : `/${url}`;
    };

    return (
        <section id="projects">
            <div className="container-fluid py-24">
                <div className="container mx-auto py-6 sm:py-8 [background:linear-gradient(45deg,#080b11,theme(colors.slate.800)_50%,#172033)_padding-box,conic-gradient(from_var(--border-angle),theme(colors.slate.600/.48)_80%,_theme(colors.indigo.500)_86%,_theme(colors.indigo.300)_90%,_theme(colors.indigo.500)_94%,_theme(colors.slate.600/.48))_border-box] rounded-xl sm:rounded-2xl border border-transparent animate-border">
                    <motion.div
                        key={`projects-${safeLng}-${animationKey}`}
                        ref={ref}
                        variants={containerVariants}
                        initial="hidden"
                        animate={isInView ? 'visible' : 'hidden'}
                        className="mx-auto max-w-6xl"
                    >
                        <motion.div
                            key={`projects-header-${safeLng}-${animationKey}`}
                            variants={itemVariants}
                            className="mb-10 text-center sm:mb-16"
                        >
                            <h2 className="heading mb-4 text-3xl font-bold sm:mb-6 sm:text-4xl">
                                {projectTitle}
                            </h2>
                            <p className="mb-10 text-sm text-gray-600 dark:text-gray-400 sm:text-lg">
                                {projectDescription}
                            </p>
                        </motion.div>

                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 md:grid-cols-2 sm:gap-8">
                            {featuredProjects &&
                                featuredProjects.map(project => (
                                    <motion.div
                                        key={`project-${project.id}-${safeLng}-${animationKey}`}
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
                                            <p className="mb-4 text-sm text-gray-600 dark:text-gray-400 sm:text-base">
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
                                        </div>
                                    </motion.div>
                                ))}
                        </div>

                        {/* Tümünü Gör butonu - Daha fazla proje varsa gösterilir */}
                        {allProjects && allProjects.length > HOME_PROJECT_LIMIT && (
                            <div className="mt-12 text-center">
                                <Link
                                    href="/projects"
                                    className="inline-block px-8 py-3 text-white bg-indigo-600 rounded-lg transition-colors hover:bg-indigo-700"
                                >
                                    {viewAllText}
                                </Link>
                            </div>
                        )}
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
