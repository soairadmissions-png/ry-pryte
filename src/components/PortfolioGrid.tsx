import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, MapPin, Target, Sparkles, Quote, Film, BookOpen, Calendar, Info } from 'lucide-react';
import { EventType, CaseStudy } from '../types';
import { useCMS } from '../lib/cmsState';

// Import authentic screenshots & still frames of the actual supplied event videos
// @ts-ignore
import gatherWedding from '../assets/images/gather_wedding_1781527313337.jpg';
// @ts-ignore
import gatherCorporate from '../assets/images/gather_corporate_1781527328223.jpg';
// @ts-ignore
import gatherBirthday from '../assets/images/gather_birthday_1781527344179.jpg';
// @ts-ignore
import gatherGala from '../assets/images/gather_gala_1781527359084.jpg';
// @ts-ignore
import gatherCustom from '../assets/images/gather_custom_1781527375668.jpg';

const LOCAL_SCREENSHOTS: Record<string, string> = {
  'aurora-estate': gatherWedding,
  'luminary-summit': gatherCorporate,
  'soiree-velours': gatherBirthday,
  'gilded-gala': gatherGala,
  'kinetic-fabric': gatherCustom,
};

// Premium, editorial magazine aspect ratios for true physical masonry flow
const ASPECT_RATIOS: Record<string, string> = {
  'aurora-estate': 'aspect-[3/4.2]',   // Portrait Solstice
  'luminary-summit': 'aspect-[4/3.1]', // Landscape Summit
  'soiree-velours': 'aspect-[3/5]',    // Ultra-Vertical Soirée
  'gilded-gala': 'aspect-[1/1]',       // Square Grand Gala
  'kinetic-fabric': 'aspect-[4/5]',    // Tactile Avant-Garde
};



interface PortfolioCardProps {
  key?: string;
  study: CaseStudy;
  onClick: () => void;
  isHovered: boolean;
  isAnyHovered: boolean;
  onHoverStart: () => void;
  onHoverEnd: () => void;
}

