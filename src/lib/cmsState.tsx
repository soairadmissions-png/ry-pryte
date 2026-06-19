import React, { createContext, useContext, useState, useEffect } from 'react';
import { EventType, EventCategory, ServiceDetail, ProcessStep, CaseStudy, ClientStory, Inquiry } from '../types';
import { getLiveVideoUrl } from './videoDb';
import { isSupabaseConfigured } from './supabaseClient';

/**
 * Simulates a secure upload to S3 / Cloud Storage / CDN bucket.
 * Conducts validations to ensure only safe video files are processed.
 * Ensures the returned URL is a validated absolute HTTPS URL.
 */
export async function uploadVideo(file: Blob | File): Promise<string> {
  if (!file) {
    throw new Error("Upload failed: No file payload provided.");
  }

  // Validate file type
  const mimeType = file.type || '';
  const name = (file as File).name || 'cinematic-event-video.mp4';
  const extension = name.split('.').pop()?.toLowerCase();
  
  const isVideoType = mimeType.startsWith('video/') || ['mp4', 'webm', 'mov', 'avi', 'mkv'].includes(extension || '');
  if (!isVideoType) {
    console.error("[UPLOAD VALIDATION ERROR] Rejected file: Not a persistent-safe video MIME/extension", { mimeType, name });
    throw new Error("Rejected: The file must be a valid video format (.mp4, .webm).");
  }

  // Validate size (limit to 10GB to support cinematic feature files and long events)
  const maxSize = 10 * 1024 * 1024 * 1024; // 10GB
  if (file.size > maxSize) {
    console.error("[UPLOAD VALIDATION ERROR] File exceeds maximum size limit (10GB):", file.size);
    throw new Error(`Rejected: Video file size exceeds the 10GB limit.`);
  }

  // Determine current host and scheme
  const host = typeof window !== 'undefined' ? window.location.origin : 'https://ais-dev-nqxryyrmpctqsgtb3y7wqy-811669566186.europe-west2.run.app';
  
  console.info(`[LOCAL MEDIA PIPELINE] Initiating upload process to kbl.db for video: "${name}" (${file.size} bytes)`);

  // Split into chunks to bypass Google frontend / Cloud Run 32MB single HTTP request body limits
  try {
    const CHUNK_SIZE = 15 * 1024 * 1024; // Use safe 15MB chunks (well under 32M limit)
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    const uploadId = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
    let uploadUrl = "";

    console.info(`[LOCAL MEDIA PIPELINE] Chunk size: 15MB. All chunks count: ${totalChunks}. Handshake ID: "${uploadId}"`);

    for (let i = 0; i < totalChunks; i++) {
      const start = i * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, file.size);
      const chunk = file.slice(start, end);

      console.info(`[LOCAL MEDIA PIPELINE] Transmitting chunk ${i + 1}/${totalChunks} (range: ${start}-${end} bytes)...`);

      const response = await fetch('/api/upload-chunk', {
        method: "POST",
        headers: {
          "X-Upload-Id": uploadId,
          "X-File-Name": name,
          "X-Chunk-Index": String(i),
          "X-Chunk-Total": String(totalChunks),
          "Content-Type": "application/octet-stream"
        },
        body: chunk
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Chunk ${i + 1}/${totalChunks} rejected by server: ${errorText || response.statusText}`);
      }

      const data = await response.json();
      if (data.completed && data.videoUrl) {
        uploadUrl = data.videoUrl;
      }
    }

    if (!uploadUrl) {
      throw new Error("Local persistence server did not return a completed video URL.");
    }

    // Ensure absolute path with HTTPS
    if (uploadUrl.startsWith('/')) {
      uploadUrl = `${host}${uploadUrl}`;
    }
    
    // Upgrade to https:// for production grade local static domain mapping
    if (uploadUrl.startsWith('http://') && host.startsWith('https://')) {
      uploadUrl = uploadUrl.replace('http://', 'https://');
    }

    console.info("=== LOCAL PERSISTENCE STORAGE SUCCESS ===");
    console.info(`Original File Name : ${name}`);
    console.info(`Security Checks     : Verified (MIME: ${mimeType}, Size: ${file.size} bytes)`);
    console.info(`Final Validated URL : ${uploadUrl}`);
    console.info("=========================================");

    return uploadUrl;
  } catch (err: any) {
    console.error("[UPLOAD REJECTION]: Chunked API upload pipeline failed:", err);
    throw new Error(`Failed to upload to local persistence storage: ${err.message || err}`);
  }
}

// Let's define the expanded types that form our CMS
export interface TeamMember {
  id: string;
  name: string;
  role: string;
  bio: string;
  portrait: string;
  socialLinks: {
    email?: string;
    linkedin?: string;
  };
}

export interface MediaAsset {
  id: string;
  title: string;
  videoUrl: string;
  description?: string;
  category?: string;
  featured?: boolean;
  badgeLabel?: string;
  eventDate?: string;
  displayOrder?: number;
  posterImage?: string;
  status?: 'Active' | 'Hidden';
  processStage?: 'Vision' | 'Blueprint' | 'Build' | 'Moment' | 'Legacy';
}

export interface NavigationItem {
  id: string;
  name: string;
  sectionId: string;
  visible: boolean;
  order: number;
}

export interface SEOConfig {
  pageTitle: string;
  metaDescription: string;
  ogImage: string;
  socialShareContent: string;
}

export interface ThemeConfig {
  primaryColor: string; // Tailwind bg or hex
  accentColor: string;  // Hex for accents
  bgColor: string;      // Page bg
  textColor: string;    // Main text
  buttonStyle: 'pill' | 'vintage' | 'minimal' | 'rounded-xl';
  fontDisplay: 'Playfair Display' | 'Space Grotesk' | 'Outfit' | 'Inter' | 'Cormorant Garamond' | string;
  fontMono: 'JetBrains Mono' | 'Fira Code' | 'Courier New' | string;
  processEyebrow?: string;
  processTitle?: string;
  processDescription?: string;
  servicesEyebrow?: string;
  servicesTitle?: string;
  servicesDescription?: string;
  floralEnabled?: boolean;
  floralDensity?: 'low' | 'medium' | 'high';
  floralSpeed?: 'slow' | 'medium' | 'fast';
  floralFlowerStyle?: 'blush-rose' | 'cherry-blossom' | 'gold-champagne' | 'ivory-white';
  floralBranchVisible?: boolean;
}

export interface HeroConfig {
  line1: string;
  line2: string;
  extra: string;
  headline: string;
  subheadline: string;
  videoUrl?: string;
  imageUrl?: string;
  hoverType: 'parallax' | 'lens-zoom' | 'kinetic-drift';
}

export interface CMSState {
  eventCategories: EventCategory[];
  heroTexts: Record<EventType, { line1: string; line2: string; extra: string }>;
  heroConfig: HeroConfig;
  services: ServiceDetail[];
  processSteps: ProcessStep[];
  portfolioProjects: CaseStudy[];
  clientStories: ClientStory[];
  teamMembers: TeamMember[];
  inquiries: Inquiry[];
  navigationItems: NavigationItem[];
  themeConfig: ThemeConfig;
  seoConfig: SEOConfig;
  mediaAssets: MediaAsset[];
}

export type CMSRole = 'super-admin' | 'admin' | 'content-manager' | 'media-manager';
export type CMSMode = 'draft' | 'preview' | 'publish';

interface CMSContextType {
  state: CMSState;
  draftState: CMSState;
  publishedState: CMSState;
  isCmsOpen: boolean;
  setIsCmsOpen: (open: boolean) => void;
  cmsMode: CMSMode;
  setCmsMode: (mode: CMSMode) => void;
  currentRole: CMSRole;
  setCurrentRole: (role: CMSRole) => void;
  
  // Actions
  updateHeroConfig: (config: Partial<HeroConfig>) => void;
  updateHeroText: (type: EventType, texts: Partial<{ line1: string; line2: string; extra: string }>) => void;
  updateCategory: (id: string, updates: Partial<EventCategory>) => void;
  addCategory: (category: EventCategory) => void;
  deleteCategory: (id: string) => void;
  reorderCategories: (categories: EventCategory[]) => void;
  
  // Services
  addService: (service: Omit<ServiceDetail, 'id'>) => void;
  updateService: (id: string, updates: Partial<ServiceDetail>) => void;
  deleteService: (id: string) => void;
  reorderServices: (services: ServiceDetail[]) => void;
  
  // Portfolio
  addProject: (project: Omit<CaseStudy, 'id'>) => void;
  updateProject: (id: string, updates: Partial<CaseStudy>) => void;
  deleteProject: (id: string) => void;
  reorderProjects: (projects: CaseStudy[]) => void;
  
  // Gallery
  addMediaAsset: (asset: Omit<MediaAsset, 'id'>) => void;
  updateMediaAsset: (id: string, updates: Partial<MediaAsset>) => void;
  deleteMediaAsset: (id: string) => void;
  
  // Testimonials
  addTestimonial: (story: ClientStory) => void;
  updateTestimonial: (index: number, updates: Partial<ClientStory>) => void;
  deleteTestimonial: (index: number) => void;
  
  // Team
  addTeamMember: (member: Omit<TeamMember, 'id'>) => void;
  updateTeamMember: (id: string, updates: Partial<TeamMember>) => void;
  deleteTeamMember: (id: string) => void;
  
  // Inquiries Room
  addInquiry: (inquiry: Inquiry) => void;
  updateInquiryStatus: (id: string, status: Inquiry['status'] | 'New' | 'Contacted' | 'Proposal Sent' | 'Confirmed' | 'Completed') => void;
  saveInquiryProposal: (id: string, proposal: NonNullable<Inquiry['proposalConcept']>) => void;
  
  // Navigation & Sections
  updateNavigationItem: (id: string, updates: Partial<NavigationItem>) => void;
  reorderNavigationItems: (items: NavigationItem[]) => void;
  
  // Process steps
  addProcessStep: (step: Omit<ProcessStep, 'number'>) => void;
  updateProcessStep: (index: number, updates: Partial<ProcessStep>) => void;
  deleteProcessStep: (index: number) => void;
  reorderProcessSteps: (steps: ProcessStep[]) => void;
  
  // Theme & SEO
  updateTheme: (updates: Partial<ThemeConfig>) => void;
  updateSEO: (updates: Partial<SEOConfig>) => void;
  
  // Global Publishing Controls
  publishDraft: () => void;
  resetToDefaults: () => void;
  
  // Local Video Resolver
  resolveVideoUrl: (url: string | undefined) => string;
  // Secure Simulated S3/Cloud Storage uploader
  uploadVideo: (file: Blob | File) => Promise<string>;
}

// Global baseline default data
const DEFAULT_HERO_TEXTS: Record<EventType, { line1: string; line2: string; extra: string }> = {
  weddings: {
    line1: "Sophisticated Elegance",
    line2: "for Modern Weddings.",
    extra: "Complete custom planning and seamless timeline coordination in Abuja."
  },
  corporate: {
    line1: "Precision & Impact",
    line2: "for Corporate Events.",
    extra: "Detailed logistical planning, VIP protocols, and flawless on-site AV execution."
  },
  birthdays: {
    line1: "Bespoke Celebration",
    line2: "of Private Milestones.",
    extra: "Beautiful table styling, guest timelines, and live entertainment coordination."
  },
  galas: {
    line1: "Grand Distinction",
    line2: "for Custom Dinners.",
    extra: "Flawless red-carpet management, detailed seating strategies, and budget planning."
  },
  custom: {
    line1: "Expert Consultation",
    line2: "and Planning Guidance.",
    extra: "Structured checklist timelines, supplier matching maps, and professional blueprints."
  }
};

const DEFAULT_EVENT_CATEGORIES: EventCategory[] = [
  {
    id: 'weddings',
    title: 'Wedding',
    subtext: 'Complete planner coordination and custom event design.',
    tagline: 'EVENT PLANNING & MANAGEMENT',
    image: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=800',
    accentColor: 'text-[#D4AF37] border-[#D4AF37]',
    bgOverlay: 'bg-black/30',
    textColor: '#D4AF37',
    description: 'From intimate ceremonies to grand celebrations, we design wedding experiences that reflect your story, style, and vision. Every detail is thoughtfully curated to create a seamless and unforgettable day for you and your guests.'
  },
  {
    id: 'corporate',
    title: 'Corporate Events',
    subtext: 'Seamless corporate logistics and flawless agenda execution.',
    tagline: 'CORPORATE PLANNING & LOGISTICS',
    image: 'https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=800',
    accentColor: 'text-[#8EA8C3] border-[#8EA8C3]',
    bgOverlay: 'bg-black/30',
    textColor: '#8EA8C3',
    visible: false
  },
  {
    id: 'birthdays',
    title: 'Private Celebration',
    subtext: 'Elegantly managed private celebrations.',
    tagline: 'PRIVATE EVENT COORDINATION',
    image: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?q=80&w=800',
    accentColor: 'text-[#D81159] border-[#D81159]',
    bgOverlay: 'bg-black/35',
    textColor: '#D81159',
    description: 'We craft private celebrations that feel deeply personal, beautifully styled, and effortlessly executed. From intimate gatherings to exclusive moments shared with close friends and family, every detail is designed to reflect your personality and create lasting memories in an atmosphere that feels truly yours.'
  },
  {
    id: 'galas',
    title: 'Gala & Luxury Diners',
    subtext: 'Premium fundraisers and award dinners managed end-to-end.',
    tagline: 'EXECUTIVE EVENT COORDINATION',
    image: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=800',
    accentColor: 'text-[#E5A93C] border-[#E5A93C]',
    bgOverlay: 'bg-black/40',
    textColor: '#E5A93C',
    description: 'We design gala experiences and luxury dinners that combine elegance, atmosphere, and precision. From refined table settings to immersive lighting and seamless service flow, every element is curated to create a sophisticated evening where guests feel both inspired and completely immersed in the moment.'
  },
  {
    id: 'custom',
    title: 'Expert Consultations',
    subtext: 'Structured consultations, checklists, and vendor matching.',
    tagline: 'EVENT PLANNERS CONSULTATION',
    image: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?q=80&w=800',
    accentColor: 'text-[#7B2CBF] border-[#7B2CBF]',
    bgOverlay: 'bg-black/30',
    textColor: '#7B2CBF',
    description: 'We offer expert consultations that turn ideas into clear, actionable event concepts. Whether you\'re starting from a rough vision or refining final details, we guide you with strategic insight, creative direction, and practical planning to ensure every decision leads toward a cohesive and impactful experience.'
  }
];

const DEFAULT_SERVICES: ServiceDetail[] = [
  {
    id: 'wedding-planning',
    title: 'Wedding Planning',
    headline: 'Complete end-to-end planning with flawless timeline coordination.',
    description: 'We design, source, and execute premium weddings, managing every vendor and detail so you can enjoy your day stress-free.',
    longDescription: 'Our wedding planning service in Abuja provides comprehensive support from initial concept design to final onsite coordination. We manage budgeting, vendor selection, timeline curation, and aesthetic styling. We partner with top-tier decor specialists, elite caterers, and live musicians to deliver clean, elegant celebrations tailored to your personal taste.',
    image: 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=800',
    category: 'weddings',
    offerings: [
      'Comprehensive Venue & Vendor Contracting',
      'Detail-Oriented Timeline & Floor Plan Curation',
      'Onsite Coordination & Ceremony Management',
      'Aesthetic Consulting & Palette Guidance'
    ]
  },
  {
    id: 'corporate-events',
    title: 'Corporate Events',
    headline: 'Precision-driven logistics and professional execution.',
    description: 'Elevate your corporate brand with seamless annual general meetings, product launches, and professional summits.',
    longDescription: 'Corporate events depend on absolute reliability, pristine timing, and professional setups. We manage technical staging, guest RSVP coordination, high-end seating layouts, and audiovisual integration. Our experienced coordination team works behind the scenes to assure that your program runs precisely script-to-script.',
    image: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?q=80&w=800',
    category: 'corporate',
    offerings: [
      'Full-Scale Audiovisual Technical Support',
      'Seating Layouts & High-Profile Guest RSVP Flow',
      'Sponsor & Speaker Liaison Coordination',
      'Detailed Budget Reconciliation & Master Schedule'
    ]
  },
  {
    id: 'private-celebrations',
    title: 'Private Celebrations',
    headline: 'Elegantly organized anniversaries, birthdays, and banquets.',
    description: 'Celebrate life’s major moments with organized, high-end coordination that leaves a lasting professional impression.',
    longDescription: 'From landmark anniversaries to select birthday dinners, we provide full-service planning or partial onsite coordination. We handle invitations, menu selection, tabletop designs, sound setups, and scheduling flow. We focus on organizing every element thoroughly so you and your guests enjoy an elegant, relaxed celebration.',
    image: 'https://images.unsplash.com/photo-1504196606672-aef5c9cefc92?q=80&w=800',
    category: 'birthdays',
    offerings: [
      'Custom Decor Sourcing & Place Styling',
      'Bespoke Catering & Menu Alignment Guidance',
      'Entertainment Scheduling & Hospitality Liaison',
      'Onsite Event Execution & Guest Management'
    ]
  },
  {
    id: 'luxury-custom',
    title: 'Expert Consultation',
    headline: 'Actionable plan blueprints, budget models, and expert advice.',
    description: 'Our consultation service provides professional blueprints, vendor matching, and coordination advice for self-managed events.',
    longDescription: 'For clients who choose to self-manage their execution but require expert guidance from a certified Abuja planner. We review your plans, build structured budgets, design master timelines, and recommend vetted vendors. You leave with a flawless, professional blueprint ready for successful execution.',
    image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=800',
    category: 'custom',
    offerings: [
      'Master Timeline & Checklist Auditing',
      'Vetted Vendor Introductions & Matches',
      'Budget Modeling & Contingency Planning',
      'Aesthetic Curation & Design Direction Brief'
    ]
  }
];

const DEFAULT_PROCESS_STEPS: ProcessStep[] = [
  {
    number: '01',
    title: 'Discovery',
    narrative: 'Architectural consultation, deep vision mapping, and aesthetic briefing.',
    details: 'Every masterwork begins with a singular intent. We sit together to dissect your values, visual culture aspirations, and programmatic desires, formulating a tailored creative mandate before a single draft is drawn.',
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
];const DEFAULT_PORTFOLIO: CaseStudy[] = [
  {
    id: 'aurora-estate',
    title: 'Waterfront Wedding Coordinator',
    client: 'The Aurora Union',
    category: 'weddings',
    location: 'Abuja Gardens, Nigeria',
    summary: 'A flawless, full-service wedding utilizing custom seating layouts, precise timeline routing, and premium onsite styling completed for 200 guests.',
    story: 'The clients requested a beautiful garden wedding that combined local cultural traditions with modern, clean styling. They required comprehensive planning and complete day-of coordination to ensure guests from across the country felt cared for.',
    goals: 'Track and organize over 15 distinct suppliers, design a reliable wet-weather contingency plan, and establish elegant seating plans that prioritized high guest flow.',
    transformation: 'We selected a premium garden venue in Abuja, coordinated a master timeline across three days, and engineered custom floral arch structures. We managed vendor deliverables to ensure the entire itinerary ran precisely to the minute, culminating in a beautiful candlelit dinner.',
    testimonial: {
      quote: "Their organization and endless attention to detail made our wedding completely stress-free. Gathering managed the timelines flawlessly, allowing us to focus entirely on celebrating.",
      author: "Dr. Alexandra V.",
      role: "The Bride"
    },
    image: 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=800',
    gallery: [
      'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=800',
      'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=800'
    ]
  },
  {
    id: 'luminary-summit',
    title: 'Executive Corporate Launch',
    client: 'Vapor Tech Corp',
    category: 'corporate',
    location: 'Transcorp Hilton, Abuja',
    summary: 'A highly coordinated commercial launch with complex audiovisual staging, seating plans, and detailed VIP agenda flow.',
    story: 'For their product launch, Vapor Tech required a professional planner capable of transforming standard halls into highly reliable interactive arenas with high-tech audio and staging.',
    goals: 'Arrange frictionless RSVP processing for 300 business leaders, coordinate complex staging logistics, and facilitate strict time-controlled agendas.',
    transformation: 'We designed a comprehensive 3D seating strategy, executed setup testing across 24 hours, and coordinated executive hospitality lounges. We handled strict speaker timing, sound systems, and projection grids with precision.',
    testimonial: {
      quote: "A masterclass in professional corporate planning. The schedule was managed with military-grade precision, and our partners were thoroughly impressed with their expertise.",
      author: "Engr. Hidetoshi S.",
      role: "VP of Operations"
    },
    image: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?q=80&w=800',
    gallery: [
      'https://images.unsplash.com/photo-1515187029135-18ee286d815b?q=80&w=800',
      'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=800'
    ]
  },
  {
    id: 'soiree-velours',
    title: 'Bespoke Anniversary Banquet',
    client: 'The Dubois Family',
    category: 'birthdays',
    location: 'Maitama District, Abuja',
    summary: 'A beautiful, premium milestone dinner managed with detailed coordination, live performance schedules, and exquisite menu styling.',
    story: 'The client wanted a theatrical, elegant birthday dinner to mark her milestone anniversary. She requested a reliable team to plan entertainment schedules, specialty drapes, and high-end catering.',
    goals: 'Execute an intricate 5-course catering service, manage complex live swing band setup schedules, and curate upscale entrance drapes.',
    transformation: 'We transformed a private Abuja club with crimson drapes and gold accents, designed a synchronized catering schedule, and coordinated performance cues. The entire evening was managed to perfection, with zero timing lag.',
    testimonial: {
      quote: "This team handles coordination with exceptional taste. They were extremely communicative throughout the planning, taking care of every single piece of logistics.",
      author: "Mrs. Sasha Dubois-Hall",
      role: "Guest of Honor"
    },
    image: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?q=80&w=800',
    gallery: [
      'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?q=80&w=800',
      'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=800'
    ]
  },
  {
    id: 'gilded-gala',
    title: 'Annual Charity Fundraiser',
    client: 'The Sovereign Arts Endowment',
    category: 'galas',
    location: 'Ladi Kwali Hall, Abuja',
    summary: 'A formal black-tie benefit gala with delicate seating structures, gold lighting installations, and intensive budget tracking.',
    story: 'A distinguished arts group required an annual gala to attract premier donors. They needed professional logistics to handle security, high-end decor, and delicate fundraising displays.',
    goals: 'Maximize seating efficiency for 500 patrons, integrate advanced lighting setups, and control budget parameters carefully.',
    transformation: 'We engineered a clean reflective gallery entrance and coordinated live classical performers. Our coordinators managed the fundraising schedule, timing food courses to correspond with giving moments, helping them clear their donor targets easily.',
    testimonial: {
      quote: "Their coordination skill is unmatched. The logistics ran beautifully, the venue was gorgeous, and we exceeded our funding targets thanks to their structural planning.",
      author: "Eleanor Sinclair",
      role: "Chairperson, Arts Endowment"
    },
    image: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=800',
    gallery: [
      'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=800',
      'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?q=80&w=800'
    ]
  },
  {
    id: 'kinetic-fabric',
    title: 'Premium Brand Showcase',
    client: 'Aether Collective',
    category: 'custom',
    location: 'Grand Square Auditorium, Abuja',
    summary: 'An elegant, bespoke private exhibition planned with meticulous material sourcing, projection routing, and security protocols.',
    story: 'A group of designers wanted a private showcase for high-net-worth curators. They required strict access control, customized drapery setups, and high-class hospitality services.',
    goals: 'Fabricate suspended textile structures securely, manage guest entrance invitations, and coordinate VIP soundscapes.',
    transformation: 'We calculated structural hanging stress loads, styled the galleries with minimalist custom teakwood, and hired executive security details. The showcase was highly successful, delivering full compliance and safe execution.',
    testimonial: {
      quote: "They took a complex visual concept and managed the entire process with complete professionalism, clear communication, and impeccable outcome execution.",
      author: "Julian Thorne",
      role: "Principal Organizer"
    },
    image: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?q=80&w=800',
    gallery: [
      'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?q=80&w=800',
      'https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=800'
    ]
  }
];

const DEFAULT_CLIENT_STORIES: ClientStory[] = [
  {
    quote: "Their organization and endless attention to detail made our wedding completely stress-free. KBJ Events managed the timelines flawlessly, bringing our dream celebration to life.",
    author: "Amara & Chidi Nwosu",
    role: "Luxe Traditional Wedding",
    eventDate: "December 2025",
    category: "weddings",
    image: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&q=80&w=300&h=300'
  },
  {
    quote: "A masterclass in professional event planning. Every detail of our annual charity gala was managed with absolute reliability, strict budget discipline, and incredible premium taste.",
    author: "Hajia Aisha Dantata",
    role: "Sovereign Endowment Chair",
    eventDate: "October 2025",
    category: "galas",
    image: 'https://images.unsplash.com/photo-1529968605615-1882bc2b415a?auto=format&fit=crop&q=80&w=300&h=300'
  },
  {
    quote: "They took a complex corporate technological theme and organized our high-level summit with absolute operational precision. Their hospitality protocol was world-class.",
    author: "Engr. Babatunde Bashir",
    role: "Infrastructure Director",
    eventDate: "February 2026",
    category: "corporate",
    image: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=crop&q=80&w=300&h=300'
  },
  {
    quote: "Our 50th birthday dinner celebration was phenomenal. The scenic setup, exquisite catering coordination, and soft live instrumentation created an unforgettable ambiance.",
    author: "Chief Okey Ndubuisi",
    role: "Private Milestone Jubilee",
    eventDate: "January 2026",
    category: "birthdays",
    image: 'https://images.unsplash.com/photo-1607990283143-e81e7a2c93ab?auto=format&fit=crop&q=80&w=300&h=300'
  },
  {
    quote: "KBJ Events delivers unparalleled logistical planning. Their bespoke supplier matchmaking model saved us weeks of vetting and gave us complete security.",
    author: "Tari Ogunleye",
    role: "Bespoke Cultural Curator",
    eventDate: "September 2025",
    category: "custom",
    image: 'https://images.unsplash.com/photo-1512484776495-a09d92e87c3b?auto=format&fit=crop&q=80&w=300&h=300'
  },
  {
    quote: "The team coordinated our elegant outdoor reception beautifully. From security protocols to guest check-in grids, everything was executed seamlessly.",
    author: "Olumide Johnson",
    role: "Maitama Garden Wedding",
    eventDate: "November 2025",
    category: "weddings",
    image: 'https://images.unsplash.com/photo-1522529599102-193c0d76b5b6?auto=format&fit=crop&q=80&w=300&h=300'
  },
  {
    quote: "Their budget reconciliation models and coordination schedules are flawless. The Embassy dinner was structured gracefully under tight timelines.",
    author: "Senator Ibrahim Usman",
    role: "Diplomatic Affairs Coordinator",
    eventDate: "August 2025",
    category: "galas",
    image: 'https://images.unsplash.com/photo-1523464862212-d6631d073194?auto=format&fit=crop&q=80&w=300&h=300'
  },
  {
    quote: "KBJ brought absolute magic to our brand launch. The immersive lighting grids, digital podium overlays, and media coordination were exceptional.",
    author: "Fatima Aliyu",
    role: "Aesthetic Brand Director",
    eventDate: "March 2026",
    category: "corporate",
    image: 'https://images.unsplash.com/photo-1589156191108-c762ff4b96ab?auto=format&fit=crop&q=80&w=300&h=300'
  },
  {
    quote: "Planning a monumental multi-day event is intimidating, but their structured session checklists and dedicated support made the process incredibly enjoyable.",
    author: "Dr. Yusuf Musa",
    role: "Strategic Board Lead",
    eventDate: "May 2025",
    category: "custom",
    image: 'https://images.unsplash.com/photo-1530268729831-4b0b9e170218?auto=format&fit=crop&q=80&w=300&h=300'
  },
  {
    quote: "Unmatched professionalism and exquisite taste. Our anniversary banquet felt incredibly intimate, warm, and structured perfectly.",
    author: "Ngozi Ezekiel",
    role: "Anniversary Banquet Host",
    eventDate: "June 2025",
    category: "birthdays",
    image: 'https://images.unsplash.com/photo-1540331547168-8b63109225b7?auto=format&fit=crop&q=80&w=300&h=300'
  },
  {
    quote: "Every vendor they recommended was outstanding. KBJ Events handled all the contracts and floor plan designs to let us focus fully on our guests.",
    author: "Kelechi Orji",
    role: "Wuse II Ballroom Wedding",
    eventDate: "October 2025",
    category: "weddings",
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300&h=300'
  },
  {
    quote: "Their logistical mastery is legendary. Over 500 VIP delegates checked in seamlessly, with full real-time coordination of staging and schedules.",
    author: "Dr. Evelyn Adebayo",
    role: "Summit Organizer",
    eventDate: "January 2026",
    category: "corporate",
    image: 'https://images.unsplash.com/photo-1614283233556-f35b0c801ef1?auto=format&fit=crop&q=80&w=300&h=300'
  },
  {
    quote: "We wanted a luxurious cultural banquet that felt both modern and authentic. KBJ Events customized every corner with total dedication.",
    author: "Efenire Cole",
    role: "Heritage Gala Committee",
    eventDate: "April 2026",
    category: "galas",
    image: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&q=80&w=300&h=300'
  },
  {
    quote: "A truly remarkable coordination model. The team is calm, exceptionally polite, organized, and delivers beautiful event blueprints.",
    author: "Mrs. Florence Nduka",
    role: "Bespoke Family Trustee",
    eventDate: "February 2026",
    category: "birthdays",
    image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=300&h=300'
  },
  {
    quote: "They developed an incredible spatial diagram and suppliers plan for our multi-city launches. Dynamic, professional, and reliable in any situation.",
    author: "Kunle Adeyemi",
    role: "Creative Enterprise Director",
    eventDate: "November 2025",
    category: "custom",
    image: 'https://images.unsplash.com/photo-1531384441138-2736e62e0919?auto=format&fit=crop&q=80&w=300&h=300'
  },
  {
    quote: "From the spectacular champagne visual scheme to the sound systems, everything was pure perfection. Our guests are still talking about it.",
    author: "Yejide Benson",
    role: "Luxe Bridal Client",
    eventDate: "March 2026",
    category: "weddings",
    image: 'https://images.unsplash.com/photo-1618151313441-bc79b11e5090?auto=format&fit=crop&q=80&w=300&h=300'
  },
  {
    quote: "Our global launch required complex, multi-language translation feeds and immediate stage execution. KBJ was outstanding under pressure.",
    author: "Olusegun Alao",
    role: "Global Ops VP",
    eventDate: "July 2025",
    category: "corporate",
    image: 'https://images.unsplash.com/photo-1506277886164-e25aa3f4ef7f?auto=format&fit=crop&q=80&w=300&h=300'
  },
  {
    quote: "The visual curation they deliver is unmatched. They elevate simple table designs into highly artistic spatial masterpieces.",
    author: "Simi Sowemimo",
    role: "Private Banquet Hostess",
    eventDate: "December 2025",
    category: "birthdays",
    image: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&q=80&w=300&h=300'
  },
  {
    quote: "An executive gathering of sovereign patrons requires absolute tact and flawless scheduling. KBJ planners excel in high-protocol environments.",
    author: "Senator Ibrahim Garba",
    role: "Patrons Assembly Secretary",
    eventDate: "May 2026",
    category: "galas",
    image: 'https://images.unsplash.com/photo-1507152832244-10d45a7e355d?auto=format&fit=crop&q=80&w=300&h=300'
  },
  {
    quote: "We were looking for planning consultation that integrated robust risk modeling and budget buffers. KBJ set us up for massive success.",
    author: "Zainab Bello",
    role: "Operations Risk Lead",
    eventDate: "April 2026",
    category: "custom",
    image: 'https://images.unsplash.com/photo-1614644147724-2d4785d69962?auto=format&fit=crop&q=80&w=300&h=300'
  }
];

const DEFAULT_TEAM: TeamMember[] = [
  {
    id: 'vivienne',
    name: 'Vivienne Thorne',
    role: 'Lead Planner & Coordinator',
    bio: 'Certified event planner with over twelve years of experience, Vivienne leads the coordination and logistical planning team at Gather.',
    portrait: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=500',
    socialLinks: { email: 'v.thorne@gather.com', linkedin: 'vivienne-thorne' }
  },
  {
    id: 'marcel',
    name: 'Marcel Sterling',
    role: 'Hospitality & Logistics Manager',
    bio: 'With a background in premium hospitality and supply chain management, Marcel coordinates all supplier contracting, budgets, and scheduling.',
    portrait: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=500',
    socialLinks: { email: 'm.sterling@gather.com' }
  },
  {
    id: 'clara',
    name: 'Clara Delacroix',
    role: 'Guest Experience Coordinator',
    bio: 'Specializing in hospitality management and registration systems, Clara oversees seating layouts and on-day guest relations.',
    portrait: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=500',
    socialLinks: { email: 'c.delacroix@gather.com', linkedin: 'clara-delacroix' }
  }
];

const DEFAULT_NAVIGATION: NavigationItem[] = [
  { id: 'carousel', name: 'Home', sectionId: 'carousel-section', visible: true, order: 1 },
  { id: 'services', name: 'Our Services', sectionId: 'services-section', visible: true, order: 2 },
  { id: 'process', name: 'Our Process', sectionId: 'process-section', visible: true, order: 3 },
  { id: 'portfolio', name: 'Case Studies', sectionId: 'portfolio-section', visible: true, order: 4 },
  { id: 'testimonials', name: 'Reviews', sectionId: 'testimonials-section', visible: true, order: 5 },
  { id: 'team', name: 'Our Team', sectionId: 'team-section', visible: false, order: 6 },
  { id: 'conversion', name: 'Contact Planners', sectionId: 'conversion-section', visible: true, order: 7 }
];

const DEFAULT_THEME: ThemeConfig = {
  primaryColor: '#1d1814',
  accentColor: '#d16126',
  bgColor: '#faf8f5',
  textColor: '#1e1a16',
  buttonStyle: 'rounded-xl',
  fontDisplay: 'Cormorant Garamond',
  fontMono: 'JetBrains Mono',
  processEyebrow: 'HOW WE WORK',
  processTitle: 'How We Bring Events To Life',
  processDescription: 'From the first conversation to the final applause, every detail is carefully designed, planned, and executed to create unforgettable experiences.',
  servicesEyebrow: 'OUR SERVICES',
  servicesTitle: 'What We Offer',
  servicesDescription: 'From intimate celebrations to large-scale productions, we transform ideas into thoughtfully curated experiences designed around your vision, audience, and occasion.',
  floralEnabled: true,
  floralDensity: 'medium',
  floralSpeed: 'medium',
  floralFlowerStyle: 'blush-rose',
  floralBranchVisible: true,
};

const DEFAULT_SEO: SEOConfig = {
  pageTitle: 'Gather | Certified Event Planners in Abuja',
  metaDescription: 'Certified event planning, coordination, and consultation agency in Abuja. Handling weddings, corporate launches, and private dinners with flawless execution.',
  ogImage: '/src/assets/images/gather_wedding_1781527313337.jpg',
  socialShareContent: 'Bespoke budgets, master timelines, and total logistical reliability. Plan your next milestone with Gather.'
};

export const heroMediaCollection: MediaAsset[] = [];

const DEFAULT_MEDIA_ASSETS: MediaAsset[] = [
  {
    id: 'media-val-1',
    title: 'The Sovereign Wedding Gala',
    videoUrl: 'https://player.vimeo.com/external/482276569.sd.mp4?s=d394b95880df967a552e1bc600bebc21c172a6b2&profile_id=165&oauth2_token_id=57447761',
    description: 'An extraordinary luxury wedding planned and executed with premium drapes, customized seating, and full timeline management.',
    category: 'weddings',
    featured: true,
    badgeLabel: 'SOVEREIGN WEDDING',
    eventDate: 'JUNE 2026',
    displayOrder: 1,
    posterImage: '/src/assets/images/gather_wedding_1781527313337.jpg',
    status: 'Active',
    processStage: 'Moment'
  },
  {
    id: 'media-val-2',
    title: 'Precision Corporate Summit',
    videoUrl: 'https://player.vimeo.com/external/371433846.sd.mp4?s=236da2f3c0543f33b00696afb8bc5e5ee6de2b78&profile_id=165&oauth2_token_id=57447761',
    description: 'A high-stakes trade delegation summit coordinated at Transcorp Hilton, with complex technical projections and schedule scripts.',
    category: 'corporate',
    featured: true,
    badgeLabel: 'PRECISION SUMMIT',
    eventDate: 'AUG 2026',
    displayOrder: 2,
    posterImage: '/src/assets/images/gather_corporate_1781527328223.jpg',
    status: 'Active',
    processStage: 'Blueprint'
  },
  {
    id: 'media-val-3',
    title: 'Bespoke Milestone Anniversary',
    videoUrl: 'https://player.vimeo.com/external/482276569.sd.mp4?s=d394b95880df967a552e1bc600bebc21c172a6b2&profile_id=165&oauth2_token_id=57447761',
    description: 'A deeply atmospheric private celebration curated in Maitama, utilizing warm spotlighting and beautifully synchronized menus.',
    category: 'birthdays',
    featured: true,
    badgeLabel: 'BESPOKE MILESTONE',
    eventDate: 'OCT 2026',
    displayOrder: 3,
    posterImage: '/src/assets/images/gather_birthday_1781527344179.jpg',
    status: 'Active',
    processStage: 'Build'
  },
  {
    id: 'media-val-4',
    title: 'Grand Charity Gala Dinner',
    videoUrl: 'https://player.vimeo.com/external/517614687.sd.mp4?s=2d2ec3da6f43e0618ff07a8fc2728df41ef3f409&profile_id=165&oauth2_token_id=57447761',
    description: 'An elite black-tie gala dinner with strict donor seating layouts, amber glowing chandeliers, and classical ensembles.',
    category: 'galas',
    featured: true,
    badgeLabel: 'GRAND GALA',
    eventDate: 'NOV 2026',
    displayOrder: 4,
    posterImage: '/src/assets/images/gather_gala_1781527359084.jpg',
    status: 'Active',
    processStage: 'Legacy'
  },
  {
    id: 'media-val-5',
    title: 'Exclusive Brand Showcase',
    videoUrl: 'https://player.vimeo.com/external/482065306.sd.mp4?s=bf02543e33fc402a77c449c4fddcd25dfdb55f84&profile_id=165&oauth2_token_id=57447761',
    description: 'A custom, tailored blueprint showcase matching designers, premium suppliers, and curated spatial diagrams.',
    category: 'custom',
    featured: true,
    badgeLabel: 'EXCLUSIVITY SHOWCASE',
    eventDate: 'DEC 2026',
    displayOrder: 5,
    posterImage: '/src/assets/images/gather_custom_1781527375668.jpg',
    status: 'Active',
    processStage: 'Vision'
  }
];

const DEFAULT_INQUIRIES: Inquiry[] = [];

const INITIAL_STATE: CMSState = {
  eventCategories: DEFAULT_EVENT_CATEGORIES,
  heroTexts: DEFAULT_HERO_TEXTS,
  heroConfig: {
    line1: "Certified Event Planning",
    line2: "and Flawless Onsite Coordination.",
    extra: "Based in Abuja, we orchestrate seamless high-end weddings, corporate summits, and private milestones with absolute precision.",
    headline: "KBJ EVENTS",
    subheadline: "EST. 2023",
    hoverType: 'parallax'
  },
  services: DEFAULT_SERVICES,
  processSteps: DEFAULT_PROCESS_STEPS,
  portfolioProjects: DEFAULT_PORTFOLIO,
  clientStories: DEFAULT_CLIENT_STORIES,
  teamMembers: DEFAULT_TEAM,
  inquiries: DEFAULT_INQUIRIES,
  navigationItems: DEFAULT_NAVIGATION,
  themeConfig: DEFAULT_THEME,
  seoConfig: DEFAULT_SEO,
  mediaAssets: DEFAULT_MEDIA_ASSETS
};

const CMSContext = createContext<CMSContextType | null>(null);

const sanitizeState = (s: CMSState): CMSState => {
  if (!s || !s.mediaAssets) return s;
  return {
    ...s,
    mediaAssets: s.mediaAssets.filter(asset => {
      if (!asset.videoUrl) return false;
      const lower = asset.videoUrl.trim().toLowerCase();
      if (lower.startsWith('blob:') || lower.startsWith('local-video:')) {
        console.warn("Sanitizer filtered out temporary reference from state asset registry:", asset.videoUrl);
        return false;
      }
      return true;
    })
  };
};

export const CMSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [draftState, setDraftState] = useState<CMSState>(INITIAL_STATE);
  const [publishedState, setPublishedState] = useState<CMSState>(INITIAL_STATE);
  
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', handleLocationChange);
    
    const originalPushState = window.history.pushState;
    window.history.pushState = function(...args: any[]) {
      originalPushState.apply(this, args as any);
      handleLocationChange();
    };

    const originalReplaceState = window.history.replaceState;
    window.history.replaceState = function(...args: any[]) {
      originalReplaceState.apply(this, args as any);
      handleLocationChange();
    };

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
    };
  }, []);

  const isCmsOpen = currentPath === '/admin';
  const setIsCmsOpen = (open: boolean) => {
    if (open) {
      window.history.pushState({}, '', '/admin');
    } else {
      window.history.pushState({}, '', '/');
    }
  };
  const [cmsMode, setCmsMode] = useState<CMSMode>('draft');
  const [currentRole, setCurrentRole] = useState<CMSRole>('super-admin');

  const [liveVideoUrls, setLiveVideoUrls] = useState<Record<string, string>>({});
  const resolvingUrlsRef = React.useRef<Set<string>>(new Set());

  // Resolve local videos from IndexedDB
  useEffect(() => {
    let isMounted = true;
    const urlsToResolve = new Set<string>();

    const scanState = (s: CMSState) => {
      s.mediaAssets.forEach(asset => {
        if (asset.videoUrl?.startsWith('local-video://')) urlsToResolve.add(asset.videoUrl);
      });
    };

    scanState(draftState);
    scanState(publishedState);

    const resolveAll = async () => {
      let changed = false;
      const resolvedMap: Record<string, string> = {};

      for (const url of urlsToResolve) {
        try {
          const liveUrl = await getLiveVideoUrl(url);
          if (liveUrl) {
            resolvedMap[url] = liveUrl;
            changed = true;
          }
        } catch (e) {
          console.error("Error resolving video url", url, e);
        }
      }

      if (changed && isMounted) {
        setLiveVideoUrls(prev => ({
          ...prev,
          ...resolvedMap
        }));
      }
    };

    if (urlsToResolve.size > 0) {
      resolveAll();
    }

    return () => {
      isMounted = false;
    };
  }, [draftState, publishedState]);

  const resolveVideoUrl = (url: any): string => {
    if (url === undefined || url === null) {
      console.warn("Rejected video asset URL: URL is null or undefined");
      return '';
    }
    if (typeof url !== 'string') {
      console.warn("Rejected video asset URL: Expected a string URL, got: ", typeof url, url);
      return '';
    }
    let cleanUrl = url.trim();
    if (cleanUrl.startsWith('blob:')) {
      console.warn("Rejected video asset URL: Blob URLs (temporary object URLs) are forbidden in state: ", cleanUrl);
      return '';
    }
    if (cleanUrl.startsWith('local-video:')) {
      console.warn("Rejected video asset URL: Local IndexedDB references are forbidden: ", cleanUrl);
      return '';
    }
    
    // Auto-rewrite localhost/loopback hosts to remote host origin if the current active hostname is not localhost
    if (window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
      if (cleanUrl.match(/^https?:\/\/localhost:\d+/i)) {
        const pathSuffix = cleanUrl.replace(/^https?:\/\/localhost:\d+/i, "");
        const originalUrl = cleanUrl;
        cleanUrl = `${window.location.origin}${pathSuffix}`;
        console.info("[VIDEO RESOLVER RECOVERY] Remapped localhost loopback resource URL: ", originalUrl, " -> ", cleanUrl);
      } else if (cleanUrl.match(/^https?:\/\/127.0.0.1:\d+/i)) {
        const pathSuffix = cleanUrl.replace(/^https?:\/\/127.0.0.1:\d+/i, "");
        const originalUrl = cleanUrl;
        cleanUrl = `${window.location.origin}${pathSuffix}`;
        console.info("[VIDEO RESOLVER RECOVERY] Remapped 127.0.0.1 loopback resource URL: ", originalUrl, " -> ", cleanUrl);
      }
    }

    // Normalize relative paths if they start with "/"
    if (cleanUrl.startsWith('/')) {
      const absoluteUrl = `${window.location.origin}${cleanUrl}`;
      console.log("Normalized relative video URL to absolute: ", cleanUrl, " -> ", absoluteUrl);
      return absoluteUrl;
    }

    if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) {
      return cleanUrl;
    }

    console.warn("Rejected video asset URL: Must start with http:// or https://: ", cleanUrl);
    return '';
  };

  // Load from Storage
  useEffect(() => {
    async function initCMSData() {
      const localDraft = localStorage.getItem('gather_cms_draft');
      const localPublished = localStorage.getItem('gather_cms_published');
      
      // Also ingest the pre-existing inquiries from inquiries dashboard
      const localInquiriesStr = localStorage.getItem('gatherInquiries');
      const systemInquiries = localInquiriesStr ? JSON.parse(localInquiriesStr) : [];
      
      let loadedDraft = INITIAL_STATE;
      let loadedPublished = INITIAL_STATE;

      // Optionally pull from Supabase if configured
      let supabaseDraft: CMSState | null = null;
      let supabasePublished: CMSState | null = null;
      let supabaseInquiries: Inquiry[] | null = null;

      if (isSupabaseConfigured) {
        try {
          const { loadCMSStateFromSupabase, loadInquiriesFromSupabase } = await import('./supabaseClient');
          supabaseDraft = await loadCMSStateFromSupabase('draft');
          supabasePublished = await loadCMSStateFromSupabase('published');
          supabaseInquiries = await loadInquiriesFromSupabase();
          console.info('[SUPABASE CONNECTED]: Restored website configurations from Supabase Cloud Database.');
        } catch (err) {
          console.warn('[SUPABASE LOADING FAILURE - FALLBACK ACTIVATED]:', err);
        }
      }
      
      if (supabaseDraft) {
        loadedDraft = supabaseDraft;
      } else if (localDraft) {
        try {
          loadedDraft = JSON.parse(localDraft);
          if (loadedDraft.themeConfig && (loadedDraft.themeConfig.bgColor === '#fbfaf7' || loadedDraft.themeConfig.bgColor === '#eee9de')) {
            loadedDraft.themeConfig.bgColor = '#12100e';
            loadedDraft.themeConfig.textColor = '#eae6df';
            loadedDraft.themeConfig.primaryColor = '#fbfaf7';
          }
          if (!loadedDraft.mediaAssets || loadedDraft.mediaAssets.length === 0) {
            loadedDraft.mediaAssets = DEFAULT_MEDIA_ASSETS;
          } else {
            DEFAULT_MEDIA_ASSETS.forEach(defAsset => {
              const exists = loadedDraft.mediaAssets.some((m: any) => m.id === defAsset.id || m.videoUrl === defAsset.videoUrl);
              if (!exists) {
                loadedDraft.mediaAssets.push(defAsset);
              }
            });
            loadedDraft.mediaAssets.sort((a: any, b: any) => (a.displayOrder || 0) - (b.displayOrder || 0));
          }
        } catch (e) {
          console.error("Failed loading draft CMS state", e);
        }
      } else {
        loadedDraft.mediaAssets = DEFAULT_MEDIA_ASSETS;
      }
      
      if (supabasePublished) {
        loadedPublished = supabasePublished;
      } else if (localPublished) {
        try {
          loadedPublished = JSON.parse(localPublished);
          if (loadedPublished.themeConfig && (loadedPublished.themeConfig.bgColor === '#fbfaf7' || loadedPublished.themeConfig.bgColor === '#eee9de')) {
            loadedPublished.themeConfig.bgColor = '#12100e';
            loadedPublished.themeConfig.textColor = '#eae6df';
            loadedPublished.themeConfig.primaryColor = '#fbfaf7';
          }
          if (!loadedPublished.mediaAssets || loadedPublished.mediaAssets.length === 0) {
            loadedPublished.mediaAssets = DEFAULT_MEDIA_ASSETS;
          } else {
            DEFAULT_MEDIA_ASSETS.forEach(defAsset => {
              const exists = loadedPublished.mediaAssets.some((m: any) => m.id === defAsset.id || m.videoUrl === defAsset.videoUrl);
              if (!exists) {
                loadedPublished.mediaAssets.push(defAsset);
              }
            });
            loadedPublished.mediaAssets.sort((a: any, b: any) => (a.displayOrder || 0) - (b.displayOrder || 0));
          }
        } catch (e) {
          console.error("Failed loading published CMS state", e);
        }
      } else if (localDraft) {
        try {
          loadedPublished = JSON.parse(localDraft);
          if (loadedPublished.themeConfig && (loadedPublished.themeConfig.bgColor === '#fbfaf7' || loadedPublished.themeConfig.bgColor === '#eee9de')) {
            loadedPublished.themeConfig.bgColor = '#12100e';
            loadedPublished.themeConfig.textColor = '#eae6df';
            loadedPublished.themeConfig.primaryColor = '#fbfaf7';
          }
          if (!loadedPublished.mediaAssets || loadedPublished.mediaAssets.length === 0) {
            loadedPublished.mediaAssets = DEFAULT_MEDIA_ASSETS;
          } else {
            DEFAULT_MEDIA_ASSETS.forEach(defAsset => {
              const exists = loadedPublished.mediaAssets.some((m: any) => m.id === defAsset.id || m.videoUrl === defAsset.videoUrl);
              if (!exists) {
                loadedPublished.mediaAssets.push(defAsset);
              }
            });
            loadedPublished.mediaAssets.sort((a: any, b: any) => (a.displayOrder || 0) - (b.displayOrder || 0));
          }
        } catch (e) {
          console.error("Failed loading copied draft state", e);
        }
      } else {
        loadedPublished.mediaAssets = DEFAULT_MEDIA_ASSETS;
      }
  
      // Blend standard inquiries registered on this machine or Supabase
      const mergedInquiries = supabaseInquiries || (systemInquiries && systemInquiries.length > 0 ? systemInquiries : []);
      if (mergedInquiries && mergedInquiries.length > 0) {
        // populate both
        loadedDraft = { ...loadedDraft, inquiries: mergedInquiries };
        loadedPublished = { ...loadedPublished, inquiries: mergedInquiries };
      }
  
      // Ensure all pre-existing storage is completely stripped of any non-persistent database reference URLs
      const sanitizedDraft = sanitizeState(loadedDraft);
      const sanitizedPublished = sanitizeState(loadedPublished);
      setDraftState(sanitizedDraft);
      setPublishedState(sanitizedPublished);
    }

    initCMSData();
  }, []);
  
  // Save drafts locally
  const saveDraft = (newState: CMSState) => {
    const sanitized = sanitizeState(newState);
    setDraftState(sanitized);
    localStorage.setItem('gather_cms_draft', JSON.stringify(sanitized));

    if (isSupabaseConfigured) {
      import('./supabaseClient').then(({ syncCMSStateToSupabase, syncInquiryToSupabase, syncMediaAssetToSupabase }) => {
        syncCMSStateToSupabase('draft', sanitized);
        // Sync assets & inquiries individually so the tables stay updated
        sanitized.mediaAssets?.forEach(asset => {
          syncMediaAssetToSupabase(asset);
        });
        sanitized.inquiries?.forEach(inq => {
          syncInquiryToSupabase(inq);
        });
      }).catch(err => {
        console.error('[SUPABASE SAVE SYNC ERROR]:', err);
      });
    }
  };

  // Synchronize Inquiries back to standard gatherInquiries key so existing modals don't break
  const syncInquiriesToCoreStorage = (inquiries: Inquiry[]) => {
    localStorage.setItem('gatherInquiries', JSON.stringify(inquiries));
  };

  // Actions
  const updateHeroConfig = (config: Partial<HeroConfig>) => {
    saveDraft({
      ...draftState,
      heroConfig: { ...draftState.heroConfig, ...config }
    });
  };

  const updateHeroText = (type: EventType, texts: Partial<{ line1: string; line2: string; extra: string }>) => {
    const updatedHeroTexts = { ...draftState.heroTexts };
    updatedHeroTexts[type] = { ...updatedHeroTexts[type], ...texts };
    saveDraft({
      ...draftState,
      heroTexts: updatedHeroTexts
    });
  };

  const updateCategory = (id: string, updates: Partial<EventCategory>) => {
    const updatedCategories = draftState.eventCategories.map(cat => 
      cat.id === id ? { ...cat, ...updates } : cat
    );
    saveDraft({
      ...draftState,
      eventCategories: updatedCategories
    });
  };

  const addCategory = (category: EventCategory) => {
    saveDraft({
      ...draftState,
      eventCategories: [...draftState.eventCategories, category]
    });
  };

  const deleteCategory = (id: string) => {
    saveDraft({
      ...draftState,
      eventCategories: draftState.eventCategories.filter(cat => cat.id !== id)
    });
  };

  const reorderCategories = (categories: EventCategory[]) => {
    saveDraft({
      ...draftState,
      eventCategories: categories
    });
  };

  // Services actions
  const addService = (service: Omit<ServiceDetail, 'id'>) => {
    const newService: ServiceDetail = {
      ...service,
      id: `service-${Date.now()}`
    };
    saveDraft({
      ...draftState,
      services: [...draftState.services, newService]
    });
  };

  const updateService = (id: string, updates: Partial<ServiceDetail>) => {
    const updated = draftState.services.map(srv => 
      srv.id === id ? { ...srv, ...updates } : srv
    );
    saveDraft({
      ...draftState,
      services: updated
    });
  };

  const deleteService = (id: string) => {
    saveDraft({
      ...draftState,
      services: draftState.services.filter(srv => srv.id !== id)
    });
  };

  const reorderServices = (services: ServiceDetail[]) => {
    saveDraft({
      ...draftState,
      services
    });
  };

  // Portfolio actions
  const addProject = (project: Omit<CaseStudy, 'id'>) => {
    const newProject: CaseStudy = {
      ...project,
      id: `project-${Date.now()}`
    };
    saveDraft({
      ...draftState,
      portfolioProjects: [...draftState.portfolioProjects, newProject]
    });
  };

  const updateProject = (id: string, updates: Partial<CaseStudy>) => {
    const updated = draftState.portfolioProjects.map(proj => 
      proj.id === id ? { ...proj, ...updates } : proj
    );
    saveDraft({
      ...draftState,
      portfolioProjects: updated
    });
  };

  const deleteProject = (id: string) => {
    saveDraft({
      ...draftState,
      portfolioProjects: draftState.portfolioProjects.filter(p => p.id !== id)
    });
  };

  const reorderProjects = (projects: CaseStudy[]) => {
    saveDraft({
      ...draftState,
      portfolioProjects: projects
    });
  };

  // Media Library actions
  const addMediaAsset = (asset: Omit<MediaAsset, 'id'>) => {
    const newAsset: MediaAsset = {
      ...asset,
      id: `media-${Date.now()}`
    };
    saveDraft({
      ...draftState,
      mediaAssets: [newAsset, ...draftState.mediaAssets]
    });
  };

  const updateMediaAsset = (id: string, updates: Partial<MediaAsset>) => {
    saveDraft({
      ...draftState,
      mediaAssets: draftState.mediaAssets.map(m => m.id === id ? { ...m, ...updates } : m)
    });
  };

  const deleteMediaAsset = (id: string) => {
    saveDraft({
      ...draftState,
      mediaAssets: draftState.mediaAssets.filter(m => m.id !== id)
    });
  };

  // Testimonials
  const addTestimonial = (story: ClientStory) => {
    saveDraft({
      ...draftState,
      clientStories: [...draftState.clientStories, story]
    });
  };

  const updateTestimonial = (index: number, updates: Partial<ClientStory>) => {
    const updated = [...draftState.clientStories];
    updated[index] = { ...updated[index], ...updates };
    saveDraft({
      ...draftState,
      clientStories: updated
    });
  };

  const deleteTestimonial = (index: number) => {
    saveDraft({
      ...draftState,
      clientStories: draftState.clientStories.filter((_, idx) => idx !== index)
    });
  };

  // Team
  const addTeamMember = (member: Omit<TeamMember, 'id'>) => {
    const newMem: TeamMember = {
      ...member,
      id: `member-${Date.now()}`
    };
    saveDraft({
      ...draftState,
      teamMembers: [...draftState.teamMembers, newMem]
    });
  };

  const updateTeamMember = (id: string, updates: Partial<TeamMember>) => {
    const updated = draftState.teamMembers.map(m => 
      m.id === id ? { ...m, ...updates } : m
    );
    saveDraft({
      ...draftState,
      teamMembers: updated
    });
  };

  const deleteTeamMember = (id: string) => {
    saveDraft({
      ...draftState,
      teamMembers: draftState.teamMembers.filter(m => m.id !== id)
    });
  };

  // Inquiries
  const addInquiry = (inquiry: Inquiry) => {
    const updatedInqs = [inquiry, ...draftState.inquiries];
    saveDraft({
      ...draftState,
      inquiries: updatedInqs
    });
    syncInquiriesToCoreStorage(updatedInqs);
  };

  const updateInquiryStatus = (id: string, status: any) => {
    const updatedInqs = draftState.inquiries.map(inq => 
      inq.id === id ? { ...inq, status } : inq
    );
    saveDraft({
      ...draftState,
      inquiries: updatedInqs
    });
    syncInquiriesToCoreStorage(updatedInqs);
  };

  const saveInquiryProposal = (id: string, proposal: NonNullable<Inquiry['proposalConcept']>) => {
    const updatedInqs = draftState.inquiries.map(inq => 
      inq.id === id ? { ...inq, proposalConcept: proposal } : inq
    );
    saveDraft({
      ...draftState,
      inquiries: updatedInqs
    });
    syncInquiriesToCoreStorage(updatedInqs);
  };

  // Navigation Items
  const updateNavigationItem = (id: string, updates: Partial<NavigationItem>) => {
    const updated = draftState.navigationItems.map(item => 
      item.id === id ? { ...item, ...updates } : item
    );
    saveDraft({
      ...draftState,
      navigationItems: updated
    });
  };

  const reorderNavigationItems = (items: NavigationItem[]) => {
    saveDraft({
      ...draftState,
      navigationItems: items
    });
  };

  // Theme Config
  const updateTheme = (updates: Partial<ThemeConfig>) => {
    saveDraft({
      ...draftState,
      themeConfig: { ...draftState.themeConfig, ...updates }
    });
  };

  // SEO Config
  const updateSEO = (updates: Partial<SEOConfig>) => {
    saveDraft({
      ...draftState,
      seoConfig: { ...draftState.seoConfig, ...updates }
    });
    
    // Update active page titles dynamically
    if (updates.pageTitle) {
      document.title = updates.pageTitle;
    }
  };

  // Process Steps
  const addProcessStep = (step: Omit<ProcessStep, 'number'>) => {
    const list = draftState.processSteps || [];
    const num = `0${list.length + 1}`.slice(-2);
    const newStep: ProcessStep = {
      ...step,
      number: num
    };
    saveDraft({
      ...draftState,
      processSteps: [...list, newStep]
    });
  };

  const updateProcessStep = (index: number, updates: Partial<ProcessStep>) => {
    const list = [...(draftState.processSteps || [])];
    if (list[index]) {
      list[index] = { ...list[index], ...updates };
      const refreshed = list.map((item, idx) => ({
        ...item,
        number: `0${idx + 1}`.slice(-2)
      }));
      saveDraft({
        ...draftState,
        processSteps: refreshed
      });
    }
  };

  const deleteProcessStep = (index: number) => {
    const list = (draftState.processSteps || []).filter((_, idx) => idx !== index);
    const refreshed = list.map((item, idx) => ({
      ...item,
      number: `0${idx + 1}`.slice(-2)
    }));
    saveDraft({
      ...draftState,
      processSteps: refreshed
    });
  };

  const reorderProcessSteps = (steps: ProcessStep[]) => {
    const refreshed = steps.map((item, idx) => ({
      ...item,
      number: `0${idx + 1}`.slice(-2)
    }));
    saveDraft({
      ...draftState,
      processSteps: refreshed
    });
  };

  // Main Publish Draft -> Live
  const publishDraft = () => {
    const sanitized = sanitizeState(draftState);
    setDraftState(sanitized);
    setPublishedState(sanitized);
    localStorage.setItem('gather_cms_published', JSON.stringify(sanitized));
    localStorage.setItem('gather_cms_draft', JSON.stringify(sanitized));
    syncInquiriesToCoreStorage(sanitized.inquiries || []);

    if (isSupabaseConfigured) {
      import('./supabaseClient').then(({ syncCMSStateToSupabase }) => {
        syncCMSStateToSupabase('published', sanitized);
        syncCMSStateToSupabase('draft', sanitized);
      }).catch(err => {
        console.error('[SUPABASE PUBLISH SYNC ERROR]:', err);
      });
    }
  };

  // Reset CMS back to origin defaults
  const resetToDefaults = () => {
    setDraftState(INITIAL_STATE);
    setPublishedState(INITIAL_STATE);
    localStorage.removeItem('gather_cms_draft');
    localStorage.removeItem('gather_cms_published');
    localStorage.removeItem('gatherInquiries');
    location.reload();
  };

  const activeState = cmsMode === 'publish' ? publishedState : draftState;

  return (
    <CMSContext.Provider value={{
      state: activeState,
      draftState,
      publishedState,
      isCmsOpen,
      setIsCmsOpen,
      cmsMode,
      setCmsMode,
      currentRole,
      setCurrentRole,
      
      updateHeroConfig,
      updateHeroText,
      updateCategory,
      addCategory,
      deleteCategory,
      reorderCategories,
      
      addService,
      updateService,
      deleteService,
      reorderServices,
      
      addProject,
      updateProject,
      deleteProject,
      reorderProjects,
      
      addMediaAsset,
      updateMediaAsset,
      deleteMediaAsset,
      
      addTestimonial,
      updateTestimonial,
      deleteTestimonial,
      
      addTeamMember,
      updateTeamMember,
      deleteTeamMember,
      
      addInquiry,
      updateInquiryStatus,
      saveInquiryProposal,
      
      updateNavigationItem,
      reorderNavigationItems,
      
      addProcessStep,
      updateProcessStep,
      deleteProcessStep,
      reorderProcessSteps,
      
      updateTheme,
      updateSEO,
      
      publishDraft,
      resetToDefaults,
      resolveVideoUrl,
      uploadVideo
    }}>
      {children}
    </CMSContext.Provider>
  );
};

export const useCMS = () => {
  const context = useContext(CMSContext);
  if (!context) {
    throw new Error('useCMS must be utilized within a CMSProvider framework');
  }
  return context;
};
