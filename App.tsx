import React, { useState, useRef, useEffect } from 'react';
import Webcam from 'react-webcam';
import { 
  Network, Activity, ClipboardList, FileText, Table, Download, 
  ChevronDown, ChevronUp, MessageSquare, Microscope, CheckCircle, XCircle,
  AlertTriangle, Settings, Scan, Camera, BrainCircuit, Youtube, X, Wand2, Play, Pause,
  Zap, Layers, Cpu, Eye, Move, RotateCw, Maximize, Lock, Shield, Thermometer, Gauge, HardHat, Mic
} from 'lucide-react';
import { SettingsModal } from './components/SettingsModal';
import { TutorialOverlay, TutorialStep } from './components/TutorialOverlay';
import { analyzeCompliance, detectLanguageFromAudio, processYoutubeVideo, checkPPE, generateIncidentReport, parseARVoiceCommand } from './services/geminiService';
import { 
  ComplianceResponse, DriftSeverity, ComplianceStatus, 
  PrivacyMode, Language, AuditLogEntry, ToolVerificationLogEntry, PPEResponse, ARVoiceCommand
} from './types';

// Declare global handTrack from the CDN script
declare const handTrack: any;

// Helper to extract YouTube ID for raw embed
const getYouTubeID = (url: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
};

const App: React.FC = () => {
  const [isLogsOpen, setIsLogsOpen] = useState(false);
  const [telemetryView, setTelemetryView] = useState<'DRIFT' | 'TOOL'>('DRIFT');
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [toolHistory, setToolHistory] = useState<ToolVerificationLogEntry[]>([]);
  
  // PPE & Safety State
  const [isShiftActive, setIsShiftActive] = useState(false);
  const [isScanningPPE, setIsScanningPPE] = useState(false);
  const [ppeResult, setPpeResult] = useState<PPEResponse | null>(null);

  // Neural SOP State
  const [isSopOpen, setIsSopOpen] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [activeYoutubeUrl, setActiveYoutubeUrl] = useState<string | null>(null);
  const [isProcessingYt, setIsProcessingYt] = useState(false);
  const [sopSteps, setSopSteps] = useState<any[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isStepWaiting, setIsStepWaiting] = useState(false);
  const [currentThumbnail, setCurrentThumbnail] = useState<string | null>(null);
  
  // Ghost Mode AR State
  const [isGhostMode, setIsGhostMode] = useState(false);
  const [ghostPos, setGhostPos] = useState({ x: 0, y: 0 });
  const [ghostRotate, setGhostRotate] = useState(0);
  const [ghostScale, setGhostScale] = useState(1);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [voiceFeedback, setVoiceFeedback] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const playerRef = useRef<any>(null);

  const [apiKey, setApiKey] = useState(process.env.API_KEY || "");
  const [privacyMode, setPrivacyMode] = useState<PrivacyMode>(PrivacyMode.SIMULATION);
  const [language, setLanguage] = useState<Language>('auto');
  const [isDetectingLang, setIsDetectingLang] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastResult, setLastResult] = useState<ComplianceResponse | null>(null);

  // Edge AI / Computer Vision State
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [handModel, setHandModel] = useState<any>(null);
  const [edgeStatus, setEdgeStatus] = useState<string>("INITIALIZING EDGE LAYER...");
  const [isHazardDetected, setIsHazardDetected] = useState(false);
  const [fps, setFps] = useState(0);

  // Load YouTube Iframe API
  useEffect(() => {
    if (!(window as any).YT) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }
  }, []);

  // Load HandTrack Model (Edge AI)
  useEffect(() => {
    if (typeof handTrack !== 'undefined') {
        setEdgeStatus("LOADING NEURAL NETS...");
        const modelParams = {
            flipHorizontal: true, 
            maxNumBoxes: 3, 
            iouThreshold: 0.5, 
            scoreThreshold: 0.7, 
        };
        
        handTrack.load(modelParams).then((model: any) => {
            setHandModel(model);
            setEdgeStatus("EDGE LAYER ACTIVE");
        }).catch((err: any) => {
            console.error("Failed to load Edge Model", err);
            setEdgeStatus("EDGE LAYER FAILED");
        });
    }
  }, []);

  // Edge AI Detection Loop (60 FPS Goal) & IoT Overlay
  useEffect(() => {
    if (!handModel || !webcamRef.current?.video || !canvasRef.current) return;

    let animationId: number;
    let lastTime = performance.now();
    let frameCount = 0;
    let lastFpsTime = performance.now();

    const runDetection = async () => {
        const video = webcamRef.current?.video;
        const canvas = canvasRef.current;
        
        if (video && video.readyState === 4 && canvas) {
            // Match canvas to video dimensions
            if (canvas.width !== video.videoWidth) {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
            }

            // Detect Hand
            // Only run heavier detection if Shift is Active to save resources during lock screen
            // But for PPE check, we might want it. Let's keep it running but only draw HUD if active.
            let predictions = [];
            if (isShiftActive || !isShiftActive) { // Always run to keep model warm
                 predictions = await handModel.detect(video);
            }
            
            // Draw HUD
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.save();
                
                // --- DIGITAL TWIN IOT OVERLAY ---
                // Simulating sensor fusion data
                if (isShiftActive) {
                    const time = Date.now();
                    const temp = 48.5 + Math.sin(time / 2000) * 2 + (Math.random() * 0.5);
                    const volt = 220.0 + Math.cos(time / 1500) * 1.5 + (Math.random() * 0.5);
                    const rpm = 1500 + Math.sin(time / 500) * 50;
                    
                    // Draw Floating Telemetry Box
                    const telemX = 20;
                    const telemY = 80;
                    const telemW = 160;
                    const telemH = 90;
                    
                    // Tech Box BG
                    ctx.fillStyle = 'rgba(2, 6, 23, 0.7)';
                    ctx.fillRect(telemX, telemY, telemW, telemH);
                    ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)'; // Cyan dim
                    ctx.lineWidth = 1;
                    ctx.strokeRect(telemX, telemY, telemW, telemH);

                    // Header
                    ctx.fillStyle = '#94a3b8'; // Slate 400
                    ctx.font = '10px "JetBrains Mono"';
                    ctx.fillText('IOT SENSOR FUSION', telemX + 10, telemY + 15);

                    // Data Points
                    ctx.font = 'bold 12px "JetBrains Mono"';
                    
                    // Temp
                    ctx.fillStyle = temp > 50 ? '#f87171' : '#22d3ee';
                    ctx.fillText(`TEMP: ${temp.toFixed(1)}°C`, telemX + 10, telemY + 35);
                    
                    // Volt
                    ctx.fillStyle = '#a78bfa';
                    ctx.fillText(`VOLT: ${volt.toFixed(1)}V`, telemX + 10, telemY + 55);

                    // RPM
                    ctx.fillStyle = '#34d399';
                    ctx.fillText(`RPM : ${rpm.toFixed(0)}`, telemX + 10, telemY + 75);
                    
                    // Connection Status
                    ctx.fillStyle = '#22c55e';
                    ctx.beginPath();
                    ctx.arc(telemX + telemW - 15, telemY + 12, 3, 0, Math.PI * 2);
                    ctx.fill();
                }

                // --- HAZARD ZONES ---
                const hazardZone = {
                    x: canvas.width * 0.6,
                    y: canvas.height * 0.1,
                    w: canvas.width * 0.35,
                    h: canvas.height * 0.4
                };

                let collision = false;
                predictions.forEach((pred: any) => {
                    const [x, y, w, h] = pred.bbox;
                    if (x < hazardZone.x + hazardZone.w &&
                        x + w > hazardZone.x &&
                        y < hazardZone.y + hazardZone.h &&
                        y + h > hazardZone.y) {
                        collision = true;
                    }
                });
                setIsHazardDetected(collision);

                // Render Hazard Zone
                if (isShiftActive) {
                    ctx.beginPath();
                    ctx.lineWidth = 3;
                    ctx.strokeStyle = collision ? '#ef4444' : 'rgba(239, 68, 68, 0.4)';
                    ctx.setLineDash([10, 5]);
                    ctx.rect(hazardZone.x, hazardZone.y, hazardZone.w, hazardZone.h);
                    ctx.stroke();
                    
                    ctx.fillStyle = collision ? '#ef4444' : 'rgba(239, 68, 68, 0.6)';
                    ctx.font = 'bold 14px "JetBrains Mono"';
                    ctx.fillText('⚡ HIGH VOLTAGE', hazardZone.x, hazardZone.y - 10);
                    ctx.setLineDash([]);
                }

                // --- HAND TRACKING ---
                predictions.forEach((pred: any) => {
                    const [x, y, w, h] = pred.bbox;
                    ctx.beginPath();
                    ctx.lineWidth = 2;
                    ctx.strokeStyle = collision ? '#ef4444' : '#06b6d4';
                    ctx.rect(x, y, w, h);
                    ctx.stroke();

                    ctx.fillStyle = collision ? '#ef4444' : '#06b6d4';
                    ctx.font = '10px "JetBrains Mono"';
                    ctx.fillText(`${(pred.score * 100).toFixed(0)}%`, x, y - 5);
                });

                // Critical Alert
                if (collision && isShiftActive) {
                    ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    
                    ctx.fillStyle = '#ef4444';
                    ctx.font = 'bold 32px "Inter"';
                    ctx.textAlign = 'center';
                    ctx.fillText('⚠ CRITICAL HAZARD ⚠', canvas.width / 2, canvas.height / 2);
                    ctx.textAlign = 'start';
                }

                ctx.restore();
            }

            // FPS Counter
            frameCount++;
            const now = performance.now();
            if (now - lastFpsTime >= 1000) {
                setFps(Math.round((frameCount * 1000) / (now - lastFpsTime)));
                frameCount = 0;
                lastFpsTime = now;
            }
        }
        animationId = requestAnimationFrame(runDetection);
    };

    runDetection();
    return () => cancelAnimationFrame(animationId);
  }, [handModel, isShiftActive]);

  // AR Calibration Logic
  useEffect(() => {
    if (!isGhostMode) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
        const SHIFT_MULTIPLIER = e.shiftKey ? 10 : 1;
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
            e.preventDefault();
        }
        switch(e.key) {
            case 'ArrowUp': setGhostPos(p => ({ ...p, y: p.y - 5 * SHIFT_MULTIPLIER })); break;
            case 'ArrowDown': setGhostPos(p => ({ ...p, y: p.y + 5 * SHIFT_MULTIPLIER })); break;
            case 'ArrowLeft': setGhostPos(p => ({ ...p, x: p.x - 5 * SHIFT_MULTIPLIER })); break;
            case 'ArrowRight': setGhostPos(p => ({ ...p, x: p.x + 5 * SHIFT_MULTIPLIER })); break;
            case '[': setGhostRotate(r => r - 1 * SHIFT_MULTIPLIER); break;
            case ']': setGhostRotate(r => r + 1 * SHIFT_MULTIPLIER); break;
            case '-': case '_': setGhostScale(s => Math.max(0.1, s - 0.01 * SHIFT_MULTIPLIER)); break;
            case '=': case '+': setGhostScale(s => s + 0.01 * SHIFT_MULTIPLIER); break;
            case '0': setGhostPos({x:0, y:0}); setGhostRotate(0); setGhostScale(1); break;
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isGhostMode]);

  const toggleVoiceRecording = async () => {
    if (isRecordingVoice) {
      // STOP RECORDING
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
        setIsRecordingVoice(false);
        setVoiceFeedback("Processing...");
      }
    } else {
      // START RECORDING
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = async () => {
            const base64Audio = reader.result as string;
            // Send to Gemini
            const cmd: ARVoiceCommand = await parseARVoiceCommand(apiKey, base64Audio);
            setVoiceFeedback(`Command: ${cmd}`);
            
            // Execute Command
            const SHIFT_MULTIPLIER = 10;
            switch(cmd) {
                case 'MOVE_LEFT': setGhostPos(p => ({ ...p, x: p.x - 50 })); break;
                case 'MOVE_RIGHT': setGhostPos(p => ({ ...p, x: p.x + 50 })); break;
                case 'MOVE_UP': setGhostPos(p => ({ ...p, y: p.y - 50 })); break;
                case 'MOVE_DOWN': setGhostPos(p => ({ ...p, y: p.y + 50 })); break;
                case 'ROTATE_CW': setGhostRotate(r => r + 15); break;
                case 'ROTATE_CCW': setGhostRotate(r => r - 15); break;
                case 'SCALE_UP': setGhostScale(s => s + 0.1); break;
                case 'SCALE_DOWN': setGhostScale(s => Math.max(0.1, s - 0.1)); break;
                case 'RESET': setGhostPos({x:0, y:0}); setGhostRotate(0); setGhostScale(1); break;
                default: setVoiceFeedback("Command not recognized");
            }

            setTimeout(() => setVoiceFeedback(null), 3000);
          };
          // Stop all tracks
          stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start();
        setIsRecordingVoice(true);
        setVoiceFeedback("Listening...");
      } catch (err) {
        console.error("Mic Error:", err);
        setVoiceFeedback("Mic Access Denied");
      }
    }
  };

  // Initialize Player
  useEffect(() => {
    if (activeYoutubeUrl && (window as any).YT && (window as any).YT.Player) {
      setTimeout(() => {
          if (playerRef.current) return;
          playerRef.current = new (window as any).YT.Player('neural-sop-frame', {
              events: { 'onStateChange': (event: any) => {} }
          });
      }, 1000);
    } else if (!activeYoutubeUrl) {
        playerRef.current = null;
    }
  }, [activeYoutubeUrl]);

  // Smart Pause
  useEffect(() => {
      if (!activeYoutubeUrl || !playerRef.current || isStepWaiting || sopSteps.length === 0) return;
      if (typeof playerRef.current.getCurrentTime !== 'function') return;
      const interval = setInterval(() => {
          try {
              const time = playerRef.current.getCurrentTime();
              const currentStep = sopSteps[currentStepIndex];
              if (currentStep && time >= currentStep.timestamp) {
                  playerRef.current.pauseVideo();
                  setIsStepWaiting(true);
              }
          } catch (e) {}
      }, 500);
      return () => clearInterval(interval);
  }, [activeYoutubeUrl, currentStepIndex, isStepWaiting, sopSteps]);

  const handleStepConfirm = () => {
      setIsStepWaiting(false);
      if (currentStepIndex < sopSteps.length - 1) {
          setCurrentStepIndex(prev => prev + 1);
          playerRef.current.playVideo();
      } else {
          alert("SOP Complete.");
          setActiveYoutubeUrl(null);
          setSopSteps([]);
          setCurrentStepIndex(0);
          setCurrentThumbnail(null);
      }
  };

  const handleGoogleExport = (type: 'DOCS' | 'SHEETS') => console.log(`Exporting ${type}...`);

  const exportLogs = () => {
    const data = JSON.stringify({ auditLogs, toolHistory }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'session-telemetry.json';
    a.click();
    URL.revokeObjectURL(url);
  };
  
  const handleDetectLanguage = async () => {
      setIsDetectingLang(true);
      const result = await detectLanguageFromAudio(apiKey, ""); 
      setLanguage(result.code);
      setIsDetectingLang(false);
  };

  const handleYoutubeSubmit = async () => {
      if (!youtubeUrl) return;
      setIsProcessingYt(true);
      try {
          const data = await processYoutubeVideo(apiKey, youtubeUrl);
          setActiveYoutubeUrl(youtubeUrl);
          setCurrentThumbnail(data.thumbnail);
          const sortedSteps = data.steps.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
          setSopSteps(sortedSteps);
          setCurrentStepIndex(0);
          setIsStepWaiting(false);
          setYoutubeUrl(""); 
      } catch (e) { console.error(e); }
      setIsProcessingYt(false);
  };

  const handlePPEScan = async () => {
      if (!webcamRef.current) return;
      setIsScanningPPE(true);
      
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
          const result = await checkPPE(apiKey, imageSrc);
          setPpeResult(result);
          if (result.compliant) {
              setTimeout(() => setIsShiftActive(true), 800);
          }
      }
      setIsScanningPPE(false);
  };

  const runAnalysis = async () => {
      setIsAnalyzing(true);
      if (webcamRef.current) {
          const imageSrc = webcamRef.current.getScreenshot();
          if (imageSrc) {
              const currentStepText = sopSteps.length > 0 && currentStepIndex < sopSteps.length 
                  ? sopSteps[currentStepIndex].text 
                  : "Standard Operating Procedure";

              const hazards = isHazardDetected ? [{ label: "High Voltage Zone", boundingBox: [100, 600, 300, 900] }] : [];

              const result = await analyzeCompliance(
                  apiKey, 
                  imageSrc, 
                  null, 
                  `Verify step: ${currentStepText}`, 
                  language,
                  hazards
              );
              setLastResult(result);
              
              if (result.status === ComplianceStatus.DRIFT) {
                  // --- AUTOMATED INCIDENT REPORTING ---
                  let reportUrl: string | undefined = undefined;
                  
                  if (result.drift_severity === DriftSeverity.CRITICAL) {
                      const logEntryForReport: AuditLogEntry = {
                          id: Date.now().toString(),
                          timestamp: new Date().toLocaleTimeString(),
                          severity: result.drift_severity,
                          reasoning: result.correction_voice
                      };
                      reportUrl = generateIncidentReport(logEntryForReport, imageSrc);
                      
                      // Simulated Toast Notification
                      alert("CRITICAL DRIFT: Incident Report Generated & Logged.");
                  }

                  const newLog: AuditLogEntry = {
                      id: Date.now().toString(),
                      timestamp: new Date().toLocaleTimeString(),
                      severity: result.drift_severity,
                      reasoning: result.correction_voice,
                      reportUrl: reportUrl
                  };
                  setAuditLogs(prev => [newLog, ...prev]);
              }
          }
      }
      setIsAnalyzing(false);
  };
  
  const tutorialSteps: TutorialStep[] = [
      {
          targetId: 'sop-toggle',
          title: 'Neural SOP',
          content: 'Open the Standard Operating Procedure module to import video protocols.',
          position: 'bottom'
      },
      { 
          targetId: 'telemetry-drawer', 
          title: 'Asynchronous Telemetry', 
          content: 'Review cognitive drift events and instrument verifications here.', 
          position: 'top' 
      }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-hidden relative font-sans selection:bg-cyan-500/30">
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)}
        apiKey={apiKey}
        setApiKey={setApiKey}
        privacyMode={privacyMode}
        setPrivacyMode={setPrivacyMode}
        isModelLoaded={!!handModel}
        language={language}
        onDetectLanguage={handleDetectLanguage}
        isDetectingLang={isDetectingLang}
      />

      {isShiftActive && (
          <TutorialOverlay 
            isOpen={isTutorialOpen}
            onClose={() => setIsTutorialOpen(false)}
            steps={tutorialSteps}
          />
      )}

      <div className="relative h-screen flex flex-col">
          <header className="absolute top-0 left-0 right-0 p-4 z-40 flex justify-between items-center bg-gradient-to-b from-black/90 to-transparent pointer-events-none">
             <div className="pointer-events-auto flex items-center gap-2">
                <Scan className="text-cyan-400" />
                <div>
                    <h1 className="font-bold tracking-wider text-sm md:text-base leading-none">ENTROPYGUARD</h1>
                    <span className="text-[10px] text-cyan-500/70 font-mono tracking-widest">HYBRID EDGE-CLOUD ARCHITECTURE</span>
                </div>
             </div>
             
             <div className="hidden md:flex gap-4 pointer-events-auto bg-black/40 backdrop-blur-md rounded-full px-4 py-1.5 border border-white/5">
                 <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
                     <Cpu size={12} className={handModel ? "text-green-400" : "text-yellow-400"} />
                     <span>EDGE: {fps} FPS</span>
                 </div>
                 <div className="w-px h-3 bg-white/10"></div>
                 <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
                     <Layers size={12} className="text-cyan-400" />
                     <span>MODEL: GEMINI 3 PRO</span>
                 </div>
             </div>

             <div className="pointer-events-auto flex items-center gap-3">
                 <button 
                    data-tour-id="sop-toggle"
                    onClick={() => setIsSopOpen(!isSopOpen)}
                    disabled={!isShiftActive}
                    className={`p-2.5 rounded-full transition-all border ${isSopOpen ? 'bg-cyan-500 text-white border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.5)]' : 'bg-slate-900/80 text-slate-400 border-white/10 hover:text-white'} ${!isShiftActive ? 'opacity-50' : ''}`}
                 >
                     <BrainCircuit size={20} />
                 </button>
                 <button onClick={() => setIsSettingsOpen(true)} className="p-2.5 bg-slate-900/80 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white border border-white/10 transition-all">
                    <Settings size={20} />
                 </button>
             </div>
          </header>

          <div className="flex-1 relative bg-slate-900 flex items-center justify-center overflow-hidden">
             
             {/* Neural SOP Side Panel */}
             <div className={`absolute left-0 top-0 bottom-0 z-30 bg-slate-950/95 backdrop-blur-2xl border-r border-white/10 transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) flex flex-col ${isSopOpen ? 'w-full md:w-[28rem] translate-x-0 shadow-2xl' : 'w-[28rem] -translate-x-full'}`}>
                 <div className="p-6 pt-24 flex flex-col h-full overflow-y-auto">
                     <div className="flex items-center justify-between mb-6">
                         <h2 className="text-lg font-bold flex items-center gap-2 text-cyan-400">
                             <Youtube size={20} /> Neural SOP
                         </h2>
                         <button onClick={() => setIsSopOpen(false)} className="md:hidden p-2 text-slate-500 hover:text-white">
                             <X size={20} />
                         </button>
                     </div>

                     {!activeYoutubeUrl ? (
                         <div className="bg-slate-900/50 border border-dashed border-slate-700 rounded-2xl p-6 text-center">
                             <p className="text-sm text-slate-400 mb-4">Paste a protocol video URL to generate safety checks.</p>
                             <input 
                                type="text" 
                                value={youtubeUrl}
                                onChange={(e) => setYoutubeUrl(e.target.value)}
                                placeholder="https://youtube.com/..."
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-sm mb-3 focus:border-cyan-500 focus:outline-none transition-colors"
                             />
                             <button 
                                onClick={handleYoutubeSubmit}
                                disabled={!youtubeUrl || isProcessingYt}
                                className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold py-3 rounded-lg text-sm flex items-center justify-center gap-2 transition-all"
                             >
                                {isProcessingYt ? <Activity className="animate-spin" size={16}/> : <Wand2 size={16}/>}
                                GENERATE PROTOCOL
                             </button>
                         </div>
                     ) : (
                         <div className="space-y-6 animate-in slide-in-from-left-4 fade-in">
                             {/* Neural Player */}
                             <div className="w-full aspect-video bg-black rounded-xl overflow-hidden shadow-2xl relative group border border-white/10">
                                <iframe
                                    id="neural-sop-frame"
                                    src={`https://www.youtube-nocookie.com/embed/${getYouTubeID(activeYoutubeUrl)}?rel=0&modestbranding=1&origin=${window.location.origin}&enablejsapi=1`}
                                    className="w-full h-full"
                                    title="Neural SOP Player"
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                    referrerPolicy="no-referrer"
                                    sandbox="allow-scripts allow-same-origin allow-presentation"
                                    loading="lazy"
                                />
                                <button 
                                    onClick={() => { setActiveYoutubeUrl(null); setSopSteps([]); setCurrentThumbnail(null); }} 
                                    className="absolute top-2 right-2 z-20 bg-black/60 hover:bg-red-600/90 text-white p-1.5 rounded-full transition-colors backdrop-blur-sm opacity-0 group-hover:opacity-100 duration-200"
                                >
                                    <X size={14}/>
                                </button>
                                {isStepWaiting && (
                                    <div className="absolute inset-0 z-10 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6 animate-in fade-in">
                                        <div className="w-12 h-12 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center mb-3">
                                            <Pause size={24} fill="currentColor" />
                                        </div>
                                        <h3 className="text-lg font-bold text-white mb-1">Step {currentStepIndex + 1} Milestone</h3>
                                        <p className="text-sm text-slate-300 mb-6">{sopSteps[currentStepIndex]?.text}</p>
                                        <button 
                                            onClick={handleStepConfirm}
                                            className="px-6 py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-full flex items-center gap-2 transition-all shadow-lg hover:shadow-cyan-500/25"
                                        >
                                            <CheckCircle size={16} /> CONFIRM & CONTINUE
                                        </button>
                                    </div>
                                )}
                             </div>

                             {/* Ghost Mode Toggle */}
                             <button 
                                onClick={() => setIsGhostMode(!isGhostMode)}
                                className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${isGhostMode ? 'bg-purple-900/30 border-purple-500/50 text-purple-300' : 'bg-slate-900/50 border-white/5 text-slate-400 hover:bg-slate-800'}`}
                             >
                                 <div className="flex items-center gap-2 font-mono text-xs font-bold">
                                     <Eye size={16} />
                                     GHOST MODE (GOLDEN FRAME)
                                 </div>
                                 <div className={`w-8 h-4 rounded-full relative transition-colors ${isGhostMode ? 'bg-purple-500' : 'bg-slate-700'}`}>
                                     <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${isGhostMode ? 'left-4.5 translate-x-1' : 'left-0.5'}`} />
                                 </div>
                             </button>

                             {isGhostMode && (
                                 <div className="p-3 bg-slate-900/50 rounded border border-white/5 text-[10px] text-slate-400 font-mono space-y-1 animate-in fade-in">
                                     <p className="text-purple-400 font-bold mb-2">AR CALIBRATION ACTIVE</p>
                                     <div className="flex justify-between"><span>MOVE</span> <span className="text-slate-200">ARROWS</span></div>
                                     <div className="flex justify-between"><span>ROTATE</span> <span className="text-slate-200">[ ]</span></div>
                                     <div className="flex justify-between"><span>SCALE</span> <span className="text-slate-200">- +</span></div>
                                 </div>
                             )}

                             <div className="space-y-3">
                                 <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex justify-between items-center">
                                     <span>Extracted Steps</span>
                                     <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-400">
                                         {currentStepIndex + 1}/{sopSteps.length}
                                     </span>
                                 </h3>
                                 {sopSteps.length === 0 ? (
                                     <div className="p-4 bg-slate-900/50 rounded-lg border border-white/5 text-center text-slate-500 text-xs">
                                         Analysis running...
                                     </div>
                                 ) : (
                                     sopSteps.map((step, idx) => (
                                         <div 
                                            key={step.id} 
                                            className={`p-4 border rounded-xl flex gap-3 transition-all ${
                                                idx === currentStepIndex 
                                                ? 'bg-cyan-950/20 border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.1)]' 
                                                : idx < currentStepIndex
                                                ? 'bg-slate-900/30 border-white/5 opacity-50'
                                                : 'bg-slate-800/40 border-white/5'
                                            }`}
                                         >
                                             <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px] font-bold shrink-0 ${
                                                 idx === currentStepIndex 
                                                 ? 'border-cyan-400 text-cyan-400' 
                                                 : idx < currentStepIndex
                                                 ? 'border-green-800 text-green-700'
                                                 : 'border-slate-600 text-slate-400'
                                             }`}>
                                                 {idx < currentStepIndex ? <CheckCircle size={12} /> : step.id}
                                             </div>
                                             <div>
                                                 <p className={`text-sm font-medium ${idx === currentStepIndex ? 'text-white' : 'text-slate-400'}`}>{step.text}</p>
                                                 <p className="text-[10px] text-slate-500 mt-1">
                                                     Tools: {step.tools?.join(', ') || 'N/A'} • {step.timestamp}s
                                                 </p>
                                             </div>
                                         </div>
                                     ))
                                 )}
                             </div>
                         </div>
                     )}
                 </div>
             </div>

             {/* Main Feed Container */}
             <div className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden">
                 {/* 1. Webcam Layer (Background) */}
                 <Webcam
                    ref={webcamRef}
                    audio={false}
                    screenshotFormat="image/jpeg"
                    className="absolute inset-0 w-full h-full object-cover opacity-60"
                 />

                 {/* 1.5 Ghost Mode Overlay Layer (Golden Frame) */}
                 {isGhostMode && currentThumbnail && isShiftActive && (
                     <>
                        <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none overflow-hidden animate-in fade-in duration-700">
                            <img 
                                src={currentThumbnail} 
                                alt="Ghost Reference" 
                                className="w-full h-full object-cover opacity-50 transition-transform duration-75 ease-out"
                                style={{
                                    transform: `translate(${ghostPos.x}px, ${ghostPos.y}px) rotate(${ghostRotate}deg) scale(${ghostScale})`,
                                    transformOrigin: 'center center'
                                }}
                            />
                        </div>
                        {/* AR Calibration HUD */}
                        <div className="absolute bottom-40 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur border border-white/10 rounded-xl p-4 flex items-center gap-6 z-20 pointer-events-none shadow-2xl">
                            <div className="flex flex-col items-center gap-1">
                                <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                                    <Move size={14} /> POS
                                </div>
                                <div className="flex gap-1 text-cyan-400 font-bold font-mono">
                                    {ghostPos.x.toFixed(0)}, {ghostPos.y.toFixed(0)}
                                </div>
                                <div className="flex gap-1 mt-1">
                                    <div className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-600 text-[10px] text-slate-300 font-mono shadow-sm flex items-center gap-1">
                                        <span className="text-xs">←</span>
                                        <span className="text-xs">↑</span>
                                        <span className="text-xs">↓</span>
                                        <span className="text-xs">→</span>
                                    </div>
                                </div>
                            </div>
                            <div className="w-px h-8 bg-white/10"></div>
                            <div className="flex flex-col items-center gap-1">
                                <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                                    <RotateCw size={14} /> ROT
                                </div>
                                <div className="flex gap-1 text-purple-400 font-bold font-mono">
                                    {ghostRotate.toFixed(0)}°
                                </div>
                                <div className="flex gap-1 mt-1">
                                    <div className="min-w-[20px] text-center px-1.5 py-0.5 bg-slate-800 rounded border border-slate-600 text-[10px] text-slate-300 font-mono shadow-sm">[</div>
                                    <div className="min-w-[20px] text-center px-1.5 py-0.5 bg-slate-800 rounded border border-slate-600 text-[10px] text-slate-300 font-mono shadow-sm">]</div>
                                </div>
                            </div>
                            <div className="w-px h-8 bg-white/10"></div>
                            <div className="flex flex-col items-center gap-1">
                                <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                                    <Maximize size={14} /> SCL
                                </div>
                                <div className="flex gap-1 text-green-400 font-bold font-mono">
                                    {Math.round(ghostScale * 100)}%
                                </div>
                                <div className="flex gap-1 mt-1">
                                    <div className="min-w-[20px] text-center px-1.5 py-0.5 bg-slate-800 rounded border border-slate-600 text-[10px] text-slate-300 font-mono shadow-sm">-</div>
                                    <div className="min-w-[20px] text-center px-1.5 py-0.5 bg-slate-800 rounded border border-slate-600 text-[10px] text-slate-300 font-mono shadow-sm">+</div>
                                </div>
                            </div>
                            <div className="w-px h-8 bg-white/10"></div>
                            <div className="flex flex-col items-center gap-2 relative">
                                {voiceFeedback && (
                                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black/90 text-white text-xs px-3 py-1.5 rounded-full border border-white/20 animate-in fade-in slide-in-from-bottom-2">
                                        {voiceFeedback}
                                    </div>
                                )}
                                <button 
                                    onClick={toggleVoiceRecording} 
                                    className={`pointer-events-auto p-3 rounded-full transition-all border ${isRecordingVoice ? 'bg-red-500 text-white border-red-400 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.6)]' : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white hover:border-slate-500'}`}
                                >
                                    <Mic size={20} />
                                </button>
                                <span className="text-[10px] font-mono text-slate-500 uppercase">Voice</span>
                            </div>
                        </div>
                     </>
                 )}
                 
                 {/* 2. Edge AI HUD Layer (Canvas) */}
                 <canvas 
                    ref={canvasRef}
                    className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                 />
                 
                 {/* PPE SENTINEL LOCK SCREEN */}
                 {!isShiftActive && (
                     <div className="absolute inset-0 z-40 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-6">
                         <div className="max-w-md w-full bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-8 text-center space-y-6 animate-in zoom-in-95">
                             <div className="flex justify-center">
                                <div className="p-4 bg-slate-800 rounded-full text-slate-400 ring-4 ring-slate-800/50">
                                    <Shield size={48} />
                                </div>
                             </div>
                             
                             <div>
                                 <h2 className="text-2xl font-bold text-white tracking-widest mb-2">PPE SENTINEL ACTIVE</h2>
                                 <p className="text-slate-400 text-sm">Industrial Compliance Check required to proceed.</p>
                             </div>

                             <div className="bg-black/50 rounded-xl p-4 border border-white/5 space-y-3 text-left">
                                 {/* Item 1 */}
                                 <div className="flex items-center gap-3 text-sm">
                                     {ppeResult ? (
                                        ppeResult.missing_items.some(i => i.toLowerCase().includes('glass') || i.toLowerCase().includes('eye')) ? 
                                        <XCircle className="text-red-500" size={18} /> : 
                                        <CheckCircle className="text-green-500" size={18} />
                                     ) : (
                                        <div className="w-4 h-4 rounded-full border-2 border-slate-600" />
                                     )}
                                     <span className={ppeResult && ppeResult.missing_items.some(i => i.toLowerCase().includes('glass') || i.toLowerCase().includes('eye')) ? "text-red-200" : "text-slate-300"}>
                                         Safety Glasses / Eye Protection
                                     </span>
                                 </div>

                                 {/* Item 2 */}
                                 <div className="flex items-center gap-3 text-sm">
                                      {ppeResult ? (
                                        ppeResult.missing_items.some(i => i.toLowerCase().includes('vest') || i.toLowerCase().includes('uniform') || i.toLowerCase().includes('coat')) ? 
                                        <XCircle className="text-red-500" size={18} /> : 
                                        <CheckCircle className="text-green-500" size={18} />
                                     ) : (
                                        <div className="w-4 h-4 rounded-full border-2 border-slate-600" />
                                     )}
                                     <span className={ppeResult && ppeResult.missing_items.some(i => i.toLowerCase().includes('vest') || i.toLowerCase().includes('uniform') || i.toLowerCase().includes('coat')) ? "text-red-200" : "text-slate-300"}>
                                         High-Visibility Vest / Uniform
                                     </span>
                                 </div>
                             </div>

                             {ppeResult && !ppeResult.compliant && (
                                 <div className="p-3 bg-red-950/50 border border-red-500/30 rounded-lg text-red-200 text-sm font-bold flex items-center gap-2 justify-center animate-in slide-in-from-bottom-2">
                                     <AlertTriangle size={16} />
                                     {ppeResult.message}
                                 </div>
                             )}

                             <button 
                                onClick={handlePPEScan}
                                disabled={isScanningPPE}
                                className="w-full py-4 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl shadow-lg hover:shadow-cyan-500/25 transition-all flex items-center justify-center gap-2"
                             >
                                {isScanningPPE ? <Activity className="animate-spin" /> : <Scan />}
                                {isScanningPPE ? "SCANNING BIOMETRICS..." : "VERIFY COMPLIANCE & UNLOCK"}
                             </button>
                         </div>
                     </div>
                 )}

                 {/* 4. Cognitive Analysis Result Overlay */}
                 {lastResult && isShiftActive && (
                     <div className="absolute top-24 left-10 p-4 bg-black/60 backdrop-blur border border-white/10 rounded-xl max-w-sm pointer-events-none z-10 animate-in zoom-in-95">
                         <div className="flex items-center gap-2 mb-2">
                             <BrainCircuit size={16} className={lastResult.status === 'MATCH' ? 'text-green-400' : 'text-red-400'} />
                             <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400">COGNITIVE INFERENCE</span>
                         </div>
                         <div className={`text-2xl font-bold mb-2 ${lastResult.status === 'MATCH' ? 'text-green-400' : 'text-red-400'}`}>
                             {lastResult.status}
                         </div>
                         <p className="text-sm text-slate-200 leading-relaxed font-medium">{lastResult.correction_voice}</p>
                     </div>
                 )}
                 
                 {/* 5. Main Action Button */}
                 {isShiftActive && (
                     <button 
                        onClick={runAnalysis}
                        disabled={isAnalyzing}
                        className={`absolute bottom-24 md:bottom-32 z-30 px-8 py-4 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-full shadow-[0_0_40px_rgba(6,182,212,0.5)] transition-all flex items-center gap-3 ${isSopOpen ? 'md:translate-x-32' : ''}`}
                     >
                        {isAnalyzing ? <Activity className="animate-spin" /> : <Camera />}
                        {isAnalyzing ? "REASONING..." : "TRIGGER COGNITIVE INFERENCE"}
                     </button>
                 )}
             </div>
          </div>
      </div>

      {/* Telemetry Drawer */}
      {isShiftActive && (
        <div data-tour-id="telemetry-drawer" className={`fixed bottom-0 left-0 right-0 bg-slate-900/90 backdrop-blur-2xl rounded-t-[2rem] border-t border-white/10 transition-all duration-500 cubic-bezier(0.32, 0.72, 0, 1) z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] ${isLogsOpen ? 'h-80' : 'h-20'}`}>
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-slate-700 rounded-full opacity-50" />
            
            <div className="flex items-center justify-between px-6 lg:px-8 h-20 cursor-pointer hover:bg-white/5 rounded-t-[2rem] transition-colors" onClick={() => setIsLogsOpen(!isLogsOpen)}>
                <div className="flex items-center gap-4 lg:gap-8" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg transition-colors ${isLogsOpen ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-800 text-slate-500'}`}>
                            <Network size={20} />
                        </div>
                        <h3 className="text-sm font-bold text-slate-200 uppercase tracking-widest hidden sm:block">Async Telemetry</h3>
                    </div>
                    <div className="h-8 w-px bg-white/10 hidden sm:block"></div>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => setTelemetryView('DRIFT')} 
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${telemetryView === 'DRIFT' ? 'bg-slate-700 text-white border-slate-600' : 'text-slate-500 border-transparent hover:text-slate-300'}`}
                        >
                            <Activity size={14} />
                            DRIFT EVENTS
                            <span className="bg-slate-800 px-1.5 rounded text-[10px] text-slate-400 min-w-[1.2rem] text-center">{auditLogs.length}</span>
                        </button>
                        <button 
                            onClick={() => setTelemetryView('TOOL')} 
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${telemetryView === 'TOOL' ? 'bg-indigo-900/40 text-indigo-300 border-indigo-500/30' : 'text-slate-500 border-transparent hover:text-slate-300'}`}
                        >
                            <ClipboardList size={14} />
                            VERIFICATIONS
                            <span className="bg-slate-800 px-1.5 rounded text-[10px] text-slate-400 min-w-[1.2rem] text-center">{toolHistory.length}</span>
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button onClick={(e) => { e.stopPropagation(); exportLogs(); }} className="text-xs text-slate-400 hover:text-white font-bold flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-white/10 transition-colors border border-white/5">
                        <Download size={14} /> <span className="hidden md:inline">JSON DUMP</span><span className="md:hidden">JSON</span>
                    </button>
                    <div className="w-px h-8 bg-white/10 mx-2 hidden sm:block"></div>
                    {isLogsOpen ? <ChevronDown size={20} className="text-slate-500" /> : <ChevronUp size={20} className="text-slate-500" />}
                </div>
            </div>

            <div className="h-full overflow-y-auto p-6 lg:p-8 pb-32 font-mono text-xs space-y-3">
                {telemetryView === 'DRIFT' ? (
                    auditLogs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-32 text-slate-600 space-y-4">
                            <div className="p-4 rounded-full bg-slate-800/50">
                                <MessageSquare size={24} className="opacity-40" />
                            </div>
                            <p className="font-sans font-medium text-slate-500">No drift events recorded in current session.</p>
                        </div>
                    ) : (
                        auditLogs.map(log => (
                            <div key={log.id} className="group flex flex-col md:flex-row gap-2 md:gap-6 p-4 hover:bg-white/5 rounded-2xl transition-all border border-transparent hover:border-white/5 items-start md:items-center">
                                <span className="text-slate-500 shrink-0 font-medium w-24">{log.timestamp}</span>
                                <span className={`px-3 py-1 rounded-full font-bold shrink-0 text-[10px] tracking-wider w-24 text-center ${log.severity === DriftSeverity.CRITICAL ? 'bg-red-900/30 text-red-300 border border-red-500/20' : log.severity === DriftSeverity.MEDIUM ? 'bg-orange-900/30 text-orange-300 border border-orange-500/20' : 'bg-yellow-900/30 text-yellow-300 border border-yellow-500/20'}`}>{log.severity}</span>
                                <span className="text-slate-300 font-sans text-sm group-hover:text-white transition-colors flex-1">{log.reasoning}</span>
                                {log.reportUrl && (
                                    <a href={log.reportUrl} download={`incident_${log.id}.pdf`} className="shrink-0 flex items-center gap-2 px-4 py-2 bg-red-900/20 text-red-400 hover:bg-red-900/40 rounded-lg border border-red-500/30 transition-all font-bold" onClick={(e) => e.stopPropagation()}>
                                        <FileText size={14} /> PDF REPORT
                                    </a>
                                )}
                            </div>
                        ))
                    )
                ) : (
                    toolHistory.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-32 text-slate-600 space-y-4">
                            <div className="p-4 rounded-full bg-slate-800/50">
                                <Microscope size={24} className="opacity-40" />
                            </div>
                            <p className="font-sans font-medium text-slate-500">No instrument verifications performed.</p>
                        </div>
                    ) : (
                        toolHistory.map(log => (
                            <div key={log.id} className="group flex flex-col md:flex-row gap-2 md:gap-6 p-4 hover:bg-slate-800/50 rounded-2xl transition-all border border-transparent hover:border-white/5 items-start md:items-center">
                                <span className="text-slate-500 shrink-0 font-medium font-mono w-24">{log.timestamp}</span>
                                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full font-bold shrink-0 text-[10px] tracking-wider w-32 justify-center border shadow-sm ${log.status === 'MATCH' ? 'bg-green-950/40 text-green-400 border-green-500/30 shadow-green-900/10' : 'bg-red-950/40 text-red-400 border-red-500/30 shadow-red-900/10'}`}>
                                    {log.status === 'MATCH' ? <CheckCircle size={12} strokeWidth={3} /> : <AlertTriangle size={12} strokeWidth={3} />}
                                    {log.status}
                                </div>
                                <span className="text-slate-300 font-sans text-sm font-medium group-hover:text-white transition-colors flex-1">{log.instruction}</span>
                            </div>
                        ))
                    )
                )}
            </div>
        </div>
      )}
    </div>
  );
};

export default App;