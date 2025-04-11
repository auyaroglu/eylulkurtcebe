'use client';

import { motion } from 'framer-motion';
import { useTranslations, useLocale } from 'next-intl';
import { useAnimation } from '@/app/animation-context';
import { useMemo } from 'react';

// Skills bileşeni için props arayüzü
interface SkillsProps {
    contentData?: any;
}

export default function Skills({ contentData }: SkillsProps) {
    const t = useTranslations('skills');
    const locale = useLocale();
    const { animationKey } = useAnimation();

    // useMemo ile her render'da skillCategories'i yeniden hesaplayalım
    // Bu, contentData değiştiğinde güncel verilerin kullanılmasını sağlar
    const skillCategories = useMemo(() => {
        // Doğrudan çevirilerden al
        const translatedCategories = t.raw('categories');

        // contentData'dan gelen kategorileri kontrol et
        if (contentData?.skills?.categories) {
            return contentData.skills.categories;
        }

        // Çevirilerden gelen kategorileri kullan
        return translatedCategories;
    }, [t, contentData, locale, animationKey]);

    // Kategori verilerini kontrol etmek için bir kullan
    console.log('Güncel kategori verileri:', skillCategories);

    return (
        <section id="skills" className="relative py-12 lg:py-24 max-lg:px-5 md:py-20 sm:py-16">
            <div className="from-accent/5 to-transparent absolute inset-0 bg-gradient-to-t dark:from-accent/10">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:54px_54px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_100%,#000_70%,transparent_100%)]" />
            </div>
            <div className="container py-6 sm:py-8 [background:linear-gradient(45deg,#080b11,theme(colors.slate.800)_50%,#172033)_padding-box,conic-gradient(from_var(--border-angle),theme(colors.slate.600/.48)_80%,_theme(colors.indigo.500)_86%,_theme(colors.indigo.300)_90%,_theme(colors.indigo.500)_94%,_theme(colors.slate.600/.48))_border-box] rounded-xl sm:rounded-2xl border border-transparent animate-border">
                <motion.div
                    key={`skills-header-${locale}-${animationKey}-${Date.now()}`}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: false, amount: 0.01 }}
                    transition={{ duration: 0.5 }}
                    className="mb-10 text-center sm:mb-16"
                >
                    <h2 className="mb-4 text-2xl font-bold sm:mb-6 sm:text-3xl">
                        {contentData?.skills?.title || t('title')}
                    </h2>
                    <p className="text-secondary mx-auto max-w-2xl text-sm dark:text-secondary/90 sm:text-base">
                        {contentData?.skills?.description || t('description')}
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 gap-5 lg:grid-cols-3 md:grid-cols-2 sm:gap-8">
                    {Object.entries(skillCategories).map(
                        ([key, category]: [string, any], index) => (
                            <motion.div
                                key={`${key}-${locale}-${animationKey}-${Date.now()}-${index}`}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: false, amount: 0.01 }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                className="bg-white/5 p-4 sm:p-6 backdrop-blur-sm dark:bg-black/5 [background:linear-gradient(45deg,#080b11,theme(colors.slate.800)_50%,#172033)_padding-box,conic-gradient(from_var(--border-angle),theme(colors.slate.600/.48)_80%,_theme(colors.indigo.500)_86%,_theme(colors.indigo.300)_90%,_theme(colors.indigo.500)_94%,_theme(colors.slate.600/.48))_border-box] rounded-xl sm:rounded-2xl border border-transparent animate-border"
                            >
                                <h3 className="mb-3 text-lg font-semibold sm:mb-4 sm:text-xl">
                                    {category.title}
                                </h3>
                                <div className="space-y-3 sm:space-y-4">
                                    {category.skills.map((skill: any) => (
                                        <div
                                            key={`${
                                                skill.name
                                            }-${locale}-${animationKey}-${Date.now()}`}
                                        >
                                            <div className="flex justify-between mb-1 text-sm sm:text-base">
                                                <span>{skill.name}</span>
                                                <span>{skill.level}%</span>
                                            </div>
                                            <div className="bg-white/10 h-1.5 sm:h-2 overflow-hidden rounded-full">
                                                <motion.div
                                                    key={`${
                                                        skill.name
                                                    }-progress-${locale}-${animationKey}-${Date.now()}`}
                                                    initial={{ width: 0 }}
                                                    whileInView={{ width: `${skill.level}%` }}
                                                    viewport={{ once: false, amount: 0.01 }}
                                                    transition={{ duration: 1, delay: 0.5 }}
                                                    className="from-primary to-accent h-full bg-gradient-to-r rounded-full"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )
                    )}
                </div>
            </div>
        </section>
    );
}
