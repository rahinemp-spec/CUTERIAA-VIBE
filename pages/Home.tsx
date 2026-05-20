
import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface HomeProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
  onQuickView: (product: Product) => void;
  onExploreProducts: () => void;
  onCustomDesign: () => void;
}

const HeroSlider = ({ products, onQuickView }: { products: Product[], onQuickView: (product: Product) => void }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const featured = products.filter(p => p.isFeatured);
  
  useEffect(() => {
    if (featured.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % featured.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [featured.length]);

  if (featured.length === 0) return null;

  const currentItem = featured[currentIndex];

  return (
    <div className="relative w-full max-w-sm aspect-[3/4] group cursor-pointer" onClick={() => onQuickView(currentItem)}>
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0 w-full h-full"
        >
          {currentItem.image && (
            <img
              src={currentItem.image}
              alt={currentItem.name}
              className="w-full h-full object-cover transition-all duration-1000 group-hover:scale-105"
            />
          )}
          {!currentItem.image && <div className="w-full h-full bg-[#111]" />}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </motion.div>
      </AnimatePresence>
      
      <div className="absolute bottom-8 left-8 right-8 z-10">
        <motion.p 
          key={`name-${currentIndex}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-[10px] font-medium uppercase tracking-[0.4em] text-white/60 mb-2"
        >
          {currentItem.category}
        </motion.p>
        <motion.h3 
          key={`title-${currentIndex}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-2xl font-display text-white tracking-tight leading-none"
        >
          {currentItem.name}
        </motion.h3>
      </div>

      <div className="absolute top-8 right-8 flex gap-2">
        {featured.map((_, idx) => (
          <div 
            key={idx} 
            className={`h-[1px] transition-all duration-500 ${idx === currentIndex ? 'w-8 bg-white' : 'w-4 bg-white/20'}`} 
          />
        ))}
      </div>
    </div>
  );
};

export default function Home({ products, onAddToCart, onQuickView, onExploreProducts, onCustomDesign }: HomeProps) {
  const featuredProducts = products.filter(p => p.isFeatured);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] }
    }
  };

  return (
    <div className="bg-[var(--bg)] text-[var(--text)] transition-colors duration-300 overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative min-h-[100vh] flex items-center pt-24 sm:pt-32 pb-12 sm:pb-20 px-4 md:px-12">
        <div className="absolute top-0 right-0 w-full md:w-1/2 h-full bg-[var(--card-bg)] grid-line-v z-0" />
        
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="relative z-10 w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-20 items-center"
        >
          <div className="max-w-2xl">
            <motion.div variants={itemVariants} className="flex items-center gap-4 mb-4 sm:mb-8">
              <span className="w-8 h-[1px] bg-white/20" />
              <span className="text-[9px] sm:text-[10px] font-medium uppercase tracking-[0.3em] sm:tracking-[0.5em] text-white/50">
                Premium Drop v.26
              </span>
            </motion.div>

            <motion.h1 
              variants={itemVariants}
              className="text-[14vw] sm:text-[12vw] lg:text-[10vw] font-display leading-[0.8] tracking-tighter mb-8 sm:mb-10"
            >
              CUTERIAA <br/> <span className="opacity-20">VIBE</span>
            </motion.h1>

            <motion.p 
              variants={itemVariants}
              className="text-xs sm:text-sm md:text-base text-white/40 mb-8 sm:mb-12 max-w-md font-medium leading-relaxed uppercase tracking-wider"
            >
              Conceptual utility gear formulated with premium architectural materials. Redefining the blueprint of modern Bangladesh lifestyle carry.
            </motion.p>

            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-6 sm:gap-8">
              <button 
                onClick={onExploreProducts}
                className="group relative flex items-center gap-4 text-[10px] font-bold uppercase tracking-[0.3em]"
              >
                <span className="relative z-10">Explore Catalog</span>
                <div className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all">
                  <i className="fas fa-arrow-right text-[10px]" />
                </div>
              </button>
              
              <button 
                onClick={onCustomDesign}
                className="group relative flex items-center gap-4 text-[10px] font-bold uppercase tracking-[0.3em]"
              >
                <span className="relative z-10">AI Lab</span>
                <div className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all">
                  <i className="fas fa-microchip text-[10px]" />
                </div>
              </button>
            </motion.div>
          </div>

          <motion.div 
            variants={itemVariants}
            className="flex justify-center lg:justify-end"
          >
            < HeroSlider products={products} onQuickView={onQuickView} />
          </motion.div>
        </motion.div>

        {/* Decorative Grid Numbers */}
        <div className="absolute bottom-12 left-12 hidden md:block">
          <p className="font-display text-8xl text-white/5 leading-none">01</p>
        </div>
      </section>

      {/* Featured Collection */}
      {featuredProducts.length > 0 && (
        <section className="py-32 px-6 md:px-12 max-w-7xl mx-auto border-t border-[var(--line)]">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 md:mb-24 gap-6 md:gap-8"
          >
            <div className="max-w-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-2 h-2 rounded-full bg-[var(--text)] animate-pulse" />
                <span className="text-[10px] font-medium uppercase tracking-[0.4em] opacity-40">Latest Releases</span>
              </div>
              <h2 className="text-4xl sm:text-5xl md:text-7xl font-display tracking-tight leading-none uppercase">THE BLUEPRINT COLLECTION</h2>
            </div>
            <button 
              onClick={onExploreProducts}
              className="text-[11px] font-bold uppercase tracking-[0.3em] opacity-60 hover:opacity-100 transition-opacity"
            >
              View Full Archive
            </button>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-20 gap-x-12">
            {featuredProducts.map((product, idx) => (
              <motion.div 
                key={product.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="group cursor-pointer"
                onClick={() => onQuickView(product)}
              >
                <div className="relative aspect-[3/4] overflow-hidden bg-[var(--card-bg)] mb-8">
                  {product.image && (
                    <img 
                      src={product.image} 
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 filter brightness-90 group-hover:brightness-100"
                    />
                  )}
                  <div className="absolute top-6 left-6 flex flex-col gap-2">
                    <span className="text-[9px] font-bold uppercase tracking-[0.2em] bg-[var(--text)] text-[var(--bg)] px-2 py-1">
                      {product.color || (product.colors && product.colors[0]) || 'Standard'}
                    </span>
                    {product.colors && product.colors.length > 1 && (
                      <span className="text-[8px] font-bold uppercase tracking-[0.1em] bg-[var(--bg)]/60 backdrop-blur-md opacity-80 px-2 py-1 border border-[var(--line)] self-start">
                        +{product.colors.length - 1} Variants
                      </span>
                    )}
                    {product.isComingSoon && (
                      <span className="text-[9px] font-bold uppercase tracking-[0.2em] bg-blue-500 text-white px-2 py-1">
                        COMING SOON
                      </span>
                    )}
                  </div>
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-[10px] font-bold uppercase tracking-[0.4em] border border-white px-6 py-3 text-white">Quick View</span>
                  </div>
                </div>
                
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[9px] font-medium opacity-30 uppercase tracking-[0.3em] mb-2">{product.anime || product.category}</p>
                    <h3 className="text-xl font-display tracking-tight transition-colors uppercase">{product.name}</h3>
                  </div>
                  <span className="text-lg font-medium tracking-tight opacity-80">{typeof product.price === 'number' ? `৳${product.price}` : product.price}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Philosophy Section - Minimal Rail Concept */}
      <section className="border-t border-[var(--line)] bg-[var(--bg)]/50">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[var(--line)]">
          {[
            { title: "Technical Core", desc: "High-density technical fabrics. Water-resistant and engineered for structural longevity." },
            { title: "Conceptual Art", desc: "Original anime-inspired gear bridging functionality and street culture." },
            { title: "Local Express", desc: "Cloud-enabled tracking and lightning delivery across all 64 districts." }
          ].map((item, idx) => (
            <div key={idx} className="p-12 md:p-20 group hover:bg-[var(--text)]/[0.02] transition-colors">
              <span className="text-[10px] font-display opacity-10 mb-8 block">0{idx + 2}</span>
              <h4 className="text-2xl font-display tracking-tight mb-6">{item.title}</h4>
              <p className="text-xs opacity-30 leading-relaxed uppercase tracking-wider font-medium">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

