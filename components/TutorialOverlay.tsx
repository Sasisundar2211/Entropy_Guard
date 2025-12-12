import React, { useEffect, useState, useLayoutEffect } from 'react';
import { ChevronRight, ChevronLeft, X, Check } from 'lucide-react';

export type TutorialStep = {
  targetId?: string; // If null, shows in center
  title: string;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
};

interface Props {
  steps: TutorialStep[];
  isOpen: boolean;
  onClose: () => void;
}

export const TutorialOverlay: React.FC<Props> = ({ steps, isOpen, onClose }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const currentStep = steps[currentStepIndex];

  // Reset when opened
  useEffect(() => {
    if (isOpen) {
        setCurrentStepIndex(0);
    }
  }, [isOpen]);

  // Update rect when step changes or window resizes
  useLayoutEffect(() => {
    if (!isOpen) return;

    const updateRect = () => {
      if (currentStep.targetId) {
        const el = document.querySelector(`[data-tour-id="${currentStep.targetId}"]`);
        if (el) {
          const rect = el.getBoundingClientRect();
          setTargetRect(rect);
          // Scroll into view if needed
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          return;
        }
      }
      setTargetRect(null); // Center mode
    };

    // Small delay to ensure UI has rendered/animated
    const timer = setTimeout(updateRect, 100);
    window.addEventListener('resize', updateRect);
    
    return () => {
        window.removeEventListener('resize', updateRect);
        clearTimeout(timer);
    };
  }, [currentStepIndex, isOpen, currentStep.targetId]);

  if (!isOpen) return null;

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  // Calculate Tooltip Position
  const getTooltipStyle = () => {
    if (!targetRect) {
      // Center position
      return {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        maxWidth: '400px'
      };
    }

    const gap = 20;
    const position = currentStep.position || 'bottom';
    
    let top = 0;
    let left = 0;
    const transform = '';

    switch (position) {
      case 'bottom':
        top = targetRect.bottom + gap;
        left = targetRect.left + (targetRect.width / 2) - 160; // Center 320px width
        break;
      case 'top':
        top = targetRect.top - gap - 100; // Approx height
        left = targetRect.left + (targetRect.width / 2) - 160;
        break;
      case 'left':
        top = targetRect.top + (targetRect.height / 2) - 100;
        left = targetRect.left - gap - 340; // Approx width
        break;
      case 'right':
        top = targetRect.top + (targetRect.height / 2) - 100;
        left = targetRect.right + gap;
        break;
    }

    // Safety check for viewport edges could go here, omitting for brevity in "vibe code"
    
    return {
      top: `${top}px`,
      left: `${left}px`,
      width: '320px'
    };
  };

  return (
    <div className="fixed inset-0 z-[60] overflow-hidden pointer-events-auto">
      {/* Spotlight Effect using massive box-shadow */}
      {targetRect ? (
        <div 
            className="absolute transition-all duration-500 ease-in-out border-2 border-cyan-400 rounded-xl shadow-[0_0_0_9999px_rgba(2,6,23,0.85)]"
            style={{
                top: targetRect.top - 5,
                left: targetRect.left - 5,
                width: targetRect.width + 10,
                height: targetRect.height + 10,
            }}
        />
      ) : (
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" />
      )}

      {/* Tooltip Card */}
      <div 
        className="absolute bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl transition-all duration-500 ease-in-out flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4"
        style={getTooltipStyle()}
      >
         <div className="flex justify-between items-start">
             <div>
                <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest mb-1 block">
                    Tutorial {currentStepIndex + 1} / {steps.length}
                </span>
                <h3 className="text-lg font-bold text-white leading-tight">{currentStep.title}</h3>
             </div>
             <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
                 <X size={18} />
             </button>
         </div>

         <p className="text-sm text-slate-300 leading-relaxed">
             {currentStep.content}
         </p>

         <div className="flex items-center justify-between pt-2 border-t border-slate-800">
             <button 
                onClick={handlePrev} 
                disabled={currentStepIndex === 0}
                className={`p-2 rounded-full hover:bg-slate-800 transition-colors ${currentStepIndex === 0 ? 'text-slate-700 cursor-not-allowed' : 'text-slate-300'}`}
             >
                 <ChevronLeft size={20} />
             </button>

             <div className="flex gap-1.5">
                 {steps.map((_, idx) => (
                     <div 
                        key={idx} 
                        className={`w-1.5 h-1.5 rounded-full transition-colors ${idx === currentStepIndex ? 'bg-cyan-400' : 'bg-slate-700'}`} 
                     />
                 ))}
             </div>

             <button 
                onClick={handleNext}
                className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-full text-xs font-bold transition-all shadow-lg hover:shadow-cyan-500/20"
             >
                 {currentStepIndex === steps.length - 1 ? (
                     <>FINISH <Check size={14} /></>
                 ) : (
                     <>NEXT <ChevronRight size={14} /></>
                 )}
             </button>
         </div>
      </div>
    </div>
  );
};