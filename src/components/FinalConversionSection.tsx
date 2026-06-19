import React, { useState } from 'react';
import { motion } from 'motion/react';
import { MessageSquare, Sparkles, Send, Calendar, Users, Phone, Mail, MapPin } from 'lucide-react';
import { EventType } from '../types';
import { useCMS } from '../lib/cmsState';

interface FinalConversionSectionProps {
  onPlanClick: (category?: EventType) => void;
  onPlanSubmitDirect: (data: { eventType: EventType; date: string; budgetRange: string; message: string; fullName: string; email: string }) => void;
}

export default function FinalConversionSection({ onPlanClick, onPlanSubmitDirect }: FinalConversionSectionProps) {
  const { state } = useCMS();
  const visibleCategories = (state.eventCategories || []).filter(cat => cat.visible !== false);

  const [eventType, setEventType] = useState<EventType>('weddings');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [date, setDate] = useState('');
  const [budgetRange, setBudgetRange] = useState('');
  const [message, setMessage] = useState('');

  const [formSubmitted, setFormSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email) return;

    // Call callback to open the sliding proposal console populated with this data
    onPlanSubmitDirect({
      eventType,
      date,
      budgetRange,
      message,
      fullName,
      email
    });

    setFormSubmitted(true);
    setTimeout(() => {
      setFormSubmitted(false);
      // clean form values
      setFullName('');
      setEmail('');
      setDate('');
      setBudgetRange('');
      setMessage('');
    }, 2000);
  };

  return (
    <section id="conversion-section" className="py-24 sm:py-32 bg-[#12100e] text-[#eae6df] relative overflow-hidden border-t border-white/5">
      {/* Decorative architectural borders */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      
      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-20 items-stretch">
          
          {/* Left Column: Direct Agency Signatures & Text */}
          <div className="lg:col-span-5 flex flex-col justify-between">
            <div className="space-y-6">
              <span className="text-[10px] font-mono tracking-[0.3em] text-brand-gold uppercase block">Start Your Event Planning</span>
              <h2 className="text-4xl sm:text-5xl font-serif tracking-tight leading-tight text-[#fbfaf7] editorial-kerning-expand-lg">
                Let's plan your <br />
                <span className="italic font-light text-[#eae6df]/55">next key milestone.</span>
              </h2>
              <p className="text-sm font-light text-neutral-300 leading-relaxed max-w-md">
                We provide full-service event planning, direct coordination, and expert consultations. Fill out our form and Vivienne, our Lead Planner, will formulate a structured blueprint and coordinate next steps with you.
              </p>
            </div>

            {/* Direct Contacts Block */}
            <div className="space-y-6 mt-12 pt-8 border-t border-white/5">
              <div className="flex items-start space-x-3 text-left">
                <MapPin className="w-4 h-4 text-brand-gold mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-xs font-mono uppercase tracking-widest text-[#fbfaf7]/40">Abuja Studio</h4>
                  <p className="text-sm font-light text-[#eae6df]/80 mt-0.5">14 Maitama Avenue, Suite 100, Abuja, Nigeria</p>
                </div>
              </div>

              <div className="flex items-start space-x-3 text-left">
                <Phone className="w-4 h-4 text-brand-gold mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-xs font-mono uppercase tracking-widest text-[#fbfaf7]/40">Executive Planner Concierge</h4>
                  <p className="text-sm font-light text-[#eae6df]/80 mt-0.5">+234 (81) 2345-6789 (Mon–Sat, 9am–7pm)</p>
                </div>
              </div>

              <div className="flex items-start space-x-3 text-left">
                <Mail className="w-4 h-4 text-brand-gold mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-xs font-mono uppercase tracking-widest text-[#fbfaf7]/40">General Enquiries</h4>
                  <p className="text-sm font-light text-[#eae6df]/80 mt-0.5">planning@gatherplanning.com</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Dynamic Simple Form */}
          <div className="lg:col-span-7 bg-[#1a1816] border border-white/10 rounded-3xl p-6 sm:p-10 relative shadow-[0_20px_60px_rgba(0,0,0,0.3)]">
            <div className="mb-6 text-left">
              <h3 className="text-xl font-serif text-[#fbfaf7] editorial-kerning-expand">Consultation Initializer</h3>
              <p className="text-xs text-neutral-400 font-light mt-1">
                Your selections will outline your event timeline and coordination scope.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Client Base Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                <div className="space-y-1">
                  <label className="text-[9px] font-mono uppercase tracking-widest text-neutral-400">Your Full Name</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Marcus Thorne"
                    className="w-full bg-[#12100e]/70 border border-white/10 rounded-2xl px-4 py-3 text-xs focus:outline-none focus:border-[#d16126] focus:bg-[#12100e] hover:border-white/20 transition-all text-left text-[#eae6df] font-light placeholder:text-neutral-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-mono uppercase tracking-widest text-neutral-400">Signature Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="marcus@vanguard.com"
                    className="w-full bg-[#12100e]/70 border border-white/10 rounded-2xl px-4 py-3 text-xs focus:outline-none focus:border-[#d16126] focus:bg-[#12100e] hover:border-white/20 transition-all text-left text-[#eae6df] font-light placeholder:text-neutral-500"
                  />
                </div>
              </div>

              {/* Event Type / Ideal Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                <div className="space-y-1">
                  <label className="text-[9px] font-mono uppercase tracking-widest text-brand-gold">Type of Sensation</label>
                  <select
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value as EventType)}
                    className="w-full bg-[#12100e]/70 border border-white/10 rounded-2xl px-4 py-3 text-xs focus:outline-none focus:border-[#d16126] focus:bg-[#1a1816] hover:border-white/20 transition-all text-left text-[#eae6df] font-light"
                  >
                    {visibleCategories.map((cat) => (
                      <option key={cat.id} value={cat.id} className="bg-[#1a1816] text-[#eae6df]">
                        {cat.title} Experience
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-mono uppercase tracking-widest text-neutral-400">Target Date Frame</label>
                  <input
                    type="text"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    placeholder="Autumn Solstice 2026"
                    className="w-full bg-[#12100e]/70 border border-white/10 rounded-2xl px-4 py-3 text-xs focus:outline-none focus:border-[#d16126] focus:bg-[#12100e] hover:border-white/20 transition-all text-left text-[#eae6df] font-light placeholder:text-neutral-500"
                  />
                </div>
              </div>

              {/* Budget Threshold Selection */}
              <div className="space-y-1 text-left">
                <label className="text-[9px] font-mono uppercase tracking-widest text-neutral-400">Expected Decor & Planning Tier</label>
                <select
                  value={budgetRange}
                  onChange={(e) => setBudgetRange(e.target.value)}
                  className="w-full bg-[#12100e]/70 border border-white/10 rounded-2xl px-4 py-3 text-xs focus:outline-none focus:border-[#d16126] focus:bg-[#1a1816] hover:border-white/20 transition-all text-left text-[#eae6df] font-light"
                >
                  <option value="" className="bg-[#1a1816] text-neutral-500">Choose an initial spectrum...</option>
                  <option value="Intimate Boutique ($25K - $50K)" className="bg-[#1a1816] text-[#eae6df]">Intimate Boutique ($25K - $50K)</option>
                  <option value="Heritage Premium ($50K - $100K)" className="bg-[#1a1816] text-[#eae6df]">Heritage Premium ($50K - $100K)</option>
                  <option value="Grandiose Opulence ($100K - $250K)" className="bg-[#1a1816] text-[#eae6df]">Grandiose Opulence ($100K - $250K)</option>
                  <option value="Unconstrained Visionary ($250K+)" className="bg-[#1a1816] text-[#eae6df]">Unconstrained Visionary ($250K+)</option>
                </select>
              </div>

              {/* Message Details */}
              <div className="space-y-1 text-left">
                <label className="text-[9px] font-mono uppercase tracking-widest text-neutral-400">Vision Statement & Priority Goals</label>
                <textarea
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Detail your goals, structural constraints, or themes we must prioritize..."
                  className="w-full bg-[#12100e]/70 border border-white/10 rounded-2xl px-4 py-3 text-xs focus:outline-none focus:border-[#d16126] focus:bg-[#12100e] hover:border-white/20 transition-all text-left text-[#eae6df] font-light resize-none leading-relaxed placeholder:text-neutral-500"
                />
              </div>

              {/* Primary submit action */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={formSubmitted}
                  className="w-full bg-[#fbfaf7] text-[#12100e] text-xs font-mono font-bold uppercase tracking-[0.25em] py-4 rounded-xl hover:bg-[#eae6df] transition-all flex items-center justify-center gap-1.5 active:scale-99 cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5 text-brand-gold" />
                  <span>{formSubmitted ? 'Concept Compiled!' : 'Start Planning With Us'}</span>
                </button>
              </div>

              {/* Secondary chat-with-planner action */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => onPlanClick(eventType)}
                  className="w-full bg-[#1a1816] hover:bg-[#201d1a] text-neutral-300 border border-white/10 rounded-xl text-xs font-mono uppercase tracking-widest py-3 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Chat With an Event Planner</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
