import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Logo from './Logo';

interface CinematicPreloaderProps {
  onComplete: () => void;
}

const LOADING_PHASES = [
  'Orchestrating bespoke luxury...',
  'Synthesizing spatial environments...',
  'Curating custom color palettes...',
  'Aligning meticulous vendor schedules...',
  'Perfecting final onsite coordination...',
];

export default function CinematicPreloader({ onComplete }: CinematicPreloaderProps) {
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    // Prevent scrolling while preloader is active
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  useEffect(() => {
    // Walk through distinct design/planning phases
    const phaseInterval = setInterval(() => {
      setPhaseIndex((prev) => {
        if (prev < LOADING_PHASES.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 650);

    // Smoothly animate the progress bar
    const startTime = Date.now();
    const duration = 3200; // 3.2 seconds cinematic entry

    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const calculatedProgress = Math.min((elapsed / duration) * 100, 100);
      
      setProgress(calculatedProgress);

      if (elapsed >= duration) {
        clearInterval(progressInterval);
        clearInterval(phaseInterval);
        setIsDone(true);
        setTimeout(() => {
          onComplete();
        }, 600); // Allow exit animations to complete
      }
    }, 16);

    return () => {
      clearInterval(progressInterval);
      clearInterval(phaseInterval);
    };
  }, [onComplete]);

  return (
    <AnimatePresence>
      {!isDone && (
        <motion.div
          id="cinematic-preloader-root"
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#12100e] text-[#eae6df] select-none"
          initial={{ opacity: 1 }}
          exit={{ 
            opacity: 0,
            transition: { duration: 0.8, ease: [0.43, 0.13, 0.23, 0.96] } 
          }}
        >
          {/* Circular abstract luxury background ambient glow */}
          <div 
            className="absolute rounded-full w-[450px] h-[450px] bg-brand-gold/10 filter blur-[90px] opacity-60 pointer-events-none"
            style={{
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          />

          <div className="relative flex flex-col items-center max-w-lg w-full px-8 text-center space-y-10">
            
            {/* Spinning & growing gold luxury emblem wrapper */}
            <motion.div
              initial={{ scale: 0.85, opacity: 0, rotate: -15 }}
              animate={{ 
                scale: 1, 
                opacity: 1, 
                rotate: 0,
                transition: { duration: 1.4, ease: [0.16, 1, 0.3, 1] } 
              }}
              className="relative p-6"
            >
              <Logo size={140} variant="emblem" />
              
              {/* Outer decorative gold ring orbit */}
              <motion.div 
                className="absolute inset-0 border border-brand-gold/20 rounded-full"
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 12, ease: "linear" }}
              />
              <motion.div 
                className="absolute inset-2 border-t-2 border-r-2 border-brand-gold/45 rounded-full"
                animate={{ rotate: -360 }}
                transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
              />
            </motion.div>

            {/* Typography brand label section */}
            <div className="space-y-3">
              <motion.h2
                initial={{ letterSpacing: '0.15em', opacity: 0 }}
                animate={{ 
                  letterSpacing: '0.35em', 
                  opacity: 1,
                  transition: { delay: 0.3, duration: 1.2, ease: "easeOut" } 
                }}
                className="text-2xl font-serif tracking-[0.35em] text-[#eae6df] uppercase font-light"
              >
                KBJ <span className="text-brand-gold italic font-semibold">Events</span>
              </motion.h2>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ 
                  opacity: 0.6,
                  transition: { delay: 0.7, duration: 0.8 } 
                }}
                className="text-[9px] font-mono tracking-[0.3em] uppercase text-neutral-400"
              >
                planning to perfection
              </motion.p>
            </div>

            {/* Dynamic phase narratives & indicators with Framer exit-transitions */}
            <div className="h-6 flex items-center justify-center overflow-hidden w-full relative">
              <AnimatePresence mode="wait">
                <motion.span
                  key={phaseIndex}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ 
                    opacity: 1, 
                    y: 0,
                    transition: { duration: 0.4, ease: "easeOut" }
                  }}
                  exit={{ 
                    opacity: 0, 
                    y: -15,
                    transition: { duration: 0.3, ease: "easeIn" }
                  }}
                  className="absolute text-[10px] font-mono tracking-widest uppercase text-brand-gold/90 font-medium"
                >
                  {LOADING_PHASES[phaseIndex]}
                </motion.span>
              </AnimatePresence>
            </div>

            {/* Premium minimal loader progress track */}
            <div className="w-full max-w-[240px] pt-4">
              <div className="h-[2px] w-full bg-neutral-800 rounded-full overflow-hidden relative">
                <motion.div
                  className="absolute top-0 bottom-0 left-0 bg-brand-gold"
                  style={{ width: `${progress}%` }}
                  transition={{ ease: "easeInOut" }}
                />
              </div>
              <div className="flex justify-between items-center pt-2 text-[8px] font-mono tracking-widest text-neutral-500 uppercase">
                <span>Initialization</span>
                <span>{Math.round(progress)}%</span>
              </div>
            </div>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
