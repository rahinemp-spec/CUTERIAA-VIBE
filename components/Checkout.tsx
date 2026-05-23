import React, { useState, useEffect } from "react";
import { CartItem, Order } from "../types";
import { sheetApi } from "../services/api";
import { safeParseJSON } from "../utils/colorUtils";

interface CheckoutProps {
  items: CartItem[];
  onClose: () => void;
  onComplete: (orderId: string) => void;
}

const BANGLADESH_DISTRICTS = [
  "Bagerhat",
  "Bandarban",
  "Barguna",
  "Barisal",
  "Bhola",
  "Bogra",
  "Brahmanbaria",
  "Chandpur",
  "Chapainawabganj",
  "Chattogram",
  "Chuadanga",
  "Comilla",
  "Cox's Bazar",
  "Dhaka City",
  "Dhaka (Suburbs)",
  "Dinajpur",
  "Faridpur",
  "Feni",
  "Gaibandha",
  "Gazipur",
  "Gopalganj",
  "Habiganj",
  "Jamalpur",
  "Jashore",
  "Jhalokati",
  "Jhenaidah",
  "Joypurhat",
  "Khagrachhari",
  "Khulna",
  "Kishoreganj",
  "Kurigram",
  "Kushtia",
  "Lakshmipur",
  "Lalmonirhat",
  "Madaripur",
  "Magura",
  "Manikganj",
  "Meherpur",
  "Moulvibazar",
  "Munshiganj",
  "Mymensingh",
  "Naogaon",
  "Narail",
  "Narayanganj",
  "Narsingdi",
  "Natore",
  "Netrokona",
  "Nilphamari",
  "Noakhali",
  "Pabna",
  "Panchagarh",
  "Patuakhali",
  "Pirojpur",
  "Rajbari",
  "Rajshahi",
  "Rangamati",
  "Rangpur",
  "Satkhira",
  "Shariatpur",
  "Sherpur",
  "Sirajganj",
  "Sunamganj",
  "Sylhet",
  "Tangail",
  "Thakurgaon",
].sort();

