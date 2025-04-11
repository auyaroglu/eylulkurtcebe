'use client';

import { motion } from 'framer-motion';
import { useTranslations, useLocale } from 'next-intl';
import { useAnimation } from '@/app/animation-context';
import {
    RiFlaskFill,
    RiPaletteFill,
    RiBuilding2Fill,
    RiMicroscopeFill,
    RiTestTubeFill,
    RiPaintBrushFill,
    RiShape2Fill,
    RiLeafFill,
    RiFireFill,
    RiWaterFlashFill,
    RiToolsFill,
    RiArtboard2Fill,
    RiRulerFill,
    RiDraftFill,
    RiLightbulbFill,
    RiSettings2Fill,
    RiBubbleChartFill,
    RiDropFill,
    RiPenNibFill,
} from 'react-icons/ri';

// Expertise bileşeni için props arayüzü
interface ExpertiseProps {
    contentData?: any;
}

// İkon seçimi için yardımcı fonksiyon
const getIcon = (iconName: string, size = 24) => {
    switch (iconName) {
        case 'flask':
            return <RiFlaskFill size={size} className="text-primary" />;
        case 'palette':
            return <RiPaletteFill size={size} className="text-primary" />;
        case 'industry':
            return <RiBuilding2Fill size={size} className="text-primary" />;
        case 'microscope':
            return <RiMicroscopeFill size={size} className="text-primary" />;
        case 'test-tube':
            return <RiTestTubeFill size={size} className="text-primary" />;
        case 'brush':
            return <RiPaintBrushFill size={size} className="text-primary" />;
        case 'shape':
            return <RiShape2Fill size={size} className="text-primary" />;
        case 'settings':
            return <RiSettings2Fill size={size} className="text-primary" />;
        case 'leaf':
            return <RiLeafFill size={size} className="text-primary" />;
        case 'fire':
            return <RiFireFill size={size} className="text-primary" />;
        case 'water':
            return <RiWaterFlashFill size={size} className="text-primary" />;
        case 'tools':
            return <RiToolsFill size={size} className="text-primary" />;
        case 'artboard':
            return <RiArtboard2Fill size={size} className="text-primary" />;
        case 'ruler':
            return <RiRulerFill size={size} className="text-primary" />;
        case 'draft':
            return <RiDraftFill size={size} className="text-primary" />;
        case 'bulb':
            return <RiLightbulbFill size={size} className="text-primary" />;
        case 'bubble':
            return <RiBubbleChartFill size={size} className="text-primary" />;
        case 'drop':
            return <RiDropFill size={size} className="text-primary" />;
        case 'pen':
            return <RiPenNibFill size={size} className="text-primary" />;
        default:
            return <RiFlaskFill size={size} className="text-primary" />;
    }
};

export default function Expertise({ contentData }: ExpertiseProps) {
    const locale = useLocale();
    const { animationKey } = useAnimation();

    // contentData içinde expertise alanı yoksa, eksik alanlar için boş bir nesne kullan
    const expertise = contentData?.expertise || {
        title: '',
        description: '',
        categories: [],
    };

    return (
        <section id="expertise" className="relative py-12 lg:py-24 max-lg:px-5 md:py-20 sm:py-16">
            <div className="from-accent/5 to-transparent absolute inset-0 bg-gradient-to-t dark:from-accent/10">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:54px_54px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_100%,#000_70%,transparent_100%)]" />
            </div>

            <div className="container mx-auto max-w-6xl py-6 sm:py-8">
                <motion.div
                    key={`expertise-header-${locale}-${animationKey}`}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: false, amount: 0.01 }}
                    transition={{ duration: 0.5 }}
                    className="mb-12 text-center sm:mb-16"
                >
                    <h2 className="mb-4 text-2xl font-bold sm:mb-6 sm:text-3xl">
                        {expertise.title}
                    </h2>
                    <p className="text-secondary mx-auto max-w-2xl text-sm dark:text-secondary/90 sm:text-base">
                        {expertise.description}
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-4 md:grid-cols-2">
                    {expertise.categories &&
                        expertise.categories.map((category: any, index: number) => (
                            <motion.div
                                key={`expertise-card-${index}-${locale}-${animationKey}`}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: false, amount: 0.01 }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                className="bg-white/5 p-6 backdrop-blur-sm dark:bg-black/5 [background:linear-gradient(45deg,#080b11,theme(colors.slate.800)_50%,#172033)_padding-box,conic-gradient(from_var(--border-angle),theme(colors.slate.600/.48)_80%,_theme(colors.indigo.500)_86%,_theme(colors.indigo.300)_90%,_theme(colors.indigo.500)_94%,_theme(colors.slate.600/.48))_border-box] rounded-xl sm:rounded-2xl border border-transparent animate-border"
                            >
                                <div className="bg-slate-900/60 w-12 h-12 flex justify-center items-center mb-4 rounded-lg backdrop-blur-md">
                                    {getIcon(category.icon || 'default', 28)}
                                </div>
                                <h3 className="mb-3 text-xl font-semibold">{category.title}</h3>
                                <p className="text-secondary text-sm leading-relaxed">
                                    {category.description}
                                </p>
                            </motion.div>
                        ))}
                </div>
            </div>
        </section>
    );
}
