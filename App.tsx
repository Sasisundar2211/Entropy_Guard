import React, { useState, useRef, useEffect, useCallback } from 'react';
import Webcam from 'react-webcam';
import { 
  Scan, Upload, FileText, 
  AlertOctagon, CheckCircle2, Activity, Play, Square,
  Settings, AlertTriangle, ShieldCheck, RotateCcw, Youtube, PauseCircle, Globe, Move,
  Mic, MicOff, ListTodo, Download, Search, X, Loader2,
  Video, VideoOff, EyeOff
} from 'lucide-react';
import { SettingsModal } from './components/SettingsModal';
import { LandingScreen } from './components/LandingScreen';
import { CalibrationWizard } from './components/CalibrationWizard';
import { TutorialOverlay, TutorialStep } from './components/TutorialOverlay';
import { TerminalLog } from './components/TerminalLog';
import { ComplianceModal } from './components/ComplianceModal';
import { ReferenceViewer } from './components/ReferenceViewer';
import { performEntropyCheck, generateStepsFromUrl } from './services/geminiService';
import { ReferenceData, EntropyAnalysisResult, ComplianceStatus, DriftSeverity, PrivacyMode, AppState, Language, LogEntry, TaskStep } from './types';

// --- TYPES ---
interface Toast {
  id: string;
  message: string;
  type: 'info' | 'success' | 'error';
}

// --- TUTORIAL STEPS ---
const TUTORIAL_STEPS: TutorialStep[] = [
    {
        title: "Welcome to EntropyGuard V2.0",
        content: "I'm your AI Safety Supervisor. I watch your hands and the manual to prevent mistakes before they happen.",
        position: 'center'
    },
    {
        targetId: "ingest-card",
        title: "Step 1: Ingest Knowledge",
        content: "Upload a PDF manual or paste a YouTube URL. I will verify your actions against this ground truth.",
        position: 'right'
    },
    {
        targetId: "live-feed-card",
        title: "Step 2: The AI Eye",
        content: "Ensure your workspace is well-lit. I project AR warnings here when you deviate from the protocol.",
        position: 'left'
    },
    {
        targetId: "action-btn",
        title: "Step 3: Initialize Guard",
        content: "Press this to start the safety loop. I'll ask you to calibrate your workspace first.",
        position: 'top'
    }
];

