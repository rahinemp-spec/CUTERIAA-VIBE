
import React, { useState, useEffect } from 'react';
import { Order } from '../types';
import { sheetApi } from '../services/api';

interface TrackingProps {
  initialOrderId?: string | null;
}

const Tracking: React.FC<TrackingProps> = ({ initialOrderId }) => {
  const [orderId, setOrderId] = useState(initialOrderId || '');
  const [trackingData, setTrackingData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialOrderId) {
      handleTrack(null, initialOrderId);
    }
  }, [initialOrderId]);

  const handleTrack = async (e: React.FormEvent | null, forcedId?: string) => {
    if (e) e.preventDefault();
    const idToTrack = (forcedId || orderId).trim().toUpperCase();
    if (!idToTrack) return;

    setLoading(true);
    setError('');
    setTrackingData(null);

    try {
      const allOrders = await sheetApi.fetchOrders();
      if (allOrders && Array.isArray(allOrders)) {
        // Robust matching: Try direct, try with UNK- prefix, try without UNK- prefix
        const found = allOrders.find((o: any) => {
          const sheetId = String(o.id).toUpperCase();
          return sheetId === idToTrack || 
                 sheetId === `UNK-${idToTrack}` || 
                 `UNK-${sheetId}` === idToTrack;
        });

        if (found) {
          setTrackingData(found);
        } else {
          setError(`Order ID "${idToTrack}" not found in our records.`);
        }
      } else {
        setError('Connection Error: Please try again in a moment.');
      }
    } catch (e) {
      setError('An unexpected error occurred during parcel lookup.');
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { label: 'Confirmed', status: 'Processing', icon: 'fa-check' },
    { label: 'Shipped', status: 'Shipped', icon: 'fa-box' },
    { label: 'Delivery', status: 'Out for Delivery', icon: 'fa-truck-fast' },
    { label: 'Received', status: 'Delivered', icon: 'fa-home' }
  ];

  const getStepIndex = (status: string) => {
    const s = status?.toLowerCase();
    if (s === 'processing') return 0;
    if (s === 'shipped') return 1;
    if (s === 'out for delivery' || s === 'delivery') return 2;
    if (s === 'delivered' || s === 'received') return 3;
    return -1;
  };

  const currentStepIndex = trackingData ? getStepIndex(trackingData.status) : -1;

  return (
    <div className="bg-[var(--bg)] text-[var(--text)] pt-32 pb-24 px-6 md:px-10 max-w-7xl mx-auto min-h-screen animate-fadeIn transition-colors duration-300">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-black uppercase tracking-tighter mb-4 italic">Track Parcel</h1>
          <p className="opacity-40 text-[10px] font-black uppercase tracking-[0.4em]">Cloud Logistics Engine v2.3</p>
        </div>

        <form onSubmit={(e) => handleTrack(e)} className="mb-20">
          <div className="flex flex-col md:flex-row gap-0 group">
            <input 
              type="text" 
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              placeholder="Order ID (e.g. UNK-XXXXXX)"
              className="flex-1 bg-[var(--bg)] border-2 border-[var(--text)] px-8 py-5 text-[var(--text)] font-black uppercase text-xs focus:outline-none placeholder:opacity-20 focus:shadow-[8px_8px_0px_0px_var(--text)] transition-all"
            />
            <button 
              type="submit"
              disabled={loading}
              className="bg-[var(--text)] text-[var(--bg)] px-12 py-5 font-black text-xs uppercase tracking-widest transition-all disabled:opacity-50 border-2 border-[var(--text)]"
            >
              {loading ? <i className="fas fa-sync fa-spin"></i> : 'Execute Tracking'}
            </button>
          </div>
          {error && <p className="mt-4 text-[10px] font-black uppercase text-red-600 tracking-widest">{error}</p>}
        </form>

        {trackingData && (
          <div className="bg-[var(--card-bg)] border-2 border-[var(--text)] p-10 animate-slideUp shadow-[20px_20px_0px_0px_var(--text)]">
            <div className="flex justify-between items-baseline mb-12 border-b-4 border-[var(--text)] pb-8">
              <div>
                <p className="text-[10px] opacity-40 font-black uppercase tracking-widest mb-1">Authenticated Parcel</p>
                <h3 className="text-3xl font-black tracking-tighter italic">#{trackingData.id}</h3>
              </div>
              <div className="text-right">
                <p className="text-[10px] opacity-40 font-black uppercase tracking-widest mb-1">Status</p>
                <h3 className={`text-lg font-black uppercase ${trackingData.status === 'Cancelled' ? 'text-red-500' : 'text-[var(--text)]'}`}>
                  {trackingData.status}
                </h3>
              </div>
            </div>

            {trackingData.status !== 'Cancelled' ? (
              <div className="relative mb-20 px-4">
                <div className="absolute top-1/2 left-0 w-full h-1.5 bg-[var(--line)] -translate-y-1/2 hidden md:block"></div>
                <div 
                  className="absolute top-1/2 left-0 h-1.5 bg-[var(--text)] -translate-y-1/2 transition-all duration-1000 hidden md:block" 
                  style={{ width: `${currentStepIndex >= 0 ? (currentStepIndex / (steps.length - 1)) * 100 : 0}%` }}
                ></div>
                
                {/* Vertical line for mobile */}
                <div className="absolute left-10 top-0 bottom-0 w-1 bg-[var(--line)] md:hidden">
                   <div 
                    className="w-full bg-[var(--text)] transition-all duration-1000"
                    style={{ height: `${currentStepIndex >= 0 ? (currentStepIndex / (steps.length - 1)) * 100 : 0}%` }}
                   ></div>
                </div>

                <div className="relative z-10 flex flex-col md:flex-row justify-between gap-8 md:gap-0">
                  {steps.map((step, idx) => (
                    <div key={idx} className="flex flex-row md:flex-col items-center gap-6 md:gap-0">
                      <div className={`w-12 h-12 flex flex-shrink-0 items-center justify-center mb-0 md:mb-4 border-2 transition-all ${
                        idx <= currentStepIndex ? 'bg-[var(--text)] text-[var(--bg)] border-[var(--text)]' : 'bg-[var(--bg)] opacity-20 border-[var(--line)]'
                      }`}>
                        <i className={`fas ${step.icon} text-sm`}></i>
                      </div>
                      <p className={`text-[9px] font-black uppercase tracking-widest ${
                        idx <= currentStepIndex ? 'opacity-100' : 'opacity-20'
                      }`}>
                        {step.label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="py-12 text-center bg-red-500/10 mb-12 border-2 border-dashed border-red-500/20">
                 <i className="fas fa-ban text-red-500 text-4xl mb-4"></i>
                 <p className="text-red-500 font-black uppercase text-xs tracking-[0.2em]">This order has been cancelled</p>
                 <p className="text-[9px] text-red-500/50 uppercase mt-2">Contact support for refund information</p>
              </div>
            )}

            {/* Item Manifest Section */}
            <div className="mt-12 pt-8 border-t-2 border-[var(--text)] space-y-6">
              <h4 className="text-[10px] font-black uppercase tracking-[0.4em] mb-4">Parcel Contents</h4>
              <div className="space-y-4">
                {Array.isArray(typeof trackingData.items === 'string' ? JSON.parse(trackingData.items) : trackingData.items) ? (typeof trackingData.items === 'string' ? JSON.parse(trackingData.items) : trackingData.items).map((item: any, i: number) => (
                  <div key={i} className="flex items-center gap-4 bg-[var(--bg)] p-4 border border-[var(--line)]">
                    <div className="w-12 h-16 bg-[var(--card-bg)] border border-[var(--line)] overflow-hidden flex-shrink-0 flex items-center justify-center">
                      {item.image ? (
                        <img src={item.image} className="w-full h-full object-cover grayscale" />
                      ) : (
                        <i className="fas fa-image opacity-10 text-xs"></i>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-[10px] font-black uppercase tracking-tight">{item.name}</p>
                      <div className="flex gap-4 mt-1">
                        <p className="text-[8px] font-bold uppercase">Color: <span className="underline decoration-2">{item.selectedColor || item.color || 'Standard'}</span></p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] font-black uppercase opacity-60">QTY: {item.quantity}</p>
                    </div>
                  </div>
                )) : (
                  <p className="text-[10px] font-bold italic opacity-30">Loading item manifest...</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8 border-t border-[var(--line)] pt-8 mt-12">
               <div className="space-y-1">
                  <p className="text-[9px] font-black uppercase opacity-40">Current Location</p>
                  <p className="text-xs font-black uppercase">
                    {trackingData.status === 'Delivered' ? 'Delivered to Customer' : (trackingData.status === 'Cancelled' ? 'Void' : 'Sorting Facility')}
                  </p>
               </div>
               <div className="space-y-1 text-right">
                  <p className="text-[9px] font-black uppercase opacity-40">Registry Date</p>
                  <p className="text-xs font-black uppercase">
                    {trackingData.date ? new Date(trackingData.date).toLocaleDateString() : 'Pending'}
                  </p>
               </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Tracking;
