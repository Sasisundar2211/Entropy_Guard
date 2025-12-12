
import React, { useEffect, useState } from 'react';
import { ShieldCheck, ArrowRight } from 'lucide-react';

interface Props {
  onComplete: () => void;
}

export const LandingScreen: React.FC<Props> = ({ onComplete }) => {
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowButton(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-[#111318] flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-700">
      
      {/* Animated Logo */}
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-[#0842A0] blur-3xl opacity-20 rounded-full animate-pulse" />
        <div className="relative w-24 h-24 bg-[#1E2229] rounded-[2rem] border border-[#444746] flex items-center justify-center shadow-2xl">
          <ShieldCheck size={48} className="text-[#A8C7FA]" />
        </div>
        {/* Status Dot */}
        <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-[#6DD58C] rounded-full border-4 border-[#111318] animate-bounce" />
      </div>

      {/* Typography */}
      <h1 className="text-5xl md:text-6xl font-medium tracking-tighter text-[#E3E3E3] mb-6 font-[Google Sans]">
        EntropyGuard <span className="text-[#A8C7FA]">V2.0</span>
      </h1>

      {/* The USP */}
      <p className="max-w-2xl text-xl md:text-2xl text-[#C4C7C5] leading-relaxed mb-12">
        The only AI that watches your hands, reads the manual, and stops mistakes <span className="text-[#FFB4AB] font-semibold underline decoration-[#93000A] underline-offset-4">before</span> they happen.
      </p>

      {/* CTA */}
      <div className={`transition-all duration-700 transform ${showButton ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        <button 
          onClick={onComplete}
          className="group relative px-8 py-4 bg-[#A8C7FA] hover:bg-[#D3E3FD] text-[#062E6F] rounded-full font-bold text-lg shadow-[0_0_40px_-10px_rgba(168,199,250,0.4)] transition-all active:scale-95 flex items-center gap-3"
        >
          Initialize System
          <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
      
      <p className="absolute bottom-8 text-xs text-[#444746] uppercase tracking-widest">
        Industrial Compliance Engine // Ready
      </p>
    </div>
  );
};
