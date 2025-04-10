'use client';

import React, { createContext, useContext, useState } from 'react';

interface AnimationContextType {
    animationKey: number;
    resetAnimations: () => void;
}

const AnimationContext = createContext<AnimationContextType | undefined>(undefined);

export function AnimationProvider({ children }: { children: React.ReactNode }) {
    const [animationKey, setAnimationKey] = useState(0);

    const resetAnimations = () => {
        setAnimationKey(prevKey => prevKey + 1);
    };

    return (
        <AnimationContext.Provider value={{ animationKey, resetAnimations }}>
            {children}
        </AnimationContext.Provider>
    );
}

export function useAnimation() {
    const context = useContext(AnimationContext);
    if (context === undefined) {
        throw new Error('useAnimation must be used within an AnimationProvider');
    }
    return context;
}
