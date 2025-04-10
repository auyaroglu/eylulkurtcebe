'use client';

// Basit bir placeholder bileşen oluşturuyoruz
export default function HeroBackground() {
  return (
    <div className="fixed inset-0 -z-10">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10"></div>
    </div>
  );
} 