function PortfolioCard({ study, onClick, isHovered, isAnyHovered, onHoverStart, onHoverEnd }: PortfolioCardProps) {
  const localImg = LOCAL_SCREENSHOTS[study.id] || study.image;
  const videoUrl = ''; // direct MP4 extraction unresolvable statically
  const aspectClass = ASPECT_RATIOS[study.id] || 'aspect-[4/5]';
  const isDimmed = isAnyHovered && !isHovered;
  return (
    <motion.div
      layout
      onMouseEnter={onHoverStart}
      onMouseLeave={onHoverEnd}
      onClick={onClick}
      className={`group relative cursor-pointer overflow-hidden bg-neutral-100 border border-black/5 break-inside-avoid-column inline-block w-full mb-8 rounded-3xl transition-all duration-700 ${aspectClass} ${
        isHovered
          ? 'scale-[1.04] z-20 border-brand-gold/50 shadow-[0_30px_60px_rgba(209,97,38,0.12)]'
          : isDimmed
          ? 'opacity-30 blur-[1px] grayscale-[20%] scale-[0.98]'
          : 'opacity-100 shadow-[0_15px_30px_rgba(32,26,22,0.04)]'
      }`}
    >
      {/* Click overlay to trigger case study details modal */}
      <div className="absolute inset-0 z-30 cursor-pointer" />

      {/* Cinematic Cover Image Background with progressive filters */}
      <div className={`absolute inset-0 w-full h-full transition-all duration-700 ease-out-quint ${
        isHovered ? 'brightness-[1.1] contrast-[1.02] grayscale-0' : 'brightness-[0.9] contrast-[0.95] grayscale-[10%]'
      }`}>
        <img
          src={localImg || null}
          className="w-full h-full object-cover pointer-events-none select-none transition-transform duration-700 group-hover:scale-105"
          alt={study.title}
        />
        {/* Soft shadow architectural mask list layer */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent z-10" />
      </div>

      {/* Floating map tags - morph on active hover */}
      <div className="absolute top-4 left-4 z-20 flex items-center space-x-2 text-[8px] font-mono uppercase tracking-widest text-[#1a1613] bg-[#ede9df]/95 border border-black/[0.05] backdrop-blur-sm px-2.5 py-1 rounded-full transition-all duration-500 group-hover:bg-brand-gold group-hover:text-black">
        <MapPin className="w-2.5 h-2.5 mr-1 text-brand-gold group-hover:text-black transition-colors" />
        <span>{study.location}</span>
      </div>

      {/* Live Looper Indicator */}
      <div className="absolute top-4 right-4 z-20 flex items-center space-x-1.5 text-[8px] font-mono uppercase tracking-widest text-[#d16126] bg-[#fdfdfb]/95 border border-brand-gold/30 backdrop-blur-sm px-2.5 py-1 rounded-full pointer-events-none">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        <span>EVENT FOOTAGE</span>
      </div>

      {/* Narrative Detail overlay - sleek reveal of title and category on hover */}
      <div className={`absolute inset-x-0 bottom-0 p-6 z-20 text-[#f5f2ed] space-y-1.5 transition-all duration-700 transform ${
        isHovered 
          ? 'opacity-100 translate-y-0 filter blur-0 scale-100' 
          : 'opacity-0 translate-y-6 filter blur-[4px] scale-[0.96]'
      }`}>
        <span className="text-[9px] font-mono uppercase tracking-[0.25em] text-brand-gold">
          {study.category}
        </span>
        <h3 className="text-xl sm:text-2xl font-serif tracking-tight leading-tight text-white group-hover:text-brand-gold transition-colors duration-500 editorial-kerning-expand">
          {study.title}
        </h3>

        {/* CSS Row Grid Height Expansion (Pure GPU animated layout) */}
        <div className="grid grid-rows-[0fr] group-hover:grid-rows-[1fr] transition-all duration-700 ease-in-out opacity-0 group-hover:opacity-100">
          <div className="overflow-hidden">
            <p className="text-xs text-[#f5f2ed]/70 font-light leading-relaxed mt-2.5">
              {study.summary}
            </p>
            <div className="pt-3">
              <span className="text-[9px] font-mono uppercase tracking-widest text-brand-gold font-bold flex items-center gap-1.5">
                View Case Study <span className="transform translate-x-0 group-hover:translate-x-1.5 duration-300">→</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

interface ArchiveMediaCardProps {
  key?: string;
  asset: any;
  onClick: () => void;
  resolveVideoUrl: (url: string) => string;
}

function ArchiveMediaCard({ asset, onClick, resolveVideoUrl }: ArchiveMediaCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const videoRef = React.useRef<HTMLVideoElement | null>(null);

  React.useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isHovered) {
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.debug("Video autoplay safely catch on hover:", err);
        });
      }
    } else {
      video.pause();
      try {
        video.currentTime = 0;
      } catch (_) {}
    }
  }, [isHovered]);

  const resolvedUrl = resolveVideoUrl(asset.videoUrl);

  return (
    <motion.div
      layout
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      className={`group relative cursor-pointer overflow-hidden bg-neutral-950 border border-black/10 break-inside-avoid-column inline-block w-full mb-8 rounded-3xl transition-all duration-700 aspect-[9/16] ${
        isHovered
          ? 'scale-[1.04] z-20 border-brand-gold/50 shadow-[0_30px_60px_rgba(209,97,38,0.12)]'
          : 'opacity-100 shadow-[0_15px_30px_rgba(32,26,22,0.04)]'
      }`}
    >
      {/* Click overlay */}
      <div className="absolute inset-0 z-30 cursor-pointer" />

      {/* Cinematic Cover / Video container */}
      <div className="absolute inset-0 w-full h-full bg-black">
        {asset.posterImage && !isHovered && (
          <img
            src={asset.posterImage}
            className="absolute inset-0 w-full h-full object-cover z-10 transition-opacity duration-300 pointer-events-none"
            alt={asset.title}
          />
        )}
        <video
          ref={videoRef}
          src={resolvedUrl || undefined}
          muted
          loop
          playsInline
          preload="none"
          crossOrigin="anonymous"
          className="w-full h-full object-cover opacity-90 transition-all duration-700 scale-100 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent z-10" />
      </div>

      {/* Floating Category tag */}
      <div className="absolute top-4 left-4 z-20 flex items-center space-x-2 text-[8px] font-mono uppercase tracking-widest text-[#1a1613] bg-[#ede9df]/95 border border-black/[0.05] backdrop-blur-sm px-2.5 py-1 rounded-full transition-all duration-500 group-hover:bg-brand-gold group-hover:text-black">
        <span>{asset.category || 'Archive Reel'}</span>
      </div>

      {/* Live Looper Indicator */}
      <div className="absolute top-4 right-4 z-20 flex items-center space-x-1.5 text-[8px] font-mono uppercase tracking-widest text-[#d16126] bg-[#fdfdfb]/95 border border-brand-gold/30 backdrop-blur-sm px-2.5 py-1 rounded-full pointer-events-none">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        <span>CINEMATIC OUTTAKE</span>
      </div>

      {/* Info Overlay */}
      <div className="absolute inset-x-0 bottom-0 p-6 z-20 text-[#f5f2ed] space-y-1">
        <span className="text-[9px] font-mono uppercase tracking-[0.25em] text-brand-gold block">
          {asset.processStage ? `${asset.processStage} Phase` : 'RAW PLATFORM FOOTAGE'}
        </span>
        <h3 className="text-lg font-serif tracking-tight leading-tight text-white group-hover:text-brand-gold transition-colors duration-500 line-clamp-2">
          {asset.title}
        </h3>
        {asset.description && (
          <p className="text-xs text-[#f5f2ed]/70 font-light font-sans line-clamp-2 pt-1 opacity-0 group-hover:opacity-100 transition-all duration-500 leading-relaxed">
            {asset.description}
          </p>
        )}
      </div>
    </motion.div>
  );
}

