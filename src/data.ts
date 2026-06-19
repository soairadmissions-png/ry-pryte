import { EventCategory, ServiceDetail, ProcessStep, CaseStudy, ClientStory } from './types';

export const EVENT_CATEGORIES: EventCategory[] = [
  {
    id: 'weddings',
    title: 'Wedding',
    subtext: 'Complete planner coordination and custom event design.',
    tagline: 'EVENT PLANNING & MANAGEMENT',
    image: '/src/assets/images/gather_wedding_1781527313337.jpg',
    accentColor: 'text-[#D4AF37] border-[#D4AF37]', // Antique Gold
    bgOverlay: 'bg-black/30',
    textColor: '#D4AF37',
    description: 'From intimate ceremonies to grand celebrations, we design wedding experiences that reflect your story, style, and vision. Every detail is thoughtfully curated to create a seamless and unforgettable day for you and your guests.'
  },
  {
    id: 'corporate',
    title: 'Corporate Events',
    subtext: 'Seamless corporate logistics and flawless agenda execution.',
    tagline: 'CORPORATE PLANNING & LOGISTICS',
    image: '/src/assets/images/gather_corporate_1781527328223.jpg',
    accentColor: 'text-[#8EA8C3] border-[#8EA8C3]', // Steel Blue
    bgOverlay: 'bg-black/30',
    textColor: '#8EA8C3',
    visible: false
  },
  {
    id: 'birthdays',
    title: 'Private Celebration',
    subtext: 'Elegantly managed private celebrations.',
    tagline: 'PRIVATE EVENT COORDINATION',
    image: '/src/assets/images/gather_birthday_1781527344179.jpg',
    accentColor: 'text-[#D81159] border-[#D81159]', // Crimson Cherry
    bgOverlay: 'bg-black/35',
    textColor: '#D81159',
    description: 'We craft private celebrations that feel deeply personal, beautifully styled, and effortlessly executed. From intimate gatherings to exclusive moments shared with close friends and family, every detail is designed to reflect your personality and create lasting memories in an atmosphere that feels truly yours.'
  },
  {
    id: 'galas',
    title: 'Gala & Luxury Diners',
    subtext: 'Premium fundraisers and award dinners managed end-to-end.',
    tagline: 'EXECUTIVE EVENT COORDINATION',
    image: '/src/assets/images/gather_gala_1781527359084.jpg',
    accentColor: 'text-[#E5A93C] border-[#E5A93C]', // Bright Gold
    bgOverlay: 'bg-black/40',
    textColor: '#E5A93C',
    description: 'We design gala experiences and luxury dinners that combine elegance, atmosphere, and precision. From refined table settings to immersive lighting and seamless service flow, every element is curated to create a sophisticated evening where guests feel both inspired and completely immersed in the moment.'
  },
  {
    id: 'custom',
    title: 'Expert Consultations',
    subtext: 'Structured consultations, checklists, and vendor matching.',
    tagline: 'EVENT PLANNERS CONSULTATION',
    image: '/src/assets/images/gather_custom_1781527375668.jpg',
    accentColor: 'text-[#7B2CBF] border-[#7B2CBF]', // Royal Violet
    bgOverlay: 'bg-black/30',
    textColor: '#7B2CBF',
    description: 'We offer expert consultations that turn ideas into clear, actionable event concepts. Whether you\'re starting from a rough vision or refining final details, we guide you with strategic insight, creative direction, and practical planning to ensure every decision leads toward a cohesive and impactful experience.'
  }
];

export const SERVICES: ServiceDetail[] = [
  {
    id: 'wedding-planning',
    title: 'Wedding Planning',
    headline: 'Complete end-to-end planning with flawless timeline coordination.',
    description: 'We design, source, and execute premium weddings, managing every vendor and detail so you can enjoy your day stress-free.',
    longDescription: 'Our wedding planning service in Abuja provides comprehensive support from initial concept design to final onsite coordination. We manage budgeting, vendor selection, timeline curation, and aesthetic styling. We partner with top-tier decor specialists, elite caterers, and live musicians to deliver clean, elegant celebrations tailored to your personal taste.',
    image: '/src/assets/images/gather_wedding_1781527313337.jpg',
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
    image: '/src/assets/images/gather_corporate_1781527328223.jpg',
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
    image: '/src/assets/images/gather_birthday_1781527344179.jpg',
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
    image: '/src/assets/images/gather_custom_1781527375668.jpg',
    category: 'custom',
    offerings: [
      'Master Timeline & Checklist Auditing',
      'Vetted Vendor Introductions & Matches',
      'Budget Modeling & Contingency Planning',
      'Aesthetic Curation & Design Direction Brief'
    ]
  }
];

