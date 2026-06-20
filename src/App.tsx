import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ClipboardList, Sparkles, Phone, Mail, ArrowUp, Instagram } from 'lucide-react';
import { EventType, Inquiry } from './types';

// Importing our high-end modular components
import ExperienceCarousel from './components/ExperienceCarousel';
import ServicesSection from './components/ServicesSection';
import ProcessSection from './components/ProcessSection';
import PortfolioGrid from './components/PortfolioGrid';
import Testimonials from './components/Testimonials';
import FinalConversionSection from './components/FinalConversionSection';
import ConsultationFlow from './components/ConsultationFlow';
import InquiriesDashboard from './components/InquiriesDashboard';
import { CMSProvider, useCMS } from './lib/cmsState';
import AdminCMS from './components/AdminCMS';
import Logo from './components/Logo';
import FlowerPetals from './components/FlowerPetals';
import CinematicPreloader from './components/CinematicPreloader';

export default function App() {
  return (
    <CMSProvider>
      <AppContent />
    </CMSProvider>
  );
}

function AppContent() {
  const { state, setIsCmsOpen, addInquiry } = useCMS();
  const [isLoading, setIsLoading] = useState(true);

  // Consultation panel state
  const [isConsultationOpen, setIsConsultationOpen] = useState(false);
  const [consultationPreselect, setConsultationPreselect] = useState<EventType>('weddings');
  
  // Registration and proposal portal dashboard state
  const [isInquiriesDashboardOpen, setIsInquiriesDashboardOpen] = useState(false);
  
  // Directly submitted inlines from bottom form
  const [inquiryForProposal, setInquiryForProposal] = useState<Inquiry | null>(null);

  // Trigger opening consultation flow from anywhere
  const handleOpenConsultation = (category?: EventType) => {
    if (category) {
      setConsultationPreselect(category);
    }
    // ensure inline overrides are cleared unless intentionally set
    setInquiryForProposal(null);
    setIsConsultationOpen(true);
  };

  // Direct submission from the inline form on the page
  const handleInlineSubmission = (data: {
    eventType: EventType;
    date: string;
    budgetRange: string;
    message: string;
    fullName: string;
    email: string;
  }) => {
    // Generate inquiry structure
    const chosenProposal = getPreloadedConcept(data.eventType);
    
    const newInquiry: Inquiry = {
      id: `inq-${Date.now()}`,
      eventType: data.eventType,
      fullName: data.fullName,
      email: data.email,
      phone: '',
      date: data.date || 'Autumn Solstice 2026',
      guestCount: '75 Guests',
      budgetRange: data.budgetRange || 'Premium Tier ($50K+)',
      message: data.message || 'We desire a deeply atmospheric celebration.',
      submittedAt: new Date().toLocaleDateString(),
      status: 'Proposal Ready',
      proposalConcept: {
        themeName: chosenProposal.themeName,
        description: chosenProposal.description,
        palette: chosenProposal.palette,
        venueVibe: chosenProposal.venueVibe,
        decorNote: chosenProposal.decorNote
      }
    };

    // Save to local storage and CMS registry
    addInquiry(newInquiry);

    // Prefill inquiry for presentation
    setInquiryForProposal(newInquiry);
    setConsultationPreselect(data.eventType);
    
    // Open panel (since inquiryForProposal is set, consultation drawer will slide open showing their proposal!)
    setIsConsultationOpen(true);
  };

  // Selection from inquiries dashboard
  const handleSelectInquiryFromDashboard = (inquiry: Inquiry) => {
    setInquiryForProposal(inquiry);
    setConsultationPreselect(inquiry.eventType);
    setIsInquiriesDashboardOpen(false); // swap panels
    setIsConsultationOpen(true);
  };

  // Navigation scroll helper
  const scrollToServices = () => {
    const el = document.getElementById('services-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  // Preloaded concept retriever
  const getPreloadedConcept = (type: EventType) => {
    const CONCEPTS = {
      weddings: {
        themeName: 'Sophisticated Elegance',
        palette: ['Champagne', 'Antique Gold', 'Blush Rose', 'Warm Cream'],
        description: 'A beautifully coordinated wedding focusing on precise schedules, elegant seating layouts, and flawless vendor management.',
        venueVibe: 'Premium hotel ballroom, lush manicured garden, or high-glass greenhouse in Abuja.',
        decorNote: 'Warm candlelit long tables, soft floral accents, and custom hand-lettered guest cards.'
      },
      corporate: {
        themeName: 'Precision & Impact',
        palette: ['Executive Slate', 'Corporate Blue', 'Silver Accent', 'Pure White'],
        description: 'A high-profile corporate launch or summit managed with elite technical logistics and meticulous timing schedules.',
        venueVibe: 'Modern convention center, executive pavilion, or upscale auditorium in Maitama.',
        decorNote: 'Floating stage elements, high-definition digital podiums, and professional lounge layouts.'
      },
      birthdays: {
        themeName: 'Bespoke Celebration',
        palette: ['Deep Burgundy', 'Warm Amber', 'Polished Brass', 'Ivory'],
        description: 'An elegant personal milestone dinner designed with detailed coordination, live music cues, and customized menus.',
        venueVibe: 'Private club lounge, boutique garden courtyard, or high-end dining parlour.',
        decorNote: 'Draped velvet panel accent walls, beautiful table flower installations, and warm ambient spotlighting.'
      },
      galas: {
        themeName: 'Grand Distinction',
        palette: ['Polished Gold', 'Imperial Charcoal', 'Sterling Silver', 'Emerald Accent'],
        description: 'A sovereign charity benefit managed with delicate seating plans, high patron check-in, and budget reconciliation.',
        venueVibe: 'Prestigious grand ballroom, embassy hall, or classic banquet atrium.',
        decorNote: 'Classic table runner accents, donor graphic milestones, and elegant background string music setups.'
      },
      custom: {
        themeName: 'Tailored Framework',
        palette: ['Deep Amethyst', 'Atomic Teal', 'Muted Lavender', 'Nirvana Coal'],
        description: 'A custom consultative event outline complete with supplier matching, planning checklist models, and budget calculations.',
        venueVibe: 'Selected based on custom requirements and planning recommendations.',
        decorNote: 'Curated according to bespoke aesthetic plans and spatial coordinate diagrams.'
      }
    };
    return CONCEPTS[type];
  };

  // Sort and filter visible navigation routes
  const visibleNavSections = [...(state.navigationItems || [])]
    .filter(item => item.visible)
    .sort((a,b) => a.order - b.order);

  const currentBgColor = (state.themeConfig?.bgColor === '#12100e' || state.themeConfig?.bgColor === '#12100E' || !state.themeConfig?.bgColor) ? '#faf8f5' : state.themeConfig.bgColor;
  const currentTextColor = (state.themeConfig?.textColor === '#eae6df' || !state.themeConfig?.textColor) ? '#1e1a16' : state.themeConfig.textColor;
  const currentAccentColor = (state.themeConfig?.accentColor === '#df9827' || !state.themeConfig?.accentColor) ? '#d16126' : state.themeConfig.accentColor;

  return (
    <div className="min-h-screen bg-[#faf8f5] text-[#1e1a16] font-sans relative flex flex-col justify-between" style={{ backgroundColor: currentBgColor, color: currentTextColor }}>
      
      {/* Cinematic preloader covers the screen on initial startup while asset models/concepts load */}
      {isLoading && (
        <CinematicPreloader onComplete={() => setIsLoading(false)} />
      )}

      {/* Ambient drifting flower petals decoration all over the background */}
      <FlowerPetals />

      {/* High-end luxury crumpled paper texture overlay */}
      <div 
        id="crumpled-paper-overlay"
        className="fixed inset-0 pointer-events-none select-none z-[35] opacity-[0.07] mix-blend-multiply"
        style={{ 
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100%25' height='100%25'%3E%3Cfilter id='crumpled'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.015' numOctaves='4' result='noise'/%3E%3CfeDiffuseLighting in='noise' lighting-color='%23ffffff' surfaceScale='2.5'%3E%3CfeDistantLight azimuth='45' elevation='60'/%3E%3C/feDiffuseLighting%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23crumpled)'/%3E%3C/svg%3E")`,
          backgroundSize: '1000px 1000px',
          backgroundRepeat: 'repeat'
        }}
      />

      {/* Dynamic Theme overrides */}
      <style dangerouslySetInnerHTML={{ __html: `
        :root {
          --brand-gold: ${currentAccentColor};
          --font-serif: "${state.themeConfig?.fontDisplay && state.themeConfig.fontDisplay !== 'Playfair Display' ? state.themeConfig.fontDisplay : 'Cormorant Garamond'}", Georgia, serif;
          --font-mono: "${state.themeConfig?.fontMono || 'JetBrains Mono'}", monospace;
        }

        .font-serif {
          font-family: var(--font-serif) !important;
        }
        .font-mono {
          font-family: var(--font-mono) !important;
        }
        .text-brand-gold {
          color: var(--brand-gold) !important;
        }
        .bg-brand-gold {
          background-color: var(--brand-gold) !important;
        }
        .border-brand-gold {
          border-color: var(--brand-gold) !important;
        }
        button, .rounded-3xl, .rounded-2xl {
          border-radius: ${
            state.themeConfig?.buttonStyle === 'pill' ? '9999px' : 
            state.themeConfig?.buttonStyle === 'rounded-xl' ? '12px' : 
            state.themeConfig?.buttonStyle === 'vintage' ? '0px' : '24px'
          } !important;
        }
      `}} />

      {/* Render navigation modules in sequence based on sorted weight orders */}
      {visibleNavSections.map((item) => {
        // Render wrappers with high-end, premium responsive scroll staging entrance animations
        const animationProps = {
          initial: { opacity: 0, y: 20 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true, margin: "-80px" },
          transition: { duration: 1.0, ease: [0.16, 1, 0.3, 1] }
        };

        switch (item.sectionId) {
          case 'hero-section':
          case 'carousel-section':
            return (
              <motion.div key={item.id} {...animationProps} transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}>
                <ExperienceCarousel 
                  onPlanClick={handleOpenConsultation}
                  onScrollDownClick={scrollToServices}
                />
              </motion.div>
            );
          case 'services-section':
            return (
              <motion.div key={item.id} {...animationProps}>
                <ServicesSection onPlanClick={handleOpenConsultation} />
              </motion.div>
            );
          case 'process-section':
            return (
              <motion.div key={item.id} {...animationProps}>
                <ProcessSection />
              </motion.div>
            );
          case 'portfolio-section':
            return (
              <motion.div key={item.id} {...animationProps}>
                <PortfolioGrid />
              </motion.div>
            );
          case 'testimonials-section':
            return (
              <motion.div key={item.id} {...animationProps}>
                <Testimonials />
              </motion.div>
            );
          case 'contact-section':
          case 'conversion-section':
            return (
              <motion.div key={item.id} {...animationProps}>
                <FinalConversionSection 
                  onPlanClick={handleOpenConsultation}
                  onPlanSubmitDirect={handleInlineSubmission}
                />
              </motion.div>
            );
          default:
            return null;
        }
      })}

      {/* PREMIUM SIGNATURE FOOTER */}
      <footer className="bg-[#ede9df] text-[#1a1613] border-t border-black/5 py-16 px-6 lg:px-8 relative overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8 relative z-10">
          {/* Trademark block */}
          <div className="space-y-2 text-center md:text-left">
            <Logo size={46} variant="combined" textColor="text-[#1a1613]" />
            <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest leading-relaxed pt-2">
              © 2026 KBJ EVENTS PLANNING & COORDINATION LTD. <br />
              CERTIFIED EVENT PROFESSIONALS. ALL RIGHTS RESERVED.
              <span 
                className="cursor-pointer hover:text-brand-gold ml-2 text-neutral-400 font-bold tracking-widest transition-all duration-300 select-all"
                onClick={() => setIsCmsOpen(true)}
              >
                [STUDIO PORTAL]
              </span>
            </p>
          </div>

          {/* Social connections block */}
          <div className="flex items-center space-x-6 text-neutral-500">
            <a 
              href="https://www.instagram.com/kbj_events?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="hover:text-[#d16126] transition-colors duration-300" 
              aria-label="Instagram"
            >
              <Instagram className="w-4 h-4" />
            </a>
            <a href="#mail" className="hover:text-brand-gold transition-colors duration-300" aria-label="Email">
              <Mail className="w-4 h-4" />
            </a>
            <a href="#phone" className="hover:text-brand-gold transition-colors duration-300" aria-label="Phone">
              <Phone className="w-4 h-4" />
            </a>
            
            {/* Scroll back up trigger */}
            <button 
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="w-8 h-8 rounded-full bg-white border border-black/10 flex items-center justify-center hover:bg-[#d16126] hover:text-white hover:border-[#d16126] transition-all duration-300 cursor-pointer text-neutral-800 animate-fade-in"
              title="Return to peak"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Settled Romantic Petals Layer */}
        {state.themeConfig?.floralEnabled !== false && (
          <div className="absolute inset-x-0 bottom-0 h-10 pointer-events-none select-none overflow-visible">
            {/* Organic Cluster 1 (Left corner) */}
            <svg className="absolute bottom-0 left-[6%]" width="16" height="16" viewBox="0 0 24 24">
              <path d="M12,4 C18,2 24,6 20,16 C17,21 11,24 10,24 C9,24 3,21 0,16 C-4,6 6,2 12,4 Z" fill={
                state.themeConfig?.floralFlowerStyle === 'cherry-blossom' ? 'rgba(255, 185, 200, 0.7)' :
                state.themeConfig?.floralFlowerStyle === 'gold-champagne' ? 'rgba(226, 194, 134, 0.7)' :
                state.themeConfig?.floralFlowerStyle === 'ivory-white' ? 'rgba(250, 240, 230, 0.75)' :
                'rgba(245, 195, 194, 0.75)'
              } transform="rotate(35 12 12)" />
            </svg>
            <svg className="absolute bottom-[2px] left-[7%] opacity-80" width="11" height="11" viewBox="0 0 24 24">
              <path d="M10,2 C16,0 20,4 20,10 C20,16 14,20 10,20 C6,20 0,16 0,10 C0,4 4,2 10,2 Z" fill={
                state.themeConfig?.floralFlowerStyle === 'cherry-blossom' ? 'rgba(255, 230, 235, 0.75)' :
                state.themeConfig?.floralFlowerStyle === 'gold-champagne' ? 'rgba(245, 225, 195, 0.7)' :
                state.themeConfig?.floralFlowerStyle === 'ivory-white' ? 'rgba(255, 255, 248, 0.8)' :
                'rgba(255, 218, 224, 0.7)'
              } transform="rotate(-15 10 10)" />
            </svg>
            <svg className="absolute bottom-0 left-[5.2%] opacity-60" width="13" height="13" viewBox="0 0 24 24">
              <path d="M6,2 C12,-1 18,3 18,10 C18,17 12,22 9,22 C6,22 0,17 0,10 C0,3 0,5 6,2 Z" fill={
                state.themeConfig?.floralFlowerStyle === 'cherry-blossom' ? 'rgba(255, 185, 200, 0.65)' :
                state.themeConfig?.floralFlowerStyle === 'gold-champagne' ? 'rgba(226, 194, 134, 0.6)' :
                state.themeConfig?.floralFlowerStyle === 'ivory-white' ? 'rgba(245, 225, 228, 0.7)' :
                'rgba(240, 185, 172, 0.65)'
              } transform="rotate(85 9 11)" />
            </svg>

            {/* Organic Cluster 2 (Mid-Left) */}
            <svg className="absolute bottom-[-1px] left-[24%]" width="14" height="14" viewBox="0 0 24 24">
              <path d="M12,4 C18,2 24,6 20,16 C17,21 11,24 10,24 C9,24 3,21 0,16 C-4,6 6,2 12,4 Z" fill={
                state.themeConfig?.floralFlowerStyle === 'cherry-blossom' ? 'rgba(255, 185, 200, 0.7)' :
                state.themeConfig?.floralFlowerStyle === 'gold-champagne' ? 'rgba(226, 194, 134, 0.7)' :
                state.themeConfig?.floralFlowerStyle === 'ivory-white' ? 'rgba(250, 240, 230, 0.75)' :
                'rgba(245, 195, 194, 0.75)'
              } transform="rotate(-40 12 12)" />
            </svg>
            <svg className="absolute bottom-[1px] left-[25.2%] opacity-90" width="10" height="10" viewBox="0 0 24 24">
              <path d="M10,2 C16,0 20,4 20,10 C20,16 14,20 10,20 C6,20 0,16 0,10 C0,4 4,2 10,2 Z" fill={
                state.themeConfig?.floralFlowerStyle === 'cherry-blossom' ? 'rgba(255, 230, 235, 0.8)' :
                state.themeConfig?.floralFlowerStyle === 'gold-champagne' ? 'rgba(245, 225, 195, 0.7)' :
                state.themeConfig?.floralFlowerStyle === 'ivory-white' ? 'rgba(255, 255, 248, 0.85)' :
                'rgba(253, 244, 227, 0.65)'
              } transform="rotate(20 10 10)" />
            </svg>

            {/* Organic Cluster 3 (Center area) */}
            <svg className="absolute bottom-[2px] left-[52%] opacity-80" width="12" height="12" viewBox="0 0 24 24">
              <path d="M6,2 C12,-1 18,3 18,10 C18,17 12,22 9,22 C6,22 0,17 0,10 C0,3 0,5 6,2 Z" fill={
                state.themeConfig?.floralFlowerStyle === 'cherry-blossom' ? 'rgba(255, 185, 200, 0.7)' :
                state.themeConfig?.floralFlowerStyle === 'gold-champagne' ? 'rgba(226, 194, 134, 0.65)' :
                state.themeConfig?.floralFlowerStyle === 'ivory-white' ? 'rgba(245, 225, 228, 0.75)' :
                'rgba(245, 195, 194, 0.75)'
              } transform="rotate(110 9 11)" />
            </svg>
            <svg className="absolute bottom-[0px] left-[53.2%] opacity-70" width="15" height="15" viewBox="0 0 24 24">
              <path d="M10,2 C16,0 20,4 20,10 C20,16 14,20 10,20 C6,20 0,16 0,10 C0,4 4,2 10,2 Z" fill={
                state.themeConfig?.floralFlowerStyle === 'cherry-blossom' ? 'rgba(255, 230, 235, 0.75)' :
                state.themeConfig?.floralFlowerStyle === 'gold-champagne' ? 'rgba(253, 244, 227, 0.8)' :
                state.themeConfig?.floralFlowerStyle === 'ivory-white' ? 'rgba(255, 255, 248, 0.85)' :
                'rgba(255, 218, 224, 0.7)'
              } transform="rotate(45 10 10)" />
            </svg>

            {/* Organic Cluster 4 (Mid-Right) */}
            <svg className="absolute bottom-0 left-[76%] opacity-90" width="14" height="14" viewBox="0 0 24 24">
              <path d="M12,4 C18,2 24,6 20,16 C17,21 11,24 10,24 C9,24 3,21 0,16 C-4,6 6,2 12,4 Z" fill={
                state.themeConfig?.floralFlowerStyle === 'cherry-blossom' ? 'rgba(255, 185, 200, 0.75)' :
                state.themeConfig?.floralFlowerStyle === 'gold-champagne' ? 'rgba(226, 194, 134, 0.7)' :
                state.themeConfig?.floralFlowerStyle === 'ivory-white' ? 'rgba(250, 240, 230, 0.8)' :
                'rgba(245, 195, 194, 0.75)'
              } transform="rotate(-60 12 12)" />
            </svg>
            <svg className="absolute bottom-[2px] left-[77.2%] opacity-70" width="11" height="11" viewBox="0 0 24 24">
              <path d="M6,2 C12,-1 18,3 18,10 C18,17 12,22 9,22 C6,22 0,17 0,10 C0,3 0,5 6,2 Z" fill={
                state.themeConfig?.floralFlowerStyle === 'cherry-blossom' ? 'rgba(255, 230, 235, 0.8)' :
                state.themeConfig?.floralFlowerStyle === 'gold-champagne' ? 'rgba(245, 225, 195, 0.65)' :
                state.themeConfig?.floralFlowerStyle === 'ivory-white' ? 'rgba(255, 250, 240, 0.85)' :
                'rgba(240, 185, 172, 0.65)'
              } transform="rotate(15 9 11)" />
            </svg>

            {/* Organic Cluster 5 (Right corner) */}
            <svg className="absolute bottom-0 left-[91%] opacity-90" width="13" height="13" viewBox="0 0 24 24">
              <path d="M10,2 C16,0 20,4 20,10 C20,16 14,20 10,20 C6,20 0,16 0,10 C0,4 4,2 10,2 Z" fill={
                state.themeConfig?.floralFlowerStyle === 'cherry-blossom' ? 'rgba(255, 185, 200, 0.75)' :
                state.themeConfig?.floralFlowerStyle === 'gold-champagne' ? 'rgba(226, 194, 134, 0.7)' :
                state.themeConfig?.floralFlowerStyle === 'ivory-white' ? 'rgba(250, 240, 230, 0.8)' :
                'rgba(245, 195, 194, 0.75)'
              } transform="rotate(-115 10 10)" />
            </svg>
            <svg className="absolute bottom-[1px] left-[91.8%] opacity-75" width="15" height="15" viewBox="0 0 24 24">
              <path d="M12,4 C18,2 24,6 20,16 C17,21 11,24 10,24 C9,24 3,21 0,16 C-4,6 6,2 12,4 Z" fill={
                state.themeConfig?.floralFlowerStyle === 'cherry-blossom' ? 'rgba(255, 230, 235, 0.8)' :
                state.themeConfig?.floralFlowerStyle === 'gold-champagne' ? 'rgba(253, 244, 227, 0.75)' :
                state.themeConfig?.floralFlowerStyle === 'ivory-white' ? 'rgba(255, 255, 248, 0.85)' :
                'rgba(255, 218, 224, 0.7)'
              } transform="rotate(75 12 12)" />
            </svg>
          </div>
        )}
      </footer>



      {/* 8. SLIDEOUT CONSULTATION DRAWER */}
      <ConsultationFlow 
        isOpen={isConsultationOpen}
        onClose={() => setIsConsultationOpen(false)}
        preselectedCategory={consultationPreselect}
        onInquirySubmitted={(inq) => {
          setInquiryForProposal(inq);
          addInquiry(inq);
        }}
      />

      {/* 9. MODAL CLIENT INQUIRIES & PROPOSALS INDEX PORTAL */}
      <InquiriesDashboard 
        isOpen={isInquiriesDashboardOpen}
        onClose={() => setIsInquiriesDashboardOpen(false)}
        onSelectInquiry={handleSelectInquiryFromDashboard}
      />

      {/* 10. STUDIO CMS CONTROL CENTER */}
      <AdminCMS />
    </div>
  );
}
