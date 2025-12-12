import React, { useRef, useState } from 'react';
import { Upload, Camera, Link as LinkIcon, X, FileText, Youtube, Trash2, Loader2, AlertCircle } from 'lucide-react';
import { ReferenceData } from '../types';

interface Props {
  referenceData: ReferenceData | null;
  onUpload: (file: File) => void;
  onClear: () => void;
  onYoutubeSubmit: (url: string) => void;
  isLoading: boolean;
}

export const ReferenceViewer: React.FC<Props> = ({ 
  referenceData, 
  onUpload, 
  onClear, 
  onYoutubeSubmit, 
  isLoading 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [ytInput, setYtInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  // --- LOGIC: YouTube Extraction ---
  const extractYoutubeId = (url: string): string | null => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
    const match = url.trim().match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const handleYoutubeSubmit = () => {
    if (!ytInput) return;
    const id = extractYoutubeId(ytInput);
    if (id) {
        onYoutubeSubmit(`https://www.youtube.com/embed/${id}?autoplay=1&rel=0&controls=1`);
        setYtInput("");
        setError(null);
    } else {
        setError("Invalid YouTube URL");
    }
  };

  // --- HELPER: Render Active Content ---
  const renderLeftPanelContent = () => {
    switch (referenceData?.type) {
        case 'PDF':
            return (
                <embed 
                    key={referenceData.content} // FORCE PERSISTENCE
                    src={referenceData.content} 
                    type="application/pdf" 
                    className="w-full h-full"
                />
            );
        case 'IMAGE':
            return (
                <img 
                    key={referenceData.content}
                    src={referenceData.content} 
                    alt="Reference" 
                    className="w-full h-full object-contain p-4" 
                />
            );
        case 'YOUTUBE':
            return (
                <iframe 
                    key={referenceData.content} // CRITICAL FOR VIDEO PERSISTENCE
                    src={referenceData.content} 
                    className="w-full h-full border-0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowFullScreen
                    title="YouTube Reference"
                />
            );
        default:
            return null; // Should not happen in this view mode
    }
  };

  // --- MODE: IDLE (INPUT FORM) ---
  if (!referenceData) {
      return (
        <div className="h-full flex flex-col bg-[#1E2229] rounded-3xl border-2 border-dashed border-[#444746] p-8 animate-in fade-in duration-500">
            <div className="flex-1 flex flex-col items-center justify-center gap-8 max-w-md mx-auto w-full">
                
                <div className="text-center space-y-2">
                    <h2 className="text-2xl font-bold text-white">Reference Material</h2>
                    <p className="text-gray-400 text-sm">Upload a manual or link a video to begin analysis</p>
                </div>

                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="application/pdf,image/*" 
                    onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])}
                />

                <div className="w-full space-y-4">
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full py-4 bg-[#0842A0] hover:bg-[#0B57D0] text-[#D3E3FD] rounded-full font-semibold shadow-lg shadow-blue-900/20 flex items-center justify-center gap-3 transition-transform active:scale-95"
                    >
                        <Upload size={20} />
                        Upload & Index PDF/Image
                    </button>

                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full py-4 bg-[#2B2F36] hover:bg-[#444746] text-[#C4C7C5] rounded-full font-semibold shadow-lg flex items-center justify-center gap-3 transition-transform active:scale-95"
                    >
                        <Camera size={20} />
                        Scan Manual
                    </button>
                </div>

                <div className="flex items-center w-full gap-4">
                    <div className="h-px bg-[#444746] flex-1"></div>
                    <span className="text-xs font-bold text-[#8E918F] uppercase">OR</span>
                    <div className="h-px bg-[#444746] flex-1"></div>
                </div>

                <div className="w-full relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8E918F] group-focus-within:text-[#A8C7FA] transition-colors">
                        <LinkIcon size={18} />
                    </div>
                    <input 
                        type="text" 
                        value={ytInput}
                        onChange={(e) => setYtInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleYoutubeSubmit()}
                        placeholder="Paste YouTube URL..." 
                        className="w-full bg-[#111318] border border-[#444746] rounded-xl py-3 pl-12 pr-12 text-[#E3E3E3] placeholder-[#444746] focus:outline-none focus:border-[#A8C7FA] focus:ring-1 focus:ring-[#A8C7FA] transition-all"
                    />
                    {isLoading ? (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                            <Loader2 className="animate-spin text-[#A8C7FA]" size={18} />
                        </div>
                    ) : (
                        ytInput && (
                            <button 
                                onClick={handleYoutubeSubmit}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-[#0842A0] rounded-lg text-white hover:bg-[#0B57D0] transition-colors"
                            >
                                <Youtube size={14} />
                            </button>
                        )
                    )}
                </div>
                 {error && (
                    <div className="flex items-center gap-2 text-[#FFB4AB] text-sm mt-2 animate-pulse">
                        <AlertCircle size={14} />
                        <span>{error}</span>
                    </div>
                )}

            </div>
        </div>
      );
  }

  // --- MODE: ACTIVE (CONTENT VIEWER) ---
  return (
    <div className="h-full flex flex-col bg-[#1E2229] rounded-3xl border border-[#444746] shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        <div className="px-6 py-4 bg-[#2B2F36] border-b border-[#444746] flex justify-between items-center shrink-0">
            <div className="flex items-center gap-3">
                {referenceData.type === 'YOUTUBE' ? <Youtube className="text-[#FFB4AB]" /> : <FileText className="text-[#A8C7FA]" />}
                <h3 className="font-semibold text-[#E3E3E3] truncate max-w-[200px]">{referenceData.name || "Reference Material"}</h3>
            </div>
            <button 
                onClick={onClear} 
                className="p-2 hover:bg-[#1E2229] rounded-full text-[#8E918F] hover:text-[#E3E3E3] transition-colors"
            >
                <X size={20} />
            </button>
        </div>

        <div className="flex-1 bg-black/50 relative overflow-hidden flex items-center justify-center">
            {renderLeftPanelContent()}
        </div>
    </div>
  );
}