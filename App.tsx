
import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Cart from './components/Cart';
import QuickView from './components/QuickView';
import LiveSupport from './components/LiveSupport';
import Checkout from './components/Checkout';
import Home from './pages/Home';
import AllProducts from './pages/AllProducts';
import CustomTshirts from './pages/CustomTshirts';
import Tracking from './pages/Tracking';
import Admin from './pages/Admin';
import Policies, { PolicyType } from './pages/Policies';
import ContactUs from './pages/ContactUs';
import { Product, CartItem } from './types';
import { PRODUCTS as FALLBACK_PRODUCTS } from './constants';
import { sheetApi } from './services/api';
import { normalizeColors, safeParseJSON } from './utils/colorUtils';

const parseBoolean = (val: any): boolean => {
  if (typeof val === 'boolean') return val;
  if (typeof val === 'number') return val === 1;
  if (typeof val === 'string') {
    const lower = val.toLowerCase().trim();
    return lower === 'true' || lower === 'on' || lower === '1' || lower === 'yes' || lower === 'featured';
  }
  return false;
};

export default function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('cuteriaa-theme');
    return (saved as 'dark' | 'light') || 'dark';
  });
  const [activeTab, setActiveTab] = useState('home');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const [lastOrderId, setLastOrderId] = useState<string | null>(null);
  const [cloudProducts, setCloudProducts] = useState<Product[]>(FALLBACK_PRODUCTS);
  const [selectedPolicy, setSelectedPolicy] = useState<PolicyType>('shipping');
  const [isLoading, setIsLoading] = useState(true);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('cuteriaa-theme', newTheme);
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const prods = await sheetApi.fetchProducts();
      if (prods && Array.isArray(prods)) {
        const formattedProducts = prods.map((p: any) => ({
          ...p,
          images: safeParseJSON(p.images),
          colors: normalizeColors(p.colors),
          outOfStockColors: safeParseJSON(p.outOfStockColors),
          outOfStockImages: safeParseJSON(p.outOfStockImages),
          isFeatured: parseBoolean(p.isFeatured)
        }));
        setCloudProducts(formattedProducts.length > 0 ? formattedProducts : FALLBACK_PRODUCTS);
      }
      await sheetApi.fetchCategories();
    } catch (err) {
      console.error("Failed to fetch initial cloud data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeTab]);

  const handleAddToCart = (product: Product, color?: string) => {
    const selectedColor = color || product.color || (product.colors && product.colors[0]) || 'Standard';
    
    // Check if the selected color is out of stock in the product record
    const isOutOfStockNow = product.outOfStockColors?.some(
      osc => osc.trim().toLowerCase() === selectedColor.trim().toLowerCase()
    );
    if (isOutOfStockNow) {
      alert(`Sorry, the color "${selectedColor}" for "${product.name}" is currently out of stock and cannot be ordered.`);
      return;
    }

    setCartItems(prev => {
      const itemKey = `${product.id}-${selectedColor}`;
      const existing = prev.find(item => `${item.id}-${item.selectedColor}` === itemKey);
      
      if (existing) {
        return prev.map(item => (`${item.id}-${item.selectedColor}` === itemKey) ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1, selectedColor: selectedColor }];
    });
    setIsCartOpen(true);
  };

  const handleOpenQuickView = (product: Product) => {
    setSelectedProduct(product);
    setIsQuickViewOpen(true);
  };

  const handleRemoveFromCart = (uniqueKey: string) => {
    setCartItems(prev => prev.filter(item => `${item.id}-${item.selectedColor}` !== uniqueKey));
  };

  const handleUpdateQuantity = (uniqueKey: string, delta: number) => {
    setCartItems(prev => prev.map(item => {
      if (`${item.id}-${item.selectedColor}` === uniqueKey) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const handleOrderComplete = async (orderId: string) => {
    setLastOrderId(orderId);
    setCartItems([]);
    setIsCheckoutOpen(false);
    setActiveTab('tracking');
  };

  const handlePolicyNavigation = (type: PolicyType) => {
    setSelectedPolicy(type);
    setActiveTab('policies');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <Home 
            products={cloudProducts}
            onAddToCart={handleOpenQuickView} 
            onQuickView={handleOpenQuickView}
            onExploreProducts={() => setActiveTab('all-products')}
            onCustomDesign={() => setActiveTab('custom')}
          />
        );
      case 'all-products':
        return <AllProducts onAddToCart={handleOpenQuickView} onQuickView={handleOpenQuickView} />;
      case 'custom':
        return <CustomTshirts onAddToCart={(p) => handleAddToCart(p)} />;
      case 'tracking':
        return <Tracking initialOrderId={lastOrderId} />;
      case 'admin':
        return <Admin onRefreshProducts={loadData} />;
      case 'policies':
        return <Policies initialType={selectedPolicy} />;
      case 'contact':
        return <ContactUs />;
      case 'cart':
        setIsCartOpen(true);
        setActiveTab('home');
        return null;
      default:
        return (
          <Home 
            products={cloudProducts}
            onAddToCart={handleOpenQuickView} 
            onQuickView={handleOpenQuickView} 
            onExploreProducts={() => setActiveTab('all-products')} 
            onCustomDesign={() => setActiveTab('custom')} 
          />
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-300 bg-[var(--bg)] text-[var(--text)]" data-theme={theme}>
      {isLoading && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#050508] transition-opacity duration-500">
          <div className="flex flex-col items-center">
            {/* Center Logo Circle */}
            <div className="relative flex items-center justify-center w-40 h-40 md:w-52 md:h-52 rounded-full mb-8 border border-indigo-500/10 bg-indigo-500/5 shadow-[0_0_60px_rgba(99,102,241,0.15)]">
              <div className="absolute inset-0 rounded-full bg-indigo-500/5 animate-pulse"></div>
              <div className="absolute inset-2 rounded-full border border-purple-500/20"></div>
              <h1 className="text-xl md:text-2xl font-display font-black tracking-[0.15em] uppercase text-indigo-400 leading-tight text-center relative z-10 drop-shadow-[0_0_15px_rgba(139,92,246,0.8)]">
                CUTERIAA<br />
                <span className="text-purple-400 text-lg md:text-xl drop-shadow-[0_0_15px_rgba(192,132,252,0.8)]">VIBE</span>
              </h1>
            </div>
            
            {/* Three Dots Animation */}
            <div className="flex space-x-3 mb-8">
              <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce shadow-[0_0_10px_rgba(99,102,241,0.8)]" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2.5 h-2.5 bg-purple-500 rounded-full animate-bounce shadow-[0_0_10px_rgba(168,85,247,0.8)]" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2.5 h-2.5 bg-indigo-400 rounded-full animate-bounce shadow-[0_0_10px_rgba(129,140,248,0.8)]" style={{ animationDelay: '300ms' }}></div>
            </div>

            {/* Status Text */}
            <p className="text-[9px] md:text-[10px] font-space tracking-[0.4em] font-bold text-gray-500 uppercase">SYNCING CLOUD DATA...</p>
          </div>
        </div>
      )}
      
      <Navbar 
        activeTab={activeTab === 'cart' ? 'home' : (activeTab === 'admin' ? 'admin' : activeTab)} 
        setActiveTab={setActiveTab} 
        cartCount={cartItems.reduce((a, b) => a + b.quantity, 0)} 
        theme={theme}
        onToggleTheme={toggleTheme}
      />
      
      <main className="flex-grow">
        {renderContent()}
      </main>

      <Footer 
        onAdminClick={() => setActiveTab('admin')} 
        onPolicyClick={handlePolicyNavigation}
        onNavClick={setActiveTab}
      />

      <Cart 
        isOpen={isCartOpen} 
        onClose={() => setIsCartOpen(false)} 
        items={cartItems}
        onRemove={handleRemoveFromCart}
        onUpdateQuantity={handleUpdateQuantity}
        onCheckout={() => {
          setIsCartOpen(false);
          setIsCheckoutOpen(true);
        }}
      />

      <QuickView 
        product={selectedProduct} 
        isOpen={isQuickViewOpen} 
        onClose={() => setIsQuickViewOpen(false)}
        onAddToCart={handleAddToCart}
      />

      {isCheckoutOpen && (
        <Checkout 
          items={cartItems} 
          onClose={() => setIsCheckoutOpen(false)} 
          onComplete={handleOrderComplete}
        />
      )}

      {activeTab !== 'admin' && <LiveSupport />}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideLeft { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .animate-fadeIn { animation: fadeIn 0.5s ease-out; }
        .animate-slideLeft { animation: slideLeft 0.3s ease-out; }
        .animate-slideUp { animation: slideUp 0.5s ease-out; }
      `}</style>
    </div>
  );
}
