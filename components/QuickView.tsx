import React, { useState, useEffect } from "react";
import { Product } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface QuickViewProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
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
  
  // Dropbox URL format converter
  if (formatted.includes("dropbox.com")) {
    formatted = formatted.replace("www.dropbox.com", "dl.dropboxusercontent.com");
    if (formatted.includes("dl=0")) {
      formatted = formatted.replace("dl=0", "raw=1");
    } else if (!formatted.includes("raw=1") && !formatted.includes("dl=1")) {
      formatted += (formatted.includes("?") ? "&" : "?") + "raw=1";
    }
  }
  
  // Google Drive URL format converter
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

const QuickView: React.FC<QuickViewProps> = ({
  product,
  isOpen,
  onClose,
  onAddToCart,
}) => {
  const [activeImage, setActiveImage] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [viewingVideo, setViewingVideo] = useState<boolean>(false);

  useEffect(() => {
    if (product) {
      setActiveImage(product.image);
      setViewingVideo(false);
      const allColors = product.colors || (product.color ? [product.color] : []);
      const firstInStockColor = allColors.find(col => !product.outOfStockColors?.some(osc => osc.trim().toLowerCase() === col.trim().toLowerCase()));
      const defaultColor = firstInStockColor || product.color || (product.colors && product.colors[0]) || "";
      setSelectedColor(defaultColor);
    }
  }, [product]);

  if (!product) return null;

  const gallery = [product.image, ...(product.images || [])];
  const allColors = product.colors || (product.color ? [product.color] : []);

  const isColorOutOfStock = selectedColor
    ? product.outOfStockColors?.some(col => col.trim().toLowerCase() === selectedColor.trim().toLowerCase())
    : false;
  const isImageOutOfStock = activeImage
    ? product.outOfStockImages?.some(img => img.trim() === activeImage.trim())
    : false;
  const isOutOfStock = isColorOutOfStock || (allColors.length === 0 && isImageOutOfStock);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 md:p-12 overflow-hidden">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[var(--bg)]/95 backdrop-blur-md"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-[var(--card-bg)] text-[var(--text)] w-full max-w-7xl h-full max-h-[90vh] overflow-y-auto border border-[var(--line)] shadow-2xl custom-scrollbar"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 sm:top-8 sm:right-8 w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-[var(--text)] text-[var(--bg)] hover:opacity-80 transition-opacity z-50 rounded-full"
            >
              <i className="fas fa-times text-xs sm:text-sm"></i>
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-12 min-h-full">
              {/* Image Section */}
              <div className="lg:col-span-6 bg-[var(--bg)] p-6 sm:p-8 md:p-12 flex flex-col border-b lg:border-b-0 lg:border-r border-[var(--line)] relative overflow-hidden group">
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
                        className="absolute bottom-4 right-4 bg-zinc-950 hover:bg-zinc-90 w-auto text-white px-3 py-1.5 text-[8px] tracking-[0.2em] font-black uppercase rounded border border-zinc-800 flex items-center gap-1.5 transition-all z-20"
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
                  <div className="flex gap-4 overflow-x-auto pb-4">
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

              {/* Details Section */}
              <div className="lg:col-span-6 p-6 sm:p-8 md:p-16 flex flex-col justify-center bg-[var(--card-bg)]">
                <div className="mb-8 sm:mb-12">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="w-6 h-[1px] bg-[var(--line)]" />
                    <span className="text-[10px] font-medium uppercase tracking-[0.4em] opacity-50">
                      {product.anime || product.category}
                    </span>
                  </div>
                  <h2 className="text-3xl sm:text-4xl md:text-5xl font-display tracking-tight leading-none uppercase mb-4 sm:mb-6">
                    {product.name}
                  </h2>
                  <div className="flex items-baseline gap-4">
                    {product.discountPrice !== undefined && product.discountPrice !== null && String(product.discountPrice).trim() !== "" ? (
                      <>
                        <span className="text-2xl sm:text-3xl font-black text-rose-500 animate-fadeIn">
                          ৳{product.discountPrice}
                        </span>
                        <span className="text-lg sm:text-xl font-light opacity-30 line-through animate-fadeIn">
                          ৳{product.price}
                        </span>
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] bg-rose-600 text-white px-2 py-1 select-none animate-bounce">
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

                <div className="space-y-12">
                  {allColors.length > 0 && (
                    <div>
                      <h4 className="opacity-20 font-bold text-[10px] uppercase tracking-[0.4em] mb-6">
                        01 / SELECT COLOR
                      </h4>
                      <div className="flex flex-wrap gap-3">
                        {allColors.map((col) => {
                          const isColOutOfStock = product.outOfStockColors?.some(osc => osc.trim().toLowerCase() === col.trim().toLowerCase());
                          return (
                            <button
                              key={col}
                              onClick={() => setSelectedColor(col)}
                              className={`px-6 py-3 border font-black text-[10px] uppercase tracking-[0.2em] transition-all rounded-full flex items-center gap-3 cursor-pointer ${
                                selectedColor === col
                                  ? isColOutOfStock
                                    ? "bg-red-950 text-red-400 border-red-500 scale-105"
                                    : "bg-[var(--text)] text-[var(--bg)] border-[var(--text)] scale-105"
                                  : isColOutOfStock
                                    ? "bg-transparent opacity-40 border-dashed border-red-500 text-red-400 hover:opacity-100 hover:border-red-500"
                                    : "bg-transparent opacity-30 border-[var(--line)] hover:opacity-100 hover:border-[var(--text)]"
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
                              {col} {isColOutOfStock && <span className="text-[7px] text-red-500 font-extrabold">(OUT OF STOCK)</span>}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div>
                    <h4 className="opacity-20 font-bold text-[10px] uppercase tracking-[0.4em] mb-4">
                      {allColors.length > 0 ? "02" : "01"} / SPECIFICATIONS
                    </h4>
                    <p className="text-xs font-medium opacity-40 leading-relaxed uppercase tracking-wider">
                      {product.description ||
                        "Premium high-density materials and architectural design. Durable construction for daily versatility."}
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      if (!product.isComingSoon && !isOutOfStock) {
                        onAddToCart(product, selectedColor);
                        onClose();
                      }
                    }}
                    disabled={product.isComingSoon || isOutOfStock}
                    className={`w-full py-6 font-bold text-[10px] uppercase tracking-[0.5em] transition-all rounded-full border shadow-xl ${
                      product.isComingSoon || isOutOfStock
                        ? "bg-transparent text-[var(--text)] border-[var(--line)] opacity-40 cursor-not-allowed"
                        : "bg-[var(--text)] text-[var(--bg)] border-[var(--text)] hover:opacity-90 hover:scale-[1.01]"
                    }`}
                  >
                    {product.isComingSoon 
                      ? "COMING SOON" 
                      : isOutOfStock 
                        ? "OUT OF STOCK" 
                        : "ADD TO BAG"}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default QuickView;
