import React from 'react';

export default function ContactUs() {
  return (
    <div className="pt-32 pb-20 px-4 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-4 text-center">Contact Us</h1>
        <p className="text-center opacity-60 font-medium mb-16 max-w-2xl mx-auto">
          We'd love to hear from you. Reach out to us through any of the channels below.
        </p>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-[var(--text)] text-[var(--bg)] p-8 shadow-[8px_8px_0px_0px_var(--text)] border-4 border-[var(--text)] bg-opacity-5">
            <h2 className="text-2xl font-black uppercase tracking-widest mb-8 border-b-2 border-current/20 pb-4">Our Details</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-2">Email</h3>
                <a href="mailto:cuteriaavibe@gmail.com" className="text-lg font-bold hover:underline underline-offset-4 decoration-2">cuteriaavibe@gmail.com</a>
              </div>

              <div>
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-2">Phone</h3>
                <a href="tel:+8801736346273" className="text-lg font-bold hover:underline underline-offset-4 decoration-2">+88 01736 346 273</a>
              </div>

              <div>
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-2">Location</h3>
                <p className="text-lg font-bold leading-tight">
                  Dhaka, Demra Sarulia,<br />
                  West Box nagar Talabali mosgid road
                </p>
              </div>
            </div>
          </div>

          <div className="bg-[#25D366]/10 p-8 shadow-[8px_8px_0px_0px_#25D366] border-4 border-[#25D366] flex flex-col justify-center items-center text-center">
            <h2 className="text-2xl font-black uppercase tracking-widest mb-6 text-[#25D366]">Chat on WhatsApp</h2>
            <p className="opacity-80 font-medium mb-8 max-w-[250px]">
              Need quick assistance? We are available on WhatsApp to answer all your queries.
            </p>
            <a 
              href="https://wa.me/8801736346273" 
              target="_blank" 
              rel="noopener noreferrer"
              className="group relative inline-block transition-transform hover:-translate-y-1 hover:translate-x-1"
            >
              <div className="absolute inset-0 border-4 border-[#25D366] bg-[#25D366] translate-x-2 translate-y-2 transition-transform group-hover:translate-x-3 group-hover:translate-y-3"></div>
              <img 
                src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRPproTdpTlTDRP4HCbky48vYaIAnqrCD_1bQ&s" 
                alt="WhatsApp Us" 
                className="relative block w-48 h-48 object-cover border-4 border-[#25D366] z-10"
              />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
