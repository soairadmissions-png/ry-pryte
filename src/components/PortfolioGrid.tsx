import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, Calendar, Info } from 'lucide-react';
import { EventType } from '../types';
import { useCMS } from '../lib/cmsState';

interface ArchiveMediaCardProps {
  key?: string;
  asset: any;
  index: number;
  onClick: () => void;
  resolveVideoUrl: (url: string) => string;
}

function ArchiveMediaCard({ asset, index, onClick, resolveVideoUrl }: ArchiveMediaCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const videoRef = React.useRef<HTMLVideoElement | null>(null);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  // We play natively using the autoPlay attribute, but let's make sure it is playing
  React.useEffect(() => {
    if (!isInView) return;
    const video = videoRef.current;
    if (!video) return;
    
    // Safety check to trigger play if interrupted or dynamic
    if (video.paused) {
      video.play().catch(() => {});
    }
  }, [isInView]);

  const resolvedUrl = resolveVideoUrl(asset.videoUrl);

  // Classic staggered editorial aspects for robust portrait masonry
  const getAspectRatio = (idx: number) => {
    const ratios = ['9/16', '9/13.5', '9/15', '9/14'];
    return ratios[idx % ratios.length];
  };

  return (
    <motion.div
      ref={containerRef}
      layout
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      style={{ aspectRatio: getAspectRatio(index) }}
      className={`group relative cursor-pointer overflow-hidden bg-neutral-950 border border-black/10 break-inside-avoid shadow-neutral-900/10 inline-block w-full mb-8 rounded-3xl transition-all duration-700 ${
        isHovered
          ? 'scale-[1.04] z-20 border-brand-gold/50 shadow-[0_30px_60px_rgba(209,97,38,0.12)]'
          : 'opacity-100 shadow-[0_15px_30px_rgba(32,26,22,0.04)]'
      }`}
    >
      {/* Click overlay */}
      <div className="absolute inset-0 z-30 cursor-pointer" />

      {/* Cinematic Cover / Video container */}
      <div className="absolute inset-0 w-full h-full bg-black">
        {isInView && (
          <video
            ref={videoRef}
            src={resolvedUrl || undefined}
            poster={asset.posterImage || undefined}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            crossOrigin="anonymous"
            className="w-full h-full object-cover opacity-90 transition-all duration-700 scale-100 group-hover:scale-105"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent z-10" />
      </div>

      {/* Info Overlay */}
      <div className="absolute inset-x-0 bottom-0 p-6 z-20 text-[#f5f2ed] space-y-1">
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
  const MEDIA_ASSETS = state.mediaAssets || [];

  const [filter, setFilter] = useState<EventType | 'all'>('all');
  const [selectedMedia, setSelectedMedia] = useState<any | null>(null);

  const visibleCategories = (state.eventCategories || []).filter(cat => cat.visible !== false);

  const filteredMedia = filter === 'all'
    ? MEDIA_ASSETS
    : MEDIA_ASSETS.filter(asset => asset.category === filter);

  return (
    <section id="portfolio-section" className="py-24 sm:py-32 bg-[#faf8f5] text-neutral-800 relative border-t border-black/5 overflow-hidden">
      {/* Background soft ambient flares */}
      <div className="absolute top-[20%] left-[-10%] w-[45%] h-[45%] bg-[#d16126] rounded-full blur-[140px] opacity-[0.04] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-10%] w-[45%] h-[45%] bg-[#d16126] rounded-full blur-[140px] opacity-[0.03] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-6">
          <div>
            <span className="text-[10px] font-mono tracking-[0.3em] text-brand-gold uppercase block mb-3">Portfolio Chronology</span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif tracking-tight text-neutral-800 editorial-kerning-expand-lg">
              Cinematic <span className="italic font-light text-neutral-500">Archives.</span>
            </h2>
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
            <span>All Cinematic Media</span>
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
            {filteredMedia.length === 0 ? (
              <div className="col-span-full py-16 text-center text-neutral-500 font-serif italic text-sm">
                No archived cinematic assets currently flagged under this category.
              </div>
            ) : (
              filteredMedia.map((asset, index) => (
                <ArchiveMediaCard
                  key={asset.id}
                  asset={asset}
                  index={index}
                  onClick={() => setSelectedMedia(asset)}
                  resolveVideoUrl={resolveVideoUrl}
                />
              ))
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* CINEMATIC FULL SCREEN MEDIA LIGHTBOX OVERLAY */}
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
                    src={resolveVideoUrl(selectedMedia.videoUrl) || undefined}
                    controls
                    autoPlay
                    playsInline
                    preload="auto"
                    crossOrigin="anonymous"
                    poster={selectedMedia.posterImage || undefined}
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
                        <Info className="w-3.5 h-3.5 text-[#d16126]" /> Footage Description
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
