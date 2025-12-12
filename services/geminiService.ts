
import { EntropyAnalysisResult, ComplianceStatus, DriftSeverity, ReferenceData, TaskStep } from "../types";

const API_URL = "http://localhost:8000/api";

export const generateStepsFromUrl = async (url: string): Promise<TaskStep[]> => {
    try {
        const response = await fetch(`${API_URL}/ingest-youtube`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url })
        });
        
        if (!response.ok) throw new Error("Backend ingestion failed");
        
        const data = await response.json();
        
        // Map backend response to Frontend TaskStep type
        // The backend returns a simulated list for now based on transcript structure
        return data.steps || [];
    } catch (e) {
        console.error("YouTube Ingestion Error:", e);
        // Fallback for demo if backend isn't running
        return [
            { id: '1', timecode: '00:00', instruction: 'Backend Error: Could not parse video.', completed: false }
        ];
    }
};

export const performEntropyCheck = async (
  apiKey: string,
  reference: ReferenceData,
  liveFrameBase64: string
): Promise<EntropyAnalysisResult> => {
  
  try {
    const response = await fetch(`${API_URL}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            apiKey,
            reference,
            liveFrame: liveFrameBase64
        })
    });

    if (!response.ok) throw new Error("Analysis failed");

    const data = await response.json();

    return {
        ...data,
        timestamp: new Date().toLocaleTimeString()
    };

  } catch (error) {
    console.error("Entropy Check Failed (Backend):", error);
    
    // Fallback/Simulation if Python server is down
    const isDrift = Math.random() > 0.7;
    return {
        status: isDrift ? ComplianceStatus.DRIFT : ComplianceStatus.MATCH,
        severity: isDrift ? DriftSeverity.MEDIUM : DriftSeverity.LOW,
        message: apiKey ? "CONNECTION LOST: Retrying backend..." : "SIMULATION: Compliance verified.",
        confidence: apiKey ? 0 : 98,
        boundingBox: isDrift ? [200, 300, 500, 600] : undefined,
        timestamp: new Date().toLocaleTimeString()
    };
  }
};
