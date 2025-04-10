'use client';

import { useEffect, useState } from 'react';
import { motion, useAnimation as useMotionAnimation } from 'framer-motion';
import { Sparkles } from '@/components/sparkles';
import { useTranslations, useLocale } from 'next-intl';
import { useAnimation } from '@/app/animation-context';

// Hero bileşeni için props arayüzü
interface HeroProps {
    contentData?: any;
}

export default function Hero({ contentData }: HeroProps) {
    const t = useTranslations('hero');
    const locale = useLocale();
    const { animationKey } = useAnimation();
    const [isVisible, setIsVisible] = useState(false);
    const controls = useMotionAnimation();

    // Veritabanı verileri veya localization dosyasından gelen veriler
    const title = contentData?.hero?.title || t('title');
    const description = contentData?.hero?.description || t('description');
    const contactButton = contentData?.hero?.contactButton || t('contactButton');
    const projectsButton = contentData?.hero?.projectsButton || t('projectsButton');

    // Sayfa yüklendiğinde veya dil değiştiğinde animasyonları yeniden başlat
    useEffect(() => {
        setIsVisible(true);
        controls.start({ opacity: 1, y: 0 });
    }, [controls, locale, animationKey, contentData]);

    return (
        <section
            id="hero"
            className="min-h-screen overflow-hidden relative flex justify-center items-center pt-20 max-lg:px-5 sm:pt-24"
        >
            <div className="container relative z-10 py-8 sm:py-10 md:py-16 [background:linear-gradient(45deg,#080b11,theme(colors.slate.800)_50%,#172033)_padding-box,conic-gradient(from_var(--border-angle),theme(colors.slate.600/.48)_80%,_theme(colors.indigo.500)_86%,_theme(colors.indigo.300)_90%,_theme(colors.indigo.500)_94%,_theme(colors.slate.600/.48))_border-box] rounded-xl sm:rounded-2xl border border-transparent animate-border">
                <div className="mx-auto max-w-3xl text-center">
                    <motion.h1
                        key={`hero-title-${locale}-${animationKey}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={controls}
                        transition={{ duration: 0.5 }}
                        className="from-primary to-light/80 mb-6 sm:mb-8 text-3xl sm:text-4xl lg:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r relative z-[1] lg:min-h-[125px]"
                    >
                        {title}
                    </motion.h1>
                    <motion.p
                        key={`hero-desc-${locale}-${animationKey}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={controls}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="text-secondary mb-8 sm:mb-10 text-base sm:text-lg lg:text-xl dark:text-secondary/90 relative z-[1] px-0 sm:px-2"
                    >
                        {description}
                    </motion.p>
                    <motion.div
                        key={`hero-buttons-${locale}-${animationKey}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={controls}
                        transition={{ duration: 0.5, delay: 0.4 }}
                        className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 relative z-[1] px-0 sm:px-4"
                    >
                        <a
                            href="#contact"
                            className="bg-primary px-6 py-3 text-sm font-medium text-white rounded-lg transition-colors hover:bg-primary/90 sm:px-8 sm:text-base"
                        >
                            {contactButton}
                        </a>
                        <a
                            href="#projects"
                            className="text-primary px-6 py-3 text-sm font-medium bg-white rounded-lg transition-colors hover:bg-white/70 sm:px-8 sm:text-base"
                        >
                            {projectsButton}
                        </a>
                    </motion.div>
                    <Sparkles
                        density={500}
                        speed={1.2}
                        color="#48b6ff"
                        direction="top"
                        className="inset-x-0 bottom-0 absolute z-[0] h-auto overflow-hidden [mask-image:radial-gradient(ellipse_at_center_top_50%,white,transparent)] before:absolute before:inset-0 before:bg-[radial-gradient(ellipse_at_bottom_center,#3273ff,transparent_90%)] before:opacity-40 after:absolute left-0 top-0 -right-0 w-full"
                    />
                </div>
            </div>
        </section>
    );
}