export default function PortfolioGrid() {
  const { state, resolveVideoUrl } = useCMS();
  const CASE_STUDIES = state.portfolioProjects || [];
  const MEDIA_ASSETS = state.mediaAssets || [];

  const [activeView, setActiveView] = useState<'case-studies' | 'media-archives'>('case-studies');
  const [filter, setFilter] = useState<EventType | 'all'>('all');
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);
  const [selectedCase, setSelectedCase] = useState<CaseStudy | null>(null);
  const [selectedMedia, setSelectedMedia] = useState<any | null>(null);
  const [modalVideoError, setModalVideoError] = useState(false);

  const handleSelectCase = (caseStudy: CaseStudy | null) => {
    setSelectedCase(caseStudy);
    setModalVideoError(false);
  };

  const visibleCategories = (state.eventCategories || []).filter(cat => cat.visible !== false);

  const filteredStudies = filter === 'all' 
    ? CASE_STUDIES 
    : CASE_STUDIES.filter(study => study.category === filter);

  const filteredMedia = filter === 'all'
    ? MEDIA_ASSETS
    : MEDIA_ASSETS.filter(asset => asset.category === filter);

  return (
    <section id="portfolio-section" className="py-24 sm:py-32 bg-[#faf8f5] text-neutral-800 relative border-t border-black/5 overflow-hidden">
      {/* Background soft ambient flares */}
      <div className="absolute top-[20%] left-[-10%] w-[45%] h-[45%] bg-[#d16126] rounded-full blur-[140px] opacity-[0.04] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-10%] w-[45%] h-[45%] bg-[#d16126] rounded-full blur-[140px] opacity-[0.03] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
        {/* Section Header with Segmented Switcher */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-6">
          <div>
            <span className="text-[10px] font-mono tracking-[0.3em] text-brand-gold uppercase block mb-3">Portfolio Chronology</span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif tracking-tight text-neutral-800 editorial-kerning-expand-lg">
              Our Case <span className="italic font-light text-neutral-500">Studies.</span>
            </h2>
          </div>

          {/* Premium Segmented Dual Control Switcher */}
          <div className="flex p-1 bg-neutral-200/60 rounded-full border border-black/5 self-start md:self-auto backdrop-blur-sm">
            <button
              onClick={() => {
                setActiveView('case-studies');
                setFilter('all');
              }}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-[10px] font-mono uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                activeView === 'case-studies'
                  ? 'bg-brand-gold text-white shadow-md font-bold'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Case Studies</span>
            </button>
            <button
              onClick={() => {
                setActiveView('media-archives');
                setFilter('all');
              }}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-[10px] font-mono uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                activeView === 'media-archives'
                  ? 'bg-[#1a1613] text-white shadow-md font-bold'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <Film className="w-3.5 h-3.5" />
              <span>Media Archives</span>
            </button>
          </div>
        </div>

        {/* Clean Editorial Filter Bar */}
        <div className="flex flex-wrap items-center gap-x-8 gap-y-4 text-[10px] font-mono uppercase tracking-[0.2em] relative z-10 w-full border-b border-black/10 pb-6 mb-12">
          <button
             onClick={() => setFilter('all')}
             className={`relative pb-2 transition-colors duration-300 cursor-pointer ${
               filter === 'all' ? 'text-brand-gold font-bold' : 'text-neutral-500 hover:text-neutral-900'
             }`}
          >
            <span>All {activeView === 'case-studies' ? 'Case Studies' : 'Media Assets'}</span>
            {filter === 'all' && (
              <motion.span 
                layoutId="activeFilterUnderline" 
                className="absolute bottom-0 left-0 w-full h-[1.5px] bg-brand-gold" 
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
          </button>
          {visibleCategories.map((cat) => {
            const type = cat.id as EventType;
            return (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={`relative pb-2 transition-colors duration-300 cursor-pointer ${
                  filter === type ? 'text-brand-gold font-bold' : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                <span>{cat.title}</span>
                {filter === type && (
                  <motion.span 
                    layoutId="activeFilterUnderline" 
                    className="absolute bottom-0 left-0 w-full h-[1.5px] bg-brand-gold" 
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Living Memory wall - Responsive multi-column masonry */}
        <div className="columns-1 md:columns-2 lg:columns-3 gap-8 space-y-0 relative">
          <AnimatePresence mode="popLayout">
            {activeView === 'case-studies' ? (
              filteredStudies.map((study) => (
                <PortfolioCard
                  key={study.id}
                  study={study}
                  isHovered={hoveredCardId === study.id}
                  isAnyHovered={hoveredCardId !== null}
                  onHoverStart={() => setHoveredCardId(study.id)}
                  onHoverEnd={() => setHoveredCardId(null)}
                  onClick={() => handleSelectCase(study)}
                />
              ))
            ) : filteredMedia.length === 0 ? (
              <div className="col-span-full py-16 text-center text-neutral-500 font-serif italic text-sm">
                No archived cinematic assets currently flagged under this category.
              </div>
            ) : (
              filteredMedia.map((asset) => (
                <ArchiveMediaCard
                  key={asset.id}
                  asset={asset}
                  onClick={() => setSelectedMedia(asset)}
                  resolveVideoUrl={resolveVideoUrl}
                />
              ))
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* 5. CINEMATIC FULL SCREEN CASE STUDY OVERLAY */}
      <AnimatePresence>
        {selectedCase && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-md flex justify-center items-start lg:items-center p-4 sm:p-6 lg:p-12 cursor-zoom-out"
            onClick={() => setSelectedCase(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 30 }}
              transition={{ duration: 0.6, ease: [0.25, 1, 0.5, 1] }}
              className="bg-[#fbfaf7] border border-black/15 text-neutral-800 w-full max-w-5xl rounded-3xl overflow-hidden relative z-50 cursor-default shadow-[0_30px_75px_rgba(0,0,0,0.15)]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={() => handleSelectCase(null)}
                className="absolute top-4 right-4 z-50 bg-[#faf8f5] hover:bg-[#eae8e2] p-2.5 rounded-full border border-black/10 transition-all text-neutral-600 hover:text-black cursor-pointer shadow-md"
                aria-label="Close case study"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Case Study Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2">
                {/* Left side: Large cinematic cover */}
                <div className="relative h-64 lg:h-full min-h-[300px] lg:min-h-[600px] bg-neutral-900 overflow-hidden">
                  <img
                    src={(LOCAL_SCREENSHOTS[selectedCase.id] || selectedCase.image) || null}
                    className="w-full h-full object-cover pointer-events-none select-none"
                    alt={selectedCase.title}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-black/80 via-transparent to-transparent z-10 pointer-events-none" />
                  
                  {/* Absolute positioning of some case metadata */}
                  <div className="absolute bottom-6 left-6 right-6 z-20 space-y-2">
                    <span className="text-[10px] font-mono tracking-[0.3em] text-brand-gold uppercase bg-black/40 backdrop-blur-sm px-3 py-1 rounded-full text-white">
                      {selectedCase.category}
                    </span>
                    <h4 className="text-3xl sm:text-4xl font-serif text-white tracking-tight mt-2">
                      {selectedCase.title}
                    </h4>
                    <p className="text-xs text-neutral-300 font-mono flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-brand-gold" />
                      {selectedCase.location} • Client: {selectedCase.client}
                    </p>
                  </div>
                </div>

                {/* Right side: Detailed narrative columns */}
                <div className="p-6 sm:p-10 lg:p-12 space-y-8 overflow-y-auto max-h-[500px] lg:max-h-[600px] scrollbar-thin">
                  {/* Case Story Paragraph */}
                  <div className="space-y-3">
                    <span className="text-[9px] font-mono tracking-widest text-[#d16126] uppercase flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-[#d16126]" /> Project Brief
                    </span>
                    <h5 className="text-xl font-serif font-light text-neutral-800">
                      Logistics & Execution of {selectedCase.title}
                    </h5>
                    <p className="text-sm font-light text-neutral-600 leading-relaxed">
                      {selectedCase.story}
                    </p>
                  </div>

                  {/* Twin Pillars: Goals & Transformation */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-black/10">
                    <div className="space-y-2">
                      <span className="text-[9px] font-mono tracking-widest text-neutral-500 uppercase flex items-center gap-1">
                        <Target className="w-3.5 h-3.5 text-neutral-500" /> Client Objectives
                      </span>
                      <p className="text-xs text-neutral-600 font-light leading-relaxed">
                        {selectedCase.goals}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <span className="text-[9px] font-mono tracking-widest text-[#d16126] uppercase flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-brand-gold" /> Logistical Execution
                      </span>
                      <p className="text-xs text-neutral-600 font-light leading-relaxed">
                        {selectedCase.transformation}
                      </p>
                    </div>
                  </div>

                  {/* Mini Gallery Images */}
                  <div className="space-y-3 pt-4 border-t border-black/10">
                    <span className="text-[9px] font-mono tracking-widest text-neutral-500 uppercase">
                      Event Gallery
                    </span>
                    <div className="grid grid-cols-2 gap-4">
                      {selectedCase.gallery.map((imgUrl, idx) => (
                        <div key={idx} className="aspect-video bg-[#faf8f5] overflow-hidden rounded-2xl border border-black/10">
                          <img
                            src={imgUrl || null}
                            alt="Atmospheric portfolio angle"
                            className="w-full h-full object-cover hover:grayscale-0 transition-all duration-500"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Elite Custom Testimonial block */}
                  <div className="pt-6 border border-black/10 bg-[#f6f5f0] p-5 rounded-2xl relative overflow-hidden">
                    <Quote className="absolute right-3 top-3 w-16 h-16 text-black/5 opacity-5 pointer-events-none" />
                    <p className="text-sm font-serif italic text-neutral-700 leading-relaxed relative z-10 mb-4 font-light">
                      "{selectedCase.testimonial.quote}"
                    </p>
                    <div className="text-xs font-mono">
                      <span className="text-[#d16126]">{selectedCase.testimonial.author}</span>
                      <span className="text-neutral-500"> — {selectedCase.testimonial.role}</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 6. CINEMATIC FULL SCREEN MEDIA LIGHTBOX OVERLAY */}
      <AnimatePresence>
        {selectedMedia && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 overflow-y-auto bg-black/95 backdrop-blur-md flex justify-center items-start lg:items-center p-4 sm:p-6 lg:p-12 cursor-zoom-out"
            onClick={() => setSelectedMedia(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 30 }}
              transition={{ duration: 0.6, ease: [0.25, 1, 0.5, 1] }}
              className="bg-[#1a1613] border border-white/10 text-white w-full max-w-5xl rounded-3xl overflow-hidden relative z-50 cursor-default shadow-[0_35px_90px_rgba(0,0,0,0.8)]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={() => setSelectedMedia(null)}
                className="absolute top-4 right-4 z-50 bg-[#12100e] hover:bg-neutral-800 p-2.5 rounded-full border border-white/10 transition-all text-neutral-400 hover:text-white cursor-pointer shadow-md"
                aria-label="Close media view"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Media Lightbox Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2">
                {/* Left side: Pure Cinematic Player */}
                <div className="relative aspect-video lg:aspect-auto lg:h-[550px] bg-black flex items-center justify-center">
                  <video
                    key={resolveVideoUrl(selectedMedia.videoUrl)}
                    src={resolveVideoUrl(selectedMedia.videoUrl)}
                    controls
                    autoPlay
                    playsInline
                    preload="auto"
                    crossOrigin="anonymous"
                    poster={selectedMedia.posterImage}
                    className="w-full h-full object-contain"
                  />
                </div>

                {/* Right side: Detailed narrative & Technical registry */}
                <div className="p-6 sm:p-10 lg:p-12 space-y-6 overflow-y-auto max-h-[450px] lg:max-h-[550px] bg-[#1a1613]">
                  <div className="space-y-2">
                    <span className="text-[10px] font-mono tracking-[0.3em] text-brand-gold uppercase bg-white/5 backdrop-blur-sm px-3 py-1 rounded-full text-white inline-block">
                      {selectedMedia.category || 'Cinema Archive'}
                    </span>
                    <h4 className="text-2xl sm:text-3xl font-serif text-white tracking-tight leading-tight">
                      {selectedMedia.title}
                    </h4>
                    {selectedMedia.eventDate && (
                      <p className="text-xs text-neutral-400 font-mono flex items-center gap-1.5 pt-1">
                        <Calendar className="w-3.5 h-3.5 text-brand-gold" />
                        Captured: {selectedMedia.eventDate}
                      </p>
                    )}
                  </div>

                  {selectedMedia.description && (
                    <div className="space-y-2 pt-4 border-t border-white/10">
                      <span className="text-[9px] font-mono tracking-widest text-[#d16126] uppercase flex items-center gap-1">
                        <Info className="w-3 h-3 text-[#d16126]" /> Footage Description
                      </span>
                      <p className="text-sm font-light text-neutral-300 leading-relaxed">
                        {selectedMedia.description}
                      </p>
                    </div>
                  )}

                  {/* Tech/Mono metadata log block */}
                  <div className="pt-4 border-t border-white/10">
                    <div className="font-mono text-[10px] text-neutral-400 bg-neutral-900/60 p-4 border border-white/5 rounded-2xl space-y-1.5">
                      <p className="text-brand-gold uppercase text-[9px] tracking-widest mb-2 font-bold flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> Tech Registry Log
                      </p>
                      <p><span className="text-neutral-500">ASSET_ID :</span> {selectedMedia.id}</p>
                      <p><span className="text-neutral-500">VIDEO_URL:</span> <span className="break-all text-[#ede9df]/80">{selectedMedia.videoUrl}</span></p>
                      <p><span className="text-neutral-500">DEPLOYED :</span> SUITE DIRECT STREAMING</p>
                      <p><span className="text-neutral-500">PHASE    :</span> {selectedMedia.processStage ? selectedMedia.processStage.toUpperCase() : 'COMPILED_RELEASE'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
