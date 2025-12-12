
import React, { useState } from 'react';
import { Scan, Lock, CheckCircle2, RotateCcw } from 'lucide-react';

interface Props {
  onComplete: () => void;
}

export const CalibrationWizard: React.FC<Props> = ({ onComplete }) => {
  const [isLocked, setIsLocked] = useState(false);

  const handleLock = () => {
    setIsLocked(true);
    setTimeout(onComplete, 1500); // Wait for animation then finish
  };

  return (
    <div className="absolute inset-0 z-40 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center p-6 animate-in fade-in">
        
      <div className="relative max-w-2xl w-full aspect-video bg-[#1E2229] rounded-[2rem] border-2 border-[#444746] overflow-hidden flex items-center justify-center shadow-2xl">
        
        {/* Ghost Overlay - Simulating the visual guide */}
        <div className={`absolute inset-0 pointer-events-none transition-all duration-500 ${isLocked ? 'border-[6px] border-[#6DD58C]' : 'border-[2px] border-[#A8C7FA]/50 dashed'}`}>
            {/* Hand Outlines (SVG) */}
            <svg className="absolute inset-0 w-full h-full opacity-30" viewBox="0 0 100 100" preserveAspectRatio="none">
                 <path d="M20,80 Q25,40 30,80 T40,80" stroke="currentColor" fill="none" strokeWidth="0.5" className="text-white"/>
                 <path d="M80,80 Q75,40 70,80 T60,80" stroke="currentColor" fill="none" strokeWidth="0.5" className="text-white"/>
                 {/* Workspace Grid */}
                 <line x1="10" y1="50" x2="90" y2="50" stroke="currentColor" strokeWidth="0.2" className="text-[#A8C7FA]" strokeDasharray="2"/>
                 <line x1="50" y1="10" x2="50" y2="90" stroke="currentColor" strokeWidth="0.2" className="text-[#A8C7FA]" strokeDasharray="2"/>
            </svg>
            
            {!isLocked && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                    <Scan size={64} className="mx-auto text-[#A8C7FA] animate-pulse mb-4" />
                    <h3 className="text-2xl font-bold text-white shadow-black drop-shadow-lg">Align Hands with Ghost Outline</h3>
                </div>
            )}

            {isLocked && (
                <div className="absolute inset-0 flex items-center justify-center bg-[#003817]/40 animate-in zoom-in duration-300">
                    <div className="text-center">
                        <CheckCircle2 size={80} className="mx-auto text-[#6DD58C] mb-4" />
                        <h3 className="text-3xl font-bold text-white shadow-black drop-shadow-lg">Calibration Locked</h3>
                    </div>
                </div>
            )}
        </div>

      </div>

      <div className="mt-8 flex gap-4">
          {!isLocked && (
            <>
                <button 
                    onClick={() => {}} 
                    className="px-6 py-3 rounded-full border border-[#8E918F] text-[#C4C7C5] hover:bg-[#2B2F36] flex items-center gap-2"
                >
                    <RotateCcw size={18} /> Reset Angle
                </button>
                <button 
                    onClick={handleLock}
                    className="px-8 py-3 bg-[#A8C7FA] hover:bg-[#D3E3FD] text-[#062E6F] rounded-full font-bold shadow-lg flex items-center gap-2"
                >
                    <Lock size={18} /> Lock Calibration
                </button>
            </>
          )}
      </div>
    </div>
  );
};
