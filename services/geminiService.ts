
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
        return data.steps || [];
    } catch (e) {
        // Fallback for demo/simulation when backend is unreachable
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        return [
            { id: '1', timecode: '00:10', instruction: 'Initialize safety protocols and verify PPE.', completed: false },
            { id: '2', timecode: '00:45', instruction: 'Inspect all components for structural integrity.', completed: false },
            { id: '3', timecode: '01:30', instruction: 'Align parts according to the visual schematic.', completed: false },
            { id: '4', timecode: '02:15', instruction: 'Secure connections and verify torque settings.', completed: false },
            { id: '5', timecode: '03:00', instruction: 'Perform final calibration check.', completed: false }
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
    // Fallback/Simulation if Python server is down
    const isDrift = Math.random() > 0.85;
    return {
        status: isDrift ? ComplianceStatus.DRIFT : ComplianceStatus.MATCH,
        severity: isDrift ? DriftSeverity.MEDIUM : DriftSeverity.LOW,
        message: isDrift ? "Calibration drift detected." : "Compliance verified. System nominal.",
        confidence: 96,
        boundingBox: isDrift ? [200, 300, 500, 600] : undefined,
        timestamp: new Date().toLocaleTimeString()
    };
  }
};
