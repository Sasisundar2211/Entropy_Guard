import React, { useState } from 'react';
import { X, Key, ShieldCheck, EyeOff, Boxes, Globe, Activity } from 'lucide-react';
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
  onDetectLanguage: () => void;
  isDetectingLang: boolean;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, onClose, apiKey, setApiKey, privacyMode, setPrivacyMode, isModelLoaded, language,
  onDetectLanguage, isDetectingLang
}) => {
  const [inputVal, setInputVal] = useState(apiKey);

  if (!isOpen) return null;

  const handleSave = () => {
    setApiKey(inputVal);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-md p-6 shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white">
          <X size={24} />
        </button>
        
        <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-slate-800 rounded-full text-green-400 border border-green-900">
                <ShieldCheck size={24} />
            </div>
            <h2 className="text-xl font-bold text-white tracking-widest">SYSTEM CONFIG</h2>
        </div>

        <div className="space-y-6">
          {/* API Key Section */}
          <div>
            <label className="block text-slate-400 text-sm mb-2 font-mono">GEMINI API KEY</label>
            <div className="relative">
                <Key className="absolute left-3 top-3 text-slate-500" size={16} />
                <input 
                    type="password"
                    value={inputVal}
                    onChange={(e) => setInputVal(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-600 text-white pl-10 pr-4 py-2 focus:outline-none focus:border-green-500 font-mono text-sm"
                    placeholder="sk-..."
                />
            </div>
            <p className="text-xs text-slate-500 mt-2">
                Leave empty to run in <span className="text-yellow-500">SIMULATION MODE</span>.
            </p>
          </div>

          {/* Babel Protocol Section */}
          <div>
              <label className="block text-slate-400 text-sm mb-2 font-mono flex items-center gap-2">
                  <Globe size={16} /> BABEL PROTOCOL
              </label>
              <div className="flex gap-2">
                  <div className="flex-1 bg-slate-800 border border-slate-600 text-slate-300 px-4 py-3 font-mono text-sm flex justify-between items-center rounded">
                      <span>DETECTED:</span>
                      <span className="text-cyan-400 font-bold uppercase">{language === 'auto' ? 'PENDING' : language}</span>
                  </div>
                  <button 
                    onClick={onDetectLanguage} 
                    disabled={isDetectingLang}
                    className="px-4 bg-cyan-900/40 hover:bg-cyan-800/40 text-cyan-400 border border-cyan-500/30 rounded flex items-center justify-center transition-colors disabled:opacity-50"
                  >
                    {isDetectingLang ? <Activity size={18} className="animate-spin" /> : <Globe size={18} />}
                  </button>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                  Language is automatically fingerprinted from audio input.
              </p>
          </div>

          {/* Privacy Config Section */}
          <div className="border-t border-slate-800 pt-4">
            <label className="block text-slate-400 text-sm mb-2 font-mono flex items-center gap-2">
              <EyeOff size={16} /> PRIVACY SHIELD ENGINE
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => setPrivacyMode(PrivacyMode.SIMULATION)}
                className={`p-3 rounded border text-xs font-bold transition-all flex flex-col items-center gap-2 ${privacyMode === PrivacyMode.SIMULATION ? 'bg-green-900/40 border-green-500 text-green-400' : 'bg-slate-800 border-slate-700 text-slate-500 hover:border-slate-500'}`}
              >
                <Boxes size={20} />
                SIMULATION
              </button>
              <button 
                onClick={() => setPrivacyMode(PrivacyMode.REAL_AI)}
                className={`p-3 rounded border text-xs font-bold transition-all flex flex-col items-center gap-2 ${privacyMode === PrivacyMode.REAL_AI ? 'bg-indigo-900/40 border-indigo-500 text-indigo-400' : 'bg-slate-800 border-slate-700 text-slate-500 hover:border-slate-500'}`}
              >
                <ShieldCheck size={20} />
                REAL AI (FACE-API)
              </button>
            </div>
            {privacyMode === PrivacyMode.REAL_AI && (
              <p className={`text-xs mt-2 text-right ${isModelLoaded ? 'text-green-500' : 'text-yellow-500 animate-pulse'}`}>
                {isModelLoaded ? "AI MODELS LOADED & READY" : "DOWNLOADING NEURAL NETS..."}
              </p>
            )}
          </div>

          <button 
            onClick={handleSave}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 transition-colors duration-200 mt-2"
          >
            CONFIRM CONFIGURATION
          </button>
        </div>
      </div>
    </div>
  );
};