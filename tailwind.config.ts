import type { Config } from 'tailwindcss';

const config: Config = {
    content: ['./components/**/*.{js,ts,jsx,tsx,mdx}', './app/**/*.{js,ts,jsx,tsx,mdx}'],
    theme: {
        extend: {
            colors: {
                primary: '#0070f3',
                secondary: '#b19c9c',
                dark: '#111827',
                light: '#f9fafb',
            },
            fontFamily: {
                sans: ['var(--font-inter)', 'sans-serif'],
                mono: ['var(--font-roboto-mono)', 'monospace'],
            },
            keyframes: {
                hyperspeed: {
                    from: { transform: 'translateX(100%) scale(0)' },
                    to: { transform: 'translateX(-500%) scale(3)' },
                },
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { transform: 'translateY(20px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                slideDown: {
                    '0%': { transform: 'translateY(-20px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                pulse: {
                    '0%, 100%': { opacity: '1' },
                    '50%': { opacity: '0.3' },
                },
                border: {
                    to: { '--border-angle': '360deg' },
                },
            },
            animation: {
                border: 'border 4s linear infinite',
                hyperspeed: 'hyperspeed 5s linear infinite',
                'fade-in': 'fadeIn 0.5s ease-in-out',
                'slide-up': 'slideUp 0.5s ease-in-out',
                'slide-down': 'slideDown 0.5s ease-in-out',
                pulse: 'pulse 3s ease-in-out infinite',
            },
            backgroundImage: {
                'grid-white':
                    'linear-gradient(to right, rgba(255, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.1) 1px, transparent 1px)',
            },
        },
    },
    plugins: [],
};

export default config;
