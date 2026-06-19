import React from 'react';
// @ts-ignore
import emblemImg from '../assets/images/regenerated_image_1781691869736.png';

interface LogoProps {
  className?: string;
  size?: number;
  variant?: 'emblem' | 'text-only' | 'combined';
  textColor?: string;
}

export default function Logo({
  className = '',
  size = 40,
  variant = 'combined',
  textColor = 'text-neutral-800'
}: LogoProps) {
  // Premium generated image of the circular KBJ Events emblem
  const emblemSvg = (
    <img 
      src={emblemImg}
      alt="KBJ Events"
      width={size}
      height={size}
      style={{ width: `${size}px`, height: `${size}px` }}
      className={`inline-block select-none rounded-full object-cover border border-neutral-200/40 shadow-sm ${className}`}
      id="jkb-logo-emblem"
      referrerPolicy="no-referrer"
    />
  );

  if (variant === 'emblem') {
    return emblemSvg;
  }

  if (variant === 'text-only') {
    return (
      <div className={`flex flex-col text-left ${className}`} id="jkb-logo-text">
        <span className="text-[18px] sm:text-[22px] tracking-[0.35em] font-light font-serif text-[#1E1A16] uppercase">
          KBJ <span className="text-[#d16126] italic font-semibold">Events</span>
        </span>
        <span className="text-[7.5px] font-mono tracking-[0.22em] text-[#d16126]/80 uppercase mt-0.5">
          ...we plan to perfection
        </span>
      </div>
    );
  }

  // Combined style
  return (
    <div className={`flex items-center space-x-3.5 ${className}`} id="jkb-logo-combined">
      {emblemSvg}
      <div className="flex flex-col text-left leading-tight">
        <span className={`text-[15px] sm:text-[18px] tracking-[0.35em] font-normal font-serif ${textColor} uppercase`}>
          KBJ <span className="text-[#d16126] italic font-semibold">Events</span>
        </span>
        <span className="text-[7px] font-mono tracking-[0.25em] text-[#d16126] uppercase mt-0.5">
          we plan to perfection
        </span>
      </div>
    </div>
  );
}
