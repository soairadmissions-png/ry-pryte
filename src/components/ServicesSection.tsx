import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Volume2, 
  VolumeX, 
  Film, 
  Sparkles, 
  Compass, 
  ChevronDown, 
  Award, 
  ArrowUpRight, 
  Play, 
  Calendar, 
  Layers 
} from 'lucide-react';
import { EventType } from '../types';
import { useCMS } from '../lib/cmsState';

interface ServicesSectionProps {
  onPlanClick: (category: EventType) => void;
}

export default function ServicesSection({ onPlanClick }: ServicesSectionProps) {
  const { state, resolveVideoUrl } = useCMS();
  const eventCategories = state.eventCategories || [];
  const mediaAssets = state.mediaAssets || [];

  // Filter visible categories to allow administrative control over presence
  const visibleCategories = eventCategories.filter(cat => cat.visible !== false);

  const [activeIdx, setActiveIdx] = useState(0);
  const [subMediaIdx, setSubMediaIdx] = useState<number | null>(null);
  const [isMuted, setIsMuted] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement | null }>({});

  // Monitor scroll positioning to advance scenes like cinema acts
  useEffect(() => {
    const handleScroll = () => {
      const el = containerRef.current;
      if (!el) return;
      
      const rect = el.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      
      // Calculate active index based on how far in viewport the section has scrolled
      const scrollProgress = -rect.top;
      const scrollableRange = rect.height - viewportHeight;
      
      if (scrollableRange <= 0) return;
      
      const percent = Math.max(0, Math.min(1, scrollProgress / scrollableRange));
      const segmentSize = 1 / visibleCategories.length;
      
      // Map percentage to target categories array
      const targetIdx = Math.min(
        visibleCategories.length - 1,
        Math.max(0, Math.floor(percent / segmentSize))
      );
      
      if (targetIdx !== activeIdx) {
        setActiveIdx(targetIdx);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // initial layout trigger
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [visibleCategories.length, activeIdx]);

  // Reset secondary interactive media clip pick when transitioning scenes
  useEffect(() => {
    setSubMediaIdx(null);
  }, [activeIdx]);

  // Command browser to play video element if src swap has checked
  const currentCategory = visibleCategories[activeIdx];

  if (!currentCategory) {
    return (
      <section className="h-96 flex flex-col items-center justify-center bg-neutral-950 text-neutral-500 font-mono text-[10px] uppercase tracking-widest border-t border-white/5">
        <Film className="w-6 h-6 mb-3 text-neutral-700 animate-pulse" />
        No active service collections archived in system registry.
      </section>
    );
  }

  // Gather ALL media assets corresponding to this specific category
  const categoryMedia = mediaAssets.filter(asset => {
    if (!asset.category) return false;
    return (
      asset.category === currentCategory.id ||
      asset.category.toLowerCase() === currentCategory.title.toLowerCase() ||
      asset.category.toLowerCase() === currentCategory.id.toLowerCase()
    );
  });

  // Calculate coordinates for the primary active media asset playing on background
  const hasSubMediaOverride = subMediaIdx !== null && categoryMedia[subMediaIdx];
  const activeMediaSourceAsset = hasSubMediaOverride ? categoryMedia[subMediaIdx!] : categoryMedia[0];

  // Resolve cover video with fallbacks
  const videoUrl = hasSubMediaOverride
    ? activeMediaSourceAsset.videoUrl
    : (currentCategory.coverVideo || (categoryMedia[0] ? categoryMedia[0].videoUrl : ''));

  // Resolve cover image with fallbacks
  const imageUrl = hasSubMediaOverride
    ? activeMediaSourceAsset.posterImage
    : (currentCategory.coverImage || (categoryMedia[0] ? categoryMedia[0].posterImage || categoryMedia[0].videoUrl : currentCategory.image));

  // Handle manual storyboard jumping clicks
  const handleJumpToScene = (targetIndex: number) => {
    const container = containerRef.current;
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    const currentScrollY = window.scrollY;
    
    // Distribute offsets evenly
    const segmentHeight = container.scrollHeight / visibleCategories.length;
    const targetScrollY = currentScrollY + rect.top + (targetIndex * segmentHeight) + 12;
    
    window.scrollTo({
      top: targetScrollY,
      behavior: 'smooth'
    });
  };

  const servicesEyebrow = state.themeConfig?.servicesEyebrow || 'OUR SERVICES';
  const servicesTitle = state.themeConfig?.servicesTitle || 'What We Offer';
  const servicesDescription = state.themeConfig?.servicesDescription || 'From intimate celebrations to large-scale productions, we transform ideas into thoughtfully curated experiences designed around your vision, audience, and occasion.';

  return (
    <div id="services-wrapper" className="bg-neutral-950 text-white overflow-visible">
      <section 
        id="services-section" 
        ref={containerRef} 
        className="relative bg-neutral-950 text-white select-none overflow-visible"
        style={{ height: `${visibleCategories.length * 115}vh` }}
      >
      {/* FULL VIEWPORT CINEMATIC STICKY CORE CONTAINER */}
      <div id="cinematic-stage" className="sticky top-0 left-0 h-screen w-full overflow-hidden flex flex-col justify-between bg-neutral-950 z-30">
        
        {/* BACKGROUND SCREEN VISUAL ENGINE (CROSSFADES & VIDEOS ON LOOP) */}
        <div className="absolute inset-0 z-0 bg-neutral-900">
          <AnimatePresence mode="popLayout">
            <motion.div
              key={`${currentCategory.id}-${videoUrl}-${imageUrl}`}
              initial={{ opacity: 0.1, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0.1, scale: 0.98 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="absolute inset-0 w-full h-full"
            >
              {videoUrl ? (
                <video
                  key={resolveVideoUrl(videoUrl)}
                  ref={(el) => {
                    videoRefs.current[`${currentCategory.id}-${videoUrl}`] = el;
                    if (el) {
                      el.play().catch(() => {
                        // Prevent browser safety failures for auto-play policy
                      });
                    }
                  }}
                  src={resolveVideoUrl(videoUrl) || undefined}
                  poster={imageUrl || undefined}
                  autoPlay
                  loop
                  muted={isMuted}
                  playsInline
                  preload="auto"
                  crossOrigin="anonymous"
                  onError={(e) => {
                    const v = e.currentTarget;
                    console.error("!!! SERVICES SECTION VIDEO LOAD ERROR !!!", {
                      src: v.src,
                      code: v.error?.code,
                      message: v.error?.message,
                      networkState: v.networkState,
                      readyState: v.readyState
                    });
                  }}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover pointer-events-none filter brightness-[0.7] saturate-[0.85]"
                />
              ) : imageUrl ? (
                <img
                  src={imageUrl || undefined}
                  alt={currentCategory.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover pointer-events-none filter brightness-[0.55] saturate-[0.9]"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-neutral-900 to-neutral-950 flex items-center justify-center">
                  <Film className="w-12 h-12 text-neutral-800" />
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* LUXURIOUS EDITORIAL SHADOW MASKS & GRADIENTS COATING */}
          {/* Left Gradient (For text readability) */}
          <div className="absolute inset-y-0 left-0 w-2/3 bg-gradient-to-r from-neutral-950 via-neutral-950/80 to-transparent pointer-events-none z-10" />
          
          {/* Bottom Gradient (For film strip and timeline legibility) */}
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-neutral-950 via-neutral-950/65 to-transparent pointer-events-none z-10" />
          
          {/* Top Edge Ambient Mask */}
          <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-neutral-950/80 to-transparent pointer-events-none z-10" />
        </div>

        {/* TOP COGNITIVE WATERMARK BAR */}
        <header className="relative w-full z-20 px-6 sm:px-12 py-6 flex justify-between items-center border-b border-white/5 backdrop-blur-[2px]">
          {/* HEADER BRANDING / NAVIGATION TITLE (LEFT ALIGNED) */}
          <div className="flex flex-col text-left space-y-1">
            <h2 className="text-xl md:text-2xl font-serif text-white tracking-normal font-normal">
              {servicesTitle}
            </h2>
          </div>

          {/* AUDIO MODULE CONTROLLER (RIGHT ALIGNED) */}
          <button 
            onClick={() => setIsMuted(!isMuted)}
            className="flex items-center gap-3 px-4 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-[9px] font-mono uppercase tracking-[0.25em] text-white cursor-pointer active:scale-95 transition-all z-40"
            title={isMuted ? 'Unmute cinematic volume' : 'Mute cinematic volume'}
          >
            {isMuted ? (
              <>
                <VolumeX className="w-3.5 h-3.5 text-neutral-400 animate-pulse" />
                <span className="text-neutral-300">Sound: Off</span>
              </>
            ) : (
              <>
                <Volume2 className="w-3.5 h-3.5 text-[#d16126] animate-bounce" />
                <span className="text-white font-bold tracking-[0.25em]">Sound: Active</span>
              </>
            )}
          </button>
        </header>

        {/* MIDDLE NARRATIVE & STORY DETAILS */}
        <div className="relative w-full max-w-7xl mx-auto px-6 sm:px-12 lg:px-16 z-20 flex-grow grid grid-cols-1 lg:grid-cols-12 items-center gap-8 py-4">
          
          {/* LEFT COLUMN: CURATED STORY CONTENT (65%) */}
          <section className="col-span-1 lg:col-span-8 flex flex-col justify-center text-left space-y-6">
            
            {/* Act Index & Category Badge */}
            <div className="flex items-center gap-4">
              {currentCategory.badge && (
                <span className="px-3.5 py-1 text-[9px] font-mono tracking-[0.2em] text-[#faf6f0] bg-[#d16126]/30 border border-[#d16126]/40 rounded-full font-bold uppercase">
                  {currentCategory.badge}
                </span>
              )}
            </div>

            {/* Cinematic Main Heading */}
            <h2 className="text-4xl sm:text-6xl lg:text-7xl font-serif tracking-tight text-white leading-none font-light animate-fade-in">
              {currentCategory.title}
            </h2>

            {/* Poetic Details paragraph */}
            {currentCategory.description && (
              <p className="max-w-2xl text-neutral-300 text-sm md:text-base leading-relaxed font-light italic font-serif">
                "{currentCategory.description}"
              </p>
            )}

            {/* Custom Interactive Stat Badges */}
            <div className="flex items-center gap-6 pt-2">
              <div className="flex flex-col">
                <span className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest">SHOWCASE REELS</span>
                <span className="text-white text-md font-serif mt-1 font-bold flex items-center gap-1.5">
                  <Play className="w-3.5 h-3.5 text-[#d16126]" />
                  0{categoryMedia.length} Event Sequences
                </span>
              </div>
              <div className="w-[1px] h-8 bg-white/10" />
              <div className="flex flex-col">
                <span className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest">ATELIER ROLE</span>
                <span className="text-white text-md font-serif mt-1 font-bold">
                  Bespoke Orchestration
                </span>
              </div>
            </div>

            {/* Call To Action Buttons */}
            <div className="pt-4 flex flex-wrap gap-4">
              <button
                onClick={() => onPlanClick(currentCategory.id as any)}
                className="group inline-flex items-center gap-3 px-7  py-4 bg-[#d16126] text-white hover:bg-[#b04a18] transition-all rounded-xl text-[10px] font-mono uppercase tracking-[0.25em] font-bold cursor-pointer hover:scale-[1.03] active:scale-[0.98] shadow-2xl"
              >
                <span>PLAN THIS SERVICE WITH US</span>
                <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </button>
            </div>
          </section>

          {/* RIGHT COLUMN: HIGH-CONTRAST TIMELINE SELECTOR (4%) */}
          <aside className="hidden lg:col-span-4 lg:flex flex-col items-end pr-4 justify-center space-y-5">
            <div className="space-y-4 w-full">
              {visibleCategories.map((cat, i) => {
                const isSelected = i === activeIdx;
                return (
                  <button
                    key={cat.id}
                    onClick={() => handleJumpToScene(i)}
                    className="group w-full flex items-center justify-between text-right p-3.5 rounded-2xl bg-white/[0.01] hover:bg-white/[0.04] border transition-all cursor-pointer text-xs"
                    style={{
                      borderColor: isSelected ? 'rgba(209, 97, 38, 0.4)' : 'rgba(255, 255, 255, 0.05)',
                    }}
                  >
                    <div className="flex items-center gap-3 text-left">
                      <span className={`text-[9px] font-mono ${isSelected ? 'text-[#d16126]' : 'text-neutral-500'}`}>
                        0{i + 1}
                      </span>
                      <span className={`font-serif tracking-wide transition-colors ${isSelected ? 'text-white font-medium' : 'text-neutral-400 group-hover:text-white'}`}>
                        {cat.title}
                      </span>
                    </div>

                    {isSelected && (
                      <motion.div 
                        layoutId="activeSceneTrackerCircle"
                        className="w-2 h-2 rounded-full bg-[#d16126] shadow-[0_0_8px_rgba(209,97,38,0.8)]"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </aside>
        </div>



      </div>
    </section>
    </div>
  );
}
