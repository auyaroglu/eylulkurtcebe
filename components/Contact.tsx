'use client';

import { motion } from 'framer-motion';
import { useTranslations, useLocale } from 'next-intl';
import { useAnimation } from '@/app/animation-context';
import { useState, FormEvent } from 'react';
import { toast } from 'react-toastify';

// Contact bileşeni için props arayüzü
interface ContactProps {
    contentData?: any;
    siteConfig?: {
        displayEmail?: string;
        contactEmail?: string;
    };
}

export default function Contact({ contentData, siteConfig }: ContactProps) {
    const t = useTranslations('contact');
    const locale = useLocale();
    const { animationKey } = useAnimation();

    // Form state
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

    // Honeypot field (bot tespiti için)
    const [honeypot, setHoneypot] = useState('');

    // Dinamik verileri kontrol et ve varsayılan değerlerle birleştir
    const contactData = contentData?.contact || {};
    const footerData = contentData?.footer || {};

    const title = contactData.title || t('title');
    const description = contactData.description || t('description');

    const infoTitle = contactData.info?.title || t('info.title');

    const formTitle = contactData.form?.title || t('form.title');
    const formName = contactData.form?.name || t('form.name');
    const formEmail = contactData.form?.email || t('form.email');
    const formMessage = contactData.form?.message || t('form.message');
    const formSubmit = contactData.form?.submit || t('form.submit');

    // Form validasyon işlevi
    const validateForm = () => {
        const errors: { [key: string]: string } = {};

        if (!name.trim()) {
            errors.name = 'İsim alanı gereklidir';
        } else if (name.trim().length < 2) {
            errors.name = 'İsim en az 2 karakter olmalıdır';
        }

        if (!email.trim()) {
            errors.email = 'E-posta alanı gereklidir';
        } else if (!/^\S+@\S+\.\S+$/.test(email)) {
            errors.email = 'Geçerli bir e-posta adresi giriniz';
        }

        if (!message.trim()) {
            errors.message = 'Mesaj alanı gereklidir';
        } else if (message.trim().length < 10) {
            errors.message = 'Mesaj en az 10 karakter olmalıdır';
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // Form gönderme işlevi
    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        // Honeypot kontrolü - eğer doldurulmuşsa bot olabilir
        if (honeypot) {
            // Bot'a başarılı gibi göster ama aslında gönderme
            setIsSubmitting(false);
            setName('');
            setEmail('');
            setMessage('');
            toast.success('Mesajınız gönderildi!');
            return;
        }

        // Form validasyonu
        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name,
                    email,
                    message,
                    honeypot,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                // Form başarıyla gönderildi
                toast.success('Mesajınız gönderildi!');

                // Formu temizle
                setName('');
                setEmail('');
                setMessage('');
                setFormErrors({});
            } else {
                // Hata mesajı
                if (data.error) {
                    toast.error(data.error);
                } else {
                    toast.error('Bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
                }
            }
        } catch (error) {
            toast.error('Bağlantı hatası. Lütfen internet bağlantınızı kontrol edin.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Site ayarlarından veya içerik verilerinden e-posta adresini al
    // Öncelik: site ayarları > içerik verisi > varsayılan değer
    const displayEmail =
        siteConfig?.displayEmail ||
        footerData.contact?.email ||
        footerData.socialMedia?.email ||
        'info@eylulkurtcebe.com';

    const instagramUser =
        footerData.contact?.instagram || footerData.socialMedia?.instagram || 'eylulkurtcebe';
    const instagramLink = instagramUser.includes('instagram.com')
        ? instagramUser
        : `https://instagram.com/${instagramUser}`;

    // LinkedIn bilgisini al
    const linkedinUser = footerData.socialMedia?.linkedin || '';
    const linkedinLink = linkedinUser.includes('linkedin.com')
        ? linkedinUser
        : linkedinUser
        ? `https://linkedin.com/in/${linkedinUser}`
        : '';

    return (
        <section id="contact" className="relative lg:py-24 max-sm:px-5 md:py-20 sm:py-16">
            <div className="from-accent/5 to-primary/5 via-transparent absolute inset-0 bg-gradient-to-t dark:from-accent/10 dark:to-primary/10">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:54px_54px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
            </div>
            <div className="container py-6 sm:py-8 [background:linear-gradient(45deg,#080b11,theme(colors.slate.800)_50%,#172033)_padding-box,conic-gradient(from_var(--border-angle),theme(colors.slate.600/.48)_80%,_theme(colors.indigo.500)_86%,_theme(colors.indigo.300)_90%,_theme(colors.indigo.500)_94%,_theme(colors.slate.600/.48))_border-box] rounded-xl sm:rounded-2xl border border-transparent animate-border">
                <motion.div
                    key={`contact-header-${locale}-${animationKey}`}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: false, amount: 0.01 }}
                    transition={{ duration: 0.5 }}
                    className="mb-10 text-center sm:mb-16"
                >
                    <h2 className="mb-4 text-2xl font-bold sm:mb-6 sm:text-3xl">{title}</h2>
                    <p className="text-secondary mx-auto max-w-2xl text-sm dark:text-secondary/90 sm:text-base">
                        {description}
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 sm:gap-12">
                    <motion.div
                        key={`contact-info-${locale}-${animationKey}`}
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: false, amount: 0.01 }}
                        transition={{ duration: 0.5 }}
                        className="bg-white/5 p-6 sm:p-8 backdrop-blur-sm dark:bg-black/5 [background:linear-gradient(45deg,#080b11,theme(colors.slate.800)_50%,#172033)_padding-box,conic-gradient(from_var(--border-angle),theme(colors.slate.600/.48)_80%,_theme(colors.indigo.500)_86%,_theme(colors.indigo.300)_90%,_theme(colors.indigo.500)_94%,_theme(colors.slate.600/.48))_border-box] rounded-xl sm:rounded-2xl border border-transparent animate-border"
                    >
                        <h3 className="mb-6 text-lg font-semibold sm:mb-8 sm:text-xl">
                            {infoTitle}
                        </h3>
                        <div className="space-y-4 sm:space-y-6">
                            <div className="flex items-center">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="text-primary w-5 h-5 mr-3 sm:w-6 sm:h-6 sm:mr-4"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                    />
                                </svg>
                                <a
                                    href={`mailto:${displayEmail}`}
                                    className="text-secondary text-sm transition-colors hover:text-primary sm:text-base"
                                >
                                    {displayEmail}
                                </a>
                            </div>
                            {linkedinUser && (
                                <div className="flex items-center">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="text-primary w-5 h-5 mr-3 sm:w-6 sm:h-6 sm:mr-4"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"
                                        />
                                        <rect width="4" height="12" x="2" y="9" />
                                        <circle cx="4" cy="4" r="2" />
                                    </svg>
                                    <a
                                        href={linkedinLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-secondary text-sm transition-colors hover:text-primary sm:text-base"
                                    >
                                        LinkedIn
                                    </a>
                                </div>
                            )}
                            {instagramUser && (
                                <div className="flex items-center">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="text-primary w-5 h-5 mr-3 sm:w-6 sm:h-6 sm:mr-4"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M12 2c2.717 0 3.056.01 4.122.06 1.065.05 1.79.217 2.428.465.66.254 1.216.598 1.772 1.153.509.5.902 1.105 1.153 1.772.247.637.415 1.363.465 2.428.047 1.066.06 1.405.06 4.122 0 2.717-.01 3.056-.06 4.122-.05 1.065-.218 1.79-.465 2.428-.254.66-.598 1.216-1.153 1.772-.5.509-1.105.902-1.772 1.153-.637.247-1.363.415-2.428.465-1.066.047-1.405.06-4.122.06-2.717 0-3.056-.01-4.122-.06-1.065-.05-1.79-.218-2.428-.465-.66-.254-1.216-.598-1.772-1.153-.509-.5-.902-1.105-1.153-1.772-.247-.637-.415-1.363-.465-2.428-.047-1.066-.06-1.405-.06-4.122 0-2.717.01-3.056.06-4.122.05-1.065.218-1.79.465-2.428.254-.66.598-1.216 1.153-1.772.5-.509 1.105-.902 1.772-1.153.637-.247 1.363-.415 2.428-.465 1.066-.047 1.405-.06 4.122-.06M12 0C9.25 0 8.824.016 7.734.068 6.66.121 5.694.308 4.84.677c-.87.371-1.607.866-2.342 1.6-.734.735-1.229 1.472-1.6 2.342C.53 5.494.343 6.459.29 7.534.239 8.624.225 9.05.225 11.8c0 2.75.014 3.176.064 4.266.053 1.075.24 2.041.609 2.896.371.87.866 1.607 1.6 2.342.735.734 1.472 1.229 2.342 1.6.856.369 1.82.556 2.896.609 1.09.05 1.516.064 4.266.064 2.75 0 3.176-.014 4.266-.064 1.075-.053 2.041-.24 2.896-.609.87-.371 1.607-.866 2.342-1.6.734-.735 1.229-1.472 1.6-2.342.369-.856.556-1.82.609-2.896.05-1.09.064-1.516.064-4.266 0-2.75-.014-3.176-.064-4.266-.053-1.075-.24-2.041-.609-2.896-.371-.87-.866-1.607-1.6-2.342-.735-.734-1.472-1.229-2.342-1.6-.856-.369-1.82-.556-2.896-.609C15.176.016 14.75 0 12 0zm0 5.838c-3.3 0-5.962 2.664-5.962 5.962 0 3.3 2.664 5.962 5.962 5.962 3.3 0 5.962-2.664 5.962-5.962 0-3.3-2.664-5.962-5.962-5.962zM12 15c-1.79 0-3.24-1.45-3.24-3.24 0-1.79 1.45-3.24 3.24-3.24 1.79 0 3.24 1.45 3.24 3.24 0 1.79-1.45 3.24-3.24 3.24zm6.162-10.2c-.77 0-1.394.626-1.394 1.394 0 .77.626 1.394 1.394 1.394.77 0 1.394-.626 1.394-1.394 0-.77-.626-1.394-1.394-1.394z"
                                        />
                                    </svg>
                                    <a
                                        href={instagramLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-secondary text-sm transition-colors hover:text-primary sm:text-base"
                                    >
                                        Instagram
                                    </a>
                                </div>
                            )}
                        </div>
                    </motion.div>

                    <motion.div
                        key={`contact-form-${locale}-${animationKey}`}
                        initial={{ opacity: 0, x: 50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: false, amount: 0.01 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="bg-white/5 p-6 sm:p-8 backdrop-blur-sm dark:bg-black/5 [background:linear-gradient(45deg,#080b11,theme(colors.slate.800)_50%,#172033)_padding-box,conic-gradient(from_var(--border-angle),theme(colors.slate.600/.48)_80%,_theme(colors.indigo.500)_86%,_theme(colors.indigo.300)_90%,_theme(colors.indigo.500)_94%,_theme(colors.slate.600/.48))_border-box] rounded-xl sm:rounded-2xl border border-transparent animate-border"
                    >
                        <h3 className="mb-4 text-lg font-semibold sm:mb-6 sm:text-xl">
                            {formTitle}
                        </h3>
                        <form className="space-y-4 sm:space-y-6" onSubmit={handleSubmit}>
                            {/* Honeypot alan - botlar için görünmez tuzak */}
                            <div className="w-0 h-0 overflow-hidden absolute opacity-0">
                                <label htmlFor="honeypot">Bu alanı boş bırakın</label>
                                <input
                                    type="text"
                                    id="honeypot"
                                    name="honeypot"
                                    value={honeypot}
                                    onChange={e => setHoneypot(e.target.value)}
                                    tabIndex={-1}
                                    autoComplete="off"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="name"
                                    className="block mb-1 text-sm sm:mb-2 sm:text-base"
                                >
                                    {formName}
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    className={`bg-white/10 border-white/10 w-full px-3 py-2 text-sm rounded-lg border transition-colors focus:border-primary focus:outline-none sm:px-4 sm:text-base ${
                                        formErrors.name ? 'border-red-500' : ''
                                    }`}
                                    disabled={isSubmitting}
                                />
                                {formErrors.name && (
                                    <p className="mt-1 text-xs text-red-500">{formErrors.name}</p>
                                )}
                            </div>
                            <div>
                                <label
                                    htmlFor="email"
                                    className="block mb-1 text-sm sm:mb-2 sm:text-base"
                                >
                                    {formEmail}
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    className={`bg-white/10 border-white/10 w-full px-3 py-2 text-sm rounded-lg border transition-colors focus:border-primary focus:outline-none sm:px-4 sm:text-base ${
                                        formErrors.email ? 'border-red-500' : ''
                                    }`}
                                    disabled={isSubmitting}
                                />
                                {formErrors.email && (
                                    <p className="mt-1 text-xs text-red-500">{formErrors.email}</p>
                                )}
                            </div>
                            <div>
                                <label
                                    htmlFor="message"
                                    className="block mb-1 text-sm sm:mb-2 sm:text-base"
                                >
                                    {formMessage}
                                </label>
                                <textarea
                                    id="message"
                                    name="message"
                                    rows={4}
                                    value={message}
                                    onChange={e => setMessage(e.target.value)}
                                    className={`bg-white/10 border-white/10 w-full px-3 py-2 text-sm rounded-lg border transition-colors focus:border-primary focus:outline-none sm:px-4 sm:text-base ${
                                        formErrors.message ? 'border-red-500' : ''
                                    }`}
                                    disabled={isSubmitting}
                                />
                                {formErrors.message && (
                                    <p className="mt-1 text-xs text-red-500">
                                        {formErrors.message}
                                    </p>
                                )}
                            </div>
                            <button
                                type="submit"
                                className="bg-primary w-full py-2.5 sm:py-3 rounded-lg transition-colors hover:bg-primary/90 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Gönderiliyor...' : formSubmit}
                            </button>
                        </form>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
