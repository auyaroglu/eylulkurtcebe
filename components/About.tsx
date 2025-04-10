'use client';

import { motion } from 'framer-motion';
import { useTranslations, useLocale } from 'next-intl';
import Image from 'next/image';
import { useAnimation } from '@/app/animation-context';
import { Sparkles } from '@/components/sparkles';

// Statik resim importu
import eylulImage from '@/public/images/eylul-galaxy.webp';

// About bileşeni için props arayüzü
interface AboutProps {
    contentData?: any;
}

export default function About({ contentData }: AboutProps) {
    const t = useTranslations('about');
    const locale = useLocale();
    const { animationKey } = useAnimation();

    // Veritabanı verileri veya localization dosyasından gelen veriler
    const title = contentData?.about?.title || t('title');
    const description = contentData?.about?.description || t('description');
    const experienceTitle = contentData?.about?.experience?.title || t('experience.title');
    const experienceDescription =
        contentData?.about?.experience?.description || t('experience.description');
    const educationTitle = contentData?.about?.education?.title || t('education.title');
    const educationDescription =
        contentData?.about?.education?.description || t('education.description');

    return (
        <section id="about" className="relative py-12 lg:py-24 max-lg:px-5 md:py-20 sm:py-16">
            <div className="from-primary/5 to-transparent absolute inset-0 bg-gradient-to-b dark:from-primary/10">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:54px_54px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
            </div>
            <div className="container py-6 sm:py-8 [background:linear-gradient(45deg,#080b11,theme(colors.slate.800)_50%,#172033)_padding-box,conic-gradient(from_var(--border-angle),theme(colors.slate.600/.48)_80%,_theme(colors.indigo.500)_86%,_theme(colors.indigo.300)_90%,_theme(colors.indigo.500)_94%,_theme(colors.slate.600/.48))_border-box] rounded-xl sm:rounded-2xl border border-transparent animate-border">
                <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-2 sm:gap-12">
                    <motion.div
                        key={`about-image-${locale}-${animationKey}`}
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: false, amount: 0.01 }}
                        transition={{ duration: 0.5 }}
                        className="mx-auto w-full max-w-sm relative md:max-w-none"
                    >
                        <div className="aspect-square w-full overflow-hidden relative rounded-xl sm:rounded-2xl">
                            <Image
                                src={eylulImage}
                                alt="Eylül Kurtcebe"
                                className="w-full h-full object-cover"
                                priority
                            />
                            <Sparkles
                                density={1500}
                                speed={2.5}
                                color="#48b6ff"
                                direction="top"
                                className="inset-x-0 top-0 bottom-0 absolute z-[0] h-auto overflow-hidden [mask-image:radial-gradient(ellipse_at_center,white,transparent)] before:absolute before:inset-0 before:bg-[radial-gradient(ellipse_at_bottom_center,#3273ff,transparent_90%)] before:opacity-40 after:absolute left-0 w-full"
                            />
                        </div>
                        <div className="-bottom-6 -right-6 bg-primary/20 w-16 h-16 absolute rounded-full blur-2xl sm:w-24 sm:h-24" />
                        <div className="-left-6 -top-6 bg-accent/20 w-24 h-24 absolute rounded-full blur-2xl sm:w-32 sm:h-32" />
                    </motion.div>

                    <motion.div
                        key={`about-content-${locale}-${animationKey}`}
                        initial={{ opacity: 0, x: 50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: false, amount: 0.01 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="px-1 sm:px-0"
                    >
                        <h2 className="mb-6 text-2xl font-bold sm:mb-8 sm:text-3xl">{title}</h2>
                        <p className="text-secondary mb-6 text-sm dark:text-secondary/90 sm:mb-8 sm:text-base">
                            {description}
                        </p>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
                            <div className="bg-white/5 border-white/10 p-4 rounded-lg border backdrop-blur-sm sm:p-6">
                                <h3 className="mb-3 text-base font-semibold sm:mb-4 sm:text-lg">
                                    {experienceTitle}
                                </h3>
                                <p className="text-secondary text-sm dark:text-secondary/90 sm:text-base">
                                    {experienceDescription}
                                </p>
                            </div>
                            <div className="bg-white/5 border-white/10 p-4 rounded-lg border backdrop-blur-sm sm:p-6">
                                <h3 className="mb-3 text-base font-semibold sm:mb-4 sm:text-lg">
                                    {educationTitle}
                                </h3>
                                <p className="text-secondary text-sm dark:text-secondary/90 sm:text-base">
                                    {educationDescription}
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
