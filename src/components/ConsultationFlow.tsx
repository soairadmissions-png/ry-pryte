import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ArrowRight, Sparkles, Send, Calendar, Users, DollarSign, CheckCircle2, MessageSquare, ClipboardCheck, PhoneCall, HelpCircle } from 'lucide-react';
import { EventType, Inquiry } from '../types';
import { useCMS } from '../lib/cmsState';

interface ConsultationFlowProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedCategory?: EventType;
  onInquirySubmitted?: (inquiry: Inquiry) => void;
}

// Highly styled pre-configured suggestions to populate dynamic concept proposals
const DEVELOPMENT_CONCEPTS: Record<EventType, {
  themeName: string;
  description: string;
  palette: string[];
  colors: string[]; // actual hexes
  venueVibe: string;
  decorNote: string;
  checklist: string[];
}> = {
  weddings: {
    themeName: 'Sophisticated Elegance',
    description: 'A beautifully coordinated wedding focusing on precise schedules, elegant seating layouts, and flawless vendor management.',
    palette: ['Champagne', 'Antique Gold', 'Blush Rose', 'Warm Cream'],
    colors: ['#F5ECD7', '#D4AF37', '#F3C5C5', '#FFFDF9'],
    venueVibe: 'Premium hotel ballroom, lush manicured garden, or high-glass greenhouse in Abuja.',
    decorNote: 'Warm candlelit long tables, soft floral accents, and custom hand-lettered guest cards.',
    checklist: ['Confirm luxury seating arrangements', 'Map master three-day logistics', 'Audit final vendor layouts']
  },
  corporate: {
    themeName: 'Precision & Impact',
    description: 'A high-profile corporate launch or summit managed with elite technical logistics and meticulous timing schedules.',
    palette: ['Executive Slate', 'Corporate Blue', 'Silver Accent', 'Pure White'],
    colors: ['#1E293B', '#1D4ED8', '#94A3B8', '#FFFFFF'],
    venueVibe: 'Modern convention center, executive pavilion, or upscale auditorium in Maitama.',
    decorNote: 'Floating stage elements, high-definition digital podiums, and professional lounge layouts.',
    checklist: ['Sync presentation queue timing', 'Confirm guest registration and badge scanning protocols', 'Complete pre-event tech testing']
  },
  birthdays: {
    themeName: 'Bespoke Celebration',
    description: 'An elegant personal milestone dinner designed with detailed coordination, live music cues, and customized menus.',
    palette: ['Deep Burgundy', 'Warm Amber', 'Polished Brass', 'Ivory'],
    colors: ['#741212', '#D97706', '#EAB308', '#FDFBF7'],
    venueVibe: 'Private club lounge, boutique garden courtyard, or high-end dining parlour.',
    decorNote: 'Draped velvet panel accent walls, beautiful table flower installations, and warm ambient spotlighting.',
    checklist: ['Choreograph band and musical cues', 'Design layout maps for private halls', 'Finalize 5-course guest tasting menu']
  },
  galas: {
    themeName: 'Grand Distinction',
    description: 'A sovereign charity benefit managed with delicate seating plans, high patron check-in, and budget reconciliation.',
    palette: ['Polished Gold', 'Imperial Charcoal', 'Sterling Silver', 'Emerald Accent'],
    colors: ['#EAB308', '#1F2937', '#E5E7EB', '#059669'],
    venueVibe: 'Prestigious grand ballroom, embassy hall, or classic banquet atrium.',
    decorNote: 'Classic table runner accents, donor graphic milestones, and elegant background string music setups.',
    checklist: ['Implement donor check-in queues', 'Direct layout for classical musicians', 'Verify speech and awards timings']
  },
  custom: {
    themeName: 'Tailored Framework',
    description: 'A custom consultative event outline complete with supplier matching, planning checklist models, and budget calculations.',
    palette: ['Deep Amethyst', 'Atomic Teal', 'Muted Lavender', 'Nirvana Coal'],
    colors: ['#6D28D9', '#0D9488', '#C084FC', '#0F172A'],
    venueVibe: 'Selected based on custom requirements and planning recommendations.',
    decorNote: 'Curated according to bespoke aesthetic plans and spatial coordinate diagrams.',
    checklist: ['Evaluate master timeline budgets', 'Coordinate supplier introductions', 'Draft bespoke floor blueprint designs']
  }
};

