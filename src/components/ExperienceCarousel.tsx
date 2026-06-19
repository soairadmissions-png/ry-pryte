import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Calendar,
  Activity,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  FileVideo,
  Monitor
} from 'lucide-react';
import { EventType } from '../types';
import { useCMS } from '../lib/cmsState';
import Logo from './Logo';

export interface DiagnosticResult {
  id: string;
  title: string;
  videoUrl: string;
  httpStatus: string;
  contentType: string;
  fileSize: string;
  readyState: string;
  networkState: string;
  errorMsg: string;
  videoWidth: number;
  videoHeight: number;
  frameExtraction: 'Success' | 'Failed (CORS)' | 'Failed (Decode)' | 'Failed (Timeout)' | 'Failed (Unknown)' | 'Running...';
  diagnosis: string;
}

// Import authentic screenshot/still assets
// @ts-ignore
import gatherWeddingImg from '../assets/images/gather_wedding_1781527313337.jpg';
// @ts-ignore
import gatherCorporateImg from '../assets/images/gather_corporate_1781527328223.jpg';
// @ts-ignore
import gatherBirthdayImg from '../assets/images/gather_birthday_1781527344179.jpg';
// @ts-ignore
import gatherGalaImg from '../assets/images/gather_gala_1781527359084.jpg';
// @ts-ignore
import gatherCustomImg from '../assets/images/gather_custom_1781527375668.jpg';

interface ExperienceCarouselProps {
  onPlanClick: (category?: EventType) => void;
  onScrollDownClick: () => void;
}

interface EventCardConfig {
  id: string;
  title: string;
  subtitle: string;
  badgeText: string;
  image: string;
  videoUrl: string;
  glowColor: string;
  categoryKey: EventType;
  eventDate: string;
  computedX?: number;
  originalAssetId?: string;
  absoluteSlotIndex?: number;
}

const LOCAL_POSTER_IMAGES = [
  gatherWeddingImg,
  gatherCorporateImg,
  gatherBirthdayImg,
  gatherGalaImg,
  gatherCustomImg
];

// Helper to check if a URL is a direct .mp4 or .webm stream or an uploaded blob
function isDirectMp4FromStorage(url: string | undefined): boolean {
  if (!url) return false;
  const lower = url.trim().toLowerCase();
  return lower.startsWith('blob:') || lower.startsWith('local-video://') || lower.endsWith('.mp4') || lower.endsWith('.webm') || lower.includes('.mp4?') || lower.includes('.webm?');
}

