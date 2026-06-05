
import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  color?: string;
}

const Logo: React.FC<LogoProps> = ({ className = "", size = 'md', color = 'currentColor' }) => {
  // Define dimensions based on modern aspect ratios and sizing
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-9 h-9 md:w-10 md:h-10",
    lg: "w-16 h-16 md:w-20 md:h-20"
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="relative flex-shrink-0">
        <img
          src="https://i.pinimg.com/736x/9b/e2/7c/9be27c432d206932eb1db98182db3708.jpg"
          alt="Cuteriaa Logo"
          referrerPolicy="no-referrer"
          className={`${sizeClasses[size]} rounded-full object-cover border border-zinc-800 shadow-md`}
        />
        <div className="absolute inset-0 rounded-full border border-white/5 pointer-events-none" />
      </div>
      <div className="flex flex-col leading-none">
        <span className="font-display text-2xl md:text-3xl tracking-[-0.05em] uppercase">Cuteriaa</span>
        <span className="text-[7px] md:text-[8px] font-bold uppercase tracking-[0.6em] opacity-40 ml-1">Vibe</span>
      </div>
    </div>
  );
};

export default Logo;
