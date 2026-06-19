import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ClipboardList, X, CheckSquare, RefreshCw, FileText, Calendar, Compass, User, Palette } from 'lucide-react';
import { Inquiry } from '../types';

interface InquiriesDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectInquiry: (inquiry: Inquiry) => void;
}

const PRELOADED_INQUIRIES: Inquiry[] = [
  {
    id: "inq-sample-1",
    eventType: "weddings",
    fullName: "Alexandra Sterling",
    email: "alexandra@sterlingholdings.com",
    phone: "+44 7700 900077",
    date: "August 20, 2026",
    guestCount: "42 Intimate Guests",
    budgetRange: "Premium Budget ($50K+)",
    message: "A well-coordinated garden ceremony with premium seating plans and professional layout management. Focus heavily on smooth flow and guest care.",
    submittedAt: "2026-06-10",
    status: "Proposal Ready",
    proposalConcept: {
      themeName: "Sophisticated Elegance",
      description: "A beautifully structured wedding under a premium garden pavilion, managed with seamless timeline coordination, high-precision seating designs, and customized flower installations.",
      palette: ["Champagne", "Antique Gold", "Blush Rose", "Warm Cream"],
      venueVibe: "Premium banquet halls, high-glass garden glasshouses, or historical estates in Abuja.",
      decorNote: "Warm candlelit long tables, soft floral accents, and custom hand-lettered guest cards."
    }
  },
  {
    id: "inq-sample-2",
    eventType: "corporate",
    fullName: "Hidetoshi Sato",
    email: "sato@vaportech.jp",
    phone: "+81 90-1234-5678",
    date: "October 12, 2026",
    guestCount: "300 Guests",
    budgetRange: "Grandiose Scale ($100K - $250K)",
    message: "Flawless planning of a corporate product launch. Requirements include strict AV stage timing and a seamless registration workflow.",
    submittedAt: "2026-06-12",
    status: "Designing Concept",
    proposalConcept: {
      themeName: "Precision & Impact",
      description: "Planning and coordinating a complete corporate summit in Maitama. Logistics include RSVP tracking, professional guest check-ins, and high-definition stage coordination.",
      palette: ["Executive Slate", "Corporate Blue", "Silver Accent", "Pure White"],
      venueVibe: "Modern convention center, executive pavilion, or upscale auditorium in Maitama.",
      decorNote: "Floating stage elements, high-definition digital podiums, and professional lounge layouts."
    }
  }
];

