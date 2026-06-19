import React, { useEffect, useState } from 'react';
import { useCMS } from '../lib/cmsState';

interface Petal {
  id: number;
  left: number; // percentage width
  size: number; // pixels
  delay: number; // seconds
  duration: number; // seconds
  rotationStart: number; // degrees
  rotationSpeed: number; // seconds for 360deg rotation
  color: string;
  horizontalShift: number; // pixels
  shapeType: number; // SVG shape selection
  isForeground: boolean; // layering
  opacity: number;
}

const STYLE_COLORS: Record<string, string[]> = {
  'blush-rose': [
    'rgba(245, 195, 194, 0.75)', // Blush Pink
    'rgba(255, 218, 224, 0.7)',   // Vintage Rose
    'rgba(253, 244, 227, 0.65)',  // Warm Champagne Cream
    'rgba(240, 185, 172, 0.65)'   // Apricot Peach
  ],
  'cherry-blossom': [
    'rgba(255, 230, 235, 0.8)',   // Sakura Soft Pink
    'rgba(255, 185, 200, 0.75)',  // Bright Blossom Pink
    'rgba(255, 245, 245, 0.85)',  // Delicate Linen White
    'rgba(255, 215, 225, 0.8)'    // Midtone Rose
  ],
  'gold-champagne': [
    'rgba(245, 225, 195, 0.8)',   // Champagne Gold
    'rgba(226, 194, 134, 0.75)',  // Honey Gold
    'rgba(253, 244, 227, 0.85)',  // Royal Warm Ivory
    'rgba(212, 175, 55, 0.45)'    // Metallic Gold Mist
  ],
  'ivory-white': [
    'rgba(255, 255, 248, 0.85)',  // Pure Silk Ivory
    'rgba(250, 240, 230, 0.8)',   // Warm Linen
    'rgba(245, 225, 228, 0.75)',  // Whisper of Blush
    'rgba(255, 250, 240, 0.85)'   // Floral White
  ]
};