export default function ExperienceCarousel({ onPlanClick, onScrollDownClick }: ExperienceCarouselProps) {
  const { state, resolveVideoUrl } = useCMS();

  // Return direct media assets array
  const collection = React.useMemo(() => {
    return state.mediaAssets || [];
  }, [state.mediaAssets]);

  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [activeModalCard, setActiveModalCard] = useState<EventCardConfig | null>(null);

  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [diagnosticResults, setDiagnosticResults] = useState<DiagnosticResult[]>([]);
  const [diagnosticProgress, setDiagnosticProgress] = useState(0);
  const [isDiagnosticRunning, setIsDiagnosticRunning] = useState(false);

  const startDiagnostics = async () => {
    setIsDiagnosticRunning(true);
    setDiagnosticProgress(0);
    
    const total = collection.length;
    if (total === 0) {
      setIsDiagnosticRunning(false);
      return;
    }

    for (let i = 0; i < total; i++) {
      const asset = collection[i];
      const id = asset.id || `diagnostic-item-${i}`;
      const title = asset.title || `Bespoke Archive ${i + 1}`;
      const url = asset.videoUrl || '';
      
      setDiagnosticResults(prev => {
        const copy = [...prev];
        const existingIdx = copy.findIndex(r => r.id === id);
        const newResult: DiagnosticResult = {
          id,
          title,
          videoUrl: url,
          httpStatus: 'Probing...',
          contentType: 'Analyzing MIME...',
          fileSize: 'Measuring filesize...',
          readyState: '0 (HAVE_NOTHING)',
          networkState: 'Running checks...',
          errorMsg: 'None',
          videoWidth: 0,
          videoHeight: 0,
          frameExtraction: 'Running...',
          diagnosis: 'Initializing automated media test...'
        };
        if (existingIdx !== -1) {
          copy[existingIdx] = newResult;
          return copy;
        } else {
          return [...prev, newResult];
        }
      });

      const resolved = resolveVideoUrl(url) || url;
      const res = await runDiagnosticsForUrl(id, resolved, title);
      
      setDiagnosticResults(prev => {
        const copy = [...prev];
        const existingIdx = copy.findIndex(r => r.id === id);
        if (existingIdx !== -1) {
          copy[existingIdx] = res;
          return copy;
        } else {
          return [...prev, res];
        }
      });

      setDiagnosticProgress(Math.round(((i + 1) / total) * 100));
    }
    
    setIsDiagnosticRunning(false);
  };

  // Responsive layout measurement State
  const [containerWidth, setContainerWidth] = useState(1200);
  const [cardHeight, setCardHeight] = useState(320);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth);
      } else {
        setContainerWidth(window.innerWidth);
      }

      if (window.innerWidth < 640) {
        setCardHeight(150);
      } else if (window.innerWidth < 1024) {
        setCardHeight(200);
      } else {
        setCardHeight(260);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    const timer = setTimeout(handleResize, 150);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer);
    };
  }, []);

  // Parallax motion and continuous carousel loop speed state
  const [motionState, setMotionState] = useState({
    angle: 0,
    scrollY: 0,
    velocity: 0
  });

  const visibleCount = 5;
  const gap = window.innerWidth < 640 ? 12 : window.innerWidth < 1024 ? 20 : 28;
  const fixedWidth = Math.max(140, Math.floor((containerWidth - (visibleCount + 1) * gap) / visibleCount));
  const stageHeight = cardHeight * 1.5;

  // Supports dynamic counts up to 50 slots, defaults to 10
  const numSlots = Math.max(10, Math.min(50, collection.length));

  // Compute carousel slot layouts on conveyor belt
  const carouselCards = React.useMemo(() => {
    if (collection.length === 0) return [];

    const itemWidth = fixedWidth + gap;
    const totalWidth = numSlots * itemWidth;

    const progress = motionState.angle / (2 * Math.PI);
    const scrollOffset = progress * totalWidth;

    return Array.from({ length: numSlots }, (_, i) => {
      let relativeX = (i * itemWidth - scrollOffset) % totalWidth;
      if (relativeX < -totalWidth / 2) relativeX += totalWidth;
      if (relativeX > totalWidth / 2) relativeX -= totalWidth;

      const virtualPos = i * itemWidth - scrollOffset;
      const k = Math.round((relativeX - virtualPos) / totalWidth);
      const absoluteSlotIndex = i + k * numSlots;

      const assetIndex = ((absoluteSlotIndex % collection.length) + collection.length) % collection.length;
      const asset = collection[assetIndex];

      const videoUrl = asset.videoUrl || '';

      // Assign a smooth cohesive background glow
      const glowColors = [
        '#FDF1EC', // Weddings
        '#EBF4FA', // Corporate
        '#FAF0E6', // Celebrations
        '#F3F4ED', // Galas
        '#F4ECEF'  // Custom Planners
      ];
      const glowColor = glowColors[assetIndex % glowColors.length];

      const categoryKeys: EventType[] = ['weddings', 'birthdays', 'galas', 'custom'];
      const categoryKey = (asset.category as EventType) || categoryKeys[assetIndex % categoryKeys.length];

      return {
        id: `conveyor-${absoluteSlotIndex}-${asset.id}`,
        originalAssetId: asset.id,
        absoluteSlotIndex,
        title: asset.title || 'Bespoke Curated Setup',
        subtitle: `Custom premium experience managed with complete coordination, timeline blueprints, and strict budget allocation protocols.`,
        badgeText: 'CERTIFIED OUTCOME',
        image: asset.posterImage || LOCAL_POSTER_IMAGES[assetIndex % LOCAL_POSTER_IMAGES.length] || '',
        videoUrl,
        glowColor,
        categoryKey,
        eventDate: 'OCT 2026',
        computedX: relativeX
      };
    });
  }, [collection, motionState.angle, containerWidth, fixedWidth, gap, numSlots]);

  const handleNextCard = () => {
    if (!activeModalCard) return;
    const currentIdx = carouselCards.findIndex(c => c.id === activeModalCard.id);
    if (currentIdx !== -1) {
      const nextIdx = (currentIdx + 1) % carouselCards.length;
      setActiveModalCard(carouselCards[nextIdx]);
    }
  };

  const handlePrevCard = () => {
    if (!activeModalCard) return;
    const currentIdx = carouselCards.findIndex(c => c.id === activeModalCard.id);
    if (currentIdx !== -1) {
      const prevIdx = (currentIdx - 1 + carouselCards.length) % carouselCards.length;
      setActiveModalCard(carouselCards[prevIdx]);
    }
  };

  const lastScrollY = useRef(0);
  const currentScrollY = useRef(0);
  const scrollVelocity = useRef(0);

  const smoothedScrollY = useRef(0);
  const smoothedVelocity = useRef(0);

  useEffect(() => {
    lastScrollY.current = window.scrollY;
    currentScrollY.current = window.scrollY;
    let lastTime = performance.now();

    const handleScroll = () => {
      const cy = window.scrollY;
      const t = performance.now();
      const dt = Math.max(1, t - lastTime);
      const dy = cy - lastScrollY.current;

      currentScrollY.current = cy;
      const rawVelocity = dy / dt;
      scrollVelocity.current = Math.max(-12, Math.min(12, rawVelocity));

      lastScrollY.current = cy;
      lastTime = t;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Motion frame runner
  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();

    const tick = (now: number) => {
      const delta = now - lastTime;
      lastTime = now;

      const targetY = currentScrollY.current;
      const targetVelocity = scrollVelocity.current;

      const lerpFactorY = Math.min(1, 0.08 * (delta / 16.67));
      const lerpFactorV = Math.min(1, 0.05 * (delta / 16.67));

      smoothedScrollY.current += (targetY - smoothedScrollY.current) * lerpFactorY;
      smoothedVelocity.current += (targetVelocity - smoothedVelocity.current) * lerpFactorV;

      scrollVelocity.current *= Math.exp(-0.06 * (delta / 16.67));

      const baseSpeed = hoveredIdx !== null ? 0.00003 : 0.00020;
      const velocityEffect = smoothedVelocity.current * 0.0010;
      const limitedVelocityEffect = Math.max(-0.0012, Math.min(0.0012, velocityEffect));
      const actualSpeed = baseSpeed + limitedVelocityEffect;

      setMotionState((prev) => {
        const nextAngle = (prev.angle + actualSpeed * delta) % (2 * Math.PI);
        return {
          angle: nextAngle >= 0 ? nextAngle : nextAngle + 2 * Math.PI,
          scrollY: smoothedScrollY.current,
          velocity: smoothedVelocity.current
        };
      });

      animationFrameId = requestAnimationFrame(tick);
    };

    animationFrameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animationFrameId);
  }, [hoveredIdx]);

  const scrollToSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };


  return (
    <div 
      id="editorial-hero-showcase" 
      className="relative min-h-[82vh] md:min-h-[85vh] w-full flex flex-col justify-between overflow-hidden bg-gradient-to-b from-[#FAF8F5] via-[#FCFAF6] to-[#F3ECE5] select-none pb-4"
    >


      {/* 1. Dynamic background glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <motion.div
          className="absolute -bottom-[20%] left-1/2 -translate-x-1/2 w-[80%] aspect-video rounded-full blur-[150px] opacity-[0.22] mix-blend-multiply"
          animate={{
            backgroundColor: hoveredIdx !== null ? carouselCards[hoveredIdx]?.glowColor : '#ecd9ce',
            scale: hoveredIdx !== null ? 1.08 : 1,
          }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        />
        
        <div className="absolute top-[8%] left-[8%] w-[250px] h-[250px] bg-[#d16126]/8 rounded-full blur-[100px] opacity-30" />
        <div className="absolute top-[28%] right-[8%] w-[350px] h-[350px] bg-[#6e411b]/4 rounded-full blur-[120px] opacity-40" />

        <div 
          className="absolute inset-0 bg-[#3a3530]/1 pointer-events-none mix-blend-overlay opacity-[0.12]" 
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} 
        />
      </div>

      {/* 2. Luxury Header Navigation */}
      <header 
        id="luxury-nav-header" 
        className="relative z-50 w-full max-w-7xl mx-auto flex justify-between items-center px-6 sm:px-12 py-6 pointer-events-auto"
      >
        <div 
          id="nav-logo"
          className="cursor-pointer"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <Logo size={42} variant="combined" textColor="text-[#1E1A16]" />
        </div>
        
        <nav 
          id="nav-links"
          className="hidden md:flex items-center space-x-10 text-[10px] uppercase tracking-[0.3em] font-mono text-[#1E1A16]/75 font-medium"
        >
          <span className="hover:text-[#1E1A16] hover:border-b hover:border-[#1E1A16]/35 pb-0.5 transition-all cursor-pointer" onClick={() => scrollToSection('services-section')}>Our Services</span>
          <span className="hover:text-[#1E1A16] hover:border-b hover:border-[#1E1A16]/35 pb-0.5 transition-all cursor-pointer" onClick={() => scrollToSection('process-section')}>Our Process</span>
          <span className="hover:text-[#1E1A16] hover:border-b hover:border-[#1E1A16]/35 pb-0.5 transition-all cursor-pointer" onClick={() => scrollToSection('portfolio-section')}>Case Studies</span>
          <span className="hover:text-[#1E1A16] hover:border-b hover:border-[#1E1A16]/35 pb-0.5 transition-all cursor-pointer" onClick={() => scrollToSection('testimonials-section')}>Reviews</span>
        </nav>

        <button
          id="nav-consultation-btn"
          onClick={() => onPlanClick()}
          className="text-[#d16126] border-b border-[#d16126]/30 pb-0.5 hover:text-[#1E1A16] hover:border-[#1E1A16] transition-all text-[10px] uppercase tracking-[0.25em] font-mono cursor-pointer font-bold"
        >
          Contact Planners
        </button>
      </header>

      {/* 3. Hero Copy */}
      <div 
        id="hero-copy-container" 
        className="relative z-10 w-full max-w-5xl mx-auto px-6 pt-4 sm:pt-6 text-center flex flex-col items-center"
      >
        <motion.h1
          id="hero-main-title"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
          className="text-3xl sm:text-4xl md:text-5xl lg:text-[46px] font-bold font-serif leading-[1.15] text-[#1E1A16] tracking-tight max-w-4xl mb-3.5"
        >
          {state.heroConfig?.line1 || "Thoughtful Planning."} <br />
          <span className="italic font-light text-[#d16126] font-serif">
            {state.heroConfig?.line2 || "Extraordinary Celebrations."}
          </span>
        </motion.h1>

        <motion.p
          id="hero-subtitle"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
          className="text-xs sm:text-[13px] md:text-[14px] text-[#1e1a16]/70 leading-relaxed tracking-wide text-center max-w-2xl font-sans font-light"
        >
          {state.heroConfig?.extra || "Certified event planners in Abuja offering complete planning, seamless onsite coordination, and structured expert consultations. We design and execute tailored high-society weddings, summits, and upscale banquets with complete logistical precision."}
        </motion.p>
      </div>

      {/* 4. Semicircular Media conveyor belt */}
      <div 
        ref={containerRef}
        id="hero-arc-gallery" 
        className="relative z-20 w-full overflow-hidden flex items-center justify-center py-1"
        style={{
          height: `${stageHeight}px`,
          perspective: '1200px',
          transformStyle: 'preserve-3d',
        }}
      >
        <div className="absolute left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#1E1A16]/5 to-transparent z-10 pointer-events-none top-1/2 -translate-y-1/2" />

        <div className="absolute inset-0 w-full h-full relative" style={{ transformStyle: 'preserve-3d' }}>
          {carouselCards.map((card, idx) => {
            const relativeX = card.computedX ?? 0;
            const maxVisibleDistance = containerWidth / 2 + fixedWidth;
            if (Math.abs(relativeX) > maxVisibleDistance) return null;

            return (
              <KineticArcCard
                key={card.id}
                card={card}
                idx={idx}
                relativeX={relativeX}
                containerWidth={containerWidth}
                cardHeight={cardHeight}
                fixedWidth={fixedWidth}
                hoveredIdx={hoveredIdx}
                setHoveredIdx={setHoveredIdx}
                onCardClick={setActiveModalCard}
                velocity={motionState.velocity}
              />
            );
          })}
        </div>
      </div>

      {/* 5. Hero CTA button strip */}
      <div className="relative z-30 w-full flex flex-col items-center pb-6 sm:pb-8 mt-2 px-6">
        <motion.div
          id="hero-action-buttons"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-md"
        >
          <button
            id="hero-primary-cta"
            onClick={() => onPlanClick()}
            className="w-full sm:w-auto px-9 py-3.5 bg-[#1E1A16] text-[#FCFAF6] font-mono text-[10px] uppercase tracking-[0.25em] font-bold hover:bg-[#322A23] transition-all duration-300 shadow-lg hover:scale-[1.03] active:scale-95 cursor-pointer rounded-xl"
          >
            Plan Your Event
          </button>
          
          <button
            id="hero-secondary-cta"
            onClick={onScrollDownClick}
            className="w-full sm:w-auto px-9 py-3.5 bg-transparent text-[#1E1A16] font-mono text-[10px] uppercase tracking-[0.25em] font-bold border border-[#1E1A16]/15 hover:bg-[#1E1A16]/5 transition-all duration-300 hover:scale-[1.03] active:scale-95 cursor-pointer rounded-xl"
          >
            View Our Work
          </button>
        </motion.div>
      </div>

      {/* Popups */}
      <AnimatePresence>
        {activeModalCard && (
          <ImmersiveCinemaModal
            card={activeModalCard}
            onClose={() => setActiveModalCard(null)}
            onNext={handleNextCard}
            onPrev={handlePrevCard}
            onPlanClick={onPlanClick}
          />
        )}
      </AnimatePresence>

    </div>
  );
}

