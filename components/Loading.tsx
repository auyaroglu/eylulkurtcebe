'use client';

import { motion } from 'framer-motion';

export default function Loading() {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-r from-slate-900 to-slate-800">
            <motion.div
                className="flex flex-col items-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
            >
                <div className="relative">
                    <div className="h-24 w-24 rounded-full border-b-2 border-t-2 border-indigo-500"></div>
                    <div className="absolute inset-0 h-24 w-24 animate-spin rounded-full border-b-2 border-indigo-300"></div>
                </div>
                <p className="mt-4 text-lg font-medium text-indigo-300">Yükleniyor...</p>
            </motion.div>
        </div>
    );
}
