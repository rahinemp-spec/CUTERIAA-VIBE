
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { PRODUCTS } from '../constants';
import { sheetApi } from '../services/api';
import { ChatMessage } from '../types';

const LiveSupport: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isIdentified, setIsIdentified] = useState(false);
  const [userInfo, setUserInfo] = useState({ name: '', email: '' });
  const [sessionId, setSessionId] = useState('');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'ai', text: 'Hi! I am Cuteriaa Support. Please introduce yourself to start chatting.', timestamp: new Date().toISOString() }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let pollInterval: number;
    if (isIdentified && isOpen) {
      pollInterval = window.setInterval(async () => {
        try {
          const chats = await sheetApi.fetchChats();
          if (chats && Array.isArray(chats)) {
            const currentSession = chats.find(c => c.id === sessionId);
            if (currentSession && currentSession.messages) {
              const cloudMessages = typeof currentSession.messages === 'string' 
                ? JSON.parse(currentSession.messages) 
                : currentSession.messages;
              
              if (cloudMessages.length > messages.length) {
                setMessages(cloudMessages);
              }
            }
          }
        } catch (e) { 
          console.warn("Poll connection issue", e); 
        }
      }, 2000);
    }
    return () => clearInterval(pollInterval);
  }, [isIdentified, isOpen, sessionId, messages.length]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleIdentify = (e: React.FormEvent) => {
    e.preventDefault();
    if (userInfo.name && userInfo.email) {
      const id = `session-${Date.now()}`;
      setSessionId(id);
      setIsIdentified(true);
      const welcome = { role: 'ai', text: `Welcome ${userInfo.name}! How can we help you today?`, timestamp: new Date().toISOString() };
      setMessages([welcome]);
      
      sheetApi.syncChat({
        id,
        userName: userInfo.name,
        userEmail: userInfo.email,
        messages: [welcome],
        lastMessageAt: new Date().toISOString(),
        status: 'active'
      });
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMessage = input.trim();
    const timestamp = new Date().toISOString();
    setInput('');
    
    const newUserMsg: ChatMessage = { role: 'user', text: userMessage, timestamp };
    const updatedMessages = [...messages, newUserMsg];
    setMessages(updatedMessages);
    setIsTyping(true);

    await sheetApi.syncChat({
      id: sessionId,
      userName: userInfo.name,
      userEmail: userInfo.email,
      messages: updatedMessages,
      lastMessageAt: timestamp,
      status: 'active'
    });

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const productContext = PRODUCTS.map(p => `${p.name} (Line: ${p.anime || p.category}) at ৳${p.price}`).join(', ');
      
      const firstUserIndex = updatedMessages.findIndex(m => m.role === 'user');
      const filteredHistory = firstUserIndex !== -1 ? updatedMessages.slice(firstUserIndex) : [newUserMsg];

      const apiContents = filteredHistory
        .filter(m => m.role !== 'admin')
        .map(m => ({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.text }]
        }));

      const startTime = Date.now();

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: apiContents,
        config: {
          systemInstruction: `You are Cuteriaa AI for Cuteriaa Vibe. High-end, professional conceptual streetwear brand.
          WE ARE NOT JUST AN ANIME BRAND. We sell Panels, Minimalist graphics, and modern streetwear pieces.
          Products: ${productContext}. Shipping: ৳70/৳120. Custom Design: ৳750.
          Emphasis quality: 175 GSM Organic Cotton, ringspun combed compact fabric.`,
        },
      });

      const aiText = response.text || "One moment please...";
      const elapsed = Date.now() - startTime;
      const remainingDelay = Math.max(0, 5000 - elapsed);

      setTimeout(async () => {
        const newAiMsg: ChatMessage = { role: 'ai', text: aiText, timestamp: new Date().toISOString() };
        const finalMessages = [...updatedMessages, newAiMsg];
        setMessages(finalMessages);
        setIsTyping(false);

        sheetApi.syncChat({
          id: sessionId,
          userName: userInfo.name,
          userEmail: userInfo.email,
          messages: finalMessages,
          lastMessageAt: newAiMsg.timestamp,
          status: 'active'
        });
      }, remainingDelay);

    } catch (error) {
      console.error("AI Error:", error);
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[100] flex flex-col items-end text-[var(--text)]">
      {isOpen && (
        <div className="mb-4 w-full max-w-[calc(100vw-32px)] sm:w-[350px] h-[500px] sm:h-[550px] bg-[var(--bg)] border-2 border-[var(--text)] shadow-[8px_8px_0px_0px_var(--text)] sm:shadow-[15px_15px_0px_0px_var(--text)] flex flex-col overflow-hidden animate-slideUp">
          <div className="bg-[var(--text)] p-4 flex justify-between items-center text-[var(--bg)]">
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${isTyping ? 'bg-yellow-400 animate-bounce' : 'bg-green-500 animate-pulse'}`}></div>
              <h3 className="font-black text-[10px] uppercase tracking-widest">Cuteriaa Support</h3>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:opacity-60"><i className="fas fa-times text-xs"></i></button>
          </div>

          {!isIdentified ? (
            <div className="flex-1 p-8 flex flex-col justify-center bg-[var(--card-bg)]">
              <form onSubmit={handleIdentify} className="space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-widest mb-2">Customer Identity</h4>
                <input required placeholder="Full Name" className="w-full bg-[var(--bg)] border-2 border-[var(--text)] p-4 text-[11px] font-bold outline-none text-[var(--text)]" value={userInfo.name} onChange={e => setUserInfo({...userInfo, name: e.target.value})} />
                <input required type="email" placeholder="Email" className="w-full bg-[var(--bg)] border-2 border-[var(--text)] p-4 text-[11px] font-bold outline-none text-[var(--text)]" value={userInfo.email} onChange={e => setUserInfo({...userInfo, email: e.target.value})} />
                <button type="submit" className="w-full bg-[var(--text)] text-[var(--bg)] py-4 text-[10px] font-black uppercase tracking-widest hover:opacity-90">Connect Now</button>
              </form>
              <div className="mt-8 text-center border-t-2 border-[var(--text)/20] pt-6">
                <p className="text-[9px] font-bold uppercase tracking-widest opacity-60 mb-3">Prefer connecting via WhatsApp?</p>
                <a href="https://wa.me/8801736346273" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center w-full gap-2 bg-[#25D366] text-white py-4 px-6 text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-opacity border-2 border-[var(--text)] shadow-[4px_4px_0px_0px_var(--text)]">
                  <i className="fab fa-whatsapp text-sm"></i> WhatsApp Us
                </a>
              </div>
            </div>
          ) : (
            <>
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 bg-[var(--card-bg)] custom-scrollbar">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] p-4 text-[11px] font-bold border-2 ${
                      msg.role === 'user' ? 'bg-[var(--text)] text-[var(--bg)] border-[var(--text)] shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]' : 
                      msg.role === 'admin' ? 'bg-blue-600 text-white border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]' :
                      'bg-[var(--bg)] text-[var(--text)] border-[var(--text)] shadow-[4px_4px_0px_0px_rgba(0,0,0,0.05)]'
                    }`}>
                      {msg.role === 'admin' && <p className="text-[7px] font-black uppercase mb-1 opacity-70 tracking-widest">STAFF REPLY</p>}
                      {msg.text}
                    </div>
                  </div>
                ))}
                {isTyping && <div className="flex gap-1 p-2"><div className="w-1.5 h-1.5 bg-[var(--text)] rounded-full animate-bounce"></div><div className="w-1.5 h-1.5 bg-[var(--text)] rounded-full animate-bounce [animation-delay:0.2s]"></div><div className="w-1.5 h-1.5 bg-[var(--text)] rounded-full animate-bounce [animation-delay:0.4s]"></div></div>}
              </div>
              <form onSubmit={handleSendMessage} className="p-4 border-t-2 border-[var(--text)] bg-[var(--bg)] flex gap-3">
                <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Send an instant message..." className="flex-1 text-[11px] font-bold outline-none bg-transparent" />
                <button type="submit" disabled={isTyping || !input.trim()} className="text-[var(--text)] disabled:opacity-20 transition-opacity"><i className="fas fa-paper-plane text-lg"></i></button>
              </form>
            </>
          )}
        </div>
      )}
      <button onClick={() => setIsOpen(!isOpen)} className="w-16 h-16 bg-[var(--text)] text-[var(--bg)] flex items-center justify-center text-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,0.2)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all">
        <i className={`fas ${isOpen ? 'fa-times' : 'fa-headset'}`}></i>
      </button>
    </div>
  );
};

export default LiveSupport;