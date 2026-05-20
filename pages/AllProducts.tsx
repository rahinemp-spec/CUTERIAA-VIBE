
import React, { useState, useEffect } from 'react';
import { PRODUCTS as INITIAL_PRODUCTS } from '../constants';
import { Product } from '../types';
import { sheetApi } from '../services/api';
import { motion, AnimatePresence } from 'motion/react';
import { normalizeColors } from '../utils/colorUtils';

interface AllProductsProps {
  onAddToCart: (product: Product) => void;
  onQuickView: (product: Product) => void;
}

const safeParseJSON = (str: any) => {
  if (!str) return [];
  if (Array.isArray(str)) return str;
  try {
    return JSON.parse(str);
  } catch (e) {
    return [];
  }
};

const AllProducts: React.FC<AllProductsProps> = ({ onAddToCart, onQuickView }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>(['All']);
  const [filter, setFilter] = useState('All');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      
      const savedProducts = localStorage.getItem('cuteriaa_products');
      if (savedProducts) {
        try {
          const parsed = JSON.parse(savedProducts);
          if (Array.isArray(parsed)) {
            const formatted = parsed.map(p => ({
              ...p,
              images: safeParseJSON(p.images),
              colors: normalizeColors(p.colors)
            }));
            setProducts(formatted);
          }
        } catch (e) {}
      } else {
        setProducts(INITIAL_PRODUCTS);
      }

      const cloudProds = await sheetApi.fetchProducts();
      if (cloudProds && Array.isArray(cloudProds)) {
        const formatted = cloudProds.map((p: any) => ({
          ...p,
          images: safeParseJSON(p.images),
          colors: normalizeColors(p.colors)
        }));
        setProducts(formatted);
      }

      const cloudCats = await sheetApi.fetchCategories();
      let catNames = ['All'];
      if (cloudCats && Array.isArray(cloudCats)) {
        const names = cloudCats.map(c => typeof c === 'string' ? c : (c.name || ''));
        catNames = ['All', ...names.filter(n => n !== '')];
      }
      setCategories(catNames);
      setIsLoading(false);
    };

    init();
  }, []);

  const filteredProducts = filter === 'All' 
    ? products 
    : products.filter(p => p.anime === filter || p.category === filter);

  return (
    <div className="bg-[var(--bg)] min-h-screen pt-40 pb-24 px-6 md:px-12 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-24 gap-8">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <span className="w-8 h-[1px] bg-[var(--line)]" />
              <span className="text-[10px] font-medium uppercase tracking-[0.4em] opacity-40">Archive Explore</span>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-8xl font-display tracking-tight leading-none uppercase">Full Blueprint</h1>
          </div>
          {isLoading && (
            <div className="flex items-center gap-2">
              <div className="w-1 h-1 rounded-full bg-[var(--text)] animate-ping" />
              <div className="text-[10px] font-bold uppercase tracking-widest opacity-30">Pulling Cloud Data...</div>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-24">
          {categories.map((cat, idx) => (
            <button
              key={idx}
              onClick={() => setFilter(cat)}
              className={`px-8 py-4 text-[10px] font-bold uppercase tracking-[0.3em] transition-all rounded-full border ${
                filter === cat 
                  ? 'bg-[var(--text)] border-[var(--text)] text-[var(--bg)] shadow-lg' 
                  : 'bg-transparent border-[var(--line)] opacity-40 hover:opacity-100 hover:border-[var(--text)]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-10 gap-y-24">
          <AnimatePresence mode="popLayout">
            {filteredProducts.map((product, idx) => (
              <motion.div 
                key={product.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.4 }}
                className="group cursor-pointer"
                onClick={() => onQuickView(product)}
              >
                <div className="relative aspect-[3/4] overflow-hidden bg-[var(--card-bg)] mb-8">
                  {product.image && (
                    <img 
                      src={product.image} 
                      alt={product.name}
                      className="w-full h-full object-cover filter brightness-90 group-hover:brightness-100 transition-all duration-1000 group-hover:scale-110"
                    />
                  )}
                  {product.isComingSoon && (
                    <div className="absolute top-4 left-4">
                      <span className="text-[9px] font-bold uppercase tracking-[0.2em] bg-blue-500 text-white px-2 py-1">
                        COMING SOON
                      </span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-[9px] font-bold uppercase tracking-[0.5em] border border-white py-3 px-6 text-white">Access Details</span>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-baseline">
                    <p className="text-[9px] font-bold opacity-20 uppercase tracking-[0.3em]">{product.anime || product.category}</p>
                    <span className="text-sm font-medium tracking-tight opacity-60">{typeof product.price === 'number' ? `৳${product.price}` : product.price}</span>
                  </div>
                  <h3 className="text-base font-display tracking-tight uppercase transition-colors">{product.name}</h3>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default AllProducts;
