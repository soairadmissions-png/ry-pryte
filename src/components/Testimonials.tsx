import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Quote, X, Calendar, MapPin, Sparkles } from 'lucide-react';
import { useCMS } from '../lib/cmsState';
import { ClientStory } from '../types';

// Precise layout configuration presets around the centered header
// Utilizes diverse coordinate cells of the screen, leaving the center region (30%-70% left, 25%-75% top) clear.
const POSITION_PRESETS = [
  // LEFT SIDE - TOP
  { left: '4%', top: '10%', size: 92, zIndex: 10, dx: [12, -8, 15], dy: [-12, 10, -15], delay: 0 },
  { left: '16%', top: '6%', size: 54, zIndex: 5, dx: [-10, 15, -8], dy: [10, -12, 8], delay: 1.2 },
  { left: '26%', top: '12%', size: 76, zIndex: 8, dx: [15, -12, 10], dy: [-8, 12, -10], delay: 0.5 },
  
  // LEFT SIDE - MID
  { left: '6%', top: '28%', size: 52, zIndex: 4, dx: [-12, 10, -15], dy: [15, -12, 18], delay: 2.1 },
  { left: '18%', top: '34%', size: 96, zIndex: 12, dx: [14, -14, 18], dy: [-18, 14, -14], delay: 0.8 },
  { left: '8%', top: '48%', size: 68, zIndex: 7, dx: [-8, 12, -10], dy: [10, -15, 12], delay: 1.5 },
  
  // LEFT SIDE - BOTTOM
  { left: '18%', top: '65%', size: 84, zIndex: 9, dx: [10, -15, 12], dy: [-12, 10, -15], delay: 0.3 },
  { left: '6%', top: '78%', size: 60, zIndex: 6, dx: [-15, 12, -10], dy: [15, -10, 15], delay: 2.7 },
  { left: '15%', top: '86%', size: 74, zIndex: 8, dx: [12, -10, 15], dy: [-10, 15, -12], delay: 1.0 },
  { left: '28%', top: '80%', size: 54, zIndex: 5, dx: [-8, 10, -12], dy: [12, -8, 10], delay: 3.4 },

  // TOP CENTER
  { left: '38%', top: '8%', size: 64, zIndex: 6, dx: [8, -12, 10], dy: [-10, 12, -8], delay: 1.9 },
  { left: '55%', top: '6%', size: 82, zIndex: 10, dx: [-12, 14, -10], dy: [14, -10, 12], delay: 0.4 },

  // RIGHT SIDE - TOP
  { left: '72%', top: '8%', size: 58, zIndex: 5, dx: [15, -10, 12], dy: [-12, 15, -10], delay: 1.7 },
  { left: '86%', top: '12%', size: 88, zIndex: 10, dx: [-14, 12, -18], dy: [12, -14, 10], delay: 2.5 },
  { left: '78%', top: '24%', size: 72, zIndex: 8, dx: [10, -12, 15], dy: [-15, 10, -12], delay: 0.7 },
  
  // RIGHT SIDE - MID
  { left: '90%', top: '36%', size: 54, zIndex: 4, dx: [-18, 12, -15], dy: [15, -18, 12], delay: 1.4 },
  { left: '80%', top: '48%', size: 92, zIndex: 11, dx: [15, -15, 12], dy: [-12, 14, -15], delay: 3.1 },
  { left: '92%', top: '64%', size: 70, zIndex: 7, dx: [-10, 15, -12], dy: [12, -10, 15], delay: 0.2 },

  // RIGHT SIDE - BOTTOM
  { left: '82%', top: '78%', size: 80, zIndex: 9, dx: [18, -12, 14], dy: [-10, 18, -14], delay: 1.8 },
  { left: '91%', top: '85%', size: 56, zIndex: 5, dx: [-12, 10, -8], dy: [10, -12, 10], delay: 0.9 },
  { left: '68%', top: '84%', size: 78, zIndex: 8, dx: [12, -15, 10], dy: [-15, 12, -12], delay: 2.3 },
  { left: '50%', top: '88%', size: 62, zIndex: 6, dx: [-10, 12, -14], dy: [8, -10, 12], delay: 1.1 }
];

