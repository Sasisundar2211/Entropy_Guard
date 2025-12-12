
import { GoogleGenAI, Type, SchemaParams } from "@google/genai";
import { EntropyAnalysisResult, ComplianceStatus, DriftSeverity, ReferenceData } from "../types";

// Mock response for simulation mode
const MOCK_RESULT: EntropyAnalysisResult = {
  status: ComplianceStatus.DRIFT,
  severity: DriftSeverity.MEDIUM,
  message: "MISMATCH DETECTED: Operator is using a 12mm wrench. Schematic requires 10mm torque wrench for this assembly.",
  boundingBox: [200, 300, 500, 600],
  timestamp: new Date().toLocaleTimeString()
};

export const performEntropyCheck = async (
  apiKey: string,
  reference: ReferenceData,
  liveFrameBase64: string
): Promise<EntropyAnalysisResult> => {
  
  // 1. Simulation Mode (No Key)
  if (!apiKey) {
    await new Promise(r => setTimeout(r, 1000));
    // Randomly flip between match and drift for demo excitement
    const isDrift = Math.random() > 0.6;
    return {
        ...MOCK_RESULT,
        status: isDrift ? ComplianceStatus.DRIFT : ComplianceStatus.MATCH,
        message: isDrift ? MOCK_RESULT.message : "SYSTEM NOMINAL: Component alignment matches schematic.",
        severity: isDrift ? DriftSeverity.MEDIUM : DriftSeverity.LOW,
        boundingBox: isDrift ? [200, 300, 500, 600] : undefined
    };
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    // 2. Prepare Live Frame
    const cleanFrame = liveFrameBase64.replace(/^data:image\/\w+;base64,/, "");
    
    // 3. Prepare Prompt Parts
    const parts: any[] = [
        { 
            text: `You are 'EntropyGuard', an industrial compliance AI. 
            
            TASK: Compare the REFERENCE MATERIAL provided against the REALITY (Live Video Frame).
            
            1. Analyze the Reference (Image/PDF/Text) to understand the expected state (schematic, wiring diagram, or instruction).
            2. Analyze the Live Frame.
            3. Identify discrepancies. 
               - If wires are wrong color? DRIFT.
               - If part is missing? DRIFT.
               - If everything looks correct? MATCH.
            4. If DRIFT, provide a bounding box [ymin, xmin, ymax, xmax] (0-1000 scale) around the specific problem area in the LIVE FRAME.
            5. Provide a concise, HUD-style status message (e.g., "ERR: Red wire connected to Port B. Expected Blue.").` 
        },
        {
            inlineData: {
                data: cleanFrame,
                mimeType: "image/jpeg"
            }
        }
    ];

    // 4. Add Reference Content
    if (reference.type === 'TEXT') {
        parts.push({ text: `REFERENCE MANUAL: ${reference.content}` });
    } else {
        // Handle Image or PDF base64
        const cleanRef = reference.content.replace(/^data:.+;base64,/, "");
        parts.push({
            inlineData: {
                data: cleanRef,
                mimeType: reference.mimeType || "image/jpeg"
            }
        });
        parts.push({ text: "REFERENCE SCHEMATIC/DOCUMENT (Above)" });
    }

    // 5. Define Output Schema
    const schema: SchemaParams = {
        type: Type.OBJECT,
        properties: {
            status: { type: Type.STRING, enum: ["MATCH", "DRIFT"] },
            severity: { type: Type.STRING, enum: ["LOW", "MEDIUM", "CRITICAL"] },
            message: { type: Type.STRING },
            boundingBox: { 
                type: Type.ARRAY, 
                items: { type: Type.INTEGER },
                description: "The bounding box [ymin, xmin, ymax, xmax] of the anomaly."
            }
        },
        required: ["status", "severity", "message"]
    };

    // 6. Execute Call
    const response = await ai.models.generateContent({
        model: "gemini-3-pro-preview",
        contents: { parts },
        config: {
            responseMimeType: "application/json",
            responseSchema: schema
        }
    });

    if (response.text) {
        const data = JSON.parse(response.text);
        return {
            ...data,
            timestamp: new Date().toLocaleTimeString()
        };
    }

    throw new Error("No response from AI");

  } catch (error) {
    console.error("Entropy Check Failed:", error);
    return {
        status: ComplianceStatus.DRIFT,
        severity: DriftSeverity.CRITICAL,
        message: "CONNECTION LOST: Unable to verify state.",
        timestamp: new Date().toLocaleTimeString()
    };
  }
};
