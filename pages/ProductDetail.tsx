import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Product } from "../types";
import { PRODUCTS as INITIAL_PRODUCTS } from "../constants";
import { sheetApi } from "../services/api";
import { normalizeProduct } from "../utils/colorUtils";
import { motion, AnimatePresence } from "motion/react";

interface ProductDetailProps {
  onAddToCart: (product: Product, color?: string) => void;
}

const getYoutubeEmbedUrl = (url?: string): string | null => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/)([^#\&\?]*).*/;
  const match = url.match(regExp);
  if (match && match[2].length === 11) {
    return `https://www.youtube.com/embed/${match[2]}?autoplay=1&mute=1&playlist=${match[2]}&loop=1`;
  }
  return null;
};

const getRawVideoUrl = (url?: string): string => {
  if (!url) return "";
  let formatted = url.trim();
  
  if (formatted.includes("dropbox.com")) {
    formatted = formatted.replace("www.dropbox.com", "dl.dropboxusercontent.com");
    if (formatted.includes("dl=0")) {
      formatted = formatted.replace("dl=0", "raw=1");
    } else if (!formatted.includes("raw=1") && !formatted.includes("dl=1")) {
      formatted += (formatted.includes("?") ? "&" : "?") + "raw=1";
    }
  }
  
  if (formatted.includes("drive.google.com")) {
    const driveRegExp = /\/file\/d\/([^\/]+)/;
    const match = formatted.match(driveRegExp);
    if (match && match[1]) {
      return `https://drive.google.com/uc?export=download&id=${match[1]}`;
    }
    const queryMatch = formatted.match(/[?&]id=([^&]+)/);
    if (queryMatch && queryMatch[1]) {
      return `https://drive.google.com/uc?export=download&id=${queryMatch[1]}`;
    }
  }
  
  return formatted;
};

const ProductDetail: React.FC<ProductDetailProps> = ({ onAddToCart }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeImage, setActiveImage] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [viewingVideo, setViewingVideo] = useState<boolean>(false);

  // Load all products and current product
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      let loadedProducts: Product[] = [];
      const savedProducts = localStorage.getItem("cuteriaa_products");
      
      if (savedProducts) {
        try {
          const parsed = JSON.parse(savedProducts);
          if (Array.isArray(parsed)) {
            loadedProducts = parsed.map(p => normalizeProduct(p)).filter(Boolean) as Product[];
          }
        } catch (e) {}
      }
      
      if (loadedProducts.length === 0) {
        loadedProducts = INITIAL_PRODUCTS;
      }

      // Sync from Google Sheet
      try {
        const cloudProds = await sheetApi.fetchProducts();
        if (cloudProds && Array.isArray(cloudProds)) {
          const formatted = cloudProds.map((p: any) => normalizeProduct(p)).filter(Boolean) as Product[];
          if (formatted.length > 0) {
            loadedProducts = formatted;
            localStorage.setItem("cuteriaa_products", JSON.stringify(formatted));
          }
        }
      } catch (err) {
        console.error("Error loading products in ProductDetail:", err);
      }

      setAllProducts(loadedProducts);
      
      const found = loadedProducts.find(p => String(p.id) === String(id));
      if (found) {
        setProduct(found);
        setActiveImage(found.image);
        setViewingVideo(false);
        const allColors = found.colors || (found.color ? [found.color] : []);
        const firstInStockColor = allColors.find(col => !found.outOfStockColors?.some(osc => osc.trim().toLowerCase() === col.trim().toLowerCase()));
        const defaultColor = firstInStockColor || found.color || (found.colors && found.colors[0]) || "";
        setSelectedColor(defaultColor);
      } else {
        setProduct(null);
      }
      setLoading(false);
    };

    loadData();
    window.scrollTo(0, 0);
  }, [id]);

  if (loading) {
    return (
      <div className="bg-[var(--bg)] min-h-screen pt-40 pb-24 px-6 flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-2 border-zinc-800 border-t-white rounded-full animate-spin mb-4" />
        <span className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-40">Loading Blueprint...</span>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="bg-[var(--bg)] min-h-screen pt-40 pb-24 px-6 flex flex-col items-center justify-center">
        <i className="fas fa-exclamation-triangle text-3xl mb-4 opacity-40 text-red-500"></i>
        <h2 className="text-xl font-display uppercase tracking-wider mb-2">Item Blueprint Not Found</h2>
        <p className="text-xs opacity-50 mb-8 uppercase tracking-widest text-center max-w-sm">The product layout model might have been updated or removed.</p>
        <Link to="/catalog" className="px-8 py-4 bg-[var(--text)] text-[var(--bg)] font-bold text-[10px] uppercase tracking-[0.3em] rounded-full hover:opacity-90">
          Back to Catalog
        </Link>
      </div>
    );
  }

  const gallery = [product.image, ...(product.images || [])];
  const allColors = product.colors || (product.color ? [product.color] : []);

  const isColorOutOfStock = selectedColor
    ? product.outOfStockColors?.some(col => col.trim().toLowerCase() === selectedColor.trim().toLowerCase())
    : false;
  const isImageOutOfStock = activeImage
    ? product.outOfStockImages?.some(img => img.trim() === activeImage.trim())
    : false;
  const isOutOfStock = isColorOutOfStock || (allColors.length === 0 && isImageOutOfStock);

  // Filter recommended products: select up to 4 other products, preferably from the same category or anime
  const recommended = allProducts
    .filter(p => String(p.id) !== String(product.id))
    .sort((a, b) => {
      // Prioritize same anime/category
      const scoreA = (a.anime === product.anime ? 2 : 0) + (a.category === product.category ? 1 : 0);
      const scoreB = (b.anime === product.anime ? 2 : 0) + (b.category === product.category ? 1 : 0);
      return scoreB - scoreA;
    })
    .slice(0, 4);

  return (
    <div className="bg-[var(--bg)] min-h-screen pt-40 pb-24 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        
        {/* Breadcrumb / Back button */}
        <div className="mb-12 flex items-center gap-4">
          <Link to="/catalog" className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-40 hover:opacity-100 transition-opacity flex items-center gap-2">
            <i className="fas fa-arrow-left text-[9px]" /> Full Catalog
          </Link>
          <span className="text-zinc-600 text-xs">/</span>
          <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500 truncate max-w-[200px]">
            {product.name}
          </span>
        </div>

        {/* Product Grid Details */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-start mb-32">
          
          {/* Image Gallery Section */}
          <div className="lg:col-span-7 bg-[var(--card-bg)] p-6 sm:p-8 md:p-12 border border-[var(--line)] relative overflow-hidden group">
            <div className="relative w-full aspect-[3/4] mb-6 sm:mb-8 overflow-hidden rounded-md bg-zinc-950">
              {viewingVideo && product.videoUrl ? (
                <div className="w-full h-full relative flex items-center justify-center">
                  {getYoutubeEmbedUrl(product.videoUrl) ? (
                    <iframe
                      src={getYoutubeEmbedUrl(product.videoUrl) || ""}
                      title="Product Video"
                      className="w-full h-full border-0 rounded-md"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  ) : (
                    <video
                      src={getRawVideoUrl(product.videoUrl)}
                      controls
                      autoPlay
                      loop
                      muted
                      className="w-full h-full object-contain rounded-md"
                    />
                  )}
                  <button
                    onClick={() => setViewingVideo(false)}
                    className="absolute bottom-4 right-4 bg-zinc-950 hover:bg-zinc-900 w-auto text-white px-3 py-1.5 text-[8px] tracking-[0.2em] font-black uppercase rounded border border-zinc-800 flex items-center gap-1.5 transition-all z-20"
                  >
                    <i className="fas fa-image" /> View Photo
                  </button>
                </div>
              ) : (
                <>
                  {activeImage && (
                    <motion.img
                      key={activeImage}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      src={activeImage}
                      className="w-full h-full object-cover filter brightness-90 transition-transform duration-300 hover:scale-[1.75] cursor-zoom-in"
                      style={{ transformOrigin: "50% 50%" }}
                      onMouseMove={(e: any) => {
                        const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
                        const x = ((e.clientX - left) / width) * 100;
                        const y = ((e.clientY - top) / height) * 100;
                        e.currentTarget.style.transformOrigin = `${x}% ${y}%`;
                      }}
                      onMouseLeave={(e: any) => {
                        e.currentTarget.style.transformOrigin = "50% 50%";
                      }}
                    />
                  )}
                  {product.color && (
                    <div className="absolute top-6 left-6">
                      <span className="text-[10px] font-bold uppercase tracking-[0.3em] bg-[var(--text)] text-[var(--bg)] px-3 py-1">
                        PROFILE: {product.color}
                      </span>
                    </div>
                  )}
                  {product.outOfStockImages?.some(img => img.trim() === activeImage.trim()) && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center pointer-events-none z-10 transition-all animate-fadeIn">
                      <div className="border-2 border-red-500 text-red-500 px-6 py-3 font-black text-xs uppercase tracking-[0.3em] rotate-[-12deg] bg-zinc-950/95 shadow-2xl">
                        OUT OF STOCK
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {(gallery.length > 1 || product.videoUrl) && (
              <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
                {gallery.map((img, idx) => {
                  const isImgOutOfStock = img ? product.outOfStockImages?.some(osc => osc.trim() === img.trim()) : false;
                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        setActiveImage(img);
                        setViewingVideo(false);
                      }}
                      className={`w-20 h-24 flex-shrink-0 transition-opacity flex items-center justify-center bg-[var(--card-bg)] border border-[var(--line)] relative ${activeImage === img && !viewingVideo ? "opacity-100 ring-1 ring-[var(--text)]" : "opacity-30 hover:opacity-60"}`}
                    >
                      {img ? (
                        <>
                          <img
                            src={img}
                            className="w-full h-full object-cover animate-fadeIn"
                          />
                          {isImgOutOfStock && (
                            <div className="absolute inset-0 bg-black/55 flex items-center justify-center">
                              <span className="text-[8px] font-black tracking-widest text-red-500 bg-zinc-950 px-1 uppercase py-0.5 border border-red-500/30 scale-90 animate-fadeIn">OUT</span>
                            </div>
                          )}
                        </>
                      ) : (
                        <i className="fas fa-image opacity-10"></i>
                      )}
                    </button>
                  );
                })}

                {product.videoUrl && (
                  <button
                    onClick={() => setViewingVideo(true)}
                    className={`w-20 h-24 flex-shrink-0 transition-all flex flex-col items-center justify-center bg-zinc-950 border text-center p-1.5 relative group/vid rounded-sm ${
                      viewingVideo
                        ? "opacity-100 ring-2 ring-red-500 border-red-500 bg-red-950/25"
                        : "opacity-40 hover:opacity-100 border-zinc-800"
                    }`}
                  >
                    <div className="absolute top-1 left-1.5 flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-red-500 animate-ping" />
                      <span className="text-[6px] tracking-widest text-red-500 font-extrabold">LIVE</span>
                    </div>
                    <i className="fas fa-play text-red-500 text-sm mb-1 group-hover/vid:scale-125 transition-transform duration-200"></i>
                    <span className="text-[7px] font-black uppercase tracking-wider text-rose-500 mt-1">VIDEO</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Core Info & Purchase Options Section */}
          <div className="lg:col-span-5 flex flex-col justify-center">
            
            <div className="mb-10">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-6 h-[1px] bg-[var(--line)]" />
                <span className="text-[10px] font-medium uppercase tracking-[0.4em] opacity-50">
                  {product.anime || product.category}
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-display tracking-tight leading-none uppercase mb-4">
                {product.name}
              </h1>
              
              <div className="flex items-baseline gap-4 mt-6">
                {product.discountPrice !== undefined && product.discountPrice !== null && String(product.discountPrice).trim() !== "" ? (
                  <>
                    <span className="text-2xl sm:text-3xl font-black text-rose-500 animate-fadeIn">
                      ৳{product.discountPrice}
                    </span>
                    <span className="text-lg sm:text-xl font-light opacity-30 line-through animate-fadeIn">
                      ৳{product.price}
                    </span>
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] bg-rose-600 text-white px-2 py-1 select-none animate-bounce rounded-xs">
                      SALE
                    </span>
                  </>
                ) : (
                  <span className="text-2xl sm:text-3xl font-light opacity-90">
                    {typeof product.price === "number"
                      ? `৳${product.price}`
                      : product.price}
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-10 border-t border-[var(--line)] pt-8">
              {allColors.length > 0 && (
                <div>
                  <h4 className="opacity-20 font-bold text-[10px] uppercase tracking-[0.4em] mb-4">
                    SELECT VARIANT PROFILE
                  </h4>
                  <div className="flex flex-wrap gap-2.5">
                    {allColors.map((col) => {
                      const isColOutOfStock = product.outOfStockColors?.some(osc => osc.trim().toLowerCase() === col.trim().toLowerCase());
                      return (
                        <button
                          key={col}
                          onClick={() => setSelectedColor(col)}
                          className={`px-5 py-3 border font-black text-[9px] uppercase tracking-[0.2em] transition-all rounded-full flex items-center gap-2 cursor-pointer ${
                            selectedColor === col
                              ? isColOutOfStock
                                ? "bg-red-950 text-red-400 border-red-500 scale-102"
                                : "bg-[var(--text)] text-[var(--bg)] border-[var(--text)] scale-102"
                              : isColOutOfStock
                                ? "bg-transparent opacity-40 border-dashed border-red-500 text-red-400 hover:opacity-100"
                                : "bg-transparent opacity-35 border-[var(--line)] hover:opacity-100 hover:border-[var(--text)]"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              selectedColor === col
                                ? isColOutOfStock
                                  ? "bg-red-400"
                                  : "bg-[var(--bg)]"
                                : isColOutOfStock
                                  ? "bg-red-500/60 animate-pulse"
                                  : "bg-current opacity-20"
                            }`}
                          />
                          {col} {isColOutOfStock && <span className="text-[7.5px] text-red-500 font-extrabold">(STOCKED OUT)</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div>
                <h4 className="opacity-20 font-bold text-[10px] uppercase tracking-[0.4em] mb-4">
                  PRODUCT SPECIFICATIONS
                </h4>
                <p className="text-xs font-medium opacity-50 leading-relaxed uppercase tracking-wider text-justify">
                  {product.description ||
                    "Premium high-density materials and architectural design custom formulated for extreme durability. Comfortable everyday wear with double-needle finishes and precision patterns."}
                </p>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => {
                    if (!product.isComingSoon && !isOutOfStock) {
                      onAddToCart(product, selectedColor);
                    }
                  }}
                  disabled={product.isComingSoon || isOutOfStock}
                  className={`w-full py-5 font-bold text-[10px] uppercase tracking-[0.5em] transition-all rounded-full border shadow-xl ${
                    product.isComingSoon || isOutOfStock
                      ? "bg-transparent text-[var(--text)] border-[var(--line)] opacity-40 cursor-not-allowed"
                      : "bg-[var(--text)] text-[var(--bg)] border-[var(--text)] hover:opacity-90 hover:scale-[1.01]"
                  }`}
                >
                  {product.isComingSoon 
                    ? "COMING SOON" 
                    : isOutOfStock 
                      ? "STOCKED OUT" 
                      : "ADD TO BAG"}
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* Recommended Products Section */}
        <div className="border-t border-[var(--line)] pt-24 mt-12">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-16 gap-4">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--text)] animate-pulse" />
                <span className="text-[9px] font-bold uppercase tracking-[0.4em] opacity-40">System Suggestions</span>
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-5xl font-display tracking-tight uppercase">Recommend our Products</h2>
            </div>
            <Link 
              to="/catalog"
              className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-60 hover:opacity-100 transition-opacity"
            >
              Explore Full Blueprint
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {recommended.map((item, idx) => (
              <div 
                key={item.id}
                onClick={() => navigate(`/product/${item.id}`)}
                className="group cursor-pointer flex flex-col h-full"
              >
                <div className="relative aspect-[3/4] overflow-hidden bg-[var(--card-bg)] mb-6 rounded-xs border border-[var(--line)]">
                  {item.image && (
                    <img 
                      src={item.image} 
                      alt={item.name}
                      className="w-full h-full object-cover filter brightness-90 group-hover:brightness-100 transition-all duration-1000 group-hover:scale-105"
                    />
                  )}
                  {item.isComingSoon && (
                    <div className="absolute top-4 left-4">
                      <span className="text-[8px] font-bold uppercase tracking-[0.2em] bg-blue-500 text-white px-2 py-0.5">
                        COMING SOON
                      </span>
                    </div>
                  )}
                  {item.discountPrice !== undefined && item.discountPrice !== null && String(item.discountPrice).trim() !== "" && (
                    <div className="absolute top-4 right-4 z-10">
                      <span className="text-[8px] font-black uppercase tracking-[0.2em] bg-rose-600 text-white px-2 py-0.5 shadow-lg animate-pulse flex items-center gap-1 leading-none rounded-xs">
                        <i className="fas fa-tags text-[6px]" /> SALE
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="space-y-2 mt-auto">
                  <div className="flex justify-between items-baseline">
                    <p className="text-[8px] font-bold opacity-30 uppercase tracking-[0.2em]">{item.anime || item.category}</p>
                    {item.discountPrice !== undefined && item.discountPrice !== null && String(item.discountPrice).trim() !== "" ? (
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-black tracking-tight text-rose-500">
                          ৳{item.discountPrice}
                        </span>
                        <span className="text-[9px] font-medium tracking-tight opacity-30 line-through">
                          ৳{item.price}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[11px] font-medium tracking-tight opacity-60">
                        {typeof item.price === 'number' ? `৳${item.price}` : item.price}
                      </span>
                    )}
                  </div>
                  <h3 className="text-xs font-display tracking-tight uppercase group-hover:text-zinc-300 transition-colors line-clamp-1">{item.name}</h3>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default ProductDetail;
