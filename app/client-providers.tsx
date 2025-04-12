'use client';

import { NextIntlClientProvider } from 'next-intl';
import { SWRConfig } from 'swr';
import { AnimationProvider } from './animation-context';
import ToastProvider from '@/components/ToastProvider';

type ClientProvidersProps = {
    children: React.ReactNode;
    locale: string;
    messages: any;
};

export default function ClientProviders({ children, locale, messages }: ClientProvidersProps) {
    return (
        <NextIntlClientProvider locale={locale} messages={messages}>
            <SWRConfig
                value={{
                    revalidateOnFocus: false,
                    revalidateIfStale: true,
                    shouldRetryOnError: true,
                    errorRetryCount: 3,
                    dedupingInterval: 5000,
                    focusThrottleInterval: 5000,
                }}
            >
                <AnimationProvider>
                    {children}
                    <ToastProvider />
                </AnimationProvider>
            </SWRConfig>
        </NextIntlClientProvider>
    );
}
