import React from 'react';
import { motion } from 'motion/react';
import { useCMS } from '../lib/cmsState';
import { Mail, Linkedin, Users } from 'lucide-react';

export default function TeamSection() {
  const { state } = useCMS();
  const team = state.teamMembers || [];

  return (
    <section id="team-section" className="py-24 sm:py-32 bg-[#faf8f5] text-neutral-800 relative overflow-hidden border-t border-black/5">
      {/* Decorative vertical guide line */}
      <div className="absolute top-0 left-1/4 w-px h-full bg-black/[0.03] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 sm:mb-24 gap-8">
          <div className="max-w-xl">
            <span className="text-[10px] font-mono tracking-[0.3em] text-brand-gold uppercase block mb-3">
              EXPERT PLANNING TEAM
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif tracking-tight leading-tight text-neutral-800">
              The professionals behind <br />
              <span className="italic font-light text-neutral-500">your flawless events.</span>
            </h2>
          </div>
          <p className="max-w-md text-neutral-600 text-[13px] font-light leading-relaxed">
            We are certified, highly experienced event coordinators and planners. Our team brings logistical excellence, clear communication, and exceptional taste to weddings, corporate events, and consultations in Abuja.
          </p>
        </div>

        {/* Team Grid layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12 lg:gap-16">
          {team.map((member, index) => (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: index * 0.15 }}
              className="group space-y-6 flex flex-col text-left"
            >
              {/* Profile Portrait card with elegant scaling */}
              <div className="relative aspect-[3/4.2] w-full overflow-hidden rounded-3xl border border-black/5 bg-[#fbfaf7] shadow-sm transition-all duration-700 group-hover:scale-[1.02] group-hover:shadow-md">
                <img
                  src={member.portrait || undefined}
                  alt={member.name}
                  className="w-full h-full object-cover grayscale transition-transform duration-[1.5s] group-hover:scale-105 group-hover:grayscale-0"
                  referrerPolicy="no-referrer"
                />
                
                {/* Visual Glass Hover Plate */}
                <div className="absolute inset-0 bg-transparent transition-all duration-500 group-hover:bg-black/40 flex items-end justify-start p-6">
                  {/* Dynamic icon connections on hover */}
                  <div className="flex items-center space-x-3.5 translate-y-6 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                    {member.socialLinks?.email && (
                      <a 
                        href={`mailto:${member.socialLinks.email}`} 
                        className="w-8 h-8 rounded-full bg-white text-neutral-800 flex items-center justify-center border border-black/10 hover:bg-brand-gold hover:text-white hover:scale-105 transition-all cursor-pointer"
                      >
                        <Mail className="w-3.5 h-3.5" />
                      </a>
                    )}
                    {member.socialLinks?.linkedin && (
                      <a 
                        href={`https://linkedin.com/in/${member.socialLinks.linkedin}`} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="w-8 h-8 rounded-full bg-white text-neutral-800 flex items-center justify-center border border-black/10 hover:bg-brand-gold hover:text-white hover:scale-105 transition-all cursor-pointer"
                      >
                        <Linkedin className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Descriptions */}
              <div className="space-y-2">
                <div className="flex justify-between items-baseline">
                  <h4 className="text-lg font-serif text-neutral-800 tracking-wide">
                    {member.name}
                  </h4>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#d16126] font-medium">
                    {member.role.split(' ')[0]}
                  </span>
                </div>
                <p className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 block pb-1 border-b border-black/[0.05]">
                  {member.role}
                </p>
                <p className="text-xs text-neutral-600 font-light leading-relaxed font-sans pt-1">
                  {member.bio}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
