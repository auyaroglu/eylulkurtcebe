'use client';

import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import About from '@/components/About';
import Skills from '@/components/Skills';
import Projects from '@/components/Projects';
import Contact from '@/components/Contact';
import Footer from '@/components/Footer';
import { useLocale } from 'next-intl';

// Project tipini Projects bileşeninden alıyoruz (re-implementation)
interface Project {
    id: string;
    title: string;
    description: string;
    images: string[];
    technologies: string[];
    demo?: string;
}

// Veri tiplerini daha spesifik olarak tanımlayalım
interface ContentData {
    hero?: any;
    about?: any;
    skills?: any;
    contact?: any;
    footer?: any;
    [key: string]: any; // Diğer alanlar için
}

// Projects bileşeninde tanımlanan ProjectsData ile uyumlu
interface ProjectsData {
    title?: string;
    description?: string;
    viewAll?: string;
    list?: Project[];
    [key: string]: any; // Diğer alanlar için
}

// Site ayarları için interface
interface SiteConfigData {
    displayEmail?: string;
    contactEmail?: string;
    robotsEnabled?: boolean;
    pagination?: {
        itemsPerPage: number;
    };
    seo?: {
        title: string;
        description: string;
        keywords: string;
        ogImage: string;
    };
    [key: string]: any; // Diğer alanlar için
}

interface PageContentProps {
    initialContent: ContentData | null;
    initialProjects: ProjectsData | null;
    siteConfig?: SiteConfigData | null;
}

export default function PageContent({
    initialContent,
    initialProjects,
    siteConfig,
}: PageContentProps) {
    const locale = useLocale();

    // initialContent veya initialProjects null ise boş obje kullan
    const safeContent = initialContent || {};
    const safeProjects = initialProjects || {};
    const safeSiteConfig = siteConfig || {};

    // Artık sunucudan gelen veri doğrudan kullanılıyor, client-side fetching yok
    return (
        <main>
            <Navbar lng={locale} />
            <Hero contentData={safeContent} />
            <About contentData={safeContent} />
            <Skills contentData={safeContent} />
            <Projects projectsData={safeProjects} lng={locale} />
            <Contact contentData={safeContent} siteConfig={safeSiteConfig} />
            <Footer contentData={safeContent} />
        </main>
    );
}
