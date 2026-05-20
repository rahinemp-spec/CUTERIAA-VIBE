
import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  color?: string;
}

const Logo: React.FC<LogoProps> = ({ className = "", size = 'md', color = 'currentColor' }) => {
  const dimensions = {
    sm: { h: 32, w: 100 },
    md: { h: 56, w: 180 },
    lg: { h: 120, w: 400 }
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <svg 
        viewBox="0 0 100 100" 
        className="w-8 md:w-10 h-8 md:h-10"
        style={{ color }}
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" className="opacity-30" />
        <path 
          d="M35 30 Q50 20 65 30" 
          stroke="currentColor" 
          strokeWidth="6" 
          strokeLinecap="round" 
        />
        <path 
          d="M30 50 Q50 80 70 50" 
          stroke="currentColor" 
          strokeWidth="8" 
          strokeLinecap="round" 
          className="opacity-90"
        />
        <circle cx="50" cy="50" r="10" fill="currentColor" />
      </svg>
      <div className="flex flex-col leading-none">
        <span className="font-display text-2xl md:text-3xl tracking-[-0.05em] uppercase">Cuteriaa</span>
        <span className="text-[7px] md:text-[8px] font-bold uppercase tracking-[0.6em] opacity-40 ml-1">Vibe</span>
      </div>
    </div>
  );
};

export default Logo;