export default function FlowerPetals() {
  const { state } = useCMS();
  const [petals, setPetals] = useState<Petal[]>([]);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);

  const themeConfig = state?.themeConfig;
  const isEnabled = themeConfig?.floralEnabled !== false;
  const floralDensity = themeConfig?.floralDensity || 'medium';
  const floralSpeed = themeConfig?.floralSpeed || 'medium';
  const flowerStyle = themeConfig?.floralFlowerStyle || 'blush-rose';

  // Responsive window resize tracking
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Regenerate/Update petals whenever theme conditions, speed, or density change
  useEffect(() => {
    if (!isEnabled) {
      setPetals([]);
      return;
    }

    // Determine target petal count based on responsive boundaries and density controls
    let count = 20; // Default medium
    const isMobile = windowWidth < 768;
    const isTablet = windowWidth >= 768 && windowWidth < 1024;

    if (isMobile) {
      if (floralDensity === 'low') count = 4;
      else if (floralDensity === 'medium') count = 7;
      else count = 12;
    } else if (isTablet) {
      if (floralDensity === 'low') count = 8;
      else if (floralDensity === 'medium') count = 14;
      else count = 22;
    } else {
      // Desktop
      if (floralDensity === 'low') count = 10;
      else if (floralDensity === 'medium') count = 22;
      else count = 38;
    }

    // Determine speed coefficients (animation durations)
    let minD = 12;
    let maxD = 24;
    if (floralSpeed === 'slow') {
      minD = 18;
      maxD = 32;
    } else if (floralSpeed === 'fast') {
      minD = 7;
      maxD = 14;
    }

    const palette = STYLE_COLORS[flowerStyle] || STYLE_COLORS['blush-rose'];

    const generated: Petal[] = Array.from({ length: count }).map((_, i) => {
      const left = Math.random() * 105 - 5; // allow entering from slightly off-left
      const size = 10 + Math.random() * 16; // 10px to 26px
      const delay = Math.random() * -30; // Start pre-scattered across vertical height
      const duration = minD + Math.random() * (maxD - minD);
      const rotationStart = Math.random() * 360;
      const rotationSpeed = 6 + Math.random() * 14;
      const color = palette[Math.floor(Math.random() * palette.length)];
      const horizontalShift = 30 + Math.random() * 90; // Sway amplitude
      const shapeType = Math.floor(Math.random() * 3);
      // Approximately 30% are in the foreground layer (Layer 3) to occasionally overlap content
      const isForeground = Math.random() < 0.3;
      const opacity = 0.4 + Math.random() * 0.45; // Subtle variation in opacity

      return {
        id: i,
        left,
        size,
        delay,
        duration,
        rotationStart,
        rotationSpeed,
        color,
        horizontalShift,
        shapeType,
        isForeground,
        opacity
      };
    });

    setPetals(generated);
  }, [isEnabled, floralDensity, floralSpeed, flowerStyle, windowWidth]);

  if (!isEnabled) return null;

  // Split petals into background and foreground layers to create 3D atmosphere
  const backgroundPetals = petals.filter(p => !p.isForeground);
  const foregroundPetals = petals.filter(p => p.isForeground);

  const renderPetal = (petal: Petal) => {
    let svgPath = '';
    if (petal.shapeType === 0) {
      // Hearty rose petal
      svgPath = "M12,4 C18,2 24,6 20,16 C17,21 11,24 10,24 C9,24 3,21 0,16 C-4,6 6,2 12,4 Z";
    } else if (petal.shapeType === 1) {
      // Cherry petal elongated
      svgPath = "M6,2 C12,-1 18,3 18,10 C18,17 12,22 9,22 C6,22 0,17 0,10 C0,3 0,5 6,2 Z";
    } else {
      // Rounded petal cup shape
      svgPath = "M10,2 C16,0 20,4 20,10 C20,16 14,20 10,20 C6,20 0,16 0,10 C0,4 4,2 10,2 Z";
    }

    return (
      <div
        key={petal.id}
        className="absolute top-0 pointer-events-none"
        style={{
          left: `${petal.left}%`,
          animationName: 'petalFall',
          animationDuration: `${petal.duration}s`,
          animationDelay: `${petal.delay}s`,
          animationIterationCount: 'infinite',
          animationTimingFunction: 'linear',
          transform: 'translate3d(0, 0, 0)', // Force GPU hardware acceleration
          '--sway-distance': `${petal.horizontalShift}px`,
        } as React.CSSProperties}
      >
        <div
          style={{
            animationName: 'petalSway',
            animationDuration: `${petal.duration * 0.4}s`,
            animationIterationCount: 'infinite',
            animationTimingFunction: 'ease-in-out',
            transform: `rotate(${petal.rotationStart}deg)`,
          }}
        >
          <svg
            width={petal.size}
            height={petal.size}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{
              filter: 'drop-shadow(0px 1px 3px rgba(0, 0, 0, 0.04))',
              transform: `rotate3d(1, 1, 0, ${petal.rotationStart}deg)`,
              opacity: petal.opacity,
              transition: 'transform 0.1s linear'
            }}
          >
            <path d={svgPath} fill={petal.color} />
          </svg>
        </div>
      </div>
    );
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes petalFall {
          0% {
            transform: translateY(-50px) translateX(0px);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(112vh) translateX(var(--sway-distance));
            opacity: 0;
          }
        }

        @keyframes petalSway {
          0%, 100% {
            transform: translateX(0) rotate(0deg);
          }
          50% {
            transform: translateX(40px) rotate(180deg);
          }
        }
      `}} />

      {/* BACKGROUND LAYER 1 - below main overlays (under navigation, buttons, copy) */}
      <div 
        className="fixed inset-0 pointer-events-none overflow-hidden z-[2]"
        aria-hidden="true"
        id="ambient-background-petals"
      >
        {backgroundPetals.map(renderPetal)}
      </div>

      {/* FOREGROUND LAYER 3 - on top of content to create absolute cinematic 3D realism */}
      <div
        className="fixed inset-0 pointer-events-none overflow-hidden z-[45]"
        aria-hidden="true"
        id="ambient-foreground-petals"
      >
        {foregroundPetals.map(renderPetal)}
      </div>
    </>
  );
}
