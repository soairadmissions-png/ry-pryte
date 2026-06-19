export type EventType = 'weddings' | 'corporate' | 'birthdays' | 'galas' | 'custom';

export interface EventCategory {
  id: string; // allow any custom category string
  title: string;
  subtext: string;
  image: string;
  accentColor: string; // Tailwind class coloring
  bgOverlay: string; // Visual tinting overlay
  tagline: string;
  textColor: string;
  description?: string;
  coverVideo?: string;
  coverImage?: string;
  visible?: boolean;
  order?: number;
  badge?: string;
}

export interface ServiceDetail {
  id: string;
  title: string;
  headline: string;
  description: string;
  longDescription: string;
  image: string;
  category: EventType;
  offerings: string[];
}

export interface ProcessStep {
  number: string;
  title: string;
  narrative: string;
  details: string;
  image?: string;
  iconName?: string;
}

export interface CaseStudy {
  id: string;
  title: string;
  client: string;
  category: EventType;
  location: string;
  summary: string;
  story: string;
  goals: string;
  transformation: string;
  testimonial: {
    quote: string;
    author: string;
    role: string;
  };
  image: string;
  gallery: string[];
}

export interface ClientStory {
  quote: string;
  author: string;
  role: string;
  eventDate: string;
  category: EventType;
  image: string;
}

export interface Inquiry {
  id: string;
  eventType: EventType;
  date: string;
  guestCount: string;
  budgetRange: string;
  message: string;
  fullName: string;
  email: string;
  phone: string;
  submittedAt: string;
  status: 'Received' | 'Designing Concept' | 'Proposal Ready';
  proposalConcept?: {
    themeName: string;
    description: string;
    palette: string[];
    venueVibe: string;
    decorNote: string;
  };
}
