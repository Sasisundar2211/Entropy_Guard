
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

export type Language = 'auto' | 'en' | 'es' | 'de' | 'hi' | 'zh' | 'fr' | 'ja';

export interface BoxCoordinates {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ComplianceResponse {
  status: ComplianceStatus;
  drift_severity: DriftSeverity;
  coordinates: number[]; // [x, y, width, height] 0-1000 scale
  correction_voice: string;
}

export interface TranslationOverlay {
  text: string;
  boundingBox: number[]; // [ymin, xmin, ymax, xmax] 0-1000 scale
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  severity: DriftSeverity;
  reasoning: string;
}

export interface ToolVerificationLogEntry {
    id: string;
    timestamp: string;
    status: 'MATCH' | 'MISMATCH';
    instruction: string;
}

export interface SOPStep {
  id: number;
  text: string;
  completed: boolean;
  timestamp?: number; // Seconds from start of video
  tools?: string[];
}

export interface MasterSOPStep extends SOPStep {
    frameData: string; // Base64 image of the step
}

export interface HazardZone {
  label: string;
  boundingBox: number[]; // [ymin, xmin, ymax, xmax] 0-1000 scale
}

export interface PreFlightResult {
    status: 'PASS' | 'FAIL';
    missing_items: string[];
    detected_items: string[];
    hazards: HazardZone[];
}

export interface ToolVerificationResult {
    status: 'MATCH' | 'MISMATCH';
    instruction: string;
}

export interface AppState {
  apiKey: string;
  referenceImage: string | null;
  protocolText: string;
  isAnalyzing: boolean;
  lastResult: ComplianceResponse | null;
}