// 6. Symmetrical Valley Conveyor Card Component
interface KineticArcCardProps {
  key?: string | number;
  card: EventCardConfig;
  idx: number;
  relativeX: number;
  containerWidth: number;
  cardHeight: number;
  fixedWidth: number;
  hoveredIdx: number | null;
  setHoveredIdx: (index: number | null) => void;
  onCardClick: (card: EventCardConfig) => void;
  velocity: number;
}

function KineticArcCard({
  card,
  idx,
  relativeX,
  containerWidth,
  cardHeight,
  fixedWidth,
  hoveredIdx,
  setHoveredIdx,
  onCardClick,
  velocity,
}: KineticArcCardProps) {
  const { resolveVideoUrl } = useCMS();
  const isHovered = hoveredIdx === idx;
  const isAnyHovered = hoveredIdx !== null;

  const halfWidth = containerWidth / 2 || 600;
  const u = Math.max(-1.0, Math.min(1.0, relativeX / halfWidth));

  const x = relativeX;
  const zVal = 0;

  const dynamicTiltZ = velocity * -3.0; 
  const dynamicSkewX = velocity * -2.2; 

  // Shortest height at exact center, tallest toward the edges (symmetrical valley height)
  const minHeight = cardHeight * 0.70;
  const maxHeight = cardHeight * 1.30;
  
  let currentMaxHeight = maxHeight;
  if (isAnyHovered && !isHovered) {
    currentMaxHeight = minHeight + (maxHeight - minHeight) * 0.45;
  }

  const uFactor = Math.pow(Math.abs(u), 1.6); 
  let computedHeight = minHeight + (currentMaxHeight - minHeight) * uFactor;

  if (isHovered) {
    computedHeight = computedHeight * 1.15;
  }

  const opacity = isAnyHovered && !isHovered ? 0.40 : 1.0;
  const brightnessFilter = isHovered 
    ? 'brightness(1.10) contrast(102%)' 
    : isAnyHovered && !isHovered 
    ? 'brightness(0.35) grayscale(25%) contrast(80%)' 
    : 'brightness(0.85) contrast(100%)';

  return (
    <motion.div
      id={`kinetic-moment-${card.id}`}
      className="absolute top-1/2 left-1/2 rounded-[20px] overflow-hidden cursor-pointer shadow-lg border border-[#1e1a16]/10 bg-[#12100e] select-none"
      style={{
        width: fixedWidth,
        height: computedHeight,
        zIndex: isHovered ? 150 : 100 - Math.floor(Math.abs(u) * 20),
        transformOrigin: 'center center',
      }}
      animate={{
        x: `calc(-50% + ${x}px)`,
        y: '-50%', 
        z: zVal,
        rotateZ: dynamicTiltZ,
        skewX: dynamicSkewX,
        opacity: opacity,
      }}
      transition={{
        type: 'spring',
        stiffness: 180,
        damping: 24,
      }}
      onMouseEnter={() => setHoveredIdx(idx)}
      onMouseLeave={() => setHoveredIdx(null)}
      onClick={() => onCardClick(card)}
    >
      {/* 0. STILL COVER SAFETY IMAGE BEHIND VIDEO */}
      {card.image && (
        <img
          src={card.image}
          alt={card.title}
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover transition-all duration-500 ease-out select-none pointer-events-none bg-[#12100e]"
          style={{
            transform: `scale(${isHovered ? 1.12 : 1.05})`,
            filter: brightnessFilter,
          }}
        />
      )}

      {/* 1. CINEMATIC DIRECT VIDEO STREAM ALWAYS ON CONVEYOR BELT */}
      <video
        key={`${card.originalAssetId}-${card.absoluteSlotIndex}-${resolveVideoUrl(card.videoUrl)}`}
        src={resolveVideoUrl(card.videoUrl) || undefined}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        crossOrigin="anonymous"
        onError={(e) => {
          const v = e.currentTarget;
          console.error("!!! CONVEYOR BELT VIDEO LOAD ERROR !!!", {
            cardId: card.originalAssetId,
            src: v.src,
            code: v.error?.code,
            message: v.error?.message,
            networkState: v.networkState,
            readyState: v.readyState
          });
        }}
        className="absolute inset-0 w-full h-full object-cover transition-all duration-500 ease-out pointer-events-none select-none bg-black"
        style={{
          transform: `scale(${isHovered ? 1.12 : 1.05})`,
          filter: brightnessFilter,
        }}
      />

      {/* Title strip at bottom on hover */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent p-4 flex flex-col justify-end h-1/2 pointer-events-none z-10 transition-opacity duration-300">
        <span className="text-white font-serif text-[11px] font-bold tracking-wide uppercase line-clamp-1 truncate">{card.title}</span>
        <span className="text-neutral-400 font-sans text-[8.5px] font-medium tracking-wide block uppercase mt-0.5">{card.badgeText}</span>
      </div>
    </motion.div>
  );
}

// 7. Dynamic Immersive Cinematic Modal
function ImmersiveCinemaModal({
  card,
  onClose,
  onNext,
  onPrev,
  onPlanClick
}: {
  card: EventCardConfig;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  onPlanClick: (category?: EventType) => void;
}) {
  const { resolveVideoUrl } = useCMS();
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight') {
        onNext();
      } else if (e.key === 'ArrowLeft') {
        onPrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onNext, onPrev, onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-[#0c0b0a]/98 backdrop-blur-xl flex flex-col justify-between p-4 sm:p-6 select-none text-white outline-none"
    >
      {/* MODAL HEADER */}
      <div className="w-full max-w-6xl mx-auto flex justify-between items-center py-3 border-b border-white/5">
        <div className="flex items-center space-x-3 text-left">
          <div className="p-1.5 bg-[#d16126]/10 rounded-lg border border-[#d16126]/20">
            <Sparkles className="w-4 h-4 text-[#d16126] animate-pulse" />
          </div>
          <div>
            <span className="text-[8.5px] font-mono tracking-[0.25em] text-[#d16126] uppercase block font-bold">
              CINEMATIC ARCHIVES / {card.badgeText}
            </span>
            <h2 className="text-sm font-serif font-medium tracking-wide text-white">
              {card.title}
            </h2>
          </div>
        </div>

        <button
          onClick={onClose}
          className="group hover:bg-white/5 border border-white/10 hover:border-white/20 p-2 rounded-full transition-all cursor-pointer flex items-center justify-center"
          title="Exit Cinema View (Esc)"
        >
          <X className="w-4.5 h-4.5 text-neutral-400 group-hover:text-white transition-colors" />
        </button>
      </div>

      {/* PORTRAIT MOVIE FRAME */}
      <div className="w-full max-w-6xl mx-auto flex-1 flex items-center justify-center gap-4 sm:gap-10 my-auto py-4">
        
        <button
          onClick={onPrev}
          className="hidden md:flex p-3 border border-white/10 hover:border-white/20 hover:bg-white/5 rounded-full transition-all text-neutral-400 hover:text-[#d16126] cursor-pointer"
          title="Previous Moment (←)"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Dynamic Portrait Player */}
        <div className="relative w-full max-w-[340px] aspect-[9/16] bg-black rounded-2xl overflow-hidden border border-white/10 shadow-[0_12px_50px_rgba(0,0,0,0.9)] flex flex-col items-center justify-center">
          <video
            key={resolveVideoUrl(card.videoUrl)}
            src={resolveVideoUrl(card.videoUrl) || undefined}
            poster={card.image || undefined}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            crossOrigin="anonymous"
            onError={(e) => {
              const v = e.currentTarget;
              console.error("!!! IMMERSIVE MODAL VIDEO LOAD ERROR !!!", {
                cardId: card.originalAssetId,
                src: v.src,
                code: v.error?.code,
                message: v.error?.message,
                networkState: v.networkState,
                readyState: v.readyState
              });
            }}
            controls
            className="absolute inset-0 w-full h-full object-cover bg-black rounded-2xl"
          />
        </div>

        <button
          onClick={onNext}
          className="hidden md:flex p-3 border border-white/10 hover:border-white/20 hover:bg-white/5 rounded-full transition-all text-neutral-400 hover:text-[#d16126] cursor-pointer"
          title="Next Moment (→)"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* FOOTER METADATA AND PLANNER ACTION */}
      <div className="w-full max-w-[340px] md:max-w-xl mx-auto pb-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-left border-t border-white/5 pt-4">
          <div className="space-y-1 max-w-md">
            <span className="text-[9px] font-mono tracking-wider text-neutral-500 uppercase flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#d16126]" /> {card.eventDate}
            </span>
            <p className="text-[12px] text-neutral-400 leading-relaxed font-sans font-light">
              {card.subtitle}
            </p>
          </div>

          <button
            onClick={() => {
              onPlanClick(card.categoryKey);
              onClose();
            }}
            className="w-full md:w-auto px-6 py-2.5 bg-[#d16126] hover:bg-[#b04a18] text-white text-[9.5px] font-mono uppercase tracking-[0.2em] font-bold rounded-xl transition-all hover:scale-[1.03] active:scale-95 cursor-pointer text-center border border-[#d16126]/20 whitespace-nowrap"
          >
            Inquire For Style
          </button>
        </div>
      </div>

      {/* MOBILE NAVIGATION BAR */}
      <div className="md:hidden flex justify-center gap-6 py-2 border-t border-white/5">
        <button
          onClick={onPrev}
          className="flex items-center gap-1.5 px-4 py-1.5 border border-white/10 rounded-full text-[11px] text-neutral-400 cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" /> Prev
        </button>
        <button
          onClick={onNext}
          className="flex items-center gap-1.5 px-4 py-1.5 border border-[#d16126]/40 rounded-full text-[11px] text-neutral-300 cursor-pointer"
        >
          Next <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}

export async function runDiagnosticsForUrl(id: string, url: string, title: string): Promise<DiagnosticResult> {
  const result: DiagnosticResult = {
    id,
    title,
    videoUrl: url,
    httpStatus: 'Testing...',
    contentType: 'Testing...',
    fileSize: 'Testing...',
    readyState: '0 (HAVE_NOTHING)',
    networkState: 'Testing...',
    errorMsg: 'None',
    videoWidth: 0,
    videoHeight: 0,
    frameExtraction: 'Running...',
    diagnosis: 'Analyzing...'
  };

  if (!url) {
    result.httpStatus = 'N/A';
    result.contentType = 'N/A';
    result.fileSize = 'N/A';
    result.readyState = '0 (HAVE_NOTHING)';
    result.networkState = '4 (NETWORK_NO_SOURCE)';
    result.frameExtraction = 'Failed (Unknown)';
    result.diagnosis = 'Invalid URL: Address is null or blank.';
    return result;
  }

  // 1. Fetch info with partial HTTP range stream limiters
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s threshold
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Range': 'bytes=0-1023' // request first 1KB to save network usage
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    result.httpStatus = String(response.status);
    result.contentType = response.headers.get('content-type') || 'Unknown';
    
    const contentRange = response.headers.get('content-range');
    const contentLength = response.headers.get('content-length');
    if (contentRange) {
      const parts = contentRange.split('/');
      if (parts[1]) {
        const bytes = parseInt(parts[1], 10);
        result.fileSize = `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
      } else {
        result.fileSize = 'Unknown';
      }
    } else if (contentLength) {
      const bytes = parseInt(contentLength, 10);
      result.fileSize = `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    } else {
      result.fileSize = 'Unknown';
    }
  } catch (err: any) {
    if (err.name === 'AbortError') {
      result.httpStatus = 'Timeout';
    } else {
      result.httpStatus = 'Blocked (CORS)';
    }
    result.contentType = 'Unavailable';
    result.fileSize = 'Unavailable';
  }

  // 2. HTMLVideoElement diagnostics
  return new Promise<DiagnosticResult>((resolve) => {
    const video = document.createElement('video');
    video.src = url;
    video.muted = true;
    video.playsInline = true;
    video.setAttribute('crossorigin', 'anonymous');
    
    let resolved = false;
    const cleanupAndResolve = (extractedResult: DiagnosticResult) => {
      if (resolved) return;
      resolved = true;
      video.pause();
      video.src = '';
      video.load();
      resolve(extractedResult);
    };

    // Fail safe timer
    const failSafeTimeout = setTimeout(() => {
      result.readyState = getReadyStateString(video.readyState);
      result.networkState = getNetworkStateString(video.networkState);
      if (video.error) {
        result.errorMsg = video.error.message || `Code: ${video.error.code}`;
      } else if (video.readyState === 0) {
        result.errorMsg = 'Timeout awaiting media metadata load';
      }
      
      result.frameExtraction = 'Failed (Timeout)';
      result.diagnosis = analyzePlaybackIssue(result, video);
      cleanupAndResolve(result);
    }, 8000);

    const getReadyStateString = (state: number): string => {
      switch (state) {
        case 0: return '0 (HAVE_NOTHING)';
        case 1: return '1 (HAVE_METADATA)';
        case 2: return '2 (HAVE_CURRENT_DATA)';
        case 3: return '3 (HAVE_FUTURE_DATA)';
        case 4: return '4 (HAVE_ENOUGH_DATA)';
        default: return `${state} (UNKNOWN)`;
      }
    };

    const getNetworkStateString = (state: number): string => {
      switch (state) {
        case 0: return '0 (NETWORK_EMPTY)';
        case 1: return '1 (NETWORK_IDLE)';
        case 2: return '2 (NETWORK_LOADING)';
        case 3: return '3 (NETWORK_NO_SOURCE)';
        default: return `${state} (UNKNOWN)`;
      }
    };

    const analyzePlaybackIssue = (res: DiagnosticResult, vid: HTMLVideoElement): string => {
      const urlLower = res.videoUrl.toLowerCase();
      
      if (vid.videoWidth === 0 && vid.videoHeight === 0 && vid.readyState > 0) {
        return 'Zero-size Layout issue: Media element does not report any visual dimension layout size.';
      }
      
      if (!res.videoUrl || (!urlLower.startsWith('http://') && !urlLower.startsWith('https://') && !urlLower.startsWith('blob:') && !urlLower.startsWith('/'))) {
        return 'Invalid URL: Address does not represent a valid online URL, relative route, or local blob spec location.';
      }

      if (!urlLower.startsWith('blob:') && !urlLower.endsWith('.mp4') && !urlLower.endsWith('.webm') && !urlLower.includes('.mp4?') && !urlLower.includes('.webm?') && !urlLower.includes('/uploads/')) {
        return 'Incorrect source mapping: video lacks raw .mp4 or .webm suffix inside URL string.';
      }
      
      if (res.httpStatus === '403' || res.httpStatus === '401') {
        return '403/401 permission issue: anonymous web visitors are forbidden access from the bucket host.';
      }

      if (res.httpStatus === '404') {
        return 'Invalid URL: Resource not found (404 status).';
      }

      if (res.httpStatus.includes('CORS') || res.frameExtraction.includes('CORS')) {
        return 'CORS issue: Host blocks canvas image draws, tainted frame extractions are intercepted.';
      }
      
      if (res.contentType !== 'Unavailable' && !res.contentType.startsWith('video/')) {
        return `MIME type issue: Wrong Content-Type fetched ("${res.contentType}"). Expected "video/mp4" formats.`;
      }

      if (vid.error) {
        if (vid.error.code === 4) {
          return 'Video decode failure: Video codec or video data payload can not be decoded.';
        }
        if (vid.error.code === 3) {
          return 'Video decode failure: Stream decryption/decompression issue.';
        }
        if (vid.error.code === 2) {
          return 'Network error: Transfer interrupted.';
        }
        if (vid.error.code === 1) {
          return 'Aborted internally.';
        }
      }

      if (vid.readyState === 0 && res.httpStatus === '200') {
        return 'Autoplay restriction / Waiting buffering load state.';
      }

      if (res.readyState === '0 (HAVE_NOTHING)') {
        return 'Invalid URL or codec unparseable, stalled in blank status.';
      }

      return 'Playback healthy: CORS, metadata, audio/video channels, and rendering channels verified.';
    };

    video.onloadedmetadata = () => {
      result.readyState = getReadyStateString(video.readyState);
      result.networkState = getNetworkStateString(video.networkState);
      result.videoWidth = video.videoWidth;
      result.videoHeight = video.videoHeight;
    };

    video.oncanplay = () => {
      result.readyState = getReadyStateString(video.readyState);
      result.networkState = getNetworkStateString(video.networkState);
      result.videoWidth = video.videoWidth;
      result.videoHeight = video.videoHeight;

      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 300;
        canvas.height = video.videoHeight || 150;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const pixel = ctx.getImageData(0, 0, 1, 1);
          if (pixel) {
            result.frameExtraction = 'Success';
          } else {
            result.frameExtraction = 'Failed (Decode)';
          }
        } else {
          result.frameExtraction = 'Failed (Unknown)';
        }
      } catch (err: any) {
        result.frameExtraction = 'Failed (CORS)';
      }

      result.diagnosis = analyzePlaybackIssue(result, video);
      clearTimeout(failSafeTimeout);
      cleanupAndResolve(result);
    };

    video.onerror = () => {
      result.readyState = getReadyStateString(video.readyState);
      result.networkState = getNetworkStateString(video.networkState);
      if (video.error) {
        result.errorMsg = video.error.message || `Code: ${video.error.code}`;
      } else {
        result.errorMsg = 'General decoding media error';
      }
      result.videoWidth = video.videoWidth;
      result.videoHeight = video.videoHeight;
      result.frameExtraction = 'Failed (Decode)';
      result.diagnosis = analyzePlaybackIssue(result, video);
      clearTimeout(failSafeTimeout);
      cleanupAndResolve(result);
    };

    // Load trigger
    video.load();
  });
}