export default function InquiriesDashboard({ isOpen, onClose, onSelectInquiry }: InquiriesDashboardProps) {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);

  const loadInquiries = () => {
    const existing = localStorage.getItem('gatherInquiries');
    const localInquiries: Inquiry[] = existing ? JSON.parse(existing) : [];
    
    // De-duplicate sample inquiries just in case
    const merged = [...localInquiries];
    PRELOADED_INQUIRIES.forEach(sample => {
      if (!merged.some(inq => inq.id === sample.id)) {
        merged.push(sample);
      }
    });
    
    setInquiries(merged);
  };

  useEffect(() => {
    if (isOpen) {
      loadInquiries();
    }
  }, [isOpen]);

  // Simulate updating the workflow status
  const handleTransitionStatus = (id: string, currentStatus: Inquiry['status']) => {
    let nextStatus: Inquiry['status'] = 'Received';
    if (currentStatus === 'Received') nextStatus = 'Designing Concept';
    else if (currentStatus === 'Designing Concept') nextStatus = 'Proposal Ready';
    else nextStatus = 'Received';

    const updated = inquiries.map(inq => {
      if (inq.id === id) {
        return { ...inq, status: nextStatus };
      }
      return inq;
    });

    setInquiries(updated);

    // Save only non-sample inquiries back to local storage
    const customOnly = updated.filter(inq => !inq.id.startsWith('inq-sample-'));
    localStorage.setItem('gatherInquiries', JSON.stringify(customOnly));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-[#1a1613]/55 backdrop-blur-sm flex justify-center items-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, y: 15 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 15 }}
            className="bg-[#fbfaf7] border border-black/10 text-neutral-800 w-full max-w-4xl h-[80vh] overflow-hidden rounded-3xl flex flex-col shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 border-b border-black/5 flex justify-between items-center bg-[#fbfaf7]/80">
              <div className="flex items-center space-x-3 text-left">
                <div className="p-2.5 bg-[#d16126]/10 rounded-full border border-[#d16126]/30 text-[#d16126]">
                  <ClipboardList className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-serif text-neutral-900">Client Portal & Proposal Center</h3>
                  <p className="text-xs text-neutral-500 font-light mt-0.5">
                    Review event coordination submissions, progress planning stages, and view structured checklists.
                  </p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 text-neutral-400 hover:text-black rounded-full bg-white border border-black/10 transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Inquiries table list */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {inquiries.length === 0 ? (
                <div className="h-48 flex flex-col justify-center items-center text-center text-neutral-400">
                  <Compass className="w-8 h-8 animate-spin mb-2 text-neutral-400" />
                  <p className="text-xs font-mono">No registered event briefs on this device.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {inquiries.map((inq) => (
                    <div 
                      key={inq.id}
                      className="border border-black/5 bg-white hover:border-[#d16126]/40 p-5 rounded-2xl transition-all text-left space-y-4 hover:shadow-md"
                    >
                      {/* Top banner alignment */}
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-black/5 pb-3">
                        <div className="space-y-1">
                          <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-[#d16126]">
                            Ref: {inq.id}
                          </span>
                          <h4 className="text-sm font-serif font-semibold text-neutral-900 flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-neutral-400" /> {inq.fullName}
                          </h4>
                        </div>

                        {/* Status elements */}
                        <div className="flex flex-wrap items-center gap-2">
                          {/* Active state indicator */}
                          <span className={`text-[9px] font-mono uppercase tracking-widest px-2.5 py-1 rounded-full border ${
                            inq.status === 'Proposal Ready' 
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                              : inq.status === 'Designing Concept'
                              ? 'bg-amber-50 border-amber-200 text-amber-700'
                              : 'bg-neutral-50 border-black/5 text-neutral-500'
                          }`}>
                            ● {inq.status}
                          </span>

                           {/* Trigger transition action */}
                          <button
                            onClick={() => handleTransitionStatus(inq.id, inq.status)}
                            className="text-[9px] font-mono tracking-wider border border-black/10 hover:border-[#d16126] px-3 py-1.5 text-neutral-600 hover:text-[#d16126] flex items-center gap-1.5 rounded-2xl transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
                            title="Simulate state progression"
                          >
                            <RefreshCw className="w-3 h-3 animate-spin-slow" /> Progress
                          </button>

                          {/* View Full Concept */}
                          <button
                            onClick={() => onSelectInquiry(inq)}
                            className="text-[9px] font-mono tracking-wider bg-[#1a1613] text-white font-bold hover:bg-black px-3 py-1.5 rounded-2xl transition-all duration-300 flex items-center gap-1 hover:scale-105 active:scale-95 cursor-pointer shadow-sm"
                          >
                            <FileText className="w-3 h-3 text-brand-gold" /> View Proposal
                          </button>
                        </div>
                      </div>

                      {/* Summary details */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono text-neutral-500">
                        <div className="flex items-center gap-1.5">
                          <Compass className="w-3.5 h-3.5 text-[#d16126]" />
                          <span>Type: <b className="text-neutral-800 capitalize font-medium">{inq.eventType}</b></span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-[#d16126]" />
                          <span>Date: <b className="text-neutral-800 font-medium">{inq.date}</b></span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Palette className="w-3.5 h-3.5 text-[#d16126]" />
                          <span>Budget: <b className="text-neutral-800 italic font-medium">{inq.budgetRange.split(' ')[0]}</b></span>
                        </div>
                      </div>

                      {/* Brief request details */}
                      <p className="text-xs text-neutral-600 leading-relaxed font-light pl-5 border-l border-black/10 bg-[#f9f8f4] py-2 rounded-r-lg pr-3">
                        <b className="text-neutral-800 font-medium">Core Vision:</b> "{inq.message}"
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Bottom notification */}
            <div className="p-4 border-t border-black/5 bg-[#f6f5f0] text-center">
              <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest block">
                * Standard client portfolios are simulated using client-side registry configurations.
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
