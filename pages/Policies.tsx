
import React from 'react';

export type PolicyType = 'shipping' | 'returns' | 'privacy' | 'terms';

interface PoliciesProps {
  initialType: PolicyType;
}

const Policies: React.FC<PoliciesProps> = ({ initialType }) => {
  const [activePolicy, setActivePolicy] = React.useState<PolicyType>(initialType);

  const sidebarItems: { id: PolicyType; label: string; icon: string }[] = [
    { id: 'shipping', label: 'Shipping & Logistics', icon: 'fa-truck-fast' },
    { id: 'returns', label: 'Returns & Refunds', icon: 'fa-rotate-left' },
    { id: 'privacy', label: 'Privacy Protocol', icon: 'fa-shield-halved' },
    { id: 'terms', label: 'Service Terms', icon: 'fa-file-contract' },
  ];

  return (
    <div className="bg-[var(--bg)] text-[var(--text)] pt-32 pb-24 px-4 sm:px-6 md:px-10 max-w-7xl mx-auto min-h-screen animate-fadeIn transition-colors duration-300">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
        
        {/* Sidebar */}
        <div className="lg:col-span-4 space-y-4">
          <div className="mb-6 sm:mb-10">
            <h1 className="text-4xl sm:text-5xl font-black uppercase tracking-tighter italic mb-4">Cuteriaa Codex</h1>
            <p className="opacity-40 text-[10px] font-black uppercase tracking-[0.4em]">Business Operations & Legal</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2 sm:gap-4 lg:gap-2">
            {sidebarItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActivePolicy(item.id);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`w-full flex items-center justify-center lg:justify-start gap-4 p-4 sm:p-5 text-[9px] sm:text-[10px] font-black uppercase tracking-widest border-2 transition-all ${
                  activePolicy === item.id 
                    ? 'bg-[var(--text)] text-[var(--bg)] border-[var(--text)] shadow-[4px_4px_0px_0px_var(--text)] sm:shadow-[8px_8px_0px_0px_var(--text)]' 
                    : 'bg-[var(--bg)] opacity-40 border-[var(--line)] hover:border-[var(--text)] hover:opacity-100'
                }`}
              >
                <i className={`fas ${item.icon} w-5`}></i>
                {item.label}
              </button>
            ))}
          </div>

          <div className="mt-8 sm:mt-12 p-6 sm:p-8 border-2 border-[var(--text)] bg-[var(--text)]/[0.02] italic hidden sm:block">
            <h4 className="text-[10px] font-black uppercase mb-4 tracking-widest">Our Standard</h4>
            <p className="text-[11px] leading-relaxed font-bold opacity-60">
              "We don't just sell apparel; we engineer anime culture. Every thread, every print, and every delivery is handled with clinical precision in our Dhaka headquarters using 175 GSM premium cotton."
            </p>
          </div>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-8 bg-[var(--bg)] border-2 sm:border-4 border-[var(--text)] p-6 sm:p-8 md:p-16 shadow-[10px_10px_0px_0px_rgba(0,0,0,0.05)] sm:shadow-[20px_20px_0px_0px_rgba(0,0,0,0.05)]">
          {activePolicy === 'shipping' && (
            <div className="animate-slideUp space-y-8 md:space-y-10">
              <h2 className="text-3xl sm:text-4xl font-black uppercase italic tracking-tighter border-b-2 sm:border-b-4 border-[var(--text)] pb-4">Shipping & Logistics</h2>
              
              <div className="space-y-6">
                <p className="text-sm font-bold leading-relaxed">
                  Cuteriaa Vibe operates a proprietary cloud-synced logistics engine based in Dhaka, Bangladesh. We ensure that every premium piece reaches its destination with speed and integrity.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-6">
                  <div className="border-l-4 border-[var(--text)] pl-6">
                    <h4 className="text-[10px] font-black uppercase tracking-widest mb-2">Inside Dhaka</h4>
                    <p className="text-xs font-bold opacity-50">1-2 Business Days • ৳70 Flat Rate</p>
                  </div>
                  <div className="border-l-4 border-[var(--text)] pl-6">
                    <h4 className="text-[10px] font-black uppercase tracking-widest mb-2">Outside Dhaka</h4>
                    <p className="text-xs font-bold opacity-50">1-3 Business Days • ৳120 Flat Rate</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-black uppercase tracking-tight">The Dispatch Pipeline</h3>
                  <ul className="space-y-3 text-xs font-bold opacity-60 list-none">
                    <li className="flex gap-3"><i className="fas fa-check-circle text-[var(--text)]"></i> 0-12 Hours: Quality assessment and textile steam-pressing.</li>
                    <li className="flex gap-3"><i className="fas fa-check-circle text-[var(--text)]"></i> 12-24 Hours: Secure eco-packaging and tracking ID generation.</li>
                    <li className="flex gap-3"><i className="fas fa-check-circle text-[var(--text)]"></i> Arrival: Delivered to your doorstep with SMS notification.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activePolicy === 'returns' && (
            <div className="animate-slideUp space-y-10">
              <h2 className="text-4xl font-black uppercase italic tracking-tighter border-b-4 border-[var(--text)] pb-4">Returns & Refunds</h2>
              
              <div className="space-y-6">
                <div className="bg-[var(--text)] text-[var(--bg)] p-6">
                  <h3 className="text-xl font-black uppercase italic mb-2 tracking-tighter">Instant 24-Hour Satisfaction Guarantee</h3>
                  <p className="text-[10px] font-bold leading-relaxed opacity-80 uppercase tracking-widest">
                    Cuteriaa Vibe stands for absolute quality. If the product does not meet your expectations, we offer a specialized fast-track refund window.
                  </p>
                </div>

                <div className="bg-yellow-500/10 border-2 border-yellow-500/20 p-6">
                  <h4 className="text-[10px] font-black uppercase text-yellow-600 mb-3 tracking-widest flex items-center gap-2">
                    <i className="fas fa-video"></i>
                    Mandatory Unboxing Video
                  </h4>
                  <p className="text-[11px] font-bold text-yellow-600/80 leading-relaxed uppercase">
                    To process any return or refund request, an unedited, continuous unboxing video starting from the sealed package is strictly required. This transparent procedure is mandatory to validate claims regarding missing, defective, or incorrect items.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 py-6">
                  <div className="space-y-4">
                    <h4 className="text-sm font-black uppercase italic tracking-tighter flex items-center gap-2">
                       <i className="fas fa-bolt text-yellow-500"></i>
                      The 24-Hour Rule
                    </h4>
                    <p className="text-[11px] font-bold opacity-50 leading-relaxed uppercase">
                      Customers have a strict <span className="text-[var(--text)] underline">24-hour window</span> from the moment of delivery to request a refund if they "don't like" the product. Requests made after this window will be evaluated for exchange only.
                    </p>
                  </div>
                  <div className="space-y-4">
                    <h4 className="text-sm font-black uppercase italic tracking-tighter flex items-center gap-2">
                      <i className="fas fa-hand-holding-dollar text-green-500"></i>
                      Refund Architecture
                    </h4>
                    <p className="text-[11px] font-bold opacity-50 leading-relaxed uppercase">
                      We will refund <span className="text-[var(--text)] underline">100% of the product price</span> instantly via mobile banking once the item is verified.
                    </p>
                  </div>
                </div>

                <div className="bg-red-500/10 border-2 border-dashed border-red-500/20 p-6">
                  <h4 className="text-[10px] font-black uppercase text-red-500 mb-3 tracking-widest flex items-center gap-2">
                    <i className="fas fa-exclamation-triangle"></i>
                    Reverse Logistics Fee
                  </h4>
                  <p className="text-[11px] font-bold text-red-500/80 leading-relaxed uppercase">
                    While the product cost is refunded, the <span className="font-black underline">delivery charge must be paid by the customer</span>. This includes the original delivery fee and the return shipping fee to our Dhaka hub.
                  </p>
                </div>

                <div className="space-y-6 py-4">
                  <h3 className="text-lg font-black uppercase tracking-tight italic">How Business Works @ Cuteriaa</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-4 border border-[var(--line)]">
                      <h5 className="text-[9px] font-black uppercase mb-2">1. Request</h5>
                      <p className="text-[9px] font-bold opacity-40 uppercase leading-tight">Text our Support Center within 24hrs of arrival.</p>
                    </div>
                    <div className="p-4 border border-[var(--line)]">
                      <h5 className="text-[9px] font-black uppercase mb-2">2. Verification</h5>
                      <p className="text-[9px] font-bold opacity-40 uppercase leading-tight">Item must be unworn and in original technical packaging.</p>
                    </div>
                    <div className="p-4 border border-[var(--line)]">
                      <h5 className="text-[9px] font-black uppercase mb-2">3. Instant Payout</h5>
                      <p className="text-[9px] font-bold opacity-40 uppercase leading-tight">Funds disbursed to your Bkash/Nagad within 24hrs of receipt.</p>
                    </div>
                  </div>
                </div>

                <p className="text-[10px] font-black opacity-40 border-t border-[var(--line)] pt-6 uppercase tracking-[0.2em]">
                  Note: Custom AI-generated designs are non-refundable unless a manufacturing defect is present.
                </p>
              </div>
            </div>
          )}

          {activePolicy === 'privacy' && (
            <div className="animate-slideUp space-y-10">
              <h2 className="text-4xl font-black uppercase italic tracking-tighter border-b-4 border-[var(--text)] pb-4">Privacy Protocol</h2>
              
              <div className="space-y-8 text-sm font-bold opacity-60 leading-relaxed uppercase tracking-tight">
                <section>
                  <h3 className="text-[var(--text)] font-black mb-4">Data Encapsulation & Security</h3>
                  <p>
                    Cuteriaa Vibe employs advanced encryption standards to safeguard your identity. Your personal information—including name, biometric phone data, and geolocation for delivery—is strictly encapsulated within our secure cloud servers. We utilize SSL (Secure Sockets Layer) technology to ensure every packet of data is unreadable by unauthorized entities.
                  </p>
                </section>

                <section>
                  <h3 className="text-[var(--text)] font-black mb-4">Information Gathering Architecture</h3>
                  <p>
                    We collect metadata focused on optimizing your procurement experience. This includes device type, browser signatures, and interaction logs. This data is used exclusively to improve our Custom AI Studio performance and logistics accuracy. We do not engage in persistent tracking across non-affiliated web domains.
                  </p>
                </section>

                <section>
                  <h3 className="text-[var(--text)] font-black mb-4">Third-Party Logistics Sharing</h3>
                  <p>
                    To execute high-precision delivery, your contact details are shared with our verified logistics partners (e.g., Pathao, RedX, or Steadfast). These entities are legally bound by our non-disclosure agreements and are prohibited from utilizing your data for marketing or external archival purposes.
                  </p>
                </section>

                <section>
                  <h3 className="text-[var(--text)] font-black mb-4">Your Sovereign Data Rights</h3>
                  <p>
                    You retain the right to request a complete purge of your interaction history from our support logs. To execute a data erasure request, contact our Staff Portal via the Live Support center or email us directly at <a href="mailto:cuteriaavibe@gmail.com" className="text-[var(--text)] underline">cuteriaavibe@gmail.com</a>.
                  </p>
                </section>
              </div>
            </div>
          )}

          {activePolicy === 'terms' && (
            <div className="animate-slideUp space-y-10">
              <h2 className="text-4xl font-black uppercase italic tracking-tighter border-b-4 border-[var(--text)] pb-4">Service Terms</h2>
              
              <div className="space-y-8 text-sm font-bold opacity-60 leading-relaxed uppercase tracking-tight">
                <section>
                  <h3 className="text-[var(--text)] font-black mb-4">Intellectual Property & Brand Integrity</h3>
                  <p>
                    The "Cuteriaa" logo, brand aesthetic, and custom-engineered anime designs are the exclusive property of Cuteriaa Vibe. Unauthorized reproduction of our proprietary graphics for commercial use is strictly prohibited and subject to legal action under Bangladesh IP laws.
                  </p>
                </section>

                <section>
                  <h3 className="text-[var(--text)] font-black mb-4">Custom AI Design Governance</h3>
                  <p>
                    Our "Custom Studio" utilizes advanced generative models to visualize your concepts. By utilizing this tool, you acknowledge that AI-generated imagery may have artistic variations. Cuteriaa reserves the right to refuse the production of designs that contain offensive, prohibited, or copyrighted material belonging to third parties without permission.
                  </p>
                </section>

                <section>
                  <h3 className="text-[var(--text)] font-black mb-4">Electronic Communication Consent</h3>
                  <p>
                    By placing an order or initiating a support chat, you consent to receive electronic communications from Cuteriaa Vibe via email, SMS, or mobile telephony. These communications include order confirmations, shipping updates, and service-related announcements necessary for fulfilling our contract with you.
                  </p>
                </section>

                <section>
                  <h3 className="text-[var(--text)] font-black mb-4">Pricing & Availability Anomalies</h3>
                  <p>
                    Cuteriaa Vibe strives for absolute accuracy in pricing. However, in the event of a system error where an item is listed at an incorrect price, we reserve the right to refuse or cancel any orders placed for that item. If your payment has already been processed, we will issue a full refund to your original payment method.
                  </p>
                </section>

                <section>
                  <h3 className="text-[var(--text)] font-black mb-4">Purchase & Payment Compliance</h3>
                  <p>
                    All orders placed through our cloud terminal are considered binding. For mobile banking (Bkash/Nagad), production begins only after a verified transaction ID is received. For Cash on Delivery (COD), customers must respond to our verification call within 12 hours, or the order will be automatically purged from the dispatch pipeline.
                  </p>
                </section>

                <section>
                  <h3 className="text-[var(--text)] font-black mb-4">Limitation of Liability</h3>
                  <p>
                    Cuteriaa Vibe is not responsible for delivery delays caused by external factors such as extreme weather, political unrest, or logistics partner infrastructure failures. Our maximum liability in any scenario is limited to the total value of the items purchased in the specific disputed order.
                  </p>
                </section>

                <section>
                  <h3 className="text-[var(--text)] font-black mb-4">Governing Law & Dispute Resolution</h3>
                  <p>
                    These terms are governed by the laws of the People's Republic of Bangladesh. Any disputes arising from or relating to these terms or our services shall be resolved through good-faith negotiation, followed by arbitration in Dhaka, Bangladesh, if a resolution cannot be reached. For all legal inquiries, please reach out to <a href="mailto:cuteriaavibe@gmail.com" className="text-[var(--text)] underline">cuteriaavibe@gmail.com</a>.
                  </p>
                </section>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Policies;