export const PROCESS_STEPS: ProcessStep[] = [
  {
    number: '01',
    title: 'Initial Consultation',
    narrative: 'We map your event goals, budget, and design vision.',
    details: 'Our process begins with a structured coordination consultation. We outline your schedule, define budget allocations, and review target goals. Rather than generic ideas, we establish a clean, practical baseline tailored specifically to your venue and guest experience.',
    image: '/src/assets/images/gather_wedding_1781527313337.jpg'
  },
  {
    number: '02',
    title: 'Strategic Sourcing',
    narrative: 'Securing vetted suppliers and creative logistics.',
    details: 'We present a master planner proposal with custom recommendations for venues, catering, audiovisual production, and master setups. Every supplier we introduce is highly vetted for reliability, high professionalism, and flawless delivery standards.',
    image: '/src/assets/images/gather_corporate_1781527328223.jpg'
  },
  {
    number: '03',
    title: 'Onsite Coordination',
    narrative: 'Executing schedules and managing on-day logistics.',
    details: 'On your event day, our certified coordinator monitors every detail. We manage timelines, track suppliers, handle sound and light parameters, and oversee the floor plans behind the scenes, ensuring the entire program is executed precisely.',
    image: '/src/assets/images/gather_gala_1781527359084.jpg'
  },
  {
    number: '04',
    title: 'Professional Delivery',
    narrative: 'An outstanding event executed with total reliability.',
    details: 'Your guests experience a seamless, organized celebration from arrival to departure. Following the event, we handle supplier cleanup audits and final accounts, leaving you with a successful milestone and absolute satisfaction.',
    image: '/src/assets/images/gather_custom_1781527375668.jpg'
  }
];

export const CASE_STUDIES: CaseStudy[] = [
  {
    id: 'aurora-estate',
    title: 'Waterfront Wedding Coordinator',
    client: 'The Aurora Union',
    category: 'weddings',
    location: 'Abuja Gardens, Nigeria',
    summary: 'A flawless, full-service wedding utilizing custom seating layouts, precise timeline routing, and premium onsite styling completed for 200 guests.',
    story: 'The clients requested a garden wedding that combined local cultural traditions with modern, clean styling. They required comprehensive planning and complete day-of coordination to ensure guests from across the country felt cared for.',
    goals: 'Track and organize over 15 distinct suppliers, design a reliable wet-weather contingency plan, and establish elegant seating plans that prioritized high guest flow.',
    transformation: 'We selected a premium garden venue in Abuja, coordinated a master timeline across three days, and engineered custom floral arch structures. We managed vendor deliverables to ensure the entire itinerary ran precisely to the minute, culminating in a beautiful candlelit dinner.',
    testimonial: {
      quote: "Their organization and endless attention to detail made our wedding completely stress-free. Gathering managed the timelines flawlessly, allowing us to focus entirely on celebrating.",
      author: "Dr. Alexandra V.",
      role: "The Bride"
    },
    image: '/src/assets/images/gather_wedding_1781527313337.jpg',
    gallery: [
      '/src/assets/images/gather_wedding_1781527313337.jpg',
      '/src/assets/images/gather_custom_1781527375668.jpg'
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
    image: '/src/assets/images/gather_corporate_1781527328223.jpg',
    gallery: [
      '/src/assets/images/gather_corporate_1781527328223.jpg',
      '/src/assets/images/gather_gala_1781527359084.jpg'
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
    image: '/src/assets/images/gather_birthday_1781527344179.jpg',
    gallery: [
      '/src/assets/images/gather_birthday_1781527344179.jpg',
      '/src/assets/images/gather_gala_1781527359084.jpg'
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
    transformation: 'We engineered a clean reflective gallery entrance and coordinated live classical performers. Our coordinators managed the fundraising schedule, timing food courses to correspond with giving moments, helping them clear their donor goals easily.',
    testimonial: {
      quote: "Their coordination skill is unmatched. The logistics ran beautifully, the venue was gorgeous, and we exceeded our funding targets thanks to their structural planning.",
      author: "Eleanor Sinclair",
      role: "Chairperson, Arts Endowment"
    },
    image: '/src/assets/images/gather_gala_1781527359084.jpg',
    gallery: [
      '/src/assets/images/gather_gala_1781527359084.jpg',
      '/src/assets/images/gather_custom_1781527375668.jpg'
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
    image: '/src/assets/images/gather_custom_1781527375668.jpg',
    gallery: [
      '/src/assets/images/gather_custom_1781527375668.jpg',
      '/src/assets/images/gather_wedding_1781527313337.jpg'
    ]
  }
];

export const CLIENT_STORIES: ClientStory[] = [
  {
    quote: "Their organization and endless attention to detail made our wedding completely stress-free. Gathering managed the timelines flawlessly.",
    author: "Alexandra & Marcus V.",
    role: "Private Ceremony",
    eventDate: "June 2025",
    category: "weddings",
    image: '/src/assets/images/gather_wedding_1781527313337.jpg'
  },
  {
    quote: "A masterclass in professional event planning. Every detail of our charity fundraiser was managed with complete reliability and exceptional taste.",
    author: "Eleanor Sinclair",
    role: "Arts Chairperson",
    eventDate: "October 2025",
    category: "galas",
    image: '/src/assets/images/gather_gala_1781527359084.jpg'
  },
  {
    quote: "They took a complex corporate technological theme and organized our summit with exceptional operational precision. They are highly capable.",
    author: "Hidetoshi S.",
    role: "VP of Product Development",
    eventDate: "February 2026",
    category: "corporate",
    image: '/src/assets/images/gather_corporate_1781527328223.jpg'
  }
];
