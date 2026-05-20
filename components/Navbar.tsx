
import React, { useState } from 'react';
import Logo from './Logo';
import { motion, AnimatePresence } from 'motion/react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  cartCount: number;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, cartCount, theme, onToggleTheme }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const tabs = [
    { id: 'home', label: 'Home' },
    { id: 'all-products', label: 'Catalog' },
    { id: 'custom', label: 'Custom AI' },
    { id: 'tracking', label: 'Tracking' },
    { id: 'contact', label: 'Contact Us' },
  ];

  const handleTabChange = (id: string) => {
    setActiveTab(id);
    setIsMenuOpen(false);
  };

  const isLight = theme === 'light';

  return (
    <>
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 backdrop-blur-xl border-b border-white/5 px-4 md:px-12 py-4 flex items-center justify-between ${
        isLight ? 'bg-white/80 border-black/5 shadow-sm' : 'bg-[#080808]/80 border-white/5'
      }`}>
        <div 
          className="flex items-center gap-2 cursor-pointer group" 
          onClick={() => handleTabChange('home')}
        >
          <Logo size="md" className={`w-20 md:w-32 transition-all group-hover:opacity-70 ${isLight ? 'text-black' : 'text-white'}`} />
        </div>

        <div className="hidden md:flex items-center gap-12">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`relative transition-all duration-300 font-medium text-[11px] tracking-[0.25em] uppercase py-1 ${
                activeTab === tab.id 
                  ? (isLight ? 'text-black' : 'text-white') 
                  : (isLight ? 'text-black/40 hover:text-black/80' : 'text-white/40 hover:text-white/80')
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <motion.div 
                  layoutId="activeTab"
                  className={`absolute -bottom-1 left-0 right-0 h-[1px] ${isLight ? 'bg-black' : 'bg-white'}`}
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4 sm:gap-6">
          <button 
            onClick={onToggleTheme}
            className={`p-2 transition-all hover:scale-110 ${isLight ? 'text-black' : 'text-white'}`}
            title={`Switch to ${isLight ? 'dark' : 'light'} mode`}
          >
            <i className={`fas ${isLight ? 'fa-moon' : 'fa-sun'} text-lg`}></i>
          </button>

          <button 
            onClick={() => handleTabChange('cart')}
            className={`relative p-2 transition-all hover:opacity-70 ${isLight ? 'text-black' : 'text-white'}`}
          >
            <i className="fas fa-shopping-bag text-lg"></i>
            <AnimatePresence>
              {cartCount > 0 && (
                <motion.span 
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className={`absolute -top-0.5 -right-0.5 text-[10px] font-bold min-w-[18px] h-[18px] flex items-center justify-center rounded-full leading-none shadow-sm ${
                    isLight ? 'bg-black text-white' : 'bg-white text-black'
                  }`}
                >
                  {cartCount}
                </motion.span>
              )}
            </AnimatePresence>
          </button>
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className={`md:hidden p-2 ${isLight ? 'text-black' : 'text-white'}`}>
            <i className={`fas ${isMenuOpen ? 'fa-times' : 'fa-bars'} text-xl`}></i>
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed inset-0 z-[45] flex flex-col items-center justify-center p-10 md:hidden ${
              isLight ? 'bg-white' : 'bg-[#080808]'
            }`}
          >
            <div className="space-y-6 md:space-y-10 text-center">
              {tabs.map((tab, idx) => (
                <motion.button
                  key={tab.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  onClick={() => handleTabChange(tab.id)}
                  className={`block w-full text-3xl sm:text-4xl md:text-5xl font-display tracking-tight leading-none ${
                    activeTab === tab.id 
                      ? (isLight ? 'text-black' : 'text-white') 
                      : (isLight ? 'text-black/20' : 'text-white/20')
                  }`}
                >
                  {tab.label}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
