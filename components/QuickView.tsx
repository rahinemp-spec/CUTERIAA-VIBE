import React, { useState, useEffect } from "react";
import { Product } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface QuickViewProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product, color?: string) => void;
}

const QuickView: React.FC<QuickViewProps> = ({
  product,
  isOpen,
  onClose,
  onAddToCart,
}) => {
  const [activeImage, setActiveImage] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");

  useEffect(() => {
    if (product) {
      setActiveImage(product.image);
      const defaultColor =
        product.color || (product.colors && product.colors[0]) || "";
      setSelectedColor(defaultColor);
    }
  }, [product]);

  if (!product) return null;

  const gallery = [product.image, ...(product.images || [])];
  const allColors = product.colors || (product.color ? [product.color] : []);

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
                <div className="relative w-full aspect-[3/4] mb-6 sm:mb-8 overflow-hidden rounded-md">
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
                </div>

                {gallery.length > 1 && (
                  <div className="flex gap-4 overflow-x-auto pb-4">
                    {gallery.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveImage(img)}
                        className={`w-20 h-24 flex-shrink-0 transition-opacity flex items-center justify-center bg-[var(--card-bg)] border border-[var(--line)] ${activeImage === img ? "opacity-100 ring-1 ring-[var(--text)]" : "opacity-30 hover:opacity-60"}`}
                      >
                        {img ? (
                          <img
                            src={img}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <i className="fas fa-image opacity-10"></i>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Details Section */}
              <div className="lg:col-span-6 p-6 sm:p-8 md:p-16 flex flex-col justify-center">
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
                  <p className="text-2xl sm:text-3xl font-light opacity-90">
                    {typeof product.price === "number"
                      ? `৳${product.price}`
                      : product.price}
                  </p>
                </div>

                <div className="space-y-12">
                  {allColors.length > 0 && (
                    <div>
                      <h4 className="opacity-20 font-bold text-[10px] uppercase tracking-[0.4em] mb-6">
                        01 / SELECT COLOR
                      </h4>
                      <div className="flex flex-wrap gap-3">
                        {allColors.map((col) => (
                          <button
                            key={col}
                            onClick={() => setSelectedColor(col)}
                            className={`px-6 py-3 border font-black text-[10px] uppercase tracking-[0.2em] transition-all rounded-full flex items-center gap-3 ${
                              selectedColor === col
                                ? "bg-[var(--text)] text-[var(--bg)] border-[var(--text)] scale-105"
                                : "bg-transparent opacity-30 border-[var(--line)] hover:opacity-100 hover:border-[var(--text)]"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${selectedColor === col ? "bg-[var(--bg)]" : "bg-current opacity-20"}`}
                            />
                            {col}
                          </button>
                        ))}
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
                      if (!product.isComingSoon) {
                        onAddToCart(product, selectedColor);
                        onClose();
                      }
                    }}
                    disabled={product.isComingSoon}
                    className={`w-full py-6 font-bold text-[10px] uppercase tracking-[0.5em] transition-all rounded-full border shadow-xl ${
                      product.isComingSoon
                        ? "bg-transparent text-[var(--text)] border-[var(--line)] opacity-50 cursor-not-allowed"
                        : "bg-[var(--text)] text-[var(--bg)] border-[var(--text)] hover:opacity-90"
                    }`}
                  >
                    {product.isComingSoon ? "COMING SOON" : "ADD TO BAG"}
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
