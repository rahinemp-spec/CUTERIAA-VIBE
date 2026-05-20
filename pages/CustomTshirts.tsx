
import React, { useState, useRef } from 'react';
import { generateCustomDesign } from '../services/gemini';
import { motion, AnimatePresence } from 'motion/react';

interface CustomTshirtsProps {
  onAddToCart: (product: any) => void;
}

type DesignMode = 'ai' | 'upload' | 'link';

const CustomTshirts: React.FC<CustomTshirtsProps> = ({ onAddToCart }) => {
  const [mode, setMode] = useState<DesignMode>('ai');
  const [prompt, setPrompt] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const CUSTOM_PRICE = 750;

  const handleGenerateAI = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    const result = await generateCustomDesign(prompt);
    setPreviewImage(result);
    setIsGenerating(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLinkSubmit = () => {
    if (imageUrl.trim()) {
      setPreviewImage(imageUrl);
    }
  };

  const handleOrder = () => {
    if (!previewImage) return;
    
    const customId = `custom-${Date.now()}`;
    const name = mode === 'ai' 
      ? `AI Design: ${prompt.slice(0, 20)}...` 
      : mode === 'upload' 
        ? 'Uploaded Design' 
        : 'Link-based Design';

    onAddToCart({
      id: customId,
      name: name,
      price: CUSTOM_PRICE,
      image: previewImage,
      category: 'Custom Print',
      description: description || `Custom order via ${mode} method. ${prompt}`,
      anime: 'Custom Studio'
    });
  };

  return (
    <div className="bg-[var(--bg)] min-h-screen pt-40 pb-24 px-6 md:px-12 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 sm:mb-24 gap-6 sm:gap-8">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <span className="w-8 h-[1px] bg-[var(--line)]" />
              <span className="text-[10px] font-medium uppercase tracking-[0.4em] opacity-40">Synthesized Carry Gear</span>
            </div>
            <h1 className="text-4xl md:text-8xl font-display tracking-tight leading-none uppercase">AI Design Lab</h1>
            <div className="mt-6 inline-flex items-center bg-red-500/10 border border-red-500 px-4 py-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse mr-3" />
              <span className="text-red-500 text-[12px] font-bold uppercase tracking-[0.2em]">OUT OF STOCK</span>
            </div>
          </div>
          <div className="text-right">
            <p className="opacity-20 text-[10px] uppercase tracking-[0.4em] font-medium mb-2">Service Status</p>
            <div className="flex items-center justify-end gap-2 text-red-500 text-[10px] font-bold uppercase tracking-[0.2em]">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> OUT OF STOCK
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
          {/* Method Selection & Inputs */}
          <div className="lg:col-span-7 space-y-10 lg:space-y-16">
            
            <div className="space-y-6">
              <label className="text-[10px] font-bold uppercase tracking-[0.4em] opacity-20 flex items-center gap-4">
                01 / INITIATION METHOD
                <span className="w-full h-[1px] bg-[var(--line)]" />
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                {(['ai', 'upload', 'link'] as DesignMode[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => {
                      setMode(m);
                      setPreviewImage(null);
                    }}
                    className={`py-5 text-[10px] font-bold uppercase tracking-[0.3em] transition-all rounded-full border ${
                      mode === m ? 'bg-[var(--text)] text-[var(--bg)] border-[var(--text)] shadow-xl' : 'bg-transparent opacity-30 border-[var(--line)] hover:opacity-100 hover:border-[var(--text)]'
                    }`}
                  >
                    {m === 'ai' ? 'Neural Synthesis' : m === 'upload' ? 'Local Buffer' : 'External Link'}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-[var(--card-bg)] border border-[var(--line)] p-6 sm:p-8 md:p-12 space-y-8 md:space-y-10">
              <AnimatePresence mode="wait">
                {mode === 'ai' && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6"
                  >
                    <div className="flex justify-between items-center mb-2">
                       <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-40">Visual Prompt Engine</h4>
                       <span className="font-mono text-[9px] opacity-20">GEMINI_v1.5_READY</span>
                    </div>
                    <textarea 
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="Input vision prompt (e.g. 'minimalist cyber-fox with red circle')..."
                      className="w-full bg-[var(--bg)] border border-[var(--line)] p-8 text-[var(--text)] font-medium focus:border-[var(--accent)] outline-none min-h-[160px] transition-all placeholder:opacity-10 text-sm tracking-wider uppercase"
                    />
                    <button 
                      onClick={handleGenerateAI}
                      disabled={isGenerating || !prompt.trim()}
                      className={`w-full py-6 font-bold uppercase text-[10px] tracking-[0.5em] transition-all disabled:opacity-30 disabled:cursor-not-allowed rounded-full ${
                        isGenerating ? 'bg-[var(--line)] text-[var(--text)]' : 'bg-[var(--text)] text-[var(--bg)] hover:opacity-90'
                      }`}
                    >
                      {isGenerating ? 'Processing Node...' : 'Engage Synthesis'}
                    </button>
                  </motion.div>
                )}

                {mode === 'upload' && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6"
                  >
                    <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-40">File Buffer Upload</h4>
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="border border-dashed border-[var(--line)] p-20 text-center cursor-pointer hover:border-[var(--accent)] transition-all bg-[var(--bg)]"
                    >
                      <i className="fas fa-cloud-upload-alt text-3xl mb-6 opacity-20 text-[var(--text)]"></i>
                      <p className="text-[10px] font-bold uppercase tracking-[0.5em] opacity-30 text-[var(--text)]">Connect Local Media</p>
                      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
                    </div>
                  </motion.div>
                )}

                {mode === 'link' && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6"
                  >
                    <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-40">External Asset URI</h4>
                    <div className="flex gap-4">
                      <input 
                        type="text" 
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        placeholder="https://uri.secure/asset.png"
                        className="flex-1 bg-[var(--bg)] border border-[var(--line)] p-5 text-[var(--text)] font-medium focus:border-[var(--accent)] outline-none transition-all placeholder:opacity-10 text-xs tracking-widest"
                      />
                      <button 
                        onClick={handleLinkSubmit}
                        className="bg-[var(--text)] text-[var(--bg)] px-10 font-bold uppercase text-[10px] tracking-[0.3em] hover:opacity-80 rounded-full"
                      >
                        Mount
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-6 pt-10 border-t border-[var(--line)]">
                <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-40">02 / COMPILATION NOTES</h4>
                <textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Input specific embroidery, strap preferences or technical notes..."
                  className="w-full bg-[var(--bg)] border border-[var(--line)] p-6 text-[var(--text)] opacity-60 font-medium focus:border-[var(--accent)] outline-none min-h-[100px] transition-all placeholder:opacity-10 text-xs tracking-widest uppercase"
                />
              </div>
            </div>
            
            <div className="flex items-start gap-4 p-8 border border-[var(--line)] bg-[var(--text)]/[0.02]">
              <i className="fas fa-terminal opacity-20 mt-1"></i>
              <p className="text-[10px] font-medium uppercase tracking-[0.3em] leading-relaxed opacity-30">
                Synthesis protocol includes manual QC review of visual data. Estimated processing: 5-7 solar cycles for delivery. 
                Unit price fixed at ৳{CUSTOM_PRICE}.
              </p>
            </div>
          </div>

          {/* Preview Section */}
          <div className="lg:col-span-5 lg:sticky lg:top-40">
            <div className="space-y-12">
              <label className="text-[10px] font-bold uppercase tracking-[0.4em] opacity-20 flex items-center gap-4">
                VISUAL PREVIEW
                <span className="w-full h-[1px] bg-[var(--line)]" />
              </label>
              
              <div className="relative aspect-square bg-[var(--card-bg)] border border-[var(--line)] overflow-hidden group">
                {previewImage ? (
                  <motion.img 
                    initial={{ opacity: 0, scale: 1.1 }}
                    animate={{ opacity: 1, scale: 1 }}
                    src={previewImage} 
                    alt="Synthesis Preview" 
                    className="w-full h-full object-contain p-8 filter brightness-90 group-hover:brightness-100 transition-all duration-1000" 
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center opacity-10">
                    <i className="fas fa-microchip text-8xl mb-8"></i>
                    <p className="text-[10px] font-bold uppercase tracking-[0.6em]">Waiting for data</p>
                  </div>
                )}
                
                {isGenerating && (
                  <div className="absolute inset-0 bg-[var(--bg)]/90 backdrop-blur-sm flex items-center justify-center">
                    <div className="flex flex-col items-center gap-6">
                      <div className="w-16 h-16 border-2 border-[var(--line)] border-t-[var(--accent)] rounded-full animate-spin"></div>
                      <p className="text-[var(--text)] font-bold text-[10px] tracking-[0.6em] uppercase">Synthesizing...</p>
                    </div>
                  </div>
                )}
              </div>

              <button 
                onClick={handleOrder}
                disabled={true}
                className={`w-full py-8 font-bold text-[11px] uppercase tracking-[0.6em] transition-all rounded-full border bg-red-500/10 text-red-500 border-red-500 cursor-not-allowed`}
              >
                OUT OF STOCK
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomTshirts;
