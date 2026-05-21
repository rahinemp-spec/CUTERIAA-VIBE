
import React from 'react';
import Logo from './Logo';

interface FooterProps {
  onAdminClick?: () => void;
  onPolicyClick: (policy: 'shipping' | 'returns' | 'privacy' | 'terms') => void;
  onNavClick: (tab: string) => void;
}

const Footer: React.FC<FooterProps> = ({ onAdminClick, onPolicyClick, onNavClick }) => {
  return (
    <footer className="bg-[var(--bg)] border-t border-[var(--line)] py-16 sm:py-24 px-6 md:px-12 transition-colors duration-300">
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 sm:gap-20 text-[var(--text)]">
        <div className="col-span-1 md:col-span-1">
          <div className="flex items-start mb-10">
            <Logo size="md" className="w-32" />
          </div>
          <p className="opacity-30 text-[10px] leading-relaxed max-w-xs uppercase tracking-[0.2em] font-medium">
            Defining conceptual streetwear. <br/> Bangladesh Based. <br/> Worldwide Vision.
          </p>
        </div>

        <div>
          <h3 className="opacity-20 font-display text-xs uppercase tracking-[0.3em] mb-10">Archive</h3>
          <ul className="opacity-50 text-[10px] font-bold space-y-5 uppercase tracking-[0.2em]">
            <li><button onClick={() => onNavClick('all-products')} className="hover:opacity-100 transition-opacity">Shop Catalog</button></li>
            <li><button onClick={() => onNavClick('custom')} className="hover:opacity-100 transition-opacity">Design Studio</button></li>
            <li><button onClick={() => onNavClick('tracking')} className="hover:opacity-100 transition-opacity">Track Order</button></li>
            <li><button onClick={onAdminClick} className="hover:opacity-100 transition-opacity opacity-30 hover:opacity-100">Portal</button></li>
          </ul>
        </div>

        <div>
          <h3 className="opacity-20 font-display text-xs uppercase tracking-[0.3em] mb-10">Compliance</h3>
          <ul className="opacity-50 text-[10px] font-bold space-y-5 uppercase tracking-[0.2em]">
            <li><button onClick={() => onPolicyClick('shipping')} className="hover:opacity-100 transition-opacity">Logistics</button></li>
            <li><button onClick={() => onPolicyClick('returns')} className="hover:opacity-100 transition-opacity">Exchange</button></li>
            <li><button onClick={() => onPolicyClick('privacy')} className="hover:opacity-100 transition-opacity">Privacy</button></li>
            <li><button onClick={() => onPolicyClick('terms')} className="hover:opacity-100 transition-opacity">Legal</button></li>
          </ul>
        </div>

        <div>
          <h3 className="opacity-20 font-display text-xs uppercase tracking-[0.3em] mb-10">Terminal</h3>
          <div className="flex gap-8 mb-10">
            <a href="https://www.facebook.com/share/1CjdLeAjAN/?mibextid=wwXIfr" target="_blank" rel="noopener noreferrer" className="opacity-20 hover:opacity-100 transition-all">
              <i className="fab fa-facebook-f text-lg"></i>
            </a>
          </div>
          <div className="space-y-6">
            <div className="flex flex-col gap-2">
              <p className="text-[9px] font-medium uppercase opacity-20 tracking-[0.4em]">Inquiries</p>
              <a href="mailto:cuteriaavibe@gmail.com" className="text-[10px] font-bold hover:opacity-100 transition-opacity opacity-50 underline decoration-current/10 underline-offset-4 tracking-widest">cuteriaavibe@gmail.com</a>
              <a href="tel:+8801736346273" className="text-[10px] font-bold hover:opacity-100 transition-opacity opacity-50 underline decoration-current/10 underline-offset-4 tracking-widest">+88 01736 346 273</a>
            </div>
            <p className="opacity-20 text-[9px] uppercase tracking-[0.5em] font-medium flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> System Online
            </p>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto mt-24 pt-10 border-t border-[var(--line)] flex flex-col md:flex-row justify-between items-center gap-6 opacity-20 text-[9px] font-bold uppercase tracking-[0.3em]">
        <span>&copy; {new Date().getFullYear()} CUTERIAA VIBE / ALL RIGHTS RESERVED.</span>
        <div className="flex gap-12">
          <span>DHAKA / BD</span>
          <span>CURRENCY: BDT ৳</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