export default function ConsultationFlow({ isOpen, onClose, preselectedCategory = 'weddings', onInquirySubmitted }: ConsultationFlowProps) {
  const { state } = useCMS();
  const visibleCategories = (state.eventCategories || []).filter(cat => cat.visible !== false);
  
  // Navigation Steps: 'form' | 'submitting' | 'concept' | 'chat'
  const [currentStep, setCurrentStep] = useState<'form' | 'concept' | 'chat'>('form');
  
  // Form State
  const [eventType, setEventType] = useState<EventType>(preselectedCategory);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [date, setDate] = useState('');
  const [guestCount, setGuestCount] = useState('');
  const [budgetRange, setBudgetRange] = useState('');
  const [message, setMessage] = useState('');
  
  // Results
  const [submittedInquiry, setSubmittedInquiry] = useState<Inquiry | null>(null);

  // Simulated Chat Agent State
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'planner' | 'client'; text: string; time: string }>>([
    {
      sender: 'planner',
      text: 'Greetings. I am Vivienne, Lead Planner & Coordinator at Gather. I see you are exploring our planning services. How can I assist you with logistics, coordination, or vendor sourcing for your upcoming event?',
      time: 'Just now'
    }
  ]);
  const [userInputMessage, setUserInputMessage] = useState('');

  // Handle Form Submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !eventType) return;

    const chosenConcept = DEVELOPMENT_CONCEPTS[eventType];
    
    const newInquiry: Inquiry = {
      id: `inq-${Date.now()}`,
      eventType,
      fullName,
      email,
      phone,
      date: date || 'Autumn Solstice 2026',
      guestCount: guestCount || '75 Guests',
      budgetRange: budgetRange || 'Premium Tier ($50K+)',
      message: message || 'We desire a deeply atmospheric celebration that defies traditional protocols.',
      submittedAt: new Date().toLocaleDateString(),
      status: 'Proposal Ready',
      proposalConcept: {
        themeName: chosenConcept.themeName,
        description: chosenConcept.description,
        palette: chosenConcept.palette,
        venueVibe: chosenConcept.venueVibe,
        decorNote: chosenConcept.decorNote
      }
    };

    // Save to Local Storage inquiries registry
    const existing = localStorage.getItem('gatherInquiries');
    const registry = existing ? JSON.parse(existing) : [];
    registry.unshift(newInquiry);
    localStorage.setItem('gatherInquiries', JSON.stringify(registry));

    setSubmittedInquiry(newInquiry);
    
    // Broadcast trigger
    if (onInquirySubmitted) {
      onInquirySubmitted(newInquiry);
    }

    // Advance flow to conceptual output screen
    setCurrentStep('concept');
  };

  // Simulated Interactive Chat suggestions
  const CHAT_PROMPTS = [
    'How do you manage logistics for premium regional weddings?',
    'What goes into planning and coordinating high-profile corporate summits?',
    'What timeline parameters should we set for a custom celebration?',
    'Let’s schedule a private planning coordination meeting at your studio.'
  ];

  const handleSendPrompt = (promptText: string) => {
    const userMsg = { sender: 'client' as const, text: promptText, time: '1s ago' };
    setChatMessages(prev => [...prev, userMsg]);

    // Simulated responses from our senior event planner Vivienne
    setTimeout(() => {
      let responseText = '';
      if (promptText.includes('weddings') || promptText.includes('destination') || promptText.includes('regional')) {
        responseText = 'For premium weddings in Abuja and destination ceremonies, we utilize a comprehensive vendor partner network. We manage all supplier coordination, budget breakdowns, and site visits under strict planner supervision, ensuring clean execution on your special day.';
      } else if (promptText.includes('projection') || promptText.includes('corporate') || promptText.includes('summits')) {
        responseText = 'For corporate summits or product launches, we focus on absolute logistical reliability. We coordinate multi-tier VIP arrivals, AV sound and light technicians, security details, and seating layouts to align precisely with your schedule.';
      } else if (promptText.includes('timeline') || promptText.includes('fabrications') || promptText.includes('celebration')) {
        responseText = 'Our standard planning timeline ranges from 2 to 6 months depending on scale. We construct interactive checklists, map out budgets, and run pre-event layout mockups to guarantee zero operational lapses.';
      } else {
        responseText = 'I would be delighted to host you back in our Abuja tasting studio. Let us connect via a 15-minute phone alignment call first to lock in your timeline goals and scale requirements.';
      }

      setChatMessages(prev => [...prev, {
        sender: 'planner',
        text: responseText,
        time: 'Just now'
      }]);
    }, 1000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-[#1a1613]/55 backdrop-blur-sm flex justify-end"
          onClick={onClose}
        >
          {/* Main Slide-out Container */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 180 }}
            className="w-full max-w-2xl bg-[#fbfaf7] text-neutral-800 h-screen overflow-y-auto flex flex-col border-l border-black/10 rounded-l-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 border-b border-black/5 flex justify-between items-center bg-[#fbfaf7]/90 sticky top-0 backdrop-blur-md z-10">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-[#d16126]" />
                <span className="text-xs font-mono uppercase tracking-[0.2em] font-medium text-neutral-500">Experience Canvas</span>
              </div>
              <button 
                onClick={onClose}
                className="p-2 text-neutral-500 hover:text-black rounded-full bg-[#fbfaf7] border border-black/10 cursor-pointer transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Sub-State Toggle Buttons (only visible after submission) */}
            {submittedInquiry && (
              <div className="grid grid-cols-2 bg-[#f6f5f0] border-b border-black/5">
                <button
                  onClick={() => setCurrentStep('concept')}
                  className={`py-3 text-[10px] font-mono tracking-widest uppercase flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                    currentStep === 'concept' ? 'border-b-2 border-[#d16126] text-black bg-white font-bold' : 'text-neutral-500'
                  }`}
                >
                  <ClipboardCheck className="w-3.5 h-3.5" /> Your Concept Proposal
                </button>
                <button
                  onClick={() => setCurrentStep('chat')}
                  className={`py-3 text-[10px] font-mono tracking-widest uppercase flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                    currentStep === 'chat' ? 'border-b-2 border-[#d16126] text-black bg-white font-bold' : 'text-neutral-500'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5 animate-pulse text-[#d16126]" /> Live Planner Chat
                </button>
              </div>
            )}

            {/* Dynamic Step Contents */}
            <div className="flex-grow p-6 sm:p-8">
              {/* STEP 1: FORM FLOW */}
              {currentStep === 'form' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-2xl font-serif text-[#1a1613] mb-2 leading-tight">
                      Let’s compose your custom <span className="italic text-neutral-500">event narrative.</span>
                    </h3>
                    <p className="text-xs text-neutral-500 font-light leading-relaxed">
                      We do not manage checklists. We manufacture peak human encounters. Fill out this basic sensory scope, and our synthesis engine will instantaneously formulate a custom draft concept theme.
                    </p>
                  </div>

                  {/* Form Block */}
                  <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Event Type Grid */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-mono uppercase tracking-widest text-[#d16126]">Type of Canvas Memory</label>
                      <div className="grid grid-cols-2 gap-2.5">
                        {visibleCategories.map((cat) => (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => setEventType(cat.id as EventType)}
                            className={`py-3 px-3 text-[10px] font-mono tracking-widest uppercase text-left border rounded-2xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex justify-between items-center ${
                              eventType === cat.id 
                                ? 'bg-[#d16126]/5 text-[#d16126] border-[#d16126]/60 shadow-sm' 
                                : 'bg-white border-black/10 text-neutral-600 hover:border-black/35 hover:text-black'
                            }`}
                          >
                            <span>{cat.title}</span>
                            {eventType === cat.id && <span className="w-1.5 h-1.5 rounded-full bg-[#d16126]"></span>}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Twin Inputs: Client info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">Full Signature Name</label>
                        <input
                          type="text"
                          required
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="Alexandra Sterling"
                          className="w-full bg-[#f6f5f0] border border-black/10 rounded-2xl px-4 py-3 text-xs focus:outline-none focus:border-[#d16126] focus:bg-white hover:border-black/20 transition-all text-[#1a1613] font-light placeholder:text-neutral-400"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">Primary Email Connection</label>
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="alexandra@sterlingholdings.com"
                          className="w-full bg-[#f6f5f0] border border-black/10 rounded-2xl px-4 py-3 text-xs focus:outline-none focus:border-[#d16126] focus:bg-white hover:border-black/20 transition-all text-[#1a1613] font-light placeholder:text-neutral-400"
                        />
                      </div>
                    </div>

                    {/* Contact Phone & Ideal Date */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">Phone Contact (Inbound)</label>
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+1 (555) 0192-384"
                          className="w-full bg-[#f6f5f0] border border-black/10 rounded-2xl px-4 py-3 text-xs focus:outline-none focus:border-[#d16126] focus:bg-white hover:border-black/20 transition-all text-[#1a1613] font-light placeholder:text-neutral-400"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono uppercase tracking-widest text-[#d16126]">Target Milestone Date</label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-3 flex items-center text-neutral-400">
                            <Calendar className="w-3.5 h-3.5" />
                          </span>
                          <input
                            type="text"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            placeholder="September 15, 2026"
                            className="w-full bg-[#f6f5f0] border border-black/10 rounded-2xl pl-9 pr-4 py-3 text-xs focus:outline-none focus:border-[#d16126] focus:bg-white hover:border-black/20 transition-all text-[#1a1613] font-light placeholder:text-neutral-400"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Scale and Budget Tier */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">Expected Guest Scale</label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-3 flex items-center text-neutral-400">
                            <Users className="w-3.5 h-3.5" />
                          </span>
                          <input
                            type="text"
                            value={guestCount}
                            onChange={(e) => setGuestCount(e.target.value)}
                            placeholder="40 to 80 Intimate Guests"
                            className="w-full bg-[#f6f5f0] border border-black/10 rounded-2xl pl-9 pr-4 py-3 text-xs focus:outline-none focus:border-[#d16126] focus:bg-white hover:border-black/20 transition-all text-[#1a1613] font-light placeholder:text-neutral-400"
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">Aesthetic Budget Threshold</label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-3 flex items-center text-neutral-400">
                            <DollarSign className="w-3.5 h-3.5" />
                          </span>
                          <select
                            value={budgetRange}
                            onChange={(e) => setBudgetRange(e.target.value)}
                            className="w-full bg-[#f6f5f0] border border-black/10 rounded-2xl pl-9 pr-4 py-3 text-xs focus:outline-none focus:border-[#d16126] focus:bg-white hover:border-black/20 transition-all text-left text-[#1a1613] font-light appearance-none text-neutral-600"
                          >
                            <option value="" className="bg-[#f6f5f0]">Select threshold category...</option>
                            <option value="Intimate Boutique ($25K - $50K)" className="bg-[#fbfaf7]">Intimate Boutique ($25K - $50K)</option>
                            <option value="Heritage Premium ($50K - $100K)" className="bg-[#fbfaf7]">Heritage Premium ($50K - $100K)</option>
                            <option value="Grandiose Opulence ($100K - $250K)" className="bg-[#fbfaf7]">Grandiose Opulence ($100K - $250K)</option>
                            <option value="Unconstrained Visionary ($250K+)" className="bg-[#fbfaf7]">Unconstrained Visionary ($250K+)</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Deep message descriptions */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">Describe the core feeling</label>
                      <textarea
                        rows={4}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Detail the spatial atmosphere, material preferences, or cultural details you desire to reflect..."
                        className="w-full bg-[#f6f5f0] border border-black/10 rounded-2xl px-4 py-3 text-xs focus:outline-none focus:border-[#d16126] focus:bg-white hover:border-black/20 transition-all text-[#1a1613] font-light resize-none leading-relaxed placeholder:text-neutral-400"
                      />
                    </div>

                    {/* Submitting Trigger buttons */}
                    <div className="pt-4">
                      <button
                        type="submit"
                        className="w-full bg-[#1a1613] hover:bg-black text-white py-4 text-xs font-mono font-medium uppercase tracking-[0.25em] active:scale-98 transition-all flex items-center justify-center space-x-2 rounded-2xl cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-brand-gold" />
                        <span>Formulate Concept Proposal</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* STEP 2: CONCEPT OUTPUT SHOWCASE */}
              {currentStep === 'concept' && submittedInquiry && (
                <div className="space-y-6">
                  {/* Banner Confirmation */}
                  <div className="bg-[#d16126]/5 border border-[#d16126]/20 rounded-3xl p-5 flex items-start space-x-3.5">
                    <CheckCircle2 className="w-5 h-5 text-[#d16126] flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-semibold text-neutral-900">Concept Synthesized Successfully</h4>
                      <p className="text-[11px] text-neutral-500 mt-1 leading-relaxed">
                        Gather client registrars compiled under reference code <b>{submittedInquiry.id}</b>. Below is your curated aesthetic concept summary generated in real-time.
                      </p>
                    </div>
                  </div>

                  {/* Proposal Core Design Card */}
                  <div className="border border-black/10 bg-white rounded-3xl p-6 sm:p-8 space-y-6 relative overflow-hidden shadow-md text-left">
                    {/* Corner aesthetics watermark */}
                    <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 opacity-5 text-9xl font-serif select-none pointer-events-none">
                      K
                    </div>

                    <div className="flex justify-between items-center border-b border-black/5 pb-4">
                      <div>
                        <span className="text-[8px] font-mono text-[#d16126] tracking-[0.3em] uppercase block mb-1">DESIGN CONSTRUCT</span>
                        <h4 className="text-xl sm:text-2xl font-serif text-neutral-900">{submittedInquiry.proposalConcept?.themeName}</h4>
                      </div>
                      <span className="text-[10px] font-mono text-neutral-400">KBJ EVENTS EST. 2023</span>
                    </div>

                    {/* Theme narrative */}
                    <div className="space-y-2">
                      <span className="text-[9px] font-mono uppercase text-neutral-400 tracking-wider font-semibold">Narrative Blueprint</span>
                      <p className="text-xs text-neutral-600 font-light leading-relaxed">
                        {submittedInquiry.proposalConcept?.description}
                      </p>
                    </div>

                    {/* Swatches Visual palettes */}
                    <div className="space-y-3.5">
                      <span className="text-[9px] font-mono uppercase text-[#d16126]/80 tracking-wider font-semibold">Chromatic Identity Swatches</span>
                      <div className="grid grid-cols-4 gap-2">
                        {DEVELOPMENT_CONCEPTS[submittedInquiry.eventType].palette.map((name, idx) => {
                          const hex = DEVELOPMENT_CONCEPTS[submittedInquiry.eventType].colors[idx];
                          return (
                            <div key={idx} className="space-y-1.5 text-center">
                              <div 
                                className="h-10 rounded-2xl border border-black/10 shadow-inner"
                                style={{ backgroundColor: hex }} 
                              />
                              <div className="text-[8px] font-mono text-neutral-500 select-all tracking-tight truncate">
                                {name}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Twin structural components: venue vibration & textures */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 border-t border-black/5 pt-5 text-left">
                      <div className="space-y-1.5">
                        <span className="text-[9px] font-mono uppercase text-neutral-400 tracking-widest font-semibold block">Spatial Venue Profile</span>
                        <p className="text-xs text-neutral-600 font-light leading-relaxed">
                          {submittedInquiry.proposalConcept?.venueVibe}
                        </p>
                      </div>
                      <div className="space-y-1.5">
                        <span className="text-[9px] font-mono uppercase text-neutral-400 tracking-widest font-semibold block">Sourcing & Decor Profile</span>
                        <p className="text-xs text-neutral-600 font-light leading-relaxed">
                          {submittedInquiry.proposalConcept?.decorNote}
                        </p>
                      </div>
                    </div>

                    {/* Concrete operational checkboxes */}
                    <div className="border-t border-black/5 pt-5 space-y-3">
                      <span className="text-[9px] font-mono uppercase text-neutral-400 tracking-widest font-semibold block mb-2">Immediate Creative Action-Items</span>
                      <div className="space-y-2">
                        {DEVELOPMENT_CONCEPTS[submittedInquiry.eventType].checklist.map((item, idx) => (
                          <div key={idx} className="flex items-center space-x-2 text-xs text-neutral-600 font-light font-sans">
                            <span className="w-1.5 h-1.5 bg-[#d16126] rounded-full" />
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Transition path button */}
                  <div className="pt-4 flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => setCurrentStep('chat')}
                      className="flex-1 bg-[#f6f5f0] border border-black/10 hover:border-[#d16126] py-3.5 text-xs font-mono uppercase tracking-widest text-neutral-700 hover:text-[#d16126] transition-colors flex items-center justify-center gap-2 rounded-2xl cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-[#d16126]" />
                      <span>Vivienne Live Chat</span>
                    </button>
                    
                    <button
                      onClick={onClose}
                      className="bg-[#1a1613] text-white py-3.5 px-6 text-xs font-mono uppercase tracking-widest font-medium hover:bg-black transition-colors rounded-2xl cursor-pointer"
                    >
                      Finish Exploration
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: CONVERSATIONAL CHAT SIMULATION */}
              {currentStep === 'chat' && (
                <div className="flex flex-col h-[550px] border border-black/10 bg-[#f6f5f0] backdrop-blur-md rounded-3xl overflow-hidden relative">
                  {/* Chat header banner */}
                  <div className="bg-white p-4 border-b border-black/5 flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-8 h-8 rounded-full bg-[#d16126]/10 border border-[#d16126]/30 flex items-center justify-center text-[#d16126] text-xs font-mono font-bold">
                        V
                      </div>
                      <div className="text-left">
                        <span className="text-xs font-semibold text-neutral-900 block">Vivienne Thorne</span>
                        <span className="text-[9px] font-mono text-neutral-400 uppercase tracking-wider block">Senior Experience Architect</span>
                      </div>
                    </div>
                    {/* Status dot */}
                    <div className="flex items-center space-x-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#d16126] animate-ping" />
                      <span className="text-[9px] font-mono text-neutral-500 capitalize">Active</span>
                    </div>
                  </div>

                  {/* Message displays */}
                  <div className="flex-1 p-4 overflow-y-auto space-y-4 scrollbar-thin">
                    {chatMessages.map((msg, index) => {
                      const isPlanner = msg.sender === 'planner';
                      return (
                        <div 
                          key={index}
                          className={`flex ${isPlanner ? 'justify-start' : 'justify-end'} text-left`}
                        >
                          <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                            isPlanner 
                              ? 'bg-white border border-black/5 text-neutral-800 shadow-sm' 
                              : 'bg-[#1a1613] text-white font-light font-sans'
                          }`}>
                            <p>{msg.text}</p>
                            <span className="text-[9px] font-mono text-neutral-400 block text-right mt-1.5 uppercase">
                              {msg.time}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Quick-choice suggestions labels */}
                  <div className="p-2 border-t border-black/5 flex flex-wrap gap-1.5 bg-[#fbfaf7]">
                    {CHAT_PROMPTS.map((prompt, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendPrompt(prompt)}
                        className="text-[9px] font-mono text-neutral-600 border border-black/10 hover:border-[#d16126] hover:bg-brand-gold hover:text-white px-2.5 py-1.5 rounded-2xl bg-white transition-all duration-300 text-left hover:scale-[1.02] cursor-pointer"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>

                  {/* Input field */}
                  <div className="p-3 border-t border-black/5 flex items-center gap-2 bg-[#fbfaf7]">
                    <input
                      type="text"
                      value={userInputMessage}
                      onChange={(e) => setUserInputMessage(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && userInputMessage.trim() && (handleSendPrompt(userInputMessage.trim()), setUserInputMessage(''))}
                      placeholder="Type a creative spatial brief requirement..."
                      className="flex-1 bg-white border border-black/10 focus:border-[#d16126] text-xs px-4 py-3 rounded-2xl focus:outline-none text-neutral-900 text-left transition-colors duration-300"
                    />
                    <button
                      onClick={() => userInputMessage.trim() && (handleSendPrompt(userInputMessage.trim()), setUserInputMessage(''))}
                      className="bg-[#1a1613] hover:bg-black text-white p-3 rounded-2xl hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer"
                      aria-label="Send"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Sticky footer with phone schedule simulation */}
            <div className="p-6 border-t border-black/10 bg-[#fbfaf7] flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left animate-fade-in">
              <div>
                <span className="text-[9px] font-mono text-neutral-400 uppercase tracking-wider block">PREFER DIRECT CALLS?</span>
                <span className="text-xs text-neutral-600 block font-light">Dial executive offices at +1 (800) KBJ-VIP-EVENTS</span>
              </div>
              <button 
                onClick={() => {
                  alert('Simulation: Scheduling a premium phone consultation callback has been requested. One of our Senior Experience Directors will connect with your dial code within 15 minutes.');
                }}
                className="text-[10px] font-mono uppercase tracking-widest text-[#1a1613] hover:text-[#d16126] hover:bg-black/5 px-4 py-2 border border-black/10 rounded-2xl hover:border-[#d16126] transition-all flex items-center gap-1.5 cursor-pointer hover:scale-105 active:scale-95"
              >
                <PhoneCall className="w-3 h-3 text-[#d16126]" /> Dial Call Simulation
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