const Checkout: React.FC<CheckoutProps> = ({ items, onClose, onComplete }) => {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    district: "",
    thana: "",
    address: "",
    deliveryMethod: "inside-dhaka",
    paymentMethod: "cod",
    transactionInfo: "",
  });

  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-adjust delivery method based on district
  useEffect(() => {
    if (!formData.district) return;

    const isDhaka = formData.district === "Dhaka City";

    if (isDhaka) {
      // If switching to Dhaka and currently on National, move to standard Dhaka
      if (formData.deliveryMethod === "outside-dhaka") {
        setFormData((prev) => ({ ...prev, deliveryMethod: "inside-dhaka" }));
      }
    } else {
      // If outside Dhaka, force national delivery
      if (formData.deliveryMethod !== "outside-dhaka") {
        setFormData((prev) => ({ ...prev, deliveryMethod: "outside-dhaka" }));
      }
    }
  }, [formData.district]);

  const hasPrebook = items.some(item => String(item.price).toLowerCase().includes("prebook"));

  const subtotal = items.reduce(
    (sum, item) =>
      sum + (typeof item.price === "number" ? item.price : 0) * item.quantity,
    0,
  );

  const getDeliveryCharge = () => {
    if (hasPrebook) return 0;
    switch (formData.deliveryMethod) {
      case "inside-dhaka":
        return 70;
      case "outside-dhaka":
        return 120;
      case "express-dhaka":
        return 100;
      default:
        return 0;
    }
  };

  const getDeliveryTime = () => {
    switch (formData.deliveryMethod) {
      case "inside-dhaka":
        return "1-2 Days";
      case "outside-dhaka":
        return "1-3 Days";
      case "express-dhaka":
        return "24 Hours";
      default:
        return "";
    }
  };

  const deliveryCharge = getDeliveryCharge();
  const total = subtotal + deliveryCharge;

  const copyNumber = () => {
    navigator.clipboard.writeText("01872537867");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Active cloud inventory validation guard
    try {
      const latestProducts = await sheetApi.fetchProducts();
      if (latestProducts && Array.isArray(latestProducts)) {
        for (const item of items) {
          const matchedProd = latestProducts.find((p: any) => String(p.id) === String(item.id));
          if (matchedProd) {
            const outColors = safeParseJSON(matchedProd.outOfStockColors);
            const isOutOfStockNow = item.selectedColor 
              ? outColors.some((c: string) => c.trim().toLowerCase() === item.selectedColor!.trim().toLowerCase())
              : false;
            
            if (isOutOfStockNow) {
              alert(`Sorry, the item "${item.name}" in color "${item.selectedColor || 'Standard'}" has just gone out of stock. Please remove it from your shopping bag to place your order.`);
              setIsSubmitting(false);
              return;
            }
          }
        }
      }
    } catch (err) {
      console.warn("Failed active inventory validation:", err);
    }

    const orderId = `CTR-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    const newOrder: Order = {
      id: orderId,
      customer: { ...formData },
      items,
      subtotal,
      deliveryCharge,
      total,
      paymentMethod: formData.paymentMethod,
      transactionInfo: formData.transactionInfo,
      status: "Processing",
      date: new Date().toISOString(),
    };

    // Sync to cloud and trigger auto-email
    await sheetApi.syncOrder(newOrder);

    setTimeout(() => {
      onComplete(orderId);
      setIsSubmitting(false);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-[150] flex md:items-center justify-center p-0 md:p-6 overflow-y-auto bg-[var(--bg)]/60 backdrop-blur-xl custom-scrollbar transition-colors duration-300">
      <div className="absolute inset-0" onClick={onClose}></div>

      <div className="relative bg-[var(--bg)] text-[var(--text)] w-full max-w-6xl h-auto md:h-auto md:max-h-[92vh] md:overflow-hidden md:rounded-[48px] border border-[var(--line)] shadow-2xl flex flex-col md:flex-row animate-slideUp">
        {/* Left: Form */}
        <div className="flex-1 md:overflow-y-auto p-6 sm:p-8 md:p-16 custom-scrollbar relative">
          <div className="mb-10 sm:mb-14">
            <button
              onClick={onClose}
              className="md:hidden absolute top-0 right-0 w-10 h-10 flex items-center justify-center rounded-full bg-[var(--card-bg)] opacity-50 text-[var(--text)] z-50"
            >
              <i className="fas fa-times text-xs"></i>
            </button>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--card-bg)] text-[9px] font-bold uppercase tracking-[0.2em] opacity-40 mb-6">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
              Checkout Securely
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-light tracking-tight mb-4 font-serif">
              Shipping <span className="italic opacity-30">Information</span>
            </h2>
            <p className="text-xs sm:text-sm opacity-40 max-w-sm leading-relaxed">
              Experience premium quality at your doorstep. Please provide your
              delivery details.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-12">
            {/* Contact Group */}
            <section className="space-y-8">
              <div className="flex items-center gap-4">
                <span className="text-[10px] uppercase tracking-[0.3em] font-black opacity-10">
                  01 Identity
                </span>
                <div className="h-px flex-1 bg-[var(--line)]"></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 ml-1">
                    Recipient
                  </label>
                  <input
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full bg-[var(--card-bg)] border border-[var(--line)] focus:border-[var(--accent)] text-[var(--text)] p-5 rounded-2xl text-sm font-medium outline-none transition-all placeholder:text-current placeholder:opacity-10 shadow-sm"
                    placeholder="Full Name"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 ml-1">
                    Contact
                  </label>
                  <input
                    required
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="w-full bg-[var(--card-bg)] border border-[var(--line)] focus:border-[var(--accent)] text-[var(--text)] p-5 rounded-2xl text-sm font-medium outline-none transition-all placeholder:text-current placeholder:opacity-10 shadow-sm"
                    placeholder="01XXXXXXXXX"
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 ml-1">
                    Digital Address
                  </label>
                  <input
                    required
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full bg-[var(--card-bg)] border border-[var(--line)] focus:border-[var(--accent)] text-[var(--text)] p-5 rounded-2xl text-sm font-medium outline-none transition-all placeholder:text-current placeholder:opacity-10 shadow-sm"
                    placeholder="your@email.com"
                  />
                </div>
              </div>
            </section>

            {/* Address Group */}
            <section className="space-y-8">
              <div className="flex items-center gap-4">
                <span className="text-[10px] uppercase tracking-[0.3em] font-black opacity-10">
                  02 Destination
                </span>
                <div className="h-px flex-1 bg-[var(--line)]"></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 ml-1">
                    City/District
                  </label>
                  <div className="relative">
                    <select
                      required
                      value={formData.district}
                      onChange={(e) =>
                        setFormData({ ...formData, district: e.target.value })
                      }
                      className="w-full bg-[var(--card-bg)] border border-[var(--line)] focus:border-[var(--accent)] text-[var(--text)] p-5 rounded-2xl text-sm font-medium outline-none transition-all appearance-none cursor-pointer shadow-sm"
                    >
                      <option value="" disabled className="bg-[var(--card-bg)]">
                        Select Locale
                      </option>
                      {BANGLADESH_DISTRICTS.map((district) => (
                        <option
                          key={district}
                          value={district}
                          className="bg-[var(--card-bg)]"
                        >
                          {district}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none opacity-30">
                      <i className="fas fa-chevron-down text-[10px]"></i>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 ml-1">
                    Thana / Upazila
                  </label>
                  <input
                    required
                    value={formData.thana}
                    onChange={(e) =>
                      setFormData({ ...formData, thana: e.target.value })
                    }
                    className="w-full bg-[var(--card-bg)] border border-[var(--line)] focus:border-[var(--accent)] text-[var(--text)] p-5 rounded-2xl text-sm font-medium outline-none transition-all placeholder:text-current placeholder:opacity-10 shadow-sm"
                    placeholder="e.g. Uttara / Mirpur"
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 ml-1">
                    Full Delivery Point
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    className="w-full bg-[var(--card-bg)] border border-[var(--line)] focus:border-[var(--accent)] text-[var(--text)] p-5 rounded-2xl text-sm font-medium outline-none transition-all placeholder:text-current placeholder:opacity-10 shadow-sm resize-none"
                    placeholder="House, Block, Road Details..."
                  />
                </div>
              </div>
            </section>

            {/* Logistics Group */}
            {!hasPrebook && (
              <section className="space-y-8">
                <div className="flex items-center gap-4">
                  <span className="text-[10px] uppercase tracking-[0.3em] font-black opacity-10">
                    03 Logistics
                  </span>
                  <div className="h-px flex-1 bg-[var(--line)]"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    {
                      id: "inside-dhaka",
                      label: "Dhaka City",
                      price: 70,
                      time: "1-2 Days",
                      dhakaOnly: true,
                    },
                    {
                      id: "outside-dhaka",
                      label: "National",
                      price: 120,
                      time: "2-4 Days",
                      dhakaOnly: false,
                    },
                    {
                      id: "express-dhaka",
                      label: "Priority",
                      price: 100,
                      time: "Next Day",
                      dhakaOnly: true,
                    },
                  ].map((method) => {
                    const isDisabled =
                      method.dhakaOnly &&
                      formData.district &&
                      formData.district !== "Dhaka City";

                    return (
                      <div
                        key={method.id}
                        onClick={() =>
                          !isDisabled &&
                          setFormData({ ...formData, deliveryMethod: method.id })
                        }
                        className={`cursor-pointer p-6 rounded-[32px] border transition-all duration-500 flex flex-col justify-between min-h-[120px] 
                          ${isDisabled ? "opacity-20 cursor-not-allowed grayscale" : ""}
                          ${
                            formData.deliveryMethod === method.id
                              ? "border-[var(--text)] bg-[var(--text)] text-[var(--bg)] shadow-2xl scale-[1.02]"
                              : "border-[var(--line)] bg-[var(--card-bg)] hover:border-[var(--accent)]"
                          }
                        `}
                      >
                        <div>
                          <p
                            className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${formData.deliveryMethod === method.id ? "opacity-40" : "opacity-60"}`}
                          >
                            {method.label}
                          </p>
                          <p
                            className={`text-[9px] uppercase ${formData.deliveryMethod === method.id ? "opacity-30" : "opacity-20"}`}
                          >
                            {method.time}
                          </p>
                        </div>
                        <p className="text-xl font-light tracking-tighter">
                          ৳{method.price}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Payment Group */}
            <section className="space-y-8">
              <div className="flex items-center gap-4">
                <span className="text-[10px] uppercase tracking-[0.3em] font-black opacity-10">
                  {hasPrebook ? "03 Settlement" : "04 Settlement"}
                </span>
                <div className="h-px flex-1 bg-[var(--line)]"></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div
                  onClick={() =>
                    setFormData({ ...formData, paymentMethod: "cod" })
                  }
                  className={`cursor-pointer p-8 rounded-[32px] border transition-all duration-500 flex items-center justify-between ${formData.paymentMethod === "cod" ? "border-[var(--text)] bg-[var(--text)] text-[var(--bg)] shadow-2xl scale-[1.02]" : "border-[var(--line)] bg-[var(--card-bg)] hover:border-[var(--accent)]"}`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${formData.paymentMethod === "cod" ? "bg-[var(--bg)] text-[var(--text)]" : "bg-[var(--bg)] border border-[var(--line)] opacity-30"}`}
                    >
                      <i className="fas fa-money-bill-wave text-sm"></i>
                    </div>
                    <span className="text-[11px] font-bold uppercase tracking-[0.2em]">
                      Cash on Delivery
                    </span>
                  </div>
                  <div
                    className={`w-4 h-4 rounded-full border-2 p-0.5 flex items-center justify-center ${formData.paymentMethod === "cod" ? "border-[var(--bg)]" : "border-[var(--line)]"}`}
                  >
                    {formData.paymentMethod === "cod" && (
                      <div className="w-full h-full rounded-full bg-current"></div>
                    )}
                  </div>
                </div>
                <div
                  onClick={() =>
                    setFormData({ ...formData, paymentMethod: "mobile" })
                  }
                  className={`cursor-pointer p-8 rounded-[32px] border transition-all duration-500 flex items-center justify-between ${formData.paymentMethod === "mobile" ? "border-[var(--text)] bg-[var(--text)] text-[var(--bg)] shadow-2xl scale-[1.02]" : "border-[var(--line)] bg-[var(--card-bg)] hover:border-[var(--accent)]"}`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${formData.paymentMethod === "mobile" ? "bg-[var(--bg)] text-[var(--text)]" : "bg-[var(--bg)] border border-[var(--line)] opacity-30"}`}
                    >
                      <i className="fas fa-wallet text-sm"></i>
                    </div>
                    <span className="text-[11px] font-bold uppercase tracking-[0.2em]">
                      Mobile Banking
                    </span>
                  </div>
                  <div
                    className={`w-4 h-4 rounded-full border-2 p-0.5 flex items-center justify-center ${formData.paymentMethod === "mobile" ? "border-[var(--bg)]" : "border-[var(--line)]"}`}
                  >
                    {formData.paymentMethod === "mobile" && (
                      <div className="w-full h-full rounded-full bg-current"></div>
                    )}
                  </div>
                </div>
              </div>

              {formData.paymentMethod === "mobile" && (
                <div className="p-10 bg-[var(--card-bg)] rounded-[40px] border border-[var(--line)] animate-fadeIn space-y-8">
                  <div className="flex flex-col md:flex-row justify-between items-start lg:items-center gap-6 md:gap-8">
                    <div>
                      <p className="text-[8px] sm:text-[9px] font-bold uppercase opacity-30 mb-2 sm:mb-3 tracking-widest flex items-center gap-2">
                        <span className="w-1 h-1 rounded-full bg-current"></span>
                        Send Money Personal
                      </p>
                      <p className="text-3xl sm:text-4xl md:text-5xl font-light tracking-tighter font-serif leading-none">
                        01872537867
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText("01872537867");
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      className="w-full md:w-auto px-10 py-3 sm:py-4 bg-[var(--text)] text-[var(--bg)] rounded-2xl text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] hover:opacity-90 transition-all shadow-lg active:scale-95"
                    >
                      {copied ? "Copied" : "Copy Number"}
                    </button>
                  </div>
                  <div className="pt-8 border-t border-[var(--line)] flex flex-col gap-3">
                    <label className="text-[10px] font-bold uppercase tracking-widest opacity-30 ml-1">
                      Confirmation Reference
                    </label>
                    <input
                      required
                      value={formData.transactionInfo}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          transactionInfo: e.target.value,
                        })
                      }
                      className="w-full bg-[var(--bg)] border border-[var(--line)] focus:border-[var(--accent)] p-5 rounded-2xl text-sm font-medium outline-none transition-all shadow-inner text-[var(--text)]"
                      placeholder="Enter Transaction ID or Phone Number"
                    />
                    <p className="text-[8px] opacity-30 italic">
                      Please complete the transfer before submitting for
                      verification.
                    </p>
                  </div>
                </div>
              )}
            </section>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full group relative py-7 bg-[var(--text)] text-[var(--bg)] rounded-[32px] font-bold uppercase text-[12px] tracking-[0.5em] hover:opacity-90 disabled:opacity-50 overflow-hidden transition-all shadow-2xl"
            >
              <span className="relative z-10 flex items-center justify-center gap-6 group-hover:gap-8 transition-all">
                {isSubmitting ? (
                  <>
                    <i className="fas fa-circle-notch fa-spin"></i>
                    Processing Selection
                  </>
                ) : (
                  <>
                    Complete Purchase
                    <i className="fas fa-arrow-right text-[10px]"></i>
                  </>
                )}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-current via-transparent to-current translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 opacity-10"></div>
            </button>
          </form>
        </div>

        {/* Right: Summary */}
        <div className="w-full md:w-[440px] bg-[var(--card-bg)] flex flex-col h-auto md:h-full border-t border-[var(--line)] md:border-t-0 md:border-l border-[var(--line)] relative shadow-[-20px_0_40px_rgba(0,0,0,0.1)]">
          <div className="absolute top-0 right-0 p-4 md:p-8 z-20 hidden md:block">
            <button
              onClick={onClose}
              className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full bg-[var(--bg)] shadow-sm hover:bg-[var(--text)] hover:text-[var(--bg)] transition-all transform hover:rotate-90 group"
            >
              <i className="fas fa-times text-xs md:text-sm opacity-40 group-hover:opacity-100"></i>
            </button>
          </div>

          <div className="p-8 md:p-14 flex-1 flex flex-col min-h-0 relative z-10 pt-20 md:pt-24">
            <div className="mb-10 md:mb-14">
              <span className="text-[10px] font-bold uppercase tracking-[0.4em] opacity-20 block mb-2">
                Order Batch
              </span>
              <h3 className="text-2xl font-light font-serif lowercase italic">
                Review summary
              </h3>
            </div>

            <div className="md:flex-1 md:overflow-y-auto space-y-10 pr-0 md:pr-2 custom-scrollbar">
              {items.map((item) => (
                <div key={item.id} className="flex gap-6 group">
                  <div className="w-24 h-32 rounded-[32px] bg-[var(--bg)] shadow-sm flex-shrink-0 overflow-hidden border border-[var(--line)] p-1">
                    <div className="w-full h-full rounded-[28px] overflow-hidden">
                      {item.image ? (
                        <img
                          src={item.image}
                          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-125"
                          alt={item.name}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center opacity-10">
                          <i className="fas fa-image"></i>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col justify-center">
                    <h4 className="text-xs font-bold mb-3 line-clamp-2 leading-relaxed tracking-tight">
                      {item.name}
                    </h4>
                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className="px-3 py-1 rounded-full bg-[var(--bg)] text-[9px] font-bold opacity-40 uppercase tracking-tighter border border-[var(--line)]">
                        {item.quantity} Unit
                      </span>
                    </div>
                    <p className="text-base font-light tracking-tighter">
                      {typeof item.price === "number"
                        ? `৳${item.price * item.quantity}`
                        : item.quantity > 1
                          ? `${item.price} (x${item.quantity})`
                          : item.price}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-auto pt-10 space-y-5">
              <div className={`flex justify-between items-center text-[10px] font-bold uppercase tracking-widest opacity-30 ${hasPrebook ? "pb-6 border-b border-[var(--line)]" : ""}`}>
                <span>Value</span>
                <span className="text-[var(--text)]">৳{subtotal}</span>
              </div>
              {!hasPrebook && (
                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest opacity-30 pb-6 border-b border-[var(--line)]">
                  <span>Shipment</span>
                  <span className="text-[var(--text)]">৳{deliveryCharge}</span>
                </div>
              )}
              <div className="pt-6 flex justify-between items-end">
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold uppercase tracking-[0.3em] opacity-30 mb-3">
                    Total Investment
                  </span>
                  <span className="text-5xl font-light font-serif leading-none tracking-tighter italic">
                    ৳{total}
                  </span>
                </div>
                <div className="w-14 h-14 rounded-full bg-[var(--text)] text-[var(--bg)] flex items-center justify-center shadow-xl animate-pulse">
                  <i className="fas fa-fingerprint text-lg"></i>
                </div>
              </div>
            </div>
          </div>

          <div className="p-10 text-center border-t border-[var(--line)] bg-[var(--bg)]/30 backdrop-blur-sm">
            <p className="text-[9px] font-bold uppercase tracking-[0.5em] opacity-20">
              Cuteriaa Premium Syndicate
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
