import React, { useState, useRef, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import * as faceapi from 'face-api.js';
import ReactPlayer from 'react-player';
import { 
    Camera, AlertTriangle, Upload, CheckCircle, Settings, ShieldAlert, 
    Cpu, Zap, Image as ImageIcon, FileText, Ghost, Activity, 
    Download, Power, ChevronDown, ChevronUp, Crosshair, Move, 
    RotateCw, RotateCcw, RefreshCcw, Mic, EyeOff, Eye, ListChecks, 
    CheckSquare, Square, Check, FlipHorizontal, Search, Hammer, Globe, X,
    Languages, ScanEye, ZoomIn, Target, MessageSquare, Sparkles, AlertCircle,
    Hand, GripHorizontal, Microscope, ClipboardList, Video, Leaf,
    FileText as FileDoc, Table, FileOutput, HelpCircle, Youtube, Link as LinkIcon,
    Play, Pause, FastForward, SkipBack, Layers, FileJson
} from 'lucide-react';
import { analyzeCompliance, generateSchematic, digitizeSOP, performPreFlightCheck, detectLanguageFromAudio, performEnvironmentalTranslation, verifyToolState, generateSOPFromFrames, estimateWasteImpact, processYoutubeVideo } from './services/geminiService';
import { SettingsModal } from './components/SettingsModal';
import { TutorialOverlay, TutorialStep } from './components/TutorialOverlay';
import { ComplianceResponse, ComplianceStatus, DriftSeverity, AuditLogEntry, SOPStep, PrivacyMode, Language, TranslationOverlay, HazardZone, ToolVerificationLogEntry, MasterSOPStep } from './types';

// Add global definition for handTrack
declare global {
  interface Window {
    handTrack: any;
  }
}

const TUTORIAL_STEPS: TutorialStep[] = [
    {
        title: "Welcome to EntropyGuard",
        content: "Your AI-powered industrial compliance agent. This system uses computer vision to prevent errors, reduce waste, and enforce standard operating procedures in real-time.",
        targetId: undefined, // Center
        position: 'center'
    },
    {
        title: "Reference Standard",
        content: "Load your technical drawings, schematics, or PDFs here. You can also upload YouTube video URLs or scan a physical manual with your camera.",
        targetId: "ref-panel",
        position: "right"
    },
    {
        title: "AR Calibration",
        content: "Use these controls to align the 'Ghost' overlay (your reference) with the live camera feed. This calibration ensures accurate drift detection.",
        targetId: "ar-controls",
        position: "bottom"
    },
    {
        title: "Voice Command",
        content: "Hands busy? This indicator shows when the system is listening. Try commands like 'System Check', 'Freeze Feed', or 'Verify Tool'.",
        targetId: "voice-indicator",
        position: "bottom"
    },
    {
        title: "Arm Intelligence",
        content: "Click this button to activate the continuous monitoring loop. The AI will check for compliance and safety hazards every few seconds.",
        targetId: "arm-button",
        position: "top"
    },
    {
        title: "Telemetry & Logs",
        content: "Expand this drawer to view real-time audit logs, drift events, and tool verification history. You can also export this data to Google Docs or Sheets.",
        targetId: "telemetry-drawer",
        position: "top"
    }
];

const App: React.FC = () => {
  // ------------------------------------------------------------------------
  // State
  // ------------------------------------------------------------------------
  const [apiKey, setApiKey] = useState("");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [protocolText, setProtocolText] = useState("Protocol 73-A: Ensure Component B is aligned vertically. \nNo loose wires visible. \nClearance check required.");
  const [referenceData, setReferenceData] = useState<string | null>(null);
  
  // V2.0 State
  const [ghostOpacity, setGhostOpacity] = useState(0);
  const [isArmed, setIsArmed] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [isLogsOpen, setIsLogsOpen] = useState(true);

  // V2.1 AR Calibration State
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [ghostPos, setGhostPos] = useState({ x: 0, y: 0 });
  const [ghostRotation, setGhostRotation] = useState(0);

  // V3.0 Enterprise State (Voice, Privacy, SOP)
  const [isListening, setIsListening] = useState(false);
  const [isPrivacyMode, setIsPrivacyMode] = useState(false);
  const [privacyEngine, setPrivacyEngine] = useState<PrivacyMode>(PrivacyMode.SIMULATION);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [sopSteps, setSopSteps] = useState<SOPStep[]>([]);
  const [isDigitizing, setIsDigitizing] = useState(false);
  const [isFrozen, setIsFrozen] = useState(false);
  const [isMirrored, setIsMirrored] = useState(false);

  // V3.5 Global Ops (Language, PreFlight)
  const [language, setLanguage] = useState<Language>('auto');
  const [preFlightStatus, setPreFlightStatus] = useState<'IDLE' | 'ANALYZING' | 'PASS' | 'FAIL'>('IDLE');
  const [missingItems, setMissingItems] = useState<string[]>([]);
  const [subtitle, setSubtitle] = useState<string | null>(null);

  // V4.0 Universal Tongue & Magic Lens
  const [isDetectingLang, setIsDetectingLang] = useState(false);
  const [isTranslatingEnv, setIsTranslatingEnv] = useState(false);
  const [envTranslations, setEnvTranslations] = useState<TranslationOverlay[]>([]);
  const [userTranscript, setUserTranscript] = useState<string | null>(null);

  // V5.0 Instrument Verifier & Geofencing
  const [isMacroMode, setIsMacroMode] = useState(false);
  const [hazards, setHazards] = useState<HazardZone[]>([]);
  const [toolCheckStatus, setToolCheckStatus] = useState<'IDLE' | 'MATCH' | 'MISMATCH'>('IDLE');
  const [toolHistory, setToolHistory] = useState<ToolVerificationLogEntry[]>([]);
  const [telemetryView, setTelemetryView] = useState<'DRIFT' | 'TOOL'>('DRIFT');

  // V6.0 Gesture Control
  const [isGestureEnabled, setIsGestureEnabled] = useState(false);
  const [gestureModelLoaded, setGestureModelLoaded] = useState(false);

  // V7.0 Master Mode & Green Score
  const [isMasterMode, setIsMasterMode] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [masterSopSteps, setMasterSopSteps] = useState<MasterSOPStep[]>([]);
  const [greenScore, setGreenScore] = useState(0); // Grams saved
  const [isProcessingVideo, setIsProcessingVideo] = useState(false);

  // V8.0 Tutorial & New Reference Features
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [activeYoutubeUrl, setActiveYoutubeUrl] = useState<string | null>(null);
  const [isImportingYt, setIsImportingYt] = useState(false);
  
  // V9.0 Supervisor Mode (Play-Along)
  const [isSupervisorMode, setIsSupervisorMode] = useState(false);
  const [currentVideoStepIndex, setCurrentVideoStepIndex] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [showGoldenFrame, setShowGoldenFrame] = useState(false);

  // Error & Notification State
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  // Analysis State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingSchematic, setIsGeneratingSchematic] = useState(false);
  const [result, setResult] = useState<ComplianceResponse | null>(null);

  // Refs
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analyzingRef = useRef(false); 
  const recognitionRef = useRef<any>(null); // For SpeechRecognition
  const lastProcessedTimeRef = useRef(0);
  const lastTranslationTimeRef = useRef(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const gestureModelRef = useRef<any>(null);
  const lastGestureTimeRef = useRef<number>(0);
  const recordedFramesRef = useRef<string[]>([]);
  const playerRef = useRef<any>(null);

  // State Refs for Voice Logic
  const sopStepsRef = useRef(sopSteps);
  const ghostOpacityRef = useRef(ghostOpacity);

  useEffect(() => { analyzingRef.current = isAnalyzing; }, [isAnalyzing]);
  useEffect(() => { sopStepsRef.current = sopSteps; }, [sopSteps]);
  useEffect(() => { ghostOpacityRef.current = ghostOpacity; }, [ghostOpacity]);

  // Load API Key & Check Tutorial
  useEffect(() => {
    const storedKey = localStorage.getItem('gemini_api_key');
    if (storedKey) setApiKey(storedKey);

    const hasSeenTutorial = localStorage.getItem('entropy_tutorial_completed');
    if (!hasSeenTutorial) {
        setIsTutorialOpen(true);
    }
  }, []);

  const handleTutorialClose = () => {
      setIsTutorialOpen(false);
      localStorage.setItem('entropy_tutorial_completed', 'true');
  };

  const startTutorial = () => {
      setIsTutorialOpen(true);
      // Ensure key drawers are open for tour
      setIsLogsOpen(true);
  };

  const handleSetApiKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem('gemini_api_key', key);
  };

  // ------------------------------------------------------------------------
  // Helper: Error UI & Speech Synthesis
  // ------------------------------------------------------------------------
  const showError = useCallback((msg: string) => {
    setErrorMsg(msg);
    if ('vibrate' in navigator) navigator.vibrate([50, 100, 50]);
    setTimeout(() => setErrorMsg(null), 6000);
  }, []);

  const showInfo = useCallback((msg: string) => {
      setInfoMsg(msg);
      setTimeout(() => setInfoMsg(null), 5000);
  }, []);

  const speak = useCallback((text: string) => {
    setSubtitle(text);
    setTimeout(() => setSubtitle(null), 6000);

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      const voices = window.speechSynthesis.getVoices();
      
      let targetLang = 'en-US';
      if (language === 'es') targetLang = 'es-ES';
      if (language === 'de') targetLang = 'de-DE';
      if (language === 'hi') targetLang = 'hi-IN';
      if (language === 'zh') targetLang = 'zh-CN';
      if (language === 'fr') targetLang = 'fr-FR';
      if (language === 'ja') targetLang = 'ja-JP';
      
      const matchedVoice = voices.find(v => v.lang.startsWith(language === 'auto' ? 'en' : language));
      if (matchedVoice) utterance.voice = matchedVoice;
      
      utterance.rate = 1.1;
      utterance.pitch = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  }, [language]);

  const getLangName = (code: string) => {
    switch (code) {
        case 'es': return 'Spanish';
        case 'de': return 'German';
        case 'hi': return 'Hindi';
        case 'zh': return 'Chinese';
        case 'fr': return 'French';
        case 'ja': return 'Japanese';
        case 'en': return 'English';
        default: return code.toUpperCase();
    }
  };

  // Initialize Face API
  useEffect(() => {
    const loadModels = async () => {
        try {
            await faceapi.nets.tinyFaceDetector.loadFromUri('https://justadudewhohacks.github.io/face-api.js/models');
            setIsModelLoaded(true);
        } catch (error) {
            console.error("Failed to load FaceAPI models:", error);
            showError("Failed to load AI vision models.");
        }
    };
    loadModels();
  }, [showError]);

  // Reset tool check status when entering macro mode
  useEffect(() => {
      if (isMacroMode) {
          setToolCheckStatus('IDLE');
          showInfo("Macro Scan Active. Align instrument in reticle.");
          setTelemetryView('TOOL');
      }
  }, [isMacroMode, showInfo]);

  // Master Mode Recording Loop
  useEffect(() => {
      let interval: ReturnType<typeof setInterval>;
      if (isRecording) {
          recordedFramesRef.current = [];
          speak("Recording initiated. Perform procedure slowly.");
          interval = setInterval(() => {
              if (webcamRef.current) {
                  const frame = webcamRef.current.getScreenshot();
                  if (frame) recordedFramesRef.current.push(frame);
              }
          }, 2000); // Capture every 2 seconds
      } else if (recordedFramesRef.current.length > 0) {
          // Recording just stopped
          speak("Processing recording. Generating protocol.");
          setIsProcessingVideo(true);
          generateSOPFromFrames(apiKey, recordedFramesRef.current).then(steps => {
              setMasterSopSteps(steps);
              setSopSteps(steps);
              setIsProcessingVideo(false);
              speak("Protocol generated from expert session.");
              // Switch to master mode view to show results if not already
              if (!isMasterMode) setIsMasterMode(true);
          });
      }
      return () => clearInterval(interval);
  }, [isRecording, apiKey, isMasterMode, speak]);

  // Supervisor Mode Video Sync Logic
  const handleVideoProgress = ({ playedSeconds }: { playedSeconds: number }) => {
    if (!isSupervisorMode || !activeYoutubeUrl || sopSteps.length === 0 || showGoldenFrame) return;

    const currentStep = sopSteps[currentVideoStepIndex];
    if (currentStep && currentStep.timestamp) {
        // Stop 0.5s before the target timestamp to show the golden frame
        if (playedSeconds >= currentStep.timestamp - 0.5) {
            setIsVideoPlaying(false);
            if (playerRef.current) {
                playerRef.current.seekTo(currentStep.timestamp, 'seconds');
            }
            setShowGoldenFrame(true);
            speak(`Step target reached. Align with overlay: ${currentStep.text}`);
        }
    }
  };

  // When enabling Supervisor mode, reset and play
  useEffect(() => {
      if (isSupervisorMode && activeYoutubeUrl && sopSteps.length > 0 && playerRef.current) {
           // If just starting, ensure we play
           if (currentVideoStepIndex === 0 && !showGoldenFrame) {
               setIsVideoPlaying(true);
           }
      }
  }, [isSupervisorMode, activeYoutubeUrl, sopSteps, currentVideoStepIndex, showGoldenFrame]);


  // ------------------------------------------------------------------------
  // Core Visual Logic
  // ------------------------------------------------------------------------
  
  const applyPrivacyFilter = useCallback(async (base64Data: string): Promise<string> => {
      if (!isPrivacyMode) return base64Data;
      return new Promise((resolve) => {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = async () => {
              const canvas = document.createElement('canvas');
              canvas.width = img.width;
              canvas.height = img.height;
              const ctx = canvas.getContext('2d');
              if (!ctx) { resolve(base64Data); return; }
              ctx.drawImage(img, 0, 0);
              if (privacyEngine === PrivacyMode.SIMULATION) {
                  const faceW = img.width * 0.3; const faceH = img.height * 0.4;
                  const faceX = (img.width - faceW) / 2; const faceY = img.height * 0.1;
                  ctx.fillStyle = "rgba(20, 20, 20, 0.9)";
                  ctx.filter = "blur(15px)";
                  ctx.fillRect(faceX, faceY, faceW, faceH);
                  resolve(canvas.toDataURL('image/jpeg'));
              } else if (privacyEngine === PrivacyMode.REAL_AI && isModelLoaded) {
                  try {
                      const detections = await faceapi.detectAllFaces(img, new faceapi.TinyFaceDetectorOptions());
                      detections.forEach(det => {
                          const { x, y, width, height } = det.box;
                          ctx.fillStyle = "rgba(20, 20, 20, 0.95)";
                          ctx.filter = "blur(10px)";
                          ctx.fillRect(x, y, width, height);
                      });
                      resolve(canvas.toDataURL('image/jpeg'));
                  } catch (e) { resolve(base64Data); }
              } else { resolve(base64Data); }
          };
          img.src = base64Data;
      });
  }, [isPrivacyMode, privacyEngine, isModelLoaded]);

  const drawOverlay = (coords: number[], status: ComplianceStatus, translations: TranslationOverlay[] = []) => {
    const canvas = canvasRef.current;
    const video = webcamRef.current?.video;
    
    // Skip standard drawing in Macro Mode to focus on Reticle
    if (isMacroMode) return;

    if (canvas && video) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const scaleX = canvas.width / 1000;
        const scaleY = canvas.height / 1000;

        // Draw Translations (Magic Lens)
        if (translations.length > 0) {
            ctx.font = 'bold 16px "Inter", sans-serif';
            translations.forEach(t => {
                let [ymin, xmin, ymax, xmax] = t.boundingBox;
                if (ymin <= 1) { ymin *= 1000; xmin *= 1000; ymax *= 1000; xmax *= 1000; }
                let x = xmin, w = xmax - xmin, y = ymin, h = ymax - ymin;
                if (isMirrored) x = 1000 - (x + w);

                // Google Lens Style Overlay for text
                ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
                const textWidth = ctx.measureText(t.text).width + 20;
                
                // Draw pill
                ctx.beginPath();
                ctx.roundRect((x * scaleX), (y * scaleY), textWidth, 30, 15);
                ctx.fill();

                ctx.fillStyle = "#0f172a";
                ctx.fillText(t.text, (x * scaleX) + 10, (y * scaleY) + 20);
            });
        }

        // Draw Compliance Box (Google Lens Style)
        if (coords.length === 4) {
            let [x, y, w, h] = coords;
            if (isMirrored) x = 1000 - (x + w);
            
            // Box
            ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
            ctx.lineWidth = 3;
            ctx.setLineDash([]); // Solid line
            
            // Draw Rounded Rectangle for Bounding Box
            ctx.beginPath();
            if (ctx.roundRect) {
                 ctx.roundRect(x * scaleX, y * scaleY, w * scaleX, h * scaleY, 24);
            } else {
                 ctx.rect(x * scaleX, y * scaleY, w * scaleX, h * scaleY);
            }
            ctx.stroke();

            // Floating Pill Label
            const isMatch = status === ComplianceStatus.MATCH;
            const pillColor = isMatch ? "#4ade80" : "#f87171"; // Tailwind Green-400 or Red-400
            const labelText = isMatch ? "MATCH" : "DRIFT";
            
            ctx.font = 'bold 14px "Inter", sans-serif';
            const textMetrics = ctx.measureText(labelText);
            const pillW = textMetrics.width + 40;
            const pillH = 36;
            const pillX = (x * scaleX) + (w * scaleX) / 2 - pillW / 2;
            const pillY = (y * scaleY) - 50; // Float above

            // Connection Line
            ctx.beginPath();
            ctx.moveTo((x * scaleX) + (w * scaleX) / 2, (y * scaleY));
            ctx.lineTo((x * scaleX) + (w * scaleX) / 2, pillY + pillH);
            ctx.strokeStyle = "rgba(255,255,255,0.6)";
            ctx.lineWidth = 2;
            ctx.stroke();

            // Draw Pill Shadow
            ctx.shadowColor = "rgba(0,0,0,0.5)";
            ctx.shadowBlur = 10;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 4;

            // Draw Pill
            ctx.beginPath();
            if (ctx.roundRect) ctx.roundRect(pillX, pillY, pillW, pillH, 999);
            else ctx.rect(pillX, pillY, pillW, pillH);
            ctx.fillStyle = "#1e293b"; // Dark Slate
            ctx.fill();
            
            // Reset Shadow for text
            ctx.shadowColor = "transparent";
            
            // Stroke Pill
            ctx.strokeStyle = pillColor;
            ctx.lineWidth = 2;
            ctx.stroke();

            // Pill Text
            ctx.fillStyle = pillColor;
            ctx.textAlign = "center";
            ctx.fillText(labelText, pillX + pillW/2, pillY + 23);
        }
      }
    }
  };

  const handlePreFlightScan = async () => {
      if (!webcamRef.current || !referenceData) return;
      setPreFlightStatus('ANALYZING');
      const frame = webcamRef.current.getScreenshot();
      if (!frame) return;
      try {
          const result = await performPreFlightCheck(apiKey, frame, referenceData);
          setHazards(result.hazards || []);
          if (result.status === 'PASS') {
              setPreFlightStatus('PASS');
              speak(language === 'en' ? "Inventory verified. Hazards identified. System ready." : "Inventory verified.");
              setMissingItems([]);
          } else {
              setPreFlightStatus('FAIL');
              setMissingItems(result.missing_items);
              speak("Pre-flight check failed.");
          }
      } catch (e) {
          console.error(e);
          setPreFlightStatus('FAIL');
          showError("Pre-flight scan failed.");
      }
  };

  const handleToolVerification = useCallback(async () => {
      if (!webcamRef.current) return;
      speak("Verifying instrument state.");
      setToolCheckStatus('IDLE');
      setIsAnalyzing(true);
      const frame = webcamRef.current.getScreenshot();
      if (!frame) return;
      try {
          const res = await verifyToolState(apiKey, frame, protocolText);
          
          // Log the result
          const newEntry: ToolVerificationLogEntry = {
              id: crypto.randomUUID(),
              timestamp: new Date().toLocaleTimeString(),
              status: res.status,
              instruction: res.instruction
          };
          setToolHistory(prev => [newEntry, ...prev]);

          if (res.status === 'MATCH') {
              setToolCheckStatus('MATCH');
              speak("Instrument verified.");
          } else {
              setToolCheckStatus('MISMATCH');
              speak(`Correction needed: ${res.instruction}`);
              setSubtitle(`ACTION: ${res.instruction}`);
          }
      } catch (e) {
          console.error(e);
          showError("Tool verification failed.");
      }
      setIsAnalyzing(false);
  }, [apiKey, protocolText, speak, showError]);

  const runComplianceCheck = useCallback(async (silentMode = false) => {
    if (!webcamRef.current || analyzingRef.current || isFrozen) return;
    const now = Date.now();
    if (now - lastProcessedTimeRef.current < 2000) return; 
    lastProcessedTimeRef.current = now;
    setIsAnalyzing(true);
    let imageSrc = webcamRef.current.getScreenshot();
    if (imageSrc) {
      try {
        imageSrc = await applyPrivacyFilter(imageSrc);
        
        // Use current step text if in supervisor mode
        const currentProtocol = (isSupervisorMode && activeYoutubeUrl && sopStepsRef.current.length > 0) 
            ? `VERIFY STEP COMPLETION: ${sopStepsRef.current[currentVideoStepIndex].text}`
            : protocolText;

        const promises: any[] = [analyzeCompliance(apiKey, imageSrc, referenceData, currentProtocol, language, hazards)];
        if (isTranslatingEnv && language !== 'auto') promises.push(performEnvironmentalTranslation(apiKey, imageSrc, language));
        const [complianceRes, translationRes] = await Promise.all(promises);
        setResult(complianceRes);
        if (translationRes && translationRes.length > 0) {
            setEnvTranslations(translationRes);
            const now = Date.now();
            if (now - lastTranslationTimeRef.current > 10000) {
                lastTranslationTimeRef.current = now;
                showInfo(`Environment translated to ${getLangName(language)}.`);
            }
        }
        drawOverlay(complianceRes.coordinates, complianceRes.status, translationRes || []);
        
        const isMatch = complianceRes.status === ComplianceStatus.MATCH;

        if (complianceRes.status === ComplianceStatus.DRIFT) {
            if (complianceRes.drift_severity === DriftSeverity.CRITICAL && navigator.vibrate) navigator.vibrate([200, 100, 200]);
            
            // Sustainability: Calculate saved waste
            if (complianceRes.drift_severity === DriftSeverity.CRITICAL) {
                estimateWasteImpact(apiKey, protocolText).then(grams => {
                    setGreenScore(prev => prev + grams);
                });
            }

            const newEntry: AuditLogEntry = {
                id: crypto.randomUUID(),
                timestamp: new Date().toLocaleTimeString(),
                severity: complianceRes.drift_severity,
                reasoning: complianceRes.correction_voice
            };
            setAuditLogs(prev => [newEntry, ...prev]);
            speak(complianceRes.correction_voice);
        } else {
             if (!silentMode) speak(complianceRes.correction_voice);
        }

        // Supervisor Auto-Advance Logic
        if (isSupervisorMode && isMatch) {
            // Check if match was found WHILE showing golden frame
            if (showGoldenFrame) {
                 if (currentVideoStepIndex < sopStepsRef.current.length - 1) {
                    const nextIdx = currentVideoStepIndex + 1;
                    setCurrentVideoStepIndex(nextIdx);
                    // Hide overlay, start playing next segment
                    setShowGoldenFrame(false);
                    setIsVideoPlaying(true);
                    speak("Verified. Playing next step.");
                    
                    // Mark current as complete
                    const newSteps = [...sopStepsRef.current];
                    newSteps[currentVideoStepIndex].completed = true;
                    setSopSteps(newSteps);
                 } else {
                    speak("All steps complete. Protocol finished.");
                    setIsSupervisorMode(false);
                    setShowGoldenFrame(false);
                    setIsVideoPlaying(false);
                 }
            }
        }

      } catch (e) {
        console.error("Analysis failed", e);
        showError("Connection lost.");
      }
    }
    setIsAnalyzing(false);
  }, [apiKey, referenceData, protocolText, isPrivacyMode, isFrozen, applyPrivacyFilter, isMirrored, language, speak, isTranslatingEnv, hazards, showError, showInfo, isSupervisorMode, currentVideoStepIndex, activeYoutubeUrl, showGoldenFrame]);

  // ------------------------------------------------------------------------
  // Audio & Voice Logic
  // ------------------------------------------------------------------------
  const detectLanguage = async () => {
      setIsDetectingLang(true);
      speak("Listening for language fingerprint.");
      try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          const mediaRecorder = new MediaRecorder(stream);
          mediaRecorderRef.current = mediaRecorder;
          const chunks: Blob[] = [];
          mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
          mediaRecorder.onstop = async () => {
              const blob = new Blob(chunks, { type: 'audio/webm' });
              const reader = new FileReader();
              reader.onloadend = async () => {
                  const base64Audio = reader.result as string;
                  const res = await detectLanguageFromAudio(apiKey, base64Audio);
                  setLanguage(res.code);
                  setIsDetectingLang(false);
                  speak(`Language detected: ${res.name}. Switching interface.`);
              };
              reader.readAsDataURL(blob);
              stream.getTracks().forEach(track => track.stop());
          };
          mediaRecorder.start();
          setTimeout(() => mediaRecorder.stop(), 3500); 
      } catch (e) {
          console.error("Audio detection failed", e);
          setIsDetectingLang(false);
          speak("Audio detection failed.");
          showError("Could not identify language. Check microphone permissions.");
      }
  };

  useEffect(() => {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) return;
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = language === 'auto' ? 'en-US' : (language === 'es' ? 'es-ES' : (language === 'de' ? 'de-DE' : (language === 'hi' ? 'hi-IN' : (language === 'zh' ? 'zh-CN' : (language === 'fr' ? 'fr-FR' : (language === 'ja' ? 'ja-JP' : 'en-US'))))));
      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onresult = (event: any) => {
          let interim = '';
          let final = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) final += event.results[i][0].transcript;
            else interim += event.results[i][0].transcript;
          }
          if (final || interim) setUserTranscript(final || interim);
          if (final) {
              const transcript = final.trim().toLowerCase();
              if (transcript.includes("system check") || transcript.includes("compliance check")) {
                  speak("Initiating check.");
                  runComplianceCheck();
              } else if (transcript.includes("freeze")) {
                  setIsFrozen(prev => !prev);
                  speak(isFrozen ? "Resuming." : "Frozen.");
              } else if (transcript.includes("translate")) {
                  setIsTranslatingEnv(prev => !prev);
                  speak("Toggling magic lens.");
              } else if (transcript.includes("enhance") || transcript.includes("macro") || transcript.includes("zoom")) {
                  setIsMacroMode(prev => !prev);
                  speak("Switching optic mode.");
              } else if (transcript.includes("system next step") || transcript.includes("next step") || transcript.includes("confirm step")) {
                  // Voice advancement
                  if (activeYoutubeUrl && isSupervisorMode) {
                       const nextIdx = currentVideoStepIndex + 1;
                       if (nextIdx < sopStepsRef.current.length) {
                           setCurrentVideoStepIndex(nextIdx);
                           speak("Advancing to next video step.");
                       }
                  } else {
                      const steps = sopStepsRef.current;
                      if (steps.length === 0) showError("No SOP loaded.");
                      else {
                          const idx = steps.findIndex(s => !s.completed);
                          if (idx !== -1) {
                              const newSteps = [...steps];
                              newSteps[idx] = { ...newSteps[idx], completed: true };
                              setSopSteps(newSteps);
                              speak(`Step ${newSteps[idx].id} completed.`);
                          }
                      }
                  }
              } else if (transcript.includes("previous step") || transcript.includes("undo step")) {
                  if (activeYoutubeUrl && isSupervisorMode) {
                       const prevIdx = Math.max(0, currentVideoStepIndex - 1);
                       setCurrentVideoStepIndex(prevIdx);
                       speak("Rewinding to previous step.");
                  }
              } else if (transcript.includes("increase opacity")) {
                  const newVal = Math.min(100, ghostOpacityRef.current + 20);
                  setGhostOpacity(newVal);
                  speak(`Opacity ${newVal}%`);
                  showInfo(`AR Opacity: ${newVal}%`);
              } else if (transcript.includes("decrease opacity")) {
                  const newVal = Math.max(0, ghostOpacityRef.current - 20);
                  setGhostOpacity(newVal);
                  speak(`Opacity ${newVal}%`);
                  showInfo(`AR Opacity: ${newVal}%`);
              } else if (transcript.includes("system focus tool") || transcript.includes("focus tool") || transcript.includes("verify tool")) {
                  if (!isMacroMode) setIsMacroMode(true);
                  speak("Engaging Instrument Verifier.");
                  handleToolVerification();
              }
              setTimeout(() => setUserTranscript(null), 4000);
          }
      };
      recognitionRef.current = recognition;
      try { recognition.start(); } catch (e) { console.log("Voice start error", e); }
      return () => recognition.stop();
  }, [isFrozen, language, speak, runComplianceCheck, showError, showInfo, handleToolVerification, isMacroMode, isSupervisorMode, currentVideoStepIndex, activeYoutubeUrl]);


  useEffect(() => {
      let intervalId: ReturnType<typeof setInterval>;
      if (isArmed && !isFrozen && !isMacroMode) {
          runComplianceCheck(true);
          intervalId = setInterval(() => { runComplianceCheck(true); }, 4000); 
      }
      return () => { if (intervalId) clearInterval(intervalId); };
  }, [isArmed, isFrozen, runComplianceCheck, isMacroMode]);

  // Keyboard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (!isCalibrating) return;
        if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName || '')) return;
        if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) e.preventDefault();
        const MOVE_STEP = e.shiftKey ? 10 : 1;
        const ROT_STEP = e.shiftKey ? 5 : 0.5;
        switch (e.key) {
            case 'ArrowUp': setGhostPos(p => ({ ...p, y: p.y - MOVE_STEP })); break;
            case 'ArrowDown': setGhostPos(p => ({ ...p, y: p.y + MOVE_STEP })); break;
            case 'ArrowLeft': setGhostPos(p => ({ ...p, x: p.x - MOVE_STEP })); break;
            case 'ArrowRight': setGhostPos(p => ({ ...p, x: p.x + MOVE_STEP })); break;
            case ']': setGhostRotation(r => r + ROT_STEP); break;
            case '[': setGhostRotation(r => r - ROT_STEP); break;
            case 'r': case 'R': setGhostPos({ x: 0, y: 0 }); setGhostRotation(0); break;
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCalibrating]);

  // ------------------------------------------------------------------------
  // Hand Gesture Logic
  // ------------------------------------------------------------------------
  useEffect(() => {
    if (isGestureEnabled && !gestureModelLoaded && window.handTrack) {
        const modelParams = {
            flipHorizontal: false, // Webcam handles flip, detection should match raw video
            maxNumBoxes: 1,
            iouThreshold: 0.5,
            scoreThreshold: 0.7,
        };
        window.handTrack.load(modelParams).then((model: any) => {
            gestureModelRef.current = model;
            setGestureModelLoaded(true);
            showInfo("Gesture Control Online. Raise hand to interact.");
            speak("Gesture control enabled.");
        });
    }
  }, [isGestureEnabled, gestureModelLoaded, showInfo, speak]);

  useEffect(() => {
    if (!isGestureEnabled || !gestureModelRef.current) return;
    
    const gestureInterval = setInterval(async () => {
        if (webcamRef.current && webcamRef.current.video && webcamRef.current.video.readyState === 4) {
             const predictions = await gestureModelRef.current.detect(webcamRef.current.video);
             
             if (predictions.length > 0) {
                 const now = Date.now();
                 // Simple Debounce: 2 seconds between actions
                 if (now - lastGestureTimeRef.current < 2000) return;

                 const prediction = predictions[0]; // Take strongest prediction
                 // Predictions return class 1: open, 2: closed, etc. 
                 // We look at the 'label' usually returned by handtrack.js default model
                 const label = prediction.label; 

                 if (label === 'closed' || label === 'pinch') {
                      // Action: Scan (Compliance Check)
                      lastGestureTimeRef.current = now;
                      speak("Gesture confirmed. Initiating scan.");
                      runComplianceCheck();
                 } else if (label === 'open') {
                      // Action: Toggle Privacy Mode
                      lastGestureTimeRef.current = now;
                      setIsPrivacyMode(prev => {
                          const next = !prev;
                          speak(next ? "Privacy Shield Active." : "Privacy Shield Deactivated.");
                          return next;
                      });
                 } else if (label === 'point') {
                      // Action: Freeze Feed
                      lastGestureTimeRef.current = now;
                      setIsFrozen(prev => {
                          const next = !prev;
                          speak(next ? "Feed Frozen." : "Feed Resumed.");
                          return next;
                      });
                 }
             }
        }
    }, 500); // Check every 500ms to save CPU
    
    return () => clearInterval(gestureInterval);
  }, [isGestureEnabled, runComplianceCheck, speak]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setReferenceData(reader.result as string);
        setGhostPos({ x: 0, y: 0 });
        setSopSteps([]);
        setPreFlightStatus('IDLE');
        setHazards([]);
        setIsArmed(false);
        setActiveYoutubeUrl(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleYoutubeSubmit = async () => {
      if (!youtubeUrl) return;
      setIsImportingYt(true);
      try {
          const data = await processYoutubeVideo(apiKey, youtubeUrl);
          setReferenceData(null); // Clear image reference
          setActiveYoutubeUrl(youtubeUrl);
          setSopSteps(data.steps);
          setProtocolText(`Protocol extracted from video source: ${data.title}`);
          speak("Video processed. Protocol steps extracted. Supervisor mode ready.");
          setYoutubeUrl(""); // Clear input
      } catch (e) {
          showError("Failed to import YouTube video. Check URL.");
      }
      setIsImportingYt(false);
  };

  const handleScanManual = () => {
      if (webcamRef.current) {
          const screenshot = webcamRef.current.getScreenshot();
          if (screenshot) {
              setReferenceData(screenshot);
              setGhostPos({ x: 0, y: 0 });
              setSopSteps([]);
              setPreFlightStatus('IDLE');
              setHazards([]);
              setIsArmed(false);
              setActiveYoutubeUrl(null);
              speak("Manual captured. Ready to digitize.");
          }
      }
  };
  
  const handleGenerateSchematic = async () => {
    setIsGeneratingSchematic(true);
    try {
      const imageBase64 = await generateSchematic(apiKey);
      setReferenceData(imageBase64);
      setPreFlightStatus('IDLE');
      setIsArmed(false);
      setActiveYoutubeUrl(null);
    } catch (e) { console.error(e); showError("Schematic generation failed."); }
    setIsGeneratingSchematic(false);
  };

  const handleDigitizeSOP = async () => {
      if (!referenceData) return;
      setIsDigitizing(true);
      try {
          const steps = await digitizeSOP(apiKey, referenceData);
          setSopSteps(steps);
          speak("SOP digitized.");
      } catch (e) { console.error(e); showError("SOP digitization failed."); }
      setIsDigitizing(false);
  };

  const toggleStep = (id: number) => {
      setSopSteps(prev => prev.map(s => s.id === id ? { ...s, completed: !s.completed } : s));
  };
  
  const handleGoogleExport = (type: 'DOCS' | 'SHEETS') => {
      // Simulate Export
      showInfo(`Syncing with Google ${type === 'DOCS' ? 'Docs' : 'Sheets'}...`);
      setTimeout(() => {
          showInfo(`Success. Entropy Report saved to Drive.`);
          // Create dummy download to simulate file generation
          const content = type === 'DOCS' 
              ? `ENTROPY GUARD REPORT\n\nDate: ${new Date().toLocaleString()}\nDrifts Detected: ${auditLogs.length}\nWaste Prevented: ${greenScore}g\n\nLogs:\n${auditLogs.map(l => `- [${l.severity}] ${l.timestamp}: ${l.reasoning}`).join('\n')}`
              : `Timestamp,Severity,Reasoning\n${auditLogs.map(l => `${l.timestamp},${l.severity},"${l.reasoning}"`).join('\n')}`;
          
          const blob = new Blob([content], { type: type === 'DOCS' ? 'text/plain' : 'text/csv' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `Entropy_Report_${type}.${type === 'DOCS' ? 'txt' : 'csv'}`;
          a.click();
      }, 1500);
  };

  const handleExportMarkdown = () => {
      if (sopSteps.length === 0) return;
      showInfo("Generating Markdown documentation...");
      
      const mdContent = `
# Standard Operating Procedure (SOP)
**Generated by EntropyGuard AI**

**Source:** ${activeYoutubeUrl || "Manual/Scan"}
**Date:** ${new Date().toLocaleDateString()}

## Protocol Steps
${sopSteps.map(step => `
### Step ${step.id}
**Instruction:** ${step.text}
${step.tools && step.tools.length ? `**Tools Required:** ${step.tools.join(', ')}` : ''}
${step.timestamp ? `**Timestamp:** ${new Date(step.timestamp * 1000).toISOString().substr(14, 5)}` : ''}
- [${step.completed ? 'x' : ' '}] Verified
`).join('\n')}

---
*Generated by EntropyGuard Neural Engine*
      `.trim();

      const blob = new Blob([mdContent], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `SOP_Protocol_${new Date().toISOString().split('T')[0]}.md`;
      a.click();
      speak("Markdown documentation exported.");
  };

  const handleSaveMasterPDF = () => {
      showInfo("Compiling PDF from video segments...");
      setTimeout(() => {
          showInfo("SOP PDF downloaded.");
          const blob = new Blob(["Simulated PDF Content from Gemini Vision Analysis"], { type: 'application/pdf' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `Master_SOP_${new Date().toISOString()}.pdf`;
          a.click();
      }, 1500);
  };

  const exportLogs = () => {
      // Export based on current view
      const dataToExport = telemetryView === 'DRIFT' ? auditLogs : toolHistory;
      const filename = telemetryView === 'DRIFT' ? 'entropy_audit' : 'tool_verification_history';
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dataToExport, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", `${filename}_${new Date().toISOString()}.json`);
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
  };

  const isPdf = referenceData?.startsWith('data:application/pdf');
  const ghostImageSrc = (!isPdf && referenceData) ? referenceData : null;

  // Calculate Active Step
  const firstIncompleteIndex = sopSteps.findIndex(s => !s.completed);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col font-sans overflow-hidden selection:bg-cyan-500/30">
      <TutorialOverlay steps={TUTORIAL_STEPS} isOpen={isTutorialOpen} onClose={handleTutorialClose} />
      <SettingsModal 
        isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} apiKey={apiKey} 
        setApiKey={handleSetApiKey} privacyMode={privacyEngine} setPrivacyMode={setPrivacyEngine}
        isModelLoaded={isModelLoaded} language={language}
        onDetectLanguage={detectLanguage}
        isDetectingLang={isDetectingLang}
      />

      {/* Header - Material 3 Sticky Surface */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex justify-between items-center transition-all duration-300">
        <div className="flex items-center gap-4">
          <div className={`p-2.5 rounded-2xl bg-slate-800/50 border border-white/5 ${isArmed ? 'text-red-400 shadow-[0_0_15px_rgba(248,113,113,0.3)]' : 'text-slate-400'}`}>
             <ShieldAlert size={24} strokeWidth={2} />
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-bold tracking-tight text-white font-sans leading-none mb-1">EntropyGuard</h1>
            <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">System Operational</p>
            </div>
          </div>
        </div>
        
        {/* Green Score Widget - Center */}
        {greenScore > 0 && (
            <div className="hidden lg:flex items-center gap-3 px-5 py-2.5 bg-gradient-to-r from-green-950/50 to-emerald-900/30 border border-green-500/30 rounded-full animate-in fade-in slide-in-from-top-4 shadow-[0_0_15px_rgba(34,197,94,0.15)]">
                <Leaf size={18} className="text-green-400" />
                <div className="flex flex-col leading-none">
                    <span className="text-xs font-bold text-green-300 tracking-wide">{greenScore >= 1000 ? `${(greenScore / 1000).toFixed(1)}kg` : `${greenScore}g`}</span>
                    <span className="text-[9px] text-green-500 uppercase tracking-wider font-bold">Waste Prevented</span>
                </div>
            </div>
        )}

        <div className="flex items-center gap-3">
             <button
                onClick={detectLanguage}
                disabled={isDetectingLang}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold transition-all border ${isDetectingLang ? 'bg-cyan-950/50 text-cyan-400 border-cyan-500/30' : 'bg-slate-900 border-white/10 text-slate-400 hover:bg-slate-800 hover:text-white hover:border-white/20'}`}
             >
                 {isDetectingLang ? <Activity size={16} className="animate-spin" /> : <Languages size={16} />}
                 <span className="hidden md:inline">{isDetectingLang ? "ANALYZING..." : language === 'auto' ? "AUTO LANG" : language.toUpperCase()}</span>
             </button>

             <button 
                onClick={() => setIsGestureEnabled(!isGestureEnabled)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold transition-all border ${isGestureEnabled ? 'bg-purple-900/20 text-purple-400 border-purple-500/30' : 'bg-slate-900 border-white/10 text-slate-400 hover:bg-slate-800 hover:text-white hover:border-white/20'}`}
             >
                 <Hand size={16} />
                 <span className="hidden md:inline">{isGestureEnabled ? "GESTURES ON" : "GESTURES"}</span>
             </button>

             <div data-tour-id="voice-indicator" className={`flex items-center gap-2 px-4 py-2.5 rounded-full border border-white/5 bg-slate-900 ${isListening ? 'text-green-400 border-green-900/50' : 'text-slate-500'}`}>
                 <Mic size={16} />
                 <span className="text-xs font-bold hidden md:inline">{isListening ? "LISTENING" : "MUTE"}</span>
             </div>

             <button onClick={startTutorial} className="p-2.5 hover:bg-slate-800 rounded-full transition-all text-slate-400 hover:text-white border border-transparent hover:border-white/10" title="Start Tutorial">
                <HelpCircle size={22} />
             </button>
             
             <button onClick={() => setIsSettingsOpen(true)} className="p-2.5 hover:bg-slate-800 rounded-full transition-all text-slate-400 hover:text-white border border-transparent hover:border-white/10">
                <Settings size={22} />
             </button>
        </div>
      </header>

      {/* Main Content - Material 3 Surface Containers */}
      <main className="flex-1 flex flex-col lg:flex-row h-full overflow-hidden p-6 gap-6 pt-24 pb-20">
        
        {/* Left Surface: Reference Standard / Master Mode */}
        <div data-tour-id="ref-panel" className="w-full lg:w-1/3 bg-slate-900/50 rounded-[2rem] border border-white/5 flex flex-col relative overflow-hidden shadow-2xl backdrop-blur-sm transition-colors hover:bg-slate-900/60">
          <div className="p-6 border-b border-white/5 flex items-center justify-between">
             <div className="flex items-center gap-3">
                 <button onClick={() => setIsMasterMode(!isMasterMode)} className={`p-2 rounded-full transition-all ${isMasterMode ? 'bg-red-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>
                     <Video size={18} />
                 </button>
                 <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2 uppercase tracking-wider">
                    {isMasterMode ? "Master Studio" : sopSteps.length > 0 ? "Workflow Steps" : "Reference Standard"}
                 </h2>
             </div>
             
             {!isMasterMode && referenceData && sopSteps.length === 0 && (
                 <button onClick={handleDigitizeSOP} disabled={isDigitizing} className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-full font-bold transition-all border border-white/5 hover:border-white/10 flex items-center gap-2">
                     {isDigitizing ? <div className="animate-spin w-3 h-3 border-2 border-current rounded-full"/> : <Zap size={14} />}
                     DIGITIZE SOP
                 </button>
             )}
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {isMasterMode ? (
                <div className="flex flex-col h-full">
                    {masterSopSteps.length === 0 && !isRecording && !isProcessingVideo ? (
                         <div className="flex flex-col items-center justify-center flex-1 text-center opacity-60">
                             <Video size={48} className="mb-4 text-slate-500" />
                             <p className="text-sm font-bold text-slate-300">Master Protocol Generation</p>
                             <p className="text-xs text-slate-500 max-w-xs mt-2">Record an expert performing the task. Gemini will analyze the video frames and generate a visual SOP automatically.</p>
                         </div>
                    ) : isRecording ? (
                         <div className="flex flex-col items-center justify-center flex-1">
                             <div className="w-20 h-20 rounded-full border-4 border-red-500 flex items-center justify-center animate-pulse">
                                 <div className="w-10 h-10 bg-red-500 rounded-sm" />
                             </div>
                             <p className="mt-6 text-red-400 font-bold tracking-widest animate-pulse">RECORDING EXPERT SESSION...</p>
                         </div>
                    ) : isProcessingVideo ? (
                         <div className="flex flex-col items-center justify-center flex-1">
                             <div className="animate-spin w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full mb-6" />
                             <p className="text-indigo-400 font-bold tracking-widest">ANALYZING FRAMES...</p>
                         </div>
                    ) : (
                         <div className="space-y-4">
                             <ul className="space-y-4">
                                 {masterSopSteps.map((step) => (
                                     <li key={step.id} className="bg-slate-800/50 rounded-xl overflow-hidden border border-white/5">
                                         <div className="h-32 bg-slate-900 relative">
                                             <img src={step.frameData} alt={`Step ${step.id}`} className="w-full h-full object-cover" />
                                             <div className="absolute top-2 left-2 bg-black/60 px-2 py-1 rounded text-[10px] font-bold text-white backdrop-blur-md">STEP {step.id}</div>
                                         </div>
                                         <div className="p-3 text-sm text-slate-300 font-medium">
                                             {step.text}
                                         </div>
                                     </li>
                                 ))}
                             </ul>
                             <button 
                                onClick={handleSaveMasterPDF} 
                                className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-xs tracking-wide border border-white/10 flex items-center justify-center gap-2 transition-all mt-4"
                             >
                                <FileOutput size={16} /> SAVE PROTOCOL AS PDF
                             </button>
                         </div>
                    )}
                    
                    {!isProcessingVideo && !masterSopSteps.length && (
                        <div className="mt-6">
                            <button 
                                onClick={() => setIsRecording(!isRecording)} 
                                className={`w-full py-4 rounded-xl font-bold text-sm tracking-wide transition-all shadow-lg flex items-center justify-center gap-3 ${
                                    isRecording 
                                    ? 'bg-slate-800 text-white border border-red-500/50' 
                                    : 'bg-gradient-to-r from-red-600 to-orange-600 text-white hover:from-red-500 hover:to-orange-500'
                                }`}
                            >
                                {isRecording ? <><Square size={18} fill="currentColor" /> STOP RECORDING</> : <><Video size={18} /> START RECORDING</>}
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                <>
                {/* YouTube Supervisor Embed */}
                {activeYoutubeUrl && (
                    <div className={`rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-black relative mb-4 transition-all ${showGoldenFrame ? 'opacity-0 h-0 overflow-hidden' : 'aspect-video'}`}>
                        <ReactPlayer
                            ref={playerRef}
                            url={activeYoutubeUrl}
                            width="100%"
                            height="100%"
                            controls
                            playing={isVideoPlaying}
                            onPlay={() => setIsVideoPlaying(true)}
                            onPause={() => setIsVideoPlaying(false)}
                            onEnded={() => setIsVideoPlaying(false)}
                            onProgress={handleVideoProgress}
                        />
                    </div>
                )}
                
                {/* Steps List (Filmstrip) */}
                {sopSteps.length > 0 ? (
                    <>
                        <div className="flex items-center justify-between mb-2 px-2">
                             <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                 <Layers size={14} /> Action Steps
                             </h3>
                             <div className="flex items-center gap-2">
                                 {activeYoutubeUrl && (
                                     <>
                                        <button 
                                            onClick={handleExportMarkdown}
                                            className="text-[10px] font-bold px-2 py-1.5 rounded-full border bg-slate-800 text-slate-400 border-white/10 hover:bg-slate-700 hover:text-white transition-all flex items-center gap-1"
                                            title="Export as Markdown"
                                        >
                                            <FileJson size={12} /> MD
                                        </button>
                                        <button 
                                            onClick={() => setIsSupervisorMode(!isSupervisorMode)}
                                            className={`text-[10px] font-bold px-3 py-1.5 rounded-full border transition-all flex items-center gap-2 ${isSupervisorMode ? 'bg-green-900/30 text-green-400 border-green-500/30 animate-pulse' : 'bg-slate-800 text-slate-400 border-white/10'}`}
                                        >
                                            <Zap size={12} /> {isSupervisorMode ? "SUPERVISOR ACTIVE" : "ENABLE SUPERVISOR"}
                                        </button>
                                     </>
                                 )}
                             </div>
                        </div>
                        <ul className="space-y-3">
                            {sopSteps.map((step, index) => {
                                // Highlight active step (first incomplete one)
                                const isActive = !step.completed && (isSupervisorMode ? index === currentVideoStepIndex : index === firstIncompleteIndex);
                                return (
                                <li key={step.id} onClick={() => {
                                        if (isSupervisorMode) {
                                            setCurrentVideoStepIndex(index);
                                            // Manual override also sets SOP active step logic
                                            setShowGoldenFrame(false);
                                        } else {
                                            toggleStep(step.id)
                                        }
                                    }} 
                                    className={`flex flex-col gap-2 p-4 rounded-2xl cursor-pointer transition-all border ${
                                    step.completed 
                                        ? 'bg-green-950/20 border-green-500/20 text-slate-500' 
                                        : isActive 
                                            ? 'bg-indigo-900/30 border-indigo-500/50 text-white shadow-[0_0_15px_rgba(99,102,241,0.15)] ring-1 ring-indigo-500/30' 
                                            : 'bg-slate-800/50 border-white/5 text-slate-400 hover:bg-slate-800 hover:border-white/10'
                                }`}>
                                    <div className="flex items-start gap-4">
                                        {step.completed ? (
                                            <CheckCircle size={20} className="shrink-0 mt-0.5 text-green-500" />
                                        ) : isActive ? (
                                            <div className="shrink-0 mt-0.5 relative flex items-center justify-center w-5 h-5">
                                                <div className="absolute inset-0 bg-indigo-500/30 rounded-full animate-ping" />
                                                <div className="w-2.5 h-2.5 bg-indigo-400 rounded-full shadow-[0_0_10px_rgba(129,140,248,0.8)]" />
                                            </div>
                                        ) : (
                                            <Square size={20} className="shrink-0 mt-0.5 text-slate-600" />
                                        )}
                                        <div className="flex-1">
                                            <span className={`text-sm font-medium leading-relaxed block ${step.completed ? 'line-through opacity-50' : isActive ? 'text-indigo-100 font-semibold' : ''}`}>{step.text}</span>
                                            {step.tools && step.tools.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mt-2">
                                                    {step.tools.map((tool, ti) => (
                                                        <span key={ti} className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-950 border border-white/5 text-slate-500 uppercase">{tool}</span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    
                                    {/* Filmstrip Metadata */}
                                    {step.timestamp !== undefined && (
                                        <div className="pl-9 flex items-center gap-3">
                                             <div className="text-[10px] font-mono text-cyan-500 bg-cyan-950/30 px-1.5 rounded">
                                                 {new Date(step.timestamp * 1000).toISOString().substr(14, 5)}
                                             </div>
                                             {isActive && activeYoutubeUrl && (
                                                 <button 
                                                    onClick={(e) => { e.stopPropagation(); setShowGoldenFrame(true); }}
                                                    className="text-[9px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 bg-amber-950/30 px-2 py-0.5 rounded border border-amber-500/20"
                                                 >
                                                     <ScanEye size={10} /> GOLDEN FRAME
                                                 </button>
                                             )}
                                        </div>
                                    )}
                                </li>
                            )})}
                        </ul>
                    </>
                ) : (
                    <div className="h-96 lg:h-[30rem] bg-slate-950/50 border-2 border-dashed border-slate-800 rounded-[1.5rem] relative overflow-hidden group flex flex-col items-center justify-center transition-colors hover:border-slate-700">
                      {referenceData ? (
                        <>
                          {isPdf ? (
                              <object data={referenceData} type="application/pdf" className="w-full h-full object-contain p-4">
                                  <div className="flex flex-col items-center justify-center h-full text-slate-500"><FileText size={64} className="mb-4 opacity-50"/><p className="font-bold">PDF Reference Loaded</p></div>
                              </object>
                          ) : (
                              <img src={referenceData} alt="Reference" className="w-full h-full object-contain p-6 opacity-90 transition-opacity hover:opacity-100" />
                          )}
                          <button onClick={() => setReferenceData(null)} className="absolute top-4 right-4 bg-slate-900/80 hover:bg-red-900/80 p-2.5 rounded-full text-white z-10 backdrop-blur-md border border-white/10 transition-colors"><X size={18} /></button>
                        </>
                      ) : (
                        <div className="text-center p-6 max-w-sm w-full flex flex-col gap-4">
                           <div className="flex justify-center gap-4 opacity-30 text-slate-400">
                              <ImageIcon size={40} /><FileText size={40} /><Youtube size={40} />
                           </div>
                           
                           <div>
                               <p className="text-sm font-bold text-slate-400 mb-1">Load Standard</p>
                               <p className="text-[10px] text-slate-600">Drag & drop blueprints, PDFs, or scan manuals.</p>
                           </div>
                          
                           {/* Action Grid */}
                           <div className="grid grid-cols-2 gap-3 w-full">
                                <label className="flex flex-col items-center justify-center gap-2 bg-slate-800/50 hover:bg-slate-800 p-4 rounded-xl cursor-pointer border border-white/5 hover:border-white/10 transition-all">
                                    <Upload size={20} className="text-indigo-400" />
                                    <span className="text-[10px] font-bold">UPLOAD FILE</span>
                                    <input type="file" accept="image/*,application/pdf" onChange={handleFileUpload} className="hidden" />
                                </label>
                                
                                <button onClick={handleScanManual} className="flex flex-col items-center justify-center gap-2 bg-slate-800/50 hover:bg-slate-800 p-4 rounded-xl cursor-pointer border border-white/5 hover:border-white/10 transition-all">
                                    <Camera size={20} className="text-green-400" />
                                    <span className="text-[10px] font-bold">SCAN MANUAL</span>
                                </button>
                           </div>

                           <div className="flex items-center gap-2 bg-slate-800/50 rounded-xl p-2 border border-white/5">
                               <Youtube size={16} className="text-red-400 ml-2" />
                               <input 
                                    type="text" 
                                    placeholder="Paste YouTube URL..." 
                                    value={youtubeUrl}
                                    onChange={(e) => setYoutubeUrl(e.target.value)}
                                    className="bg-transparent border-none text-xs text-white focus:outline-none w-full"
                               />
                               <button onClick={handleYoutubeSubmit} disabled={!youtubeUrl || isImportingYt} className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white disabled:opacity-50">
                                   {isImportingYt ? <div className="animate-spin w-3 h-3 border-2 border-white rounded-full"/> : <LinkIcon size={14} />}
                               </button>
                           </div>

                           <button onClick={handleGenerateSchematic} disabled={isGeneratingSchematic} className="w-full py-3 bg-slate-900/50 hover:bg-purple-900/20 text-purple-300 rounded-xl font-bold text-[10px] tracking-wide border border-purple-500/20 hover:border-purple-500/50 flex items-center justify-center gap-2 transition-all">
                                  {isGeneratingSchematic ? <div className="animate-spin w-3 h-3 border-2 border-current rounded-full" /> : <Sparkles size={14} />}
                                  {isGeneratingSchematic ? "GENERATING..." : "GENERATE AI SCHEMATIC"}
                           </button>
                        </div>
                      )}
                    </div>
                )}

                <div>
                  <label className="text-xs font-bold text-slate-500 mb-3 block uppercase tracking-widest flex items-center gap-2">
                     <ShieldAlert size={12} /> Protocol Context
                  </label>
                  <textarea 
                    value={protocolText} 
                    onChange={(e) => setProtocolText(e.target.value)} 
                    className="w-full h-40 bg-slate-950/50 border border-slate-800 rounded-[1.5rem] p-5 text-sm text-slate-300 font-mono focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 resize-none leading-relaxed transition-all placeholder:text-slate-700"
                    placeholder="Enter safety protocols here..."
                  />
                </div>
                </>
            )}
          </div>
        </div>

        {/* Right Surface: Live Reality */}
        <div className="w-full lg:w-2/3 bg-slate-900/50 rounded-[2rem] border border-white/5 flex flex-col overflow-hidden relative shadow-2xl backdrop-blur-sm">
          
          {/* Camera Controls Bar */}
          <div className="absolute top-6 left-6 right-6 z-40 flex items-center justify-between pointer-events-none">
            <div className="pointer-events-auto flex items-center gap-3 bg-slate-950/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/5">
                <div className={`w-2.5 h-2.5 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : isArmed ? "bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.6)]" : "bg-slate-600"}`} />
                <h2 className="text-xs font-bold text-white tracking-wide uppercase">{isRecording ? "REC" : "Live Feed"}</h2>
            </div>

            <div data-tour-id="ar-controls" className="pointer-events-auto flex items-center gap-2 bg-slate-950/60 backdrop-blur-md p-1.5 rounded-full border border-white/5">
                <button onClick={() => setIsMacroMode(!isMacroMode)} className={`p-2.5 rounded-full transition-all ${isMacroMode ? 'bg-indigo-500/30 text-indigo-300' : 'text-slate-400 hover:text-white hover:bg-white/5'}`} title="Macro Mode"><Microscope size={20} /></button>
                <button onClick={() => setIsMirrored(!isMirrored)} className={`p-2.5 rounded-full transition-all ${isMirrored ? 'bg-indigo-500/30 text-indigo-300' : 'text-slate-400 hover:text-white hover:bg-white/5'}`} title="Mirror Feed"><FlipHorizontal size={20} /></button>
                <button onClick={() => setIsTranslatingEnv(!isTranslatingEnv)} className={`p-2.5 rounded-full transition-all ${isTranslatingEnv ? 'bg-cyan-500/30 text-cyan-300' : 'text-slate-400 hover:text-white hover:bg-white/5'}`} title="Translate Environment"><ScanEye size={20} /></button>
                <button onClick={() => setIsPrivacyMode(!isPrivacyMode)} className={`p-2.5 rounded-full transition-all ${isPrivacyMode ? 'bg-green-500/30 text-green-300' : 'text-slate-400 hover:text-white hover:bg-white/5'}`} title="Privacy Mode"><EyeOff size={20} /></button>
                <div className="w-px h-6 bg-white/10 mx-1"></div>
                <button onClick={() => setIsCalibrating(!isCalibrating)} className={`p-2.5 rounded-full transition-all ${isCalibrating ? 'bg-amber-500/30 text-amber-300' : 'text-slate-400 hover:text-white hover:bg-white/5'}`} disabled={!ghostImageSrc} title="Calibrate AR"><Crosshair size={20} /></button>
                
                <div className="flex items-center gap-2 pl-2 pr-3">
                    <Ghost size={16} className={ghostOpacity > 0 ? "text-cyan-400" : "text-slate-600"} />
                    <input type="range" min="0" max="100" value={ghostOpacity} onChange={(e) => setGhostOpacity(Number(e.target.value))} className="w-20 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400" disabled={!ghostImageSrc}/>
                </div>
            </div>
          </div>

          <div className="relative flex-1 bg-black overflow-hidden group">
            {/* Vignette Overlay */}
            <div className="absolute inset-0 pointer-events-none z-30 bg-[radial-gradient(circle,transparent_40%,rgba(0,0,0,0.8)_100%)]" />

            {/* Instrument Verifier Reticle */}
            {isMacroMode && (
                <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none animate-in fade-in duration-300">
                    <div className={`relative w-72 h-72 transition-all duration-500 ${
                        toolCheckStatus === 'MATCH' ? 'border-green-500 shadow-[0_0_50px_rgba(34,197,94,0.4)]' :
                        toolCheckStatus === 'MISMATCH' ? 'border-red-500 shadow-[0_0_50px_rgba(239,68,68,0.4)]' :
                        'border-cyan-400/50 shadow-[0_0_30px_rgba(34,211,238,0.2)]'
                    }`}>
                        {/* Decorative brackets */}
                        <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-current"/>
                        <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-current"/>
                        <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-current"/>
                        <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-current"/>
                        
                        {/* Scanning line if analyzing */}
                        {isAnalyzing && (
                            <div className="absolute inset-x-0 top-0 h-0.5 bg-current opacity-50 animate-pulse"/>
                        )}
                        
                        {/* Center marker */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-current rounded-full opacity-80"/>

                        {/* Readout */}
                        <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 whitespace-nowrap">
                            <div className={`px-4 py-1.5 rounded-full text-xs font-bold font-mono border backdrop-blur-md ${
                                toolCheckStatus === 'MATCH' ? 'bg-green-950/80 border-green-500 text-green-400' :
                                toolCheckStatus === 'MISMATCH' ? 'bg-red-950/80 border-red-500 text-red-400' :
                                'bg-slate-900/80 border-cyan-500/50 text-cyan-400'
                            }`}>
                                {isAnalyzing ? "ANALYZING OPTICS..." : 
                                toolCheckStatus === 'MATCH' ? "INSTRUMENT VERIFIED" :
                                toolCheckStatus === 'MISMATCH' ? "CALIBRATION ERROR" : "MACRO OPTICS ENGAGED"}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Error Toast - Floating Material Pill */}
            {errorMsg && (
                <div className="absolute top-24 left-1/2 -translate-x-1/2 z-[100] w-auto max-w-md animate-in slide-in-from-top-4 fade-in">
                    <div className="bg-[#1E1E1E] text-[#E3E3E3] rounded-full px-6 py-3 shadow-2xl border border-white/10 flex items-center gap-4 backdrop-blur-xl">
                        <AlertCircle className="text-red-400 shrink-0" size={20} />
                        <span className="text-sm font-medium">{errorMsg}</span>
                        <button onClick={() => setErrorMsg(null)} className="ml-2 text-slate-500 hover:text-white"><X size={16} /></button>
                    </div>
                </div>
            )}
            
            {/* Info Toast - Floating Material Pill */}
            {infoMsg && !errorMsg && (
                <div className="absolute top-24 left-1/2 -translate-x-1/2 z-[100] w-auto max-w-md animate-in slide-in-from-top-4 fade-in">
                    <div className="bg-[#1E1E1E] text-[#E3E3E3] rounded-full px-6 py-3 shadow-2xl border border-white/10 flex items-center gap-4 backdrop-blur-xl">
                        <Sparkles className="text-cyan-400 shrink-0" size={18} />
                        <span className="text-sm font-medium">{infoMsg}</span>
                    </div>
                </div>
            )}

            {/* AI Subtitles - Google Assistant Style */}
            {subtitle && (
                <div className="absolute bottom-28 left-0 right-0 z-50 flex justify-center pointer-events-none px-6">
                    <div className="bg-black/60 backdrop-blur-lg text-white px-8 py-4 text-lg font-medium rounded-3xl border border-white/10 shadow-xl max-w-2xl text-center leading-relaxed">
                        {subtitle}
                    </div>
                </div>
            )}

            {/* Live Transcript - Material Card */}
            {userTranscript && (
                <div className="absolute bottom-36 left-8 z-50 pointer-events-none animate-in slide-in-from-bottom-2 fade-in">
                     <div className="bg-slate-900/60 backdrop-blur-xl rounded-3xl p-5 border border-white/10 max-w-sm shadow-xl">
                        <div className="flex items-center gap-2.5 mb-2">
                             <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                             <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Voice Command</span>
                        </div>
                        <p className="text-white text-base leading-relaxed font-medium">"{userTranscript}"</p>
                     </div>
                </div>
            )}

            {/* Privacy Shield Badge */}
            {isPrivacyMode && (
                 <div className="absolute top-24 left-8 z-20">
                     <div className="bg-slate-900/60 backdrop-blur-md border border-white/10 text-white text-xs px-4 py-2 rounded-full flex items-center gap-2.5 shadow-xl">
                         <ShieldAlert size={14} className="text-green-400" />
                         <span className="font-bold tracking-wide opacity-90">{privacyEngine === PrivacyMode.SIMULATION ? "IDENTITY SIMULATED" : "FACE REDACTION ACTIVE"}</span>
                     </div>
                 </div>
            )}

            {/* Gesture Mode Badge */}
            {isGestureEnabled && (
                 <div className="absolute top-24 right-8 z-20">
                     <div className="bg-purple-900/60 backdrop-blur-md border border-purple-500/20 text-white text-xs px-4 py-2 rounded-full flex items-center gap-2.5 shadow-xl animate-in fade-in slide-in-from-top-2">
                         <Hand size={14} className="text-purple-300" />
                         <span className="font-bold tracking-wide opacity-90">HAND TRACKING ACTIVE</span>
                     </div>
                 </div>
            )}
            
            {/* Golden Frame AR Overlay (YouTube Player Overlaid) */}
            {activeYoutubeUrl && showGoldenFrame && (
                <div className="absolute inset-0 z-10 pointer-events-none opacity-50 flex items-center justify-center">
                    <ReactPlayer
                        url={activeYoutubeUrl}
                        width="100%"
                        height="100%"
                        playing={false} // Static frame reference
                        controls={false}
                        light={true} // Just show thumbnail or initial frame
                        style={{ objectFit: 'cover' }}
                    />
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-amber-500/80 text-black px-4 py-1 rounded-full font-bold text-xs animate-pulse">
                        GOLDEN FRAME ALIGNMENT MODE
                    </div>
                </div>
            )}
            
            {/* Exit Golden Frame Button */}
            {activeYoutubeUrl && showGoldenFrame && (
                <div className="absolute top-24 right-1/2 translate-x-1/2 z-50">
                    <button onClick={() => setShowGoldenFrame(false)} className="bg-slate-900 hover:bg-red-600 text-white px-4 py-2 rounded-full font-bold text-xs shadow-xl transition-colors border border-white/10">
                        EXIT ALIGNMENT
                    </button>
                </div>
            )}

            <Webcam 
                ref={webcamRef} 
                audio={false} 
                screenshotFormat="image/jpeg" 
                videoConstraints={{ facingMode: "environment" }} 
                className={`absolute inset-0 w-full h-full object-cover transition-transform duration-500 ${isMirrored ? 'scale-x-[-1]' : ''} ${isMacroMode ? 'scale-[2] origin-center' : ''}`} 
            />
            
            {ghostImageSrc && <img src={ghostImageSrc} alt="AR Overlay" className="absolute inset-0 w-full h-full object-cover pointer-events-none z-10 mix-blend-screen transition-transform duration-75" style={{ opacity: ghostOpacity / 100, transform: `translate(${ghostPos.x}px, ${ghostPos.y}px) rotate(${ghostRotation}deg)` }} />}

            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full z-20 pointer-events-none" />

            {/* AR Calibration HUD - Floating Glass Panel */}
            {isCalibrating && ghostImageSrc && (
                <div className="absolute top-20 right-8 z-40 bg-slate-900/80 backdrop-blur-xl border border-white/10 p-5 rounded-[1.5rem] w-64 shadow-2xl animate-in slide-in-from-right-4">
                    <div className="flex items-center gap-2 mb-4 border-b border-white/5 pb-3">
                        <Crosshair size={16} className="text-cyan-400" />
                        <h3 className="font-bold text-xs text-white uppercase tracking-widest">AR Alignment</h3>
                    </div>
                    <div className="space-y-3">
                        <div className="bg-black/30 rounded-xl p-3 border border-white/5 cursor-help" title="Use Arrow keys to move the overlay. Hold Shift for faster movement.">
                             <div className="flex justify-between text-[10px] text-slate-400 uppercase mb-1 font-bold">
                                <span>Position</span> 
                                <div className="flex items-center gap-1 text-cyan-400 font-mono"><Move size={10} /> <span>ARROWS</span></div>
                             </div>
                             <div className="flex justify-between font-mono text-xs text-slate-200"><span>X: {ghostPos.x}</span> <span>Y: {ghostPos.y}</span></div>
                        </div>
                        <div className="bg-black/30 rounded-xl p-3 border border-white/5 cursor-help" title="Use [ and ] keys to rotate the overlay. Hold Shift for faster rotation.">
                             <div className="flex justify-between text-[10px] text-slate-400 uppercase mb-1 font-bold">
                                <span>Rotation</span> 
                                <div className="flex items-center gap-1 text-cyan-400 font-mono">
                                    <RotateCcw size={10} /> <span>[</span> <span className="mx-0.5 text-slate-600">|</span> <span>]</span> <RotateCw size={10} />
                                </div>
                             </div>
                             <div className="font-mono text-xs text-slate-200">Angle: {ghostRotation.toFixed(1)}°</div>
                        </div>
                        <button onClick={() => { setGhostPos({x:0,y:0}); setGhostRotation(0); }} className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-bold text-white transition-colors border border-white/5" title="Reset overlay to original position and rotation">RESET VIEW</button>
                    </div>
                </div>
            )}
            
            {/* Loading Indicator Center - Gemini Spinner */}
            {(isAnalyzing || preFlightStatus === 'ANALYZING' || isDetectingLang) && !isArmed && (
                <div className="absolute inset-0 flex items-center justify-center z-40 bg-black/20 backdrop-blur-sm">
                    <div className="bg-white text-slate-900 pl-5 pr-8 py-4 rounded-full font-bold shadow-2xl flex items-center gap-4 animate-in zoom-in duration-300">
                         <div className="relative w-6 h-6">
                             <div className="absolute inset-0 rounded-full border-2 border-blue-500 border-t-transparent animate-spin"></div>
                             <div className="absolute inset-1 rounded-full border-2 border-purple-500 border-b-transparent animate-spin direction-reverse"></div>
                         </div>
                        <span className="tracking-tight">{isDetectingLang ? "Fingerprinting Audio..." : "Processing Visuals..."}</span>
                    </div>
                </div>
            )}
          </div>

          {/* Bottom Control Bar */}
          <div className="bg-slate-900/30 p-6 flex items-center justify-between gap-4 backdrop-blur-md">
             <div className="flex items-center gap-6">
                 {/* Main Action Button - Gemini Gradient */}
                 {referenceData && preFlightStatus !== 'PASS' && !isArmed ? (
                     <button onClick={handlePreFlightScan} disabled={preFlightStatus === 'ANALYZING'} className="group flex items-center gap-3 pl-6 pr-8 py-4 rounded-full bg-slate-800 hover:bg-slate-700 text-yellow-400 font-bold text-sm transition-all shadow-lg border border-white/5 hover:border-yellow-500/30 hover:shadow-yellow-500/10">
                         <Search size={20} className="group-hover:scale-110 transition-transform" />
                         {preFlightStatus === 'ANALYZING' ? "SCANNING..." : "SCAN WORKBENCH"}
                     </button>
                 ) : isMacroMode ? (
                      <button onClick={handleToolVerification} disabled={isAnalyzing} className="group flex items-center gap-3 pl-6 pr-8 py-4 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-all shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40">
                         <Target size={20} className="group-hover:rotate-90 transition-transform" />
                         {isAnalyzing ? "VERIFYING..." : "VERIFY TOOL STATE"}
                      </button>
                 ) : (
                     <button 
                        onClick={() => setIsArmed(!isArmed)}
                        data-tour-id="arm-button"
                        disabled={referenceData && preFlightStatus !== 'PASS' && !isArmed && !activeYoutubeUrl}
                        className={`group flex items-center gap-3 pl-6 pr-8 py-4 rounded-full font-bold text-sm transition-all shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 ${
                            isArmed 
                            ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/20' 
                            : 'bg-gradient-to-r from-[#4E75F6] via-[#A568CC] to-[#DC606B] text-white'
                        }`}
                     >
                        {isArmed ? <Power size={20} /> : <Sparkles size={20} className={isArmed ? "" : "animate-pulse"} />}
                        <span className="tracking-wide">{isArmed ? "DISARM SYSTEM" : "ARM INTELLIGENCE"}</span>
                     </button>
                 )}
                 
                 <div className="hidden md:flex flex-col border-l border-white/10 pl-6 h-10 justify-center">
                     <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mb-0.5">System Status</span>
                     <span className={`text-sm font-bold tracking-tight ${result?.status === ComplianceStatus.DRIFT ? 'text-red-400' : 'text-green-400'}`}>
                         {isArmed ? (result?.status === ComplianceStatus.DRIFT ? "DRIFT DETECTED" : "OPTIMAL ALIGNMENT") : "STANDBY"}
                     </span>
                 </div>
             </div>
          </div>
        </div>
      </main>

      {/* Telemetry Drawer (Bottom Sheet) - Material 3 Surface w/ Handle */}
      <div data-tour-id="telemetry-drawer" className={`fixed bottom-0 left-0 right-0 bg-slate-900/90 backdrop-blur-2xl rounded-t-[2rem] border-t border-white/10 transition-all duration-500 cubic-bezier(0.32, 0.72, 0, 1) z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] ${isLogsOpen ? 'h-80' : 'h-16'}`}>
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-slate-700 rounded-full opacity-50" />
          
          <div className="flex items-center justify-between px-8 h-16 cursor-pointer hover:bg-white/5 rounded-t-[2rem] transition-colors" onClick={() => setIsLogsOpen(!isLogsOpen)}>
              
              {/* Left Side: View Toggles */}
              <div className="flex items-center gap-4" onClick={(e) => e.stopPropagation()}>
                  <button 
                      onClick={() => setTelemetryView('DRIFT')} 
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${telemetryView === 'DRIFT' ? 'bg-slate-700 text-white border-slate-600' : 'text-slate-500 border-transparent hover:text-slate-300'}`}
                  >
                    <Activity size={14} />
                    DRIFT LOGS
                    <span className="bg-slate-800 px-1.5 rounded text-[10px] text-slate-400 min-w-[1.2rem] text-center">{auditLogs.length}</span>
                  </button>

                  <div className="w-px h-4 bg-slate-700/50"></div>

                  <button 
                      onClick={() => setTelemetryView('TOOL')} 
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${telemetryView === 'TOOL' ? 'bg-indigo-900/40 text-indigo-300 border-indigo-500/30' : 'text-slate-500 border-transparent hover:text-slate-300'}`}
                  >
                    <ClipboardList size={14} />
                    TOOL HISTORY
                    <span className="bg-slate-800 px-1.5 rounded text-[10px] text-slate-400 min-w-[1.2rem] text-center">{toolHistory.length}</span>
                  </button>
              </div>

              {/* Right Side: Actions */}
              <div className="flex items-center gap-3 md:gap-4">
                  <button onClick={(e) => { e.stopPropagation(); handleGoogleExport('DOCS'); }} className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold text-blue-400 hover:bg-blue-900/30 transition-colors border border-transparent hover:border-blue-500/30 bg-blue-950/10">
                      <FileDoc size={14} /> <span className="hidden lg:inline">EXPORT</span> DOCS
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); handleGoogleExport('SHEETS'); }} className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold text-green-400 hover:bg-green-900/30 transition-colors border border-transparent hover:border-green-500/30 bg-green-950/10">
                      <Table size={14} /> <span className="hidden lg:inline">SYNC</span> SHEETS
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); exportLogs(); }} className="text-xs text-slate-400 hover:text-white font-bold flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-white/10 transition-colors"><Download size={14} /> JSON</button>
                  {isLogsOpen ? <ChevronDown size={20} className="text-slate-500" /> : <ChevronUp size={20} className="text-slate-500" />}
              </div>
          </div>

          <div className="h-full overflow-y-auto p-8 pb-24 font-mono text-xs space-y-3">
              {telemetryView === 'DRIFT' ? (
                  auditLogs.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-48 text-slate-600 space-y-4">
                          <div className="p-4 rounded-full bg-slate-800/50">
                            <MessageSquare size={32} className="opacity-40" />
                          </div>
                          <p className="font-sans font-medium text-slate-500">No drift events recorded in current session.</p>
                      </div>
                  ) : (
                      auditLogs.map(log => (
                          <div key={log.id} className="group flex gap-6 p-4 hover:bg-white/5 rounded-2xl transition-all border border-transparent hover:border-white/5 items-center">
                              <span className="text-slate-500 shrink-0 font-medium">{log.timestamp}</span>
                              <span className={`px-3 py-1 rounded-full font-bold shrink-0 text-[10px] tracking-wider w-24 text-center ${log.severity === DriftSeverity.CRITICAL ? 'bg-red-900/30 text-red-300 border border-red-500/20' : log.severity === DriftSeverity.MEDIUM ? 'bg-orange-900/30 text-orange-300 border border-orange-500/20' : 'bg-yellow-900/30 text-yellow-300 border border-yellow-500/20'}`}>{log.severity}</span>
                              <span className="text-slate-300 font-sans text-sm group-hover:text-white transition-colors">{log.reasoning}</span>
                          </div>
                      ))
                  )
              ) : (
                  toolHistory.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-48 text-slate-600 space-y-4">
                          <div className="p-4 rounded-full bg-slate-800/50">
                            <Microscope size={32} className="opacity-40" />
                          </div>
                          <p className="font-sans font-medium text-slate-500">No instrument verifications performed.</p>
                      </div>
                  ) : (
                      toolHistory.map(log => (
                          <div key={log.id} className="group flex gap-6 p-4 hover:bg-white/5 rounded-2xl transition-all border border-transparent hover:border-white/5 items-center">
                              <span className="text-slate-500 shrink-0 font-medium">{log.timestamp}</span>
                              <span className={`px-3 py-1 rounded-full font-bold shrink-0 text-[10px] tracking-wider w-24 text-center ${log.status === 'MATCH' ? 'bg-green-900/30 text-green-300 border border-green-500/20' : 'bg-red-900/30 text-red-300 border border-red-500/20'}`}>{log.status}</span>
                              <span className="text-slate-300 font-sans text-sm group-hover:text-white transition-colors">{log.instruction}</span>
                          </div>
                      ))
                  )
              )}
          </div>
      </div>
    </div>
  );
};

export default App;