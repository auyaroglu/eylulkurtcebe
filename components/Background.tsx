'use client';

import { useEffect, useState } from 'react';
import Particles, { initParticlesEngine } from '@tsparticles/react';
import { loadSlim } from '@tsparticles/slim';

export default function Background() {
  const [init, setInit] = useState(false);

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => {
      setInit(true);
    });
  }, []);

  return init ? (
    <Particles
      id="tsparticles"
      className="!fixed inset-0 !z-[0]"
      options={{
        background: {
          color: {
            value: "#111827",
          },
        },
        fpsLimit: 120,
        fullScreen: {
          enable: true,
          zIndex: 0
        },
        particles: {
          color: {
            value: ["#48b6ff", "#0070f3", "#3273ff"],
          },
          move: {
            direction: "top",
            enable: true,
            outModes: {
              default: "out",
            },
            random: false,
            speed: 1.2,
            straight: false
          },
          number: {
            value: 1800
          },
          opacity: {
            value: 1,
            animation: {
              enable: true,
              speed: 1,
              sync: false
            }
          },
          shape: {
            type: "circle"
          },
          size: {
            value: { min: 1, max: 3 }
          },
          twinkle: {
            particles: {
              enable: true,
              frequency: 0.05,
              opacity: 1
            }
          }
        },
        detectRetina: true
      }}
    />
  ) : null;
} 