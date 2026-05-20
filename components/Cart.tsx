
import React from 'react';
import { CartItem } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface CartProps {
  items: CartItem[];
  onRemove: (uniqueKey: string) => void;
  onUpdateQuantity: (uniqueKey: string, delta: number) => void;
  isOpen: boolean;
  onClose: () => void;
  onCheckout: () => void;
}

const Cart: React.FC<CartProps> = ({ items, onRemove, onUpdateQuantity, isOpen, onClose, onCheckout }) => {
  const total = items.reduce((sum, item) => sum + (typeof item.price === 'number' ? item.price : 0) * item.quantity, 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[80] flex justify-end overflow-hidden">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[var(--bg)]/80 backdrop-blur-sm" 
            onClick={onClose} 
          />
          
          <motion.div 
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="relative w-full max-w-md bg-[var(--bg)] text-[var(--text)] h-full flex flex-col border-l border-[var(--line)] shadow-2xl"
          >
            <div className="p-6 md:p-12 border-b border-[var(--line)] flex items-center justify-between">
              <h2 className="text-2xl md:text-3xl font-display uppercase tracking-tight">
                BAG / <span className="opacity-20">{items.length}</span>
              </h2>
              <button onClick={onClose} className="w-12 h-12 flex items-center justify-center opacity-40 hover:opacity-100 transition-opacity">
                <i className="fas fa-times text-lg"></i>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-12 space-y-8 md:space-y-10 custom-scrollbar">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <p className="opacity-20 font-bold uppercase tracking-[0.4em] text-[10px] mb-8">System Empty</p>
                  <button 
                    onClick={onClose}
                    className="px-10 py-5 border border-[var(--line)] hover:border-[var(--text)] opacity-40 hover:opacity-100 font-bold uppercase text-[9px] tracking-[0.3em] transition-all rounded-full"
                  >
                    Return to Catalog
                  </button>
                </div>
              ) : (
                items.map((item) => {
                  const uniqueKey = `${item.id}-${item.selectedColor}`;
                  return (
                    <div key={uniqueKey} className="flex gap-6 pb-10 border-b border-[var(--line)] group">
                      <div className="w-24 h-32 bg-[var(--card-bg)] border border-[var(--line)] overflow-hidden flex items-center justify-center">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover filter brightness-90 group-hover:brightness-100 transition-all" />
                        ) : (
                          <i className="fas fa-image opacity-10 text-xl"></i>
                        )}
                      </div>
                      <div className="flex-1 flex flex-col justify-between py-1">
                        <div>
                          <p className="text-[9px] font-bold opacity-20 uppercase tracking-[0.3em] mb-2">{item.anime || item.category}</p>
                          <h3 className="text-sm font-bold uppercase tracking-tight line-clamp-1 mb-1">{item.name}</h3>
                          <div className="flex flex-wrap gap-x-4 gap-y-1">
                            <p className="text-[10px] opacity-40 font-medium uppercase">Color / <span className="opacity-100">{item.selectedColor}</span></p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center border border-[var(--line)] rounded-full py-1 px-4">
                              <button onClick={() => onUpdateQuantity(uniqueKey, -1)} className="opacity-40 hover:opacity-100 transition-opacity px-2"><i className="fas fa-minus text-[8px]"></i></button>
                              <span className="text-[10px] font-bold min-w-[20px] text-center">{item.quantity}</span>
                              <button onClick={() => onUpdateQuantity(uniqueKey, 1)} className="opacity-40 hover:opacity-100 transition-opacity px-2"><i className="fas fa-plus text-[8px]"></i></button>
                            </div>
                          </div>
                          <p className="text-sm font-medium opacity-80">{typeof item.price === 'number' ? `৳${item.price}` : item.price}</p>
                        </div>
                      </div>
                      <button onClick={() => onRemove(uniqueKey)} className="opacity-10 hover:text-red-500 transition-colors self-start py-1">
                        <i className="fas fa-trash-alt text-xs"></i>
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {items.length > 0 && (
              <div className="p-6 md:p-12 bg-[var(--card-bg)] border-t border-[var(--line)] space-y-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center opacity-30 text-[10px] font-bold uppercase tracking-[0.4em]">
                    <span>Sub-total</span>
                    <span className="text-[var(--text)]">৳{total}</span>
                  </div>
                  <div className="flex justify-between items-center opacity-30 text-[10px] font-bold uppercase tracking-[0.4em]">
                    <span>Logistics</span>
                    <span className="italic font-medium">Pending Checkout</span>
                  </div>
                </div>
                <div className="flex justify-between items-center font-display text-3xl border-t border-[var(--line)] pt-8">
                  <span>TOTAL</span>
                  <span>৳{total}</span>
                </div>
                <button 
                  onClick={onCheckout}
                  className="w-full py-6 bg-[var(--text)] text-[var(--bg)] hover:opacity-90 font-bold text-[10px] uppercase tracking-[0.5em] transition-all rounded-full shadow-xl"
                >
                  Confirm & Checkout
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default Cart;