const App: React.FC = () => {
  // --- STATE ---
  const [appState, setAppState] = useState<AppState>(AppState.SPLASH);
  const [apiKey, setApiKey] = useState(process.env.API_KEY || "");
  const [referenceData, setReferenceData] = useState<ReferenceData | null>(null);
  const [analysisResult, setAnalysisResult] = useState<EntropyAnalysisResult | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  
  // Settings & Flags
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [privacyMode, setPrivacyMode] = useState<PrivacyMode>(PrivacyMode.SIMULATION);
  const [language, setLanguage] = useState<Language>('auto');
  const [showTutorial, setShowTutorial] = useState(false);
  
  // Advanced Features
  const [isPaused, setIsPaused] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(true);
  
  // Ingestion State
  const [youtubeLoading, setYoutubeLoading] = useState(false);
  
  // Session State
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [calibration, setCalibration] = useState({ x: 0, y: 0, r: 0 });
  
  // Refs
  const webcamRef = useRef<Webcam>(null);
  const recognitionRef = useRef<any>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // --- TOAST SYSTEM ---
  const showToast = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // --- LOGGING HELPER ---
  const addLog = (message: string, type: LogEntry['type'] = 'INFO') => {
      setLogs(prev => [...prev, {
          id: Math.random().toString(36).substr(2, 9),
          timestamp: new Date().toLocaleTimeString([], { hour12: false }),
          type,
          message
      }]);
  };

  // --- LIFECYCLE ---
  
  // CRITICAL FIX: Only cleanup Blob URL if the CONTENT itself changes. 
  // Previous bug caused revocation when metadata (like steps) updated, breaking the view.
  useEffect(() => {
    return () => {
        if (referenceData?.content && referenceData.content.startsWith('blob:')) {
            URL.revokeObjectURL(referenceData.content);
        }
    };
  }, [referenceData?.content]); // Dependency strictly on content string

  useEffect(() => {
    if (appState === AppState.DASHBOARD) {
        const hasSeen = localStorage.getItem('entropy_tutorial_v2');
        if (!hasSeen) {
            setTimeout(() => setShowTutorial(true), 500);
        }
    }
    if (appState === AppState.MONITORING && !startTime) {
        setStartTime(new Date());
        addLog("Security protocols initialized.", 'SUCCESS');
        setIsVoiceActive(true);
        showToast("System Armed: Monitoring Active", 'success');
    }
  }, [appState]);

  // Voice Command Listener
  useEffect(() => {
    if (appState === AppState.MONITORING && isVoiceActive) {
        if ('webkitSpeechRecognition' in window) {
            const SpeechRecognition = (window as any).webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = false;
            recognitionRef.current.lang = 'en-US';

            recognitionRef.current.onstart = () => showToast("Voice Control Active", 'info');
            
            recognitionRef.current.onresult = (event: any) => {
                const transcript = event.results[event.results.length - 1][0].transcript.trim().toLowerCase();
                
                if (transcript.includes('next')) {
                    addLog(`Voice Command: NEXT STEP`, 'AI');
                    showToast("Acknowledged: Next Step", 'success');
                } else if (transcript.includes('stop')) {
                    setAppState(AppState.REPORT);
                    addLog(`Voice Command: STOP`, 'WARNING');
                } else if (transcript.includes('reset')) {
                    setCalibration({x:0, y:0, r:0});
                    addLog(`Calibration Reset`, 'INFO');
                }
            };

            recognitionRef.current.start();
        }
    } else {
        recognitionRef.current?.stop();
    }
    return () => recognitionRef.current?.stop();
  }, [appState, isVoiceActive]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;
      const step = e.shiftKey ? 10 : 2;
      switch(e.key) {
        case 'ArrowUp': e.preventDefault(); setCalibration(p => ({...p, y: p.y - step})); break;
        case 'ArrowDown': e.preventDefault(); setCalibration(p => ({...p, y: p.y + step})); break;
        case 'ArrowLeft': e.preventDefault(); setCalibration(p => ({...p, x: p.x - step})); break;
        case 'ArrowRight': e.preventDefault(); setCalibration(p => ({...p, x: p.x + step})); break;
        case '[': setCalibration(p => ({...p, r: p.r - 1})); break;
        case ']': setCalibration(p => ({...p, r: p.r + 1})); break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // --- HANDLERS ---

  const handleTutorialComplete = () => {
      setShowTutorial(false);
      localStorage.setItem('entropy_tutorial_v2', 'true');
  };

  const handleFileUpload = (file: File) => {
    // Generate Blob URL - Safe for Chrome/modern browsers
    const objectUrl = URL.createObjectURL(file);
    
    const isPdf = file.type.includes('pdf');
    const type = isPdf ? 'PDF' : 'IMAGE';

    setReferenceData({ 
        type, 
        content: objectUrl, 
        name: file.name, 
        mimeType: file.type 
    });
    
    addLog(`Ingested Reference: ${file.name}`, 'SUCCESS');
    showToast(`${isPdf ? 'Manual' : 'Schematic'} Uploaded Successfully`, 'success');
  };

  const handleYoutubeSubmit = async (embedUrl: string) => {
      if (!embedUrl) return;
      
      setYoutubeLoading(true);
      showToast("Analyzing Video Structure...", 'info');
      addLog(`Analyzing Video Stream...`, 'AI');

      // IMMEDIATE FEEDBACK: Show video player right away
      setReferenceData({ 
           type: 'YOUTUBE', 
           content: embedUrl, 
           name: 'Video Procedure', 
           steps: [] 
      });

      try {
         // Fetch Steps in background
         const steps = await generateStepsFromUrl(embedUrl);
         
         // Update with steps only if content matches (prevents race condition)
         setReferenceData(prev => (prev && prev.content === embedUrl) ? { ...prev, steps } : prev);
         
         addLog(`Generated ${steps.length} safety checkpoints from video.`, 'SUCCESS');
         showToast("Video Workflow Extracted", 'success');
      } catch (e) {
         addLog("Failed to parse video content.", 'ERROR');
         showToast("Failed to parse video. Using raw playback.", 'error');
      } finally {
         setYoutubeLoading(false);
      }
  };

  const startCheckSequence = () => {
      if (!referenceData) {
        showToast("Mission Critical: Upload Reference Material First", 'error');
        return;
      }
      setAppState(AppState.CALIBRATION);
  };

  const captureFrame = useCallback(async () => {
    // Stop check if camera is off
    if (!isCameraActive || !webcamRef.current || !referenceData || isPaused) return;
    
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return;
    
    try {
        const result = await performEntropyCheck(apiKey, referenceData, imageSrc);
        setAnalysisResult(result);

        if (result.status === ComplianceStatus.DRIFT) {
            addLog(`DRIFT: ${result.message}`, 'ERROR');
            showToast("Drift Detected", 'error');
        } 
    } catch(e) {
        // Silent fail on frame capture errors
    }
  }, [apiKey, referenceData, isPaused, isCameraActive]);

  useEffect(() => {
    if (appState === AppState.MONITORING) {
        intervalRef.current = setInterval(captureFrame, 2500); 
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [appState, captureFrame]);

  // --- RENDER HELPERS ---
  const getDuration = () => {
      if (!startTime) return "00:00";
      const diff = new Date().getTime() - startTime.getTime();
      const minutes = Math.floor(diff / 60000);
      const seconds = ((diff % 60000) / 1000).toFixed(0);
      return `${minutes}m ${seconds}s`;
  };

  // --- MAIN RENDER ---
  if (appState === AppState.SPLASH) return <LandingScreen onComplete={() => setAppState(AppState.DASHBOARD)} />;

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-[#111318] text-[#E3E3E3] font-[Inter]">
      
      <TutorialOverlay steps={TUTORIAL_STEPS} isOpen={showTutorial} onClose={handleTutorialComplete} />
      
      {/* Toast Container */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 pointer-events-none">
          {toasts.map(toast => (
              <div key={toast.id} className="bg-[#1E2229] border border-[#444746] text-[#E3E3E3] px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-5 fade-in">
                  {toast.type === 'success' && <CheckCircle2 size={18} className="text-[#6DD58C]" />}
                  {toast.type === 'error' && <AlertTriangle size={18} className="text-[#FFB4AB]" />}
                  {toast.type === 'info' && <Activity size={18} className="text-[#A8C7FA]" />}
                  <span className="text-sm font-medium">{toast.message}</span>
              </div>
          ))}
      </div>

      {appState === AppState.REPORT && (
          <ComplianceModal 
            logs={logs} 
            duration={getDuration()} 
            onReset={() => {
                setAppState(AppState.DASHBOARD);
                setLogs([]);
                setReferenceData(null);
                setStartTime(null);
            }} 
          />
      )}

      {/* --- HEADER --- */}
      <header className="h-16 px-6 flex items-center justify-between z-20 shrink-0 border-b border-[#1E1E1E] bg-[#111318]">
        <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-lg bg-[#0842A0] flex items-center justify-center text-[#D3E3FD] shadow-[0_0_15px_-3px_rgba(8,66,160,0.6)]">
                <ShieldCheck size={20} strokeWidth={2.5} />
            </div>
            <div>
                <h1 className="text-lg font-medium tracking-tight font-[Google Sans]">EntropyGuard <span className="text-[#A8C7FA] text-xs ml-1">Enterprise</span></h1>
            </div>
        </div>

        <div className="flex items-center gap-4">
             {analysisResult?.detectedLanguage && (
                 <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-[#1E2229] rounded-full border border-[#444746]">
                     <Globe size={14} className="text-[#A8C7FA]" />
                     <span className="text-xs uppercase font-bold text-[#C4C7C5]">{analysisResult.detectedLanguage}</span>
                 </div>
             )}
             
             <div className={`flex items-center gap-3 px-4 py-1.5 rounded-full border transition-all ${appState === AppState.MONITORING ? 'bg-[#003817] border-[#003817] text-[#C4EED0]' : 'bg-[#1E2229] border-[#444746] text-[#C4C7C5]'}`}>
                 <div className={`w-2 h-2 rounded-full shadow-sm ${appState === AppState.MONITORING ? 'bg-[#6DD58C] animate-pulse' : 'bg-[#8E918F]'}`} />
                 <span className="text-xs font-medium tracking-wide uppercase">{appState === AppState.MONITORING ? "System Armed" : "Standby"}</span>
             </div>
             
             <button onClick={() => setIsSettingsOpen(true)} className="w-8 h-8 rounded-full bg-[#1E2229] hover:bg-[#2B2F36] flex items-center justify-center text-[#C4C7C5] border border-[#444746] active:scale-95 transition-transform">
                 <Settings size={16} />
             </button>
        </div>
      </header>

      {/* --- MAIN CONTENT (CSS GRID) --- */}
      <div className="flex-1 flex flex-col min-h-0">
          
          <main className="flex-1 p-4 grid grid-cols-1 lg:grid-cols-2 gap-4 overflow-hidden relative">
            
            {appState === AppState.CALIBRATION && (
                <CalibrationWizard onComplete={() => setAppState(AppState.MONITORING)} />
            )}

            {/* LEFT CARD: Reference Context (PDF/YouTube) */}
            <div className="flex flex-col h-full overflow-hidden">
                <ReferenceViewer 
                    referenceData={referenceData}
                    onUpload={handleFileUpload}
                    onClear={() => {
                        setReferenceData(null);
                        showToast("Reference Cleared", 'info');
                    }}
                    onYoutubeSubmit={handleYoutubeSubmit}
                    isLoading={youtubeLoading}
                />
            </div>

            {/* RIGHT CARD: Live Analysis */}
            <section 
                data-tour-id="live-feed-card"
                className="flex flex-col h-full bg-[#1E2229] rounded-3xl shadow-xl border border-[#2B2F36] overflow-hidden"
            >
                <div className="px-6 py-4 border-b border-[#2B2F36] flex items-center justify-between">
                    <span className="text-sm font-semibold text-[#E3E3E3] flex items-center gap-2">
                        <Activity size={18} className="text-[#A8C7FA]" /> Live Analysis
                    </span>
                    
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => {
                                const nextState = !isCameraActive;
                                setIsCameraActive(nextState);
                                addLog(`Camera sensor ${nextState ? 'activated' : 'deactivated'} manually.`, nextState ? 'SUCCESS' : 'WARNING');
                            }}
                            className={`p-1.5 rounded-lg transition-colors border ${
                                isCameraActive 
                                ? 'bg-[#1E2229] border-[#444746] text-[#C4C7C5] hover:text-white hover:bg-[#2B2F36]' 
                                : 'bg-[#1E1B16] border-[#FFB4AB]/20 text-[#FFB4AB]'
                            }`}
                            title={isCameraActive ? "Disable Camera Feed" : "Enable Camera Feed"}
                        >
                            {isCameraActive ? <Video size={16} /> : <VideoOff size={16} />}
                        </button>

                        <div className="hidden md:flex items-center gap-4">
                            <div className="flex items-center gap-3 bg-[#111318]/60 px-3 py-1 rounded-lg border border-[#444746]/50">
                                <div className="flex items-center gap-2" title="Use Arrow Keys">
                                    <Move size={12} className="text-[#8E918F]" />
                                    <span className="text-[10px] font-mono text-[#C4C7C5] w-12 text-right">{calibration.x},{calibration.y}</span>
                                </div>
                                <div className="w-px h-3 bg-[#444746]" />
                                <div className="flex items-center gap-2" title="Use [ and ]">
                                    <span className="text-[10px] font-mono text-[#C4C7C5] w-6 text-right">{calibration.r}°</span>
                                </div>
                                {(calibration.x !== 0 || calibration.y !== 0 || calibration.r !== 0) && (
                                    <button onClick={() => setCalibration({x:0, y:0, r:0})} className="ml-1 text-[#A8C7FA] hover:text-white"><RotateCcw size={12} /></button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
                    {isCameraActive ? (
                        <>
                            <Webcam 
                                ref={webcamRef}
                                audio={false}
                                className="absolute inset-0 w-full h-full object-cover opacity-90"
                                screenshotFormat="image/jpeg"
                            />
                            
                            {/* Confidence Bar */}
                            {appState === AppState.MONITORING && (
                                <div className="absolute top-4 left-4 right-4 flex gap-2">
                                    <div className="flex-1 h-1.5 bg-black/50 rounded-full overflow-hidden backdrop-blur">
                                        <div 
                                            className="h-full transition-all duration-500 ease-out"
                                            style={{ 
                                                width: `${analysisResult?.confidence || 100}%`,
                                                backgroundColor: (analysisResult?.confidence || 100) > 80 ? '#6DD58C' : '#FFB4AB'
                                            }}
                                        />
                                    </div>
                                    <span className="text-[10px] font-bold text-white shadow-black drop-shadow-md">
                                        {analysisResult?.confidence || 100}% TRUST
                                    </span>
                                </div>
                            )}

                            {/* Calibration AR */}
                            <div 
                                className="absolute inset-0 pointer-events-none overflow-hidden" 
                                style={{ 
                                    transform: `translate(${calibration.x}px, ${calibration.y}px) rotate(${calibration.r}deg)`, 
                                    transformOrigin: 'center' 
                                }}
                            >
                                {analysisResult?.boundingBox && analysisResult.status === ComplianceStatus.DRIFT && (
                                     <div 
                                        className="absolute border-[3px] border-[#FFB4AB] bg-[#93000A]/30 rounded-lg flex items-start justify-center animate-pulse"
                                        style={{
                                            top: `${analysisResult.boundingBox[0]/10}%`, left: `${analysisResult.boundingBox[1]/10}%`,
                                            height: `${(analysisResult.boundingBox[2]-analysisResult.boundingBox[0])/10}%`, width: `${(analysisResult.boundingBox[3]-analysisResult.boundingBox[1])/10}%`
                                        }}
                                    >
                                        <span className="bg-[#FFB4AB] text-[#690005] text-xs font-bold px-2 py-0.5 rounded-b shadow-md">
                                            DRIFT DETECTED
                                        </span>
                                    </div>
                                )}
                            </div>

                             {appState === AppState.MONITORING && isVoiceActive && (
                                <div className="absolute top-4 right-4 bg-black/40 backdrop-blur rounded-full p-2 border border-white/10 animate-pulse">
                                    <Mic size={16} className="text-[#FFB4AB]" />
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="absolute inset-0 bg-[#0B0D10] flex flex-col items-center justify-center text-[#444746] animate-in fade-in duration-300">
                             <div className="w-16 h-16 rounded-full bg-[#1E2229] border border-[#2B2F36] flex items-center justify-center mb-4 shadow-inner">
                                <EyeOff size={28} />
                             </div>
                             <span className="font-mono text-xs tracking-[0.2em] font-bold">SENSOR OFFLINE</span>
                             <p className="text-[10px] text-[#8E918F] mt-2 uppercase tracking-wide">Analysis Suspended</p>
                        </div>
                    )}
                </div>

                <div className="bg-[#1E2229] border-t border-[#2B2F36] p-4">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 flex items-center">
                            {analysisResult && isCameraActive ? (
                                <div className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium w-full animate-in slide-in-from-bottom-2 ${
                                    analysisResult.status === ComplianceStatus.DRIFT 
                                    ? 'bg-[#93000A] text-[#FFDAD6] border border-[#FFB4AB]/30' 
                                    : 'bg-[#003817] text-[#C4EED0] border border-[#6DD58C]/30'
                                }`}>
                                    {analysisResult.status === ComplianceStatus.DRIFT ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
                                    <span className="truncate">{analysisResult.message}</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 text-[#8E918F] px-2">
                                    <div className={`w-1.5 h-1.5 rounded-full bg-[#8E918F] ${isCameraActive ? 'animate-bounce' : ''}`} />
                                    <span className="text-sm italic">{isCameraActive ? 'System Ready.' : 'Camera Paused.'}</span>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-2">
                            <button 
                                onClick={() => {
                                    const nextState = !isVoiceActive;
                                    setIsVoiceActive(nextState);
                                    showToast(nextState ? "Voice Control Active" : "Voice Control Disabled", 'info');
                                    addLog(`Voice command module ${nextState ? 'enabled' : 'disabled'}.`, 'INFO');
                                }}
                                className={`p-3 rounded-full transition-all active:scale-95 border ${isVoiceActive ? 'bg-[#4A4458] border-[#E8DEF8] text-[#E8DEF8]' : 'bg-[#1E2229] border-[#444746] text-[#C4C7C5]'}`}
                                title="Toggle Voice Commands"
                            >
                                {isVoiceActive ? <Mic size={18} /> : <MicOff size={18} />}
                            </button>
                            <button 
                                data-tour-id="action-btn"
                                onClick={() => {
                                    if (appState === AppState.MONITORING) {
                                        setAppState(AppState.REPORT);
                                    } else {
                                        startCheckSequence();
                                    }
                                }}
                                className={`shrink-0 flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-sm transition-all shadow-lg active:scale-95 ${
                                    appState === AppState.MONITORING
                                    ? 'bg-[#FFB4AB] text-[#690005] hover:bg-[#FFDAD6]' 
                                    : 'bg-[#A8C7FA] text-[#062E6F] hover:bg-[#D3E3FD]'
                                }`}
                            >
                                {appState === AppState.MONITORING ? <Square size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
                                {appState === AppState.MONITORING ? "FINISH TASK" : "START CHECK"}
                            </button>
                        </div>
                    </div>
                </div>
            </section>
          </main>

          {/* TERMINAL LOG */}
          <TerminalLog logs={logs} />
      </div>
      
      <SettingsModal 
        isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)}
        apiKey={apiKey} setApiKey={setApiKey} privacyMode={privacyMode} setPrivacyMode={setPrivacyMode}
        isModelLoaded={true} language={language} setLanguage={setLanguage} onDetectLanguage={() => {}} isDetectingLang={false}
      />
    </div>
  );
};

export default App;