export default function Testimonials() {
  const { state } = useCMS();
  const CLIENT_STORIES = state.clientStories || [];

  // Interaction States
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [activeStory, setActiveStory] = useState<ClientStory | null>(null);

  // Fallback for empty states to gracefully compile
  if (CLIENT_STORIES.length === 0) {
    return (
      <section id="testimonials-section" className="py-20 text-center text-xs font-mono text-neutral-500 bg-[#faf8f5]">
        No testimonials loaded. Open the Command Center to add.
      </section>
    );
  }

  // Dynamic values configured in Customizer CMS
  const theme = state.themeConfig || {};
  const currentBgColor = (theme.bgColor === '#12100e' || theme.bgColor === '#12100E' || !theme.bgColor) ? '#faf8f5' : theme.bgColor;
  const currentTextColor = (theme.textColor === '#eae6df' || !theme.textColor) ? '#1e1a16' : theme.textColor;
  const currentAccentColor = theme.accentColor || '#d16126';

  // Categories labeling dictionary helper
  const getCategoryTheme = (category: string) => {
    switch (category) {
      case 'weddings': return { bg: 'bg-[#D4AF37]/10', text: 'text-[#D4AF37]', border: 'border-[#D4AF37]/30', label: 'Wedding Jubilee' };
      case 'corporate': return { bg: 'bg-[#8EA8C3]/10', text: 'text-[#8EA8C3]', border: 'border-[#8EA8C3]/30', label: 'Corporate Summit' };
      case 'birthdays': return { bg: 'bg-[#D81159]/10', text: 'text-[#D81159]', border: 'border-[#D81159]/30', label: 'Private Milestone' };
      case 'galas': return { bg: 'bg-[#E5A93C]/10', text: 'text-[#E5A93C]', border: 'border-[#E5A93C]/30', label: 'Luxury Gala Dinner' };
      default: return { bg: 'bg-[#7B2CBF]/10', text: 'text-[#7B2CBF]', border: 'border-[#7B2CBF]/30', label: 'Consultative Outline' };
    }
  };

  return (
    <section 
      id="testimonials-section" 
      className="relative w-full py-28 md:py-36 overflow-hidden select-none border-t border-black/5 flex items-center justify-center min-h-[720px] md:min-h-[860px] transition-all duration-700"
      style={{ 
        backgroundColor: currentBgColor, 
        color: currentTextColor 
      }}
    >
      {/* Editorial Decorative Coordinates Background */}
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/2 to-transparent pointer-events-none" />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[500px] h-[500px] rounded-full border border-neutral-100/40 animate-spin-slow opacity-60" />
        <div className="w-[750px] h-[750px] rounded-full border border-dashed border-neutral-200/20 absolute animate-reverse-spin opacity-40" />
      </div>

      {/* Center Anchor Heading (Non-overlapping deadzone area) */}
      <div className="relative z-10 text-center max-w-xl w-full px-6 pointer-events-none">
        <div className="flex items-center justify-center gap-1.5 mb-3">
          <Sparkles className="w-4 h-4" style={{ color: currentAccentColor }} />
          <span 
            className="text-[10px] font-mono tracking-[0.3em] uppercase block"
            style={{ color: currentAccentColor }}
          >
            Community & Trust
          </span>
        </div>
        <h2 
          className="text-4xl sm:text-5xl font-serif tracking-tight leading-tight mb-4 font-normal text-neutral-800"
          style={{ color: currentTextColor }}
        >
          Testimonials
        </h2>
        <p className="text-xs sm:text-sm font-light leading-relaxed max-w-sm mx-auto text-neutral-500 font-sans">
          Discover the testimonies of modern visionaries, couples, and leaders whose bespoke events were executed to ultimate perfection.
        </p>
      </div>

      {/* Floating Starfield Profile Community Constellation */}
      <div className="absolute inset-0 w-full h-full">
        {CLIENT_STORIES.map((story, index) => {
          const preset = POSITION_PRESETS[index % POSITION_PRESETS.length];
          const isHovered = hoveredIdx === index;
          const isSomethingHovered = hoveredIdx !== null;
          const isReducedEmphasis = isSomethingHovered && !isHovered;

          return (
            <motion.button
              id={`profile-node-${index}`}
              key={index}
              onClick={() => setActiveStory(story)}
              onMouseEnter={() => setHoveredIdx(index)}
              onMouseLeave={() => setHoveredIdx(null)}
              style={{
                position: 'absolute',
                left: preset.left,
                top: preset.top,
                width: `${preset.size}px`,
                height: `${preset.size}px`,
                zIndex: isHovered ? 40 : preset.zIndex,
              }}
              className="rounded-full overflow-hidden cursor-pointer flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              animate={{
                x: preset.dx,
                y: preset.dy,
                scale: isHovered ? 1.3 : isReducedEmphasis ? 0.8 : 1,
                filter: isHovered 
                  ? 'brightness(1.15) contrast(1.05) saturate(1.1)' 
                  : isReducedEmphasis 
                    ? 'brightness(0.55) grayscale(40%) blur(1px)' 
                    : 'brightness(0.95) grayscale(10%) blur(0px)',
                boxShadow: isHovered 
                  ? `0 0 30px ${currentAccentColor}45, 0 10px 25px -5px rgba(0, 0, 0, 0.2)` 
                  : '0 4px 10px -2px rgba(0, 0, 0, 0.05)'
              }}
              transition={{
                x: {
                  duration: 14 + (index % 4) * 3,
                  repeat: Infinity,
                  repeatType: 'mirror',
                  ease: 'easeInOut',
                  delay: preset.delay,
                },
                y: {
                  duration: 11 + (index % 5) * 3,
                  repeat: Infinity,
                  repeatType: 'mirror',
                  ease: 'easeInOut',
                  delay: preset.delay,
                },
                scale: { type: 'spring', stiffness: 280, damping: 22 },
                filter: { duration: 0.4 },
                boxShadow: { duration: 0.4 }
              }}
            >
              <div 
                className="absolute inset-0 rounded-full border-1.5 transition-all duration-500 z-10"
                style={{ 
                  borderColor: isHovered ? currentAccentColor : 'rgba(0, 0, 0, 0.08)'
                }}
              />
              <img
                src={story.image}
                alt={story.author}
                className="w-full h-full object-cover select-none"
                referrerPolicy="no-referrer"
                draggable={false}
              />
              
              {/* Quick Hover Category Overlay Ribbon */}
              <AnimatePresence>
                {isHovered && (
                  <motion.div
                    initial={{ opacity: 0, y: 7 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 7 }}
                    className="absolute bottom-1 bg-black/95 px-2 py-0.5 rounded text-[7px] font-mono tracking-widest text-[#eae6df] uppercase z-20"
                  >
                    {story.category}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </div>

      {/* Deluxe Testimonial Frosted Glass Reveal Modal Card */}
      <AnimatePresence>
        {activeStory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Elegant dark frosted veil */}
            <motion.div
              id="reveal-veil"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveStory(null)}
              className="absolute inset-0 bg-[#0c0a09]/75 backdrop-blur-md"
            />

            {/* Frosted glass content vessel */}
            <motion.div
              id="reveal-card-body"
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 26, stiffness: 320 }}
              className="relative w-full max-w-lg md:max-w-xl bg-[#faf8f5]/95 border border-[#1e1a16]/10 shadow-[0_30px_70px_rgba(0,0,0,0.4)] rounded-[32px] overflow-hidden z-10 flex flex-col items-center p-8 md:p-12 text-center"
            >
              {/* Luxury gold glowing top accent */}
              <div 
                className="absolute top-0 inset-x-0 h-1.5"
                style={{ backgroundColor: currentAccentColor }}
              />

              {/* Absolute Close Hammer */}
              <button 
                id="close-reveal-modal"
                onClick={() => setActiveStory(null)}
                className="absolute top-6 right-6 w-9 h-9 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-600 hover:text-black transition-all flex items-center justify-center cursor-pointer border border-[#1e1a16]/5"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Large Portrait Frame inside Modal */}
              <div className="relative mb-6">
                <div 
                  className="w-24 h-24 md:w-28 md:h-28 rounded-full overflow-hidden p-1 border-2"
                  style={{ borderColor: currentAccentColor }}
                >
                  <img 
                    src={activeStory.image} 
                    alt={activeStory.author} 
                    className="w-full h-full object-cover rounded-full"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div 
                  className="absolute bottom-0 right-1 px-3 py-1 rounded-full text-[9px] font-mono tracking-wider font-semibold border z-10 uppercase bg-[#faf8f5]"
                  style={{ 
                    color: getCategoryTheme(activeStory.category).text,
                    backgroundColor: getCategoryTheme(activeStory.category).bg,
                    borderColor: getCategoryTheme(activeStory.category).text + '30'
                  }}
                >
                  {getCategoryTheme(activeStory.category).label}
                </div>
              </div>

              {/* Artistic Quote Graphics */}
              <Quote 
                className="w-12 h-12 mb-5 opacity-40" 
                style={{ color: currentAccentColor }}
              />

              {/* Review Quote Body Text */}
              <blockquote className="text-lg md:text-xl font-serif italic text-neutral-700 leading-relaxed font-light mb-8 max-w-md">
                "{activeStory.quote}"
              </blockquote>

              {/* Metadata Anchor Area */}
              <div className="w-full border-t border-neutral-200/60 pt-6 flex flex-col items-center">
                <h3 className="text-base font-mono tracking-widest text-[#1e1a16] font-bold uppercase mb-1">
                  {activeStory.author}
                </h3>
                
                <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest mb-4">
                  {activeStory.role}
                </p>

                {/* Footnotes Coordinates */}
                <div className="flex items-center gap-6 text-[10px] font-mono text-neutral-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {activeStory.eventDate || 'AESTHETIC 2026'}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    Abuja, Nigeria
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
