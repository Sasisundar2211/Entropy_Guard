
import React, { useState, useRef, useEffect, useCallback } from 'react';
import Webcam from 'react-webcam';
import { 
  Scan, Upload, FileText, Image as ImageIcon, 
  AlertOctagon, CheckCircle2, Activity, Play, Square,
  Settings, Zap, AlertTriangle
} from 'lucide-react';
import { SettingsModal } from './components/SettingsModal';
import { performEntropyCheck } from './services/geminiService';
import { ReferenceData, EntropyAnalysisResult, ComplianceStatus, DriftSeverity, PrivacyMode } from './types';

const App: React.FC = () => {
  // --- STATE ---
  const [apiKey, setApiKey] = useState(process.env.API_KEY || "");
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [referenceData, setReferenceData] = useState<ReferenceData | null>(null);
  const [analysisResult, setAnalysisResult] = useState<EntropyAnalysisResult | null>(null);
  const [history, setHistory] = useState<EntropyAnalysisResult[]>([]);
  
  // Settings / Config State (Kept for compatibility with modal)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [privacyMode, setPrivacyMode] = useState<PrivacyMode>(PrivacyMode.SIMULATION);
  
  // Refs
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- HANDLERS ---

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
        const result = reader.result as string;
        const type = file.type.includes('pdf') ? 'PDF' : 'IMAGE';
        setReferenceData({
            type,
            content: result,
            name: file.name,
            mimeType: file.type
        });
    };
    reader.readAsDataURL(file);
  };

  const handleUrlInput = () => {
      const url = prompt("Paste URL of schematic (Text/Image):");
      if(url) {
          setReferenceData({ type: 'TEXT', content: url, name: 'External URL' });
      }
  };

  const drawOverlay = (result: EntropyAnalysisResult) => {
      const canvas = canvasRef.current;
      const video = webcamRef.current?.video;
      
      if (!canvas || !video) return;

      // Match canvas size to video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (result.status === ComplianceStatus.DRIFT && result.boundingBox) {
          const [ymin, xmin, ymax, xmax] = result.boundingBox;
          
          // Convert 0-1000 scale to pixel coordinates
          const x = (xmin / 1000) * canvas.width;
          const y = (ymin / 1000) * canvas.height;
          const w = ((xmax - xmin) / 1000) * canvas.width;
          const h = ((ymax - ymin) / 1000) * canvas.height;

          // Draw Industrial Box
          ctx.strokeStyle = '#ef4444'; // Red-500
          ctx.lineWidth = 3;
          ctx.setLineDash([]);
          ctx.strokeRect(x, y, w, h);

          // Draw Diagonal Hatching inside
          ctx.fillStyle = 'rgba(239, 68, 68, 0.1)';
          ctx.fillRect(x, y, w, h);

          // Draw Label
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(x, y - 24, 120, 24);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 12px "JetBrains Mono"';
          ctx.fillText("DRIFT DETECTED", x + 5, y - 8);
      } else if (result.status === ComplianceStatus.MATCH) {
          // Draw a subtle green scanline or border
          ctx.strokeStyle = '#22c55e'; // Green-500
          ctx.lineWidth = 4;
          ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);
      }
  };

  const captureFrame = useCallback(async () => {
    if (!webcamRef.current || !referenceData) return;
    
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return;

    // Call API
    const result = await performEntropyCheck(apiKey, referenceData, imageSrc);
    
    setAnalysisResult(result);
    setHistory(prev => [result, ...prev].slice(0, 10)); // Keep last 10
    drawOverlay(result);

  }, [apiKey, referenceData]);

  // --- MONITORING LOOP ---
  useEffect(() => {
    if (isMonitoring) {
        intervalRef.current = setInterval(captureFrame, 2000); // 2 second loop
    } else {
        if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isMonitoring, captureFrame]);


  // --- UI THEME HELPERS ---
  const borderColor = analysisResult?.status === ComplianceStatus.DRIFT 
    ? 'border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.2)]' 
    : 'border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.1)]';

  const textColor = analysisResult?.status === ComplianceStatus.DRIFT ? 'text-red-400' : 'text-cyan-400';

  return (
    <div className="h-screen w-screen bg-[#050505] text-[#e3e3e3] font-sans flex flex-col overflow-hidden">
      
      {/* --- HEADER --- */}
      <header className="h-16 border-b border-white/10 bg-[#0a0a0a] flex items-center justify-between px-6 z-20">
        <div className="flex items-center gap-3">
            <Scan className="text-cyan-400" />
            <div>
                <h1 className="text-xl font-bold tracking-tight text-white font-mono">ENTROPY<span className="text-cyan-400">GUARD</span></h1>
                <p className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">Industrial Compliance Core</p>
            </div>
        </div>

        <div className="flex items-center gap-4">
             {/* Status Indicator */}
             <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full border ${isMonitoring ? 'bg-green-900/20 border-green-500/50 text-green-400' : 'bg-slate-900 border-slate-700 text-slate-500'}`}>
                 <div className={`w-2 h-2 rounded-full ${isMonitoring ? 'bg-green-400 animate-pulse' : 'bg-slate-500'}`} />
                 <span className="text-xs font-mono font-bold">{isMonitoring ? "SYSTEM ACTIVE" : "STANDBY"}</span>
             </div>
             
             <button onClick={() => setIsSettingsOpen(true)} className="p-2 text-slate-400 hover:text-white transition-colors">
                 <Settings size={20} />
             </button>
        </div>
      </header>

      {/* --- MAIN SPLIT LAYOUT --- */}
      <main className="flex-1 flex overflow-hidden">
        
        {/* LEFT PANEL: REFERENCE VIEWER (50%) */}
        <section className="w-1/2 flex flex-col border-r border-white/10 bg-[#0a0a0a] relative">
            {/* Panel Header */}
            <div className="h-12 border-b border-white/10 flex items-center justify-between px-4 bg-[#111]">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <FileText size={14} /> Reference Schematic
                </span>
                {referenceData && (
                    <span className="text-[10px] font-mono text-cyan-500 bg-cyan-950/30 px-2 py-0.5 rounded">
                        {referenceData.name}
                    </span>
                )}
            </div>

            {/* Panel Content */}
            <div className="flex-1 p-6 flex flex-col items-center justify-center relative overflow-hidden">
                {/* Background Grid */}
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

                {referenceData ? (
                    <div className="relative z-10 w-full h-full flex flex-col">
                        {referenceData.type === 'IMAGE' ? (
                            <img src={referenceData.content} alt="Schematic" className="w-full h-full object-contain border border-white/10 rounded-lg" />
                        ) : referenceData.type === 'PDF' ? (
                             <iframe src={referenceData.content} className="w-full h-full border border-white/10 rounded-lg" title="PDF Manual" />
                        ) : (
                            <div className="w-full h-full bg-[#111] p-4 font-mono text-xs text-green-400 whitespace-pre-wrap overflow-auto border border-white/10 rounded-lg">
                                {referenceData.content}
                            </div>
                        )}
                        <button 
                            onClick={() => setReferenceData(null)}
                            className="absolute top-2 right-2 bg-black/60 text-white p-2 rounded-full hover:bg-red-500 transition-colors"
                        >
                            <AlertOctagon size={16} />
                        </button>
                    </div>
                ) : (
                    <div className="z-10 flex flex-col gap-4 items-center">
                        <div className="p-4 border-2 border-dashed border-slate-700 rounded-2xl flex flex-col items-center gap-2 text-slate-500 hover:border-cyan-500 hover:text-cyan-400 transition-colors cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                            <Upload size={32} />
                            <span className="text-sm font-medium">Upload Schematic / Manual</span>
                            <span className="text-[10px] uppercase opacity-50">PDF, JPG, PNG Supported</span>
                        </div>
                        <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*,application/pdf" />
                        
                        <div className="flex items-center gap-2 w-full">
                            <div className="h-px bg-white/10 flex-1" />
                            <span className="text-[10px] text-slate-600 uppercase">OR</span>
                            <div className="h-px bg-white/10 flex-1" />
                        </div>

                        <button onClick={handleUrlInput} className="text-xs text-slate-400 hover:text-white underline decoration-slate-600 underline-offset-4">
                            Input Text URL / Instructions Manually
                        </button>
                    </div>
                )}
            </div>
        </section>

        {/* RIGHT PANEL: LIVE REALITY FEED (50%) */}
        <section className="w-1/2 flex flex-col bg-[#050505] relative">
            {/* Panel Header */}
            <div className="h-12 border-b border-white/10 flex items-center justify-between px-4 bg-[#0a0a0a]">
                 <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <Activity size={14} /> Reality Feed
                </span>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-[10px] font-mono text-red-400">LIVE</span>
                </div>
            </div>

            {/* Video Container */}
            <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
                <Webcam 
                    ref={webcamRef}
                    audio={false}
                    className="absolute inset-0 w-full h-full object-cover opacity-80"
                    screenshotFormat="image/jpeg"
                />
                {/* HUD Overlay Canvas */}
                <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

                {/* HUD Crosshairs (Decorative) */}
                <div className="absolute inset-0 pointer-events-none opacity-20">
                    <div className="absolute top-10 left-10 w-8 h-8 border-t-2 border-l-2 border-white" />
                    <div className="absolute top-10 right-10 w-8 h-8 border-t-2 border-r-2 border-white" />
                    <div className="absolute bottom-10 left-10 w-8 h-8 border-b-2 border-l-2 border-white" />
                    <div className="absolute bottom-10 right-10 w-8 h-8 border-b-2 border-r-2 border-white" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 border border-white/30 rounded-full flex items-center justify-center">
                        <div className="w-1 h-1 bg-white rounded-full" />
                    </div>
                </div>
            </div>

            {/* Bottom Controls / Logs */}
            <div className="h-1/3 border-t border-white/10 bg-[#0a0a0a] flex flex-col">
                {/* Control Bar */}
                <div className="h-14 border-b border-white/10 flex items-center justify-between px-6 bg-[#0f0f0f]">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => {
                                if (!referenceData) {
                                    alert("Please upload Reference Material first.");
                                    return;
                                }
                                setIsMonitoring(!isMonitoring);
                            }}
                            className={`flex items-center gap-2 px-6 py-2 rounded-sm font-bold text-sm tracking-wider transition-all ${
                                isMonitoring 
                                ? 'bg-red-900/50 text-red-400 border border-red-500/50 hover:bg-red-900/80' 
                                : 'bg-cyan-900/50 text-cyan-400 border border-cyan-500/50 hover:bg-cyan-900/80'
                            }`}
                        >
                            {isMonitoring ? <Square size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
                            {isMonitoring ? "STOP MONITORING" : "START ENTROPY CHECK"}
                        </button>
                    </div>
                </div>

                {/* Log Console */}
                <div className="flex-1 p-4 font-mono text-xs overflow-y-auto">
                    {history.length === 0 ? (
                        <div className="text-slate-600 italic mt-4 ml-2">> System Ready. Awaiting Initialization...</div>
                    ) : (
                        <div className="flex flex-col gap-2">
                             {history.map((entry, idx) => (
                                 <div key={idx} className={`flex gap-3 pb-2 border-b border-white/5 ${idx === 0 ? 'opacity-100' : 'opacity-50'}`}>
                                     <span className="text-slate-500">[{entry.timestamp}]</span>
                                     <span className={entry.status === ComplianceStatus.DRIFT ? 'text-red-500 font-bold' : 'text-green-500 font-bold'}>
                                         {entry.status}
                                     </span>
                                     <span className="text-slate-300">{entry.message}</span>
                                 </div>
                             ))}
                        </div>
                    )}
                </div>
            </div>
        </section>
      </main>

      {/* Legacy Modal (Hidden but functional for API Key) */}
      <SettingsModal 
        isOpen={isSettingsOpen} onClose={() => setIsSettings