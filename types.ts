
export enum DriftSeverity {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  CRITICAL = "CRITICAL"
}

export enum ComplianceStatus {
  MATCH = "MATCH",
  DRIFT = "DRIFT"
}

export enum PrivacyMode {
  SIMULATION = "SIMULATION",
  REAL_AI = "REAL_AI"
}

export enum AppState {
  SPLASH = "SPLASH",
  DASHBOARD = "DASHBOARD",
  CALIBRATION = "CALIBRATION",
  MONITORING = "MONITORING",
  REPORT = "REPORT"
}

export type Language = 'auto' | 'en' | 'es' | 'de' | 'hi' | 'zh' | 'fr' | 'ja';

export interface BoxCoordinates {
  ymin: number;
  xmin: number;
  ymax: number;
  xmax: number;
}

export interface EntropyAnalysisResult {
  status: ComplianceStatus;
  severity: DriftSeverity;
  message: string;
  confidence: number; // 0-100
  boundingBox?: number[]; 
  timestamp: string;
  detectedLanguage?: string;
}

export interface ReferenceData {
  type: 'IMAGE' | 'PDF' | 'TEXT' | 'YOUTUBE';
  content: string; // Base64, raw text, or URL
  name: string;
  mimeType?: string;
  steps?: TaskStep[]; // For YouTube/Text generated checklists
}

export interface TaskStep {
  id: string;
  timecode: string;
  instruction: string;
  completed: boolean;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  type: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS' | 'AI';
  message: string;
}

// Keeping legacy types for compatibility with unused components if needed
export interface HazardZone {
  label: string;
  boundingBox: number[]; 
}
