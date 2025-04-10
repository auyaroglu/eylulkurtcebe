'use client';

import { useRef, useEffect, useState } from 'react';

interface Star {
    x: number;
    y: number;
    size: number;
    opacity: number;
    speed: number;
    flickerSpeed: number;
}

export default function StarBackground() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [stars, setStars] = useState<Star[]>([]);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const frameRef = useRef<number>(0);
    const prevTimeRef = useRef<number>(0);

    // Tarayıcı boyutunu izleme
    useEffect(() => {
        const handleResize = () => {
            if (canvasRef.current) {
                const width = window.innerWidth;
                const height = window.innerHeight;
                canvasRef.current.width = width;
                canvasRef.current.height = height;
                setDimensions({ width, height });
            }
        };

        handleResize();
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    // Yıldızları oluşturma
    useEffect(() => {
        if (dimensions.width && dimensions.height) {
            const starCount = Math.min(
                Math.floor((dimensions.width * dimensions.height) / 3000),
                300
            );
            const newStars: Star[] = [];

            for (let i = 0; i < starCount; i++) {
                newStars.push({
                    x: Math.random() * dimensions.width,
                    y: Math.random() * dimensions.height,
                    size: Math.random() * 2 + 0.5,
                    opacity: Math.random() * 0.8 + 0.2,
                    speed: Math.random() * 0.05 + 0.01,
                    flickerSpeed: Math.random() * 0.02 + 0.005,
                });
            }

            setStars(newStars);
        }
    }, [dimensions]);

    // Fare hareketini izleme
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setMousePosition({ x: e.clientX, y: e.clientY });
        };

        window.addEventListener('mousemove', handleMouseMove);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
        };
    }, []);

    // Render animasyon döngüsü
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const animate = (time: number) => {
            if (!prevTimeRef.current) prevTimeRef.current = time;
            const deltaTime = time - prevTimeRef.current;
            prevTimeRef.current = time;

            ctx.clearRect(0, 0, dimensions.width, dimensions.height);

            // Fare konumuna dayalı kayma faktörü
            const maxOffset = 20; // Maksimum yıldız kayması
            const centerX = dimensions.width / 2;
            const centerY = dimensions.height / 2;
            const offsetX = ((mousePosition.x - centerX) / centerX) * maxOffset;
            const offsetY = ((mousePosition.y - centerY) / centerY) * maxOffset;

            stars.forEach(star => {
                // Yıldız titremesi için zamanla değişen opaklık
                const flickerAmount = Math.sin(time * star.flickerSpeed) * 0.2 + 0.8;
                const starOpacity = star.opacity * flickerAmount;

                // Fare hareketine göre yıldız pozisyonunu ayarlama
                const posX = star.x + offsetX * star.speed;
                const posY = star.y + offsetY * star.speed;

                // Yıldızı ekranın dışına çıkmasını önle
                const wrappedX = (posX + dimensions.width) % dimensions.width;
                const wrappedY = (posY + dimensions.height) % dimensions.height;

                // Yıldızı çizme
                ctx.beginPath();
                ctx.arc(wrappedX, wrappedY, star.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 255, 255, ${starOpacity})`;
                ctx.fill();

                // Büyük yıldızlar için parıltı efekti
                if (star.size > 1.2) {
                    ctx.beginPath();
                    ctx.arc(wrappedX, wrappedY, star.size * 3, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(255, 255, 255, ${starOpacity * 0.1})`;
                    ctx.fill();
                }
            });

            frameRef.current = requestAnimationFrame(animate);
        };

        frameRef.current = requestAnimationFrame(animate);

        return () => {
            cancelAnimationFrame(frameRef.current);
        };
    }, [stars, mousePosition, dimensions]);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 -z-10 bg-[#111827]"
            style={{ pointerEvents: 'none' }}
        />
    );
}
