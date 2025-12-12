
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
  ymin: number;
  xmin: number;
  ymax: number;
  xmax: number;
}

export interface EntropyAnalysisResult {
  status: ComplianceStatus;
  severity: DriftSeverity;
  message: string;
  // Bounding box for the error/anomaly in the LIVE FEED (0-1000 scale)
  boundingBox?: number[]; 
  timestamp: string;
}

export interface ReferenceData {
  type: 'IMAGE' | 'PDF' | 'TEXT';
  content: string; // Base64 or raw text
  name: string;
  mimeType?: string;
}

// Keeping legacy types for compatibility with unused components if needed, 
// though App.tsx is fully rewritten.
export interface HazardZone {
  label: string;
  boundingBox: number[]; 
}
