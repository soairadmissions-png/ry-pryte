import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useCMS } from '../lib/cmsState';
import { 
  Compass, 
  Map, 
  Sparkles, 
  Users, 
  Activity, 
  Award, 
  Wine, 
  Layers, 
  Calendar, 
  Clock,
  ArrowLeft,
  ArrowRight,
  HelpCircle,
  LucideIcon
} from 'lucide-react';

// Map icon strings to Lucide components
const ICON_MAP: Record<string, LucideIcon> = {
  Compass,
  Map,
  Sparkles,
  Users,
  Activity,
  Award,
  Wine,
  Layers,
  Calendar,
  Clock
};

export default function ProcessSection() {
  const { state } = useCMS();
  const carouselRef = useRef<HTMLDivElement>(null);
  const lastWheelTime = useRef<number>(0);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  const [isAutoPlayPaused, setIsAutoPlayPaused] = useState(false);

  // Responsive state sizing
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Keyboard navigation support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.processSteps]);

  // Extract CMS or fallback default content
  const steps = state.processSteps && state.processSteps.length > 0 
    ? state.processSteps 
    : [
        {
          number: '01',
          title: 'Discovery',
          narrative: 'Architectural consultation, deep vision mapping, and aesthetic briefing.',
          details: 'Every masterwork begins with a singular intent. We sit together to dissect your values, visual culture aspirations, and programmatic desires, formulating a tailored creative creative mandate before a single draft is drawn.',
          iconName: 'Compass'
        },
        {
          number: '02',
          title: 'Strategy',
          narrative: 'Logistical engineering, resource vetting, and strategic scenario mapping.',
          details: 'We construct a bulletproof operational scaffold. We engineer precise budget models, establish risk mitigation protocols, and cross-reference a curated match of premier regional elite vendors.',
          iconName: 'Map'
        },
        {
          number: '03',
          title: 'Design',
          narrative: 'Atmospheric curation, bespoke spatial configurations, and sensory floor plans.',
          details: 'Our designers sculpt the atmosphere. We craft custom color systems, specify structural table layouts, organize precise spotlight illumination layers, and draft beautiful spatial coordinate blueprints.',
          iconName: 'Sparkles'
        },
        {
          number: '04',
          title: 'Coordination',
          narrative: 'Liaison integration, detailed master runsheets, and administrative synergy.',
          details: 'As production nears, we align every component. We orchestrate detailed timeline grids, manage supplier logistics contracts, and synchronize all cues to operate in complete, perfect unison.',
          iconName: 'Users'
        },
        {
          number: '05',
          title: 'Event Day',
          narrative: 'On-site execution command, continuous log-tracking, and flawless performance.',
          details: 'Our senior coordination squad takes command. We direct timing, oversee physical floor management, guide the hospitality protocol, and align every live cue so you can remain entirely in the moment.',
          iconName: 'Activity'
        },
        {
          number: '06',
          title: 'Legacy',
          narrative: 'Enduring photographic preservation, supplier reconciliation audits, and gratitude echoes.',
          details: 'Even after the final guests depart, our care continues. We audit final accounts, coordinate sustainable tear downs, and hand over beautiful curated digital memory assets that preserve the magic forever.',
          iconName: 'Award'
        }
      ];

  const eyebrowName = state.themeConfig?.processEyebrow || 'HOW WE WORK';
  const processHeadline = state.themeConfig?.processTitle || 'How We Bring Events To Life';
  const processSubtitleText = state.themeConfig?.processDescription || 'From the first conversation to the final applause, every detail is carefully designed, planned, and executed to create unforgettable experiences.';

  const handleNext = () => {
    if (steps.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % steps.length);
  };

  const handlePrev = () => {
    if (steps.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + steps.length) % steps.length);
  };

  // Autoplay loop timer
  useEffect(() => {
    if (steps.length === 0) return;
    const interval = setInterval(() => {
      if (!isAutoPlayPaused) {
        handleNext();
      }
    }, 4500); // 4.5 seconds luxury autoplay pacing
    return () => clearInterval(interval);
  }, [steps.length, isAutoPlayPaused, currentIndex]);

  // Wheel horizontal momentum navigation
  const handleWheel = (e: React.WheelEvent) => {
    if (steps.length === 0) return;
    // Check if the delta is significant
    const deltaY = e.deltaY;
    const deltaX = e.deltaX;
    const absDelta = Math.max(Math.abs(deltaY), Math.abs(deltaX));

    if (absDelta > 38) {
      // Debounce trigger
      const now = Date.now();
      if (now - lastWheelTime.current < 900) return;
      lastWheelTime.current = now;

      if (deltaY > 0 || deltaX > 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }
  };

  // Responsive measurement helpers
  const slideWidth = windowWidth < 768 ? Math.min(windowWidth - 48, 360) : 580;
  const gap = windowWidth < 768 ? 16 : 32;
  const shiftOffset = steps.length > 0 
    ? (windowWidth / 2) - ((currentIndex * (slideWidth + gap)) + (slideWidth / 2)) 
    : 0;

  return (
    <section 
      id="process-section" 
      className="relative py-24 md:py-32 bg-white text-neutral-900 overflow-hidden select-none"
      onWheel={handleWheel}
    >
      {/* Luxury Ambient Lighting Glow Layer - No images, pure spatial depth CSS */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#d16126]/3 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 left-1/4 -translate-x-1/2 w-[350px] h-[350px] bg-neutral-100/50 rounded-full blur-[100px] pointer-events-none" />

      {/* Structured Editorial Header */}
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 mb-16 md:mb-24 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="space-y-4 max-w-3xl mx-auto"
        >
          <div className="inline-flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#d16126] animate-pulse" />
            <span className="text-[10px] md:text-xs font-mono uppercase tracking-[0.3em] text-[#d16126] font-bold">
              {eyebrowName}
            </span>
          </div>

          <h2 className="text-4xl sm:text-5xl md:text-6xl font-serif text-neutral-900 tracking-tight leading-tight">
            {processHeadline}
          </h2>

          <p className="text-sm md:text-base text-neutral-500 font-light leading-relaxed max-w-xl mx-auto font-sans">
            {processSubtitleText}
          </p>
        </motion.div>
      </div>

      {/* LUXURY HORIZONTAL TRAVEL CANVAS WITH INTEGRATIVE AUTOPLAY PAUSE HOVERS */}
      <div 
        className="relative w-full overflow-visible z-10 cursor-grab active:cursor-grabbing"
        onMouseEnter={() => setIsAutoPlayPaused(true)}
        onMouseLeave={() => setIsAutoPlayPaused(false)}
        onTouchStart={() => setIsAutoPlayPaused(true)}
        onTouchEnd={() => setIsAutoPlayPaused(false)}
      >
        {/* Carousel Tracks */}
        <motion.div
          initial={{ opacity: 0, y: 35, scale: 0.98 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full overflow-hidden py-4"
        >
          <motion.div
            ref={carouselRef}
            drag="x"
            dragConstraints={{ left: shiftOffset - 1, right: shiftOffset + 1 }} // Constrain snapping elegantly
            onDragEnd={(event, info) => {
              const swipeThreshold = 50;
              if (info.offset.x < -swipeThreshold) {
                handleNext();
              } else if (info.offset.x > swipeThreshold) {
                handlePrev();
              }
            }}
            animate={{ x: shiftOffset }}
            transition={{ type: "spring", stiffness: 220, damping: 26 }}
            className="flex items-center overflow-visible"
            style={{ gap: `${gap}px` }}
          >
            {steps.map((step, idx) => {
              const isActive = idx === currentIndex;
              const StepIcon = step.iconName ? (ICON_MAP[step.iconName] || Spar_Fallback(step.iconName)) : Sparkles;

              function Spar_Fallback(name: string) {
                // Return default fallback if some key misspelled
                return Sparkles;
              }

              return (
                <div
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  style={{ width: `${slideWidth}px` }}
                  className="flex-shrink-0"
                >
                  <motion.div
                    animate={{
                      scale: isActive ? 1.02 : 0.94,
                      opacity: isActive ? 1 : 0.35,
                      borderColor: isActive ? 'rgba(209, 97, 38, 0.35)' : 'rgba(0, 0, 0, 0.06)'
                    }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    className={`p-6 md:p-8 rounded-[32px] bg-white border shadow-[0_12px_40px_rgba(0,0,0,0.02)] text-left h-[260px] md:h-[300px] flex flex-col justify-between transition-all relative overflow-hidden group select-none`}
                  >
                    {/* Glowing highlight loop inside card */}
                    {isActive && (
                      <div className="absolute top-0 right-0 w-32 h-32 bg-[#d16126]/3 rounded-full blur-2xl pointer-events-none" />
                    )}

                    {/* Step Card Header */}
                    <div className="flex justify-between items-start">
                      {/* Step index */}
                      <span className={`text-4xl md:text-5xl font-mono font-bold tracking-tight transition-colors duration-500 ${
                        isActive ? 'text-[#d16126]' : 'text-neutral-300'
                      }`}>
                        {step.number || `0${idx + 1}`}
                      </span>

                      {/* Step icon highlight */}
                      <div className={`p-4 rounded-2xl transition-all duration-500 border ${
                        isActive 
                          ? 'bg-[#d16126]/10 border-[#d16126]/30 text-[#d16126] scale-110 shadow-[0_8px_20px_rgba(209,97,38,0.08)]' 
                          : 'bg-neutral-50 border-neutral-100 text-neutral-400'
                      }`}>
                        <StepIcon className="w-5 h-5 md:w-6 h-6" />
                      </div>
                    </div>

                    {/* Step Content */}
                    <div className="space-y-1.5 mt-auto">
                      <h3 className={`text-lg md:text-xl font-serif text-neutral-900 tracking-wide transition-all duration-500 ${
                        isActive ? 'text-neutral-900' : 'text-neutral-400'
                      }`}>
                        {step.title}
                      </h3>
                      <p className={`text-[11px] md:text-xs text-neutral-500 font-medium italic tracking-wide`}>
                        {step.narrative}
                      </p>
                      <p className={`text-[11px] md:text-xs transition-all duration-500 font-light leading-relaxed line-clamp-3 ${
                        isActive ? 'text-neutral-600' : 'text-neutral-400/80'
                      }`}>
                        {step.details}
                      </p>
                    </div>
                  </motion.div>
                </div>
              );
            })}
          </motion.div>
        </motion.div>
      </div>

      {/* BOTTOM CONTROLS & LUXURY SEAMLESS PROGRESS BAR */}
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 mt-12 md:mt-16 flex flex-col items-center gap-6 relative z-10 select-none">
        {/* Elegant circular arrow controls */}
        <div className="flex items-center gap-4">
          <button
            onClick={handlePrev}
            className="w-12 h-12 rounded-full border border-neutral-200 hover:border-[#d16126]/30 bg-white hover:bg-[#d16126]/5 flex items-center justify-center text-neutral-400 hover:text-neutral-800 transition-all cursor-pointer shadow-[0_4px_12px_rgba(0,0,0,0.02)] outline-none"
            aria-label="Previous step"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="text-[10px] font-mono tracking-[0.2em] text-neutral-400 uppercase">
            {currentIndex + 1} / {steps.length}
          </span>
          <button
            onClick={handleNext}
            className="w-12 h-12 rounded-full border border-neutral-200 hover:border-[#d16126]/30 bg-white hover:bg-[#d16126]/5 flex items-center justify-center text-neutral-400 hover:text-neutral-800 transition-all cursor-pointer shadow-[0_4px_12px_rgba(0,0,0,0.02)] outline-none"
            aria-label="Next step"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </section>
  );
}
