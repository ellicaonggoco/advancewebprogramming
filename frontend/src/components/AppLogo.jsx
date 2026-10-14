import React, { useState } from 'react';

/**
 * AppLogo Component
 * Styled in the user's requested #39333B velvet aubergine luxury color family.
 * Clean, maximized typography without generic enterprise pills.
 * Supports custom image logo (/logo.png or /logo.svg) with geometric SVG fallback.
 */
export default function AppLogo({ 
  size = 'md', 
  showText = true, 
  inverted = false,
  customLogoUrl = '/logo.png',
  className = ''
}) {
  const [imageError, setImageError] = useState(false);

  const dimensions = {
    sm: { 
      icon: 'w-9 h-9', 
      svg: 'w-5 h-5', 
      text: 'text-base', 
      sub: 'text-[10px]' 
    },
    md: { 
      icon: 'w-12 h-12', 
      svg: 'w-6 h-6', 
      text: 'text-xl', 
      sub: 'text-[11px]' 
    },
    lg: { 
      icon: 'w-16 h-16', 
      svg: 'w-9 h-9', 
      text: 'text-3xl', 
      sub: 'text-xs' 
    },
  }[size] || { 
    icon: 'w-12 h-12', 
    svg: 'w-6 h-6', 
    text: 'text-xl', 
    sub: 'text-[11px]' 
  };

  return (
    <div className={`flex items-center gap-3.5 select-none ${className}`}>
      {/* Maximized Logo Emblem */}
      <div 
        className={`${dimensions.icon} rounded-2xl flex items-center justify-center shrink-0 border transition-all duration-200 overflow-hidden ${
          inverted 
            ? 'bg-[#39333B] border-[#5E4761] ring-1 ring-[#DFC090]/35 text-white shadow-lg shadow-black/20' 
            : 'bg-[#39333B] border-[#463C4A] text-white shadow-md'
        }`}
      >
        {!imageError && customLogoUrl ? (
          <img 
            src={customLogoUrl} 
            alt="Logo" 
            onError={() => setImageError(true)}
            className="w-full h-full object-contain p-1 rounded-2xl transition-transform hover:scale-105 duration-200"
          />
        ) : (
          /* Geometric Executive Emblem in #39333B & Champagne Gold */
          <svg 
            viewBox="0 0 24 24" 
            fill="none" 
            className={dimensions.svg}
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Outer precision ring */}
            <circle cx="12" cy="12" r="9" stroke="#E8E1EA" strokeWidth="1.5" strokeOpacity="0.45" />
            
            {/* 12 o'clock luxury notch */}
            <line x1="12" y1="4" x2="12" y2="6" stroke="#DFC090" strokeWidth="2.2" strokeLinecap="round" />
            
            {/* 3, 6, 9 ticks */}
            <circle cx="19" cy="12" r="0.8" fill="#E8E1EA" fillOpacity="0.7" />
            <circle cx="12" cy="19" r="0.8" fill="#E8E1EA" fillOpacity="0.7" />
            <circle cx="5" cy="12" r="0.8" fill="#E8E1EA" fillOpacity="0.7" />
            
            {/* Precision Hour Hand (pointing at 9) */}
            <line x1="12" y1="12" x2="7.5" y2="12" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
            {/* Precision Minute Hand (pointing at 12) */}
            <line x1="12" y1="12" x2="12" y2="7" stroke="#DFC090" strokeWidth="2" strokeLinecap="round" />
            
            {/* Center jewel hub */}
            <circle cx="12" cy="12" r="1.6" fill="#DFC090" />
            <circle cx="12" cy="12" r="0.7" fill="#39333B" />
          </svg>
        )}
      </div>

      {/* Maximized Aesthetic Brand Wordmark */}
      {showText && (
        <div className="flex flex-col justify-center">
          <span className={`font-extrabold tracking-tight leading-none ${dimensions.text} ${inverted ? 'text-white' : 'text-[#39333B]'}`}>
            Attend<span className="text-[#DFC090]">Ease</span>
          </span>
          <p className={`${dimensions.sub} font-medium tracking-wider uppercase mt-1 ${inverted ? 'text-[#DCD3DF]' : 'text-slate-500'}`}>
            Attendance System
          </p>
        </div>
      )}
    </div>
  );
}
