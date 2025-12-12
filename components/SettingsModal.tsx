
import React, { useState } from 'react';
import { X, Key, ShieldCheck, Boxes, Globe, ChevronDown } from 'lucide-react';
import { PrivacyMode, Language } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  setApiKey: (key: string) => void;
  privacyMode: PrivacyMode;
  setPrivacyMode: (mode: PrivacyMode) => void;
  isModelLoaded: boolean;
  language: Language;
  setLanguage: (lang: Language) => void;
  onDetectLanguage: () => void;
  isDetectingLang: boolean;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, onClose, apiKey, setApiKey, privacyMode, setPrivacyMode, language, setLanguage
}) => {
  const [inputVal, setInputVal] = useState(apiKey);

  if (!isOpen) return null;

  const handleSave = () => {
    setApiKey(inputVal);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[#1E2229] rounded-[2rem] w-full max-w-md p-8 shadow-2xl relative animate-in zoom-in-95 duration-200 border border-[#444746]">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
                <div className="p-3 bg-[#0842A0] text-[#D3E3FD] rounded-2xl">
                    <ShieldCheck size={24} />
                </div>
                <h2 className="text-2xl font-medium text-[#E3E3E3]">Configuration</h2>
            </div>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-[#2B2F36] text-[#C4C7C5] transition-colors">
                <X size={24} />
            </button>
        </div>

        <div className="space-y-6">
          {/* API Key Section */}
          <div className="bg-[#2B2F36] p-5 rounded-3xl border border-[#444746]">
            <label className="block text-[#C4C7C5] text-sm font-medium mb-3 ml-1">Gemini API Key</label>
            <div className="relative">
                <Key className="absolute left-4 top-3.5 text-[#8E918F]" size={18} />
                <input 
                    type="password"
                    value={inputVal}
                    onChange={(e) => setInputVal(e.target.value)}
                    className="w-full bg-[#111318] border border-[#444746] text-[#E3E3E3] pl-12 pr-4 py-3 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#A8C7FA] focus:border-transparent transition-all shadow-inner placeholder-[#444746]"
                    placeholder="Enter sk- key..."
                />
            </div>
            <p className="text-xs text-[#8E918F] mt-3 ml-2">
                Leave empty for <span className="font-bold text-[#D0BCFF]">Simulation Mode</span>
            </p>
          </div>

          {/* Language Section */}
          <div>
            <label className="block text-[#C4C7C5] text-sm font-medium mb-3 ml-1">Language Preference</label>
            <div className="relative">
                <Globe className="absolute left-4 top-3.5 text-[#8E918F]" size={18} />
                <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value as Language)}
                    className="w-full bg-[#111318] border border-[#444746] text-[#E3E3E3] pl-12 pr-10 py-3 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#A8C7FA] focus:border-transparent appearance-none shadow-inner cursor-pointer"
                >
                    <option value="auto">Auto-Detect (System Default)</option>
                    <option value="en">English (US)</option>
                    <option value="es">Español (Spanish)</option>
                    <option value="de">Deutsch (German)</option>
                    <option value="fr">Français (French)</option>
                    <option value="hi">हिन्दी (Hindi)</option>
                    <option value="ja">日本語 (Japanese)</option>
                    <option value="zh">中文 (Chinese)</option>
                </select>
                <ChevronDown className="absolute right-4 top-4 text-[#8E918F] pointer-events-none" size={16} />
            </div>
          </div>

          {/* Privacy Config Section */}
          <div>
            <label className="block text-[#C4C7C5] text-sm font-medium mb-3 ml-1">Privacy Engine</label>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => setPrivacyMode(PrivacyMode.SIMULATION)}
                className={`p-4 rounded-3xl text-sm font-medium transition-all flex flex-col items-center gap-2 border-2 ${
                    privacyMode === PrivacyMode.SIMULATION 
                    ? 'bg-[#374939] border-[#374939] text-[#C4EED0]' 
                    : 'bg-[#1E2229] border-[#444746] text-[#C4C7C5] hover:bg-[#2B2F36]'
                }`}
              >
                <Boxes size={24} />
                Simulation
              </button>
              <button 
                onClick={() => setPrivacyMode(PrivacyMode.REAL_AI)}
                className={`p-4 rounded-3xl text-sm font-medium transition-all flex flex-col items-center gap-2 border-2 ${
                    privacyMode === PrivacyMode.REAL_AI 
                    ? 'bg-[#4A4458] border-[#4A4458] text-[#E8DEF8]' 
                    : 'bg-[#1E2229] border-[#444746] text-[#C4C7C5] hover:bg-[#2B2F36]'
                }`}
              >
                <ShieldCheck size={24} />
                Real AI
              </button>
            </div>
          </div>

          <button 
            onClick={handleSave}
            className="w-full bg-[#A8C7FA] hover:bg-[#85b5f8] text-[#062E6F] font-semibold text-lg py-3.5 px-6 rounded-full transition-colors shadow-lg shadow-black/20"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};
