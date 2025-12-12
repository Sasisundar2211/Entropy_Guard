
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
    // Robust pattern covering standard watch, shorts, embeds, and shortened links
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const handleYoutubeSubmit = () => {
    if (!ytInput) return;
    const id = extractYoutubeId(ytInput);
    if (id) {
        // Construct embed URL for iframe
        onYoutubeSubmit(`https://www.youtube.com/embed/${id}?autoplay=1&rel=0`);
        setYtInput("");
        setError(null);
    } else {
        setError("Invalid YouTube URL");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        onUpload(e.target.files[0]);
    }
  };

  // --- RENDER: STATE 2 - PREVIEW (Active) ---
  if (referenceData) {
    return (
        <div className="flex-1 min-w-0 h-full flex flex-col bg-[#1E2229] rounded-3xl border border-[#444746] shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
            {/* Header */}
            <div className="px-6 py-4 bg-[#2B2F36] border-b border-[#444746] flex justify-between items-center">
                <div className="flex items-center gap-3">
                    {referenceData.type === 'YOUTUBE' ? <Youtube className="text-red-500" /> : <FileText className="text-blue-400" />}
                    <h3 className="font-semibold text-white truncate max-w-[200px]">{referenceData.name || "Reference Material"}</h3>
                </div>
                <button 
                    onClick={onClear} 
                    className="p-2 hover:bg-[#1E2229] rounded-full text-gray-400 hover:text-white transition-colors"
                >
                    <X size={20} />
                </button>
            </div>

            {/* Viewer Content */}
            <div className="flex-1 bg-black/50 relative overflow-hidden flex items-center justify-center">
                {referenceData.type === 'PDF' && (
                     <embed 
                        src={referenceData.content} 
                        type="application/pdf" 
                        className="w-full h-full"
                    />
                )}
                
                {(referenceData.type === 'IMAGE') && (
                    <img 
                        src={referenceData.content} 
                        alt="Reference" 
                        className="w-full h-full object-contain p-4" 
                    />
                )}

                {referenceData.type === 'YOUTUBE' && (
                    <iframe 
                        src={referenceData.content} 
                        className="w-full h-full border-0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowFullScreen
                        title="YouTube Reference"
                    />
                )}
            </div>
        </div>
    );
  }

  // --- RENDER: STATE 1 - EMPTY (Default) ---
  return (
    <div className="flex-1 min-w-0 h-full flex flex-col bg-[#1E2229] rounded-3xl border-2 border-dashed border-[#444746] p-8 animate-in fade-in duration-500">
        <div className="flex-1 flex flex-col items-center justify-center gap-8 max-w-md mx-auto w-full">
            
            {/* Header Text */}
            <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-white">Reference Material</h2>
                <p className="text-gray-400 text-sm">Upload a manual or link a video to begin analysis</p>
            </div>

            {/* Hidden Input */}
            <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="application/pdf,image/*" 
                onChange={handleFileChange}
            />

            {/* Action Buttons */}
            <div className="w-full space-y-4">
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-semibold shadow-lg shadow-blue-900/20 flex items-center justify-center gap-3 transition-transform active:scale-95"
                >
                    <Upload size={20} />
                    Upload & Index PDF/Image
                </button>

                <button 
                    onClick={() => fileInputRef.current?.click()} // Reusing file input for scan simulation
                    className="w-full py-4 bg-gray-700 hover:bg-gray-600 text-white rounded-full font-semibold shadow-lg flex items-center justify-center gap-3 transition-transform active:scale-95"
                >
                    <Camera size={20} />
                    Scan Manual
                </button>
            </div>

            {/* Divider */}
            <div className="flex items-center w-full gap-4">
                <div className="h-px bg-gray-700 flex-1"></div>
                <span className="text-xs font-bold text-gray-500 uppercase">OR</span>
                <div className="h-px bg-gray-700 flex-1"></div>
            </div>

            {/* URL Input */}
            <div className="w-full relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-400 transition-colors">
                    <LinkIcon size={18} />
                </div>
                <input 
                    type="text" 
                    value={ytInput}
                    onChange={(e) => setYtInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleYoutubeSubmit()}
                    placeholder="Paste YouTube URL..." 
                    className="w-full bg-[#111318] border border-gray-600 rounded-xl py-3 pl-12 pr-12 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                />
                {isLoading ? (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        <Loader2 className="animate-spin text-blue-400" size={18} />
                    </div>
                ) : (
                    ytInput && (
                        <button 
                            onClick={handleYoutubeSubmit}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-blue-600 rounded-lg text-white hover:bg-blue-500 transition-colors"
                        >
                            <Youtube size={14} />
                        </button>
                    )
                )}
            </div>
             {error && (
                <div className="flex items-center gap-2 text-red-400 text-sm mt-2 animate-pulse">
                    <AlertCircle size={14} />
                    <span>{error}</span>
                </div>
            )}

        </div>
    </div>
  );
};
