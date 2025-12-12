import { GoogleGenAI, Type, SchemaParams } from "@google/genai";
import { jsPDF } from "jspdf";
import { ComplianceResponse, ComplianceStatus, DriftSeverity, SOPStep, PreFlightResult, Language, TranslationOverlay, ToolVerificationResult, HazardZone, MasterSOPStep, PPEResponse, AuditLogEntry, ARVoiceCommand } from "../types";

// Mock response for when no API key is provided or for testing
const MOCK_RESPONSE_DRIFT: ComplianceResponse = {
  status: ComplianceStatus.DRIFT,
  drift_severity: DriftSeverity.CRITICAL,
  coordinates: [200, 300, 400, 300], // Example box in middle
  correction_voice: "Entropy Detected. Critical misalignment in sector 4. Reset component immediately."
};

const MOCK_RESPONSE_MATCH: ComplianceResponse = {
  status: ComplianceStatus.MATCH,
  drift_severity: DriftSeverity.LOW,
  coordinates: [100, 100, 800, 800], // Full frame safe
  correction_voice: "System Stable. Entropy within nominal limits."
};

export const checkPPE = async (apiKey: string, imageBase64: string): Promise<PPEResponse> => {
    if (!apiKey) {
        await new Promise(r => setTimeout(r, 1500));
        return { compliant: false, missing_items: ["Safety Glasses"], message: "ACCESS DENIED. Missing Safety Glasses." };
    }

    try {
        const ai = new GoogleGenAI({ apiKey });
        const cleanFrame = imageBase64.replace(/^data:image\/\w+;base64,/, "");

        const response = await ai.models.generateContent({
            model: "gemini-3-pro-preview",
            contents: {
                parts: [
                    { text: "ACT AS: OSHA Safety Inspector. \nTASK: Analyze this image of a worker. \nCHECKLIST: \n1. Safety Glasses / Eye Protection? \n2. High-Visibility Vest or Lab Coat or Safety Uniform? \n\nOUTPUT JSON: { \"compliant\": bool, \"missing_items\": [\"item1\", \"item2\"], \"message\": \"Short status message\" }" },
                    { inlineData: { mimeType: "image/jpeg", data: cleanFrame } }
                ]
            },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        compliant: { type: Type.BOOLEAN },
                        missing_items: { type: Type.ARRAY, items: { type: Type.STRING } },
                        message: { type: Type.STRING }
                    },
                    required: ["compliant", "missing_items", "message"]
                }
            }
        });

        if (response.text) return JSON.parse(response.text);
        throw new Error("PPE Check Failed");
    } catch (e) {
        console.error("PPE Check Error", e);
        return { compliant: false, missing_items: ["AI Error"], message: "Compliance service unavailable." };
    }
};

export const generateIncidentReport = (logEntry: AuditLogEntry, screenshotBase64: string): string => {
    // Generates a PDF and returns the Blob URL
    try {
        const doc = new jsPDF();
        const date = new Date().toLocaleString();

        // Header
        doc.setFont("helvetica", "bold");
        doc.setFontSize(22);
        doc.setTextColor(220, 38, 38); // Red
        doc.text("ENTROPYGUARD // INCIDENT REPORT", 10, 20);

        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.setFont("courier", "normal");
        doc.text(`REPORT ID: ${logEntry.id}`, 10, 35);
        doc.text(`TIMESTAMP: ${date}`, 10, 42);
        doc.text(`SEVERITY: ${logEntry.severity}`, 10, 49);

        // Evidence Image
        if (screenshotBase64) {
            doc.addImage(screenshotBase64, "JPEG", 10, 60, 100, 75); // x, y, w, h
        }

        // Analysis
        doc.setFont("helvetica", "bold");
        doc.text("AI FORENSIC ANALYSIS:", 10, 150);
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
        const splitText = doc.splitTextToSize(logEntry.reasoning, 180);
        doc.text(splitText, 10, 160);

        // Footer
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text("Generated automatically by EntropyGuard Neural Safety Core.", 10, 280);

        const blob = doc.output("blob");
        return URL.createObjectURL(blob);
    } catch (e) {
        console.error("PDF Generation Failed", e);
        return "#";
    }
};

export const generateSchematic = async (apiKey: string): Promise<string> => {
  // Fallback if no key (though UI should prevent this usually, or we use a mock placeholder)
  if (!apiKey) {
    console.warn("No API Key provided. Returning mock schematic.");
    await new Promise(r => setTimeout(r, 1500)); 
    // Return a placeholder for demo purposes if no key
    return "https://placehold.co/1024x1024/0f172a/4ade80?text=SYNTHETIC+SCHEMATIC+PREVIEW";
  }

  const ai = new GoogleGenAI({ apiKey });
  
  try {
    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: 'High-tech industrial blueprint schematic of a complex mechanical engine part, white and cyan technical lines on a dark slate blue background, orthographic view, detailed engineering annotations, vector style, high contrast.',
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/jpeg',
        aspectRatio: '1:1',
      },
    });

    const base64EncodeString = response.generatedImages?.[0]?.image?.imageBytes;
    if (!base64EncodeString) throw new Error("No image generated");

    return `data:image/jpeg;base64,${base64EncodeString}`;
  } catch (error) {
    console.error("Imagen Generation Failed:", error);
    throw error;
  }
};

export const digitizeSOP = async (apiKey: string, referenceBase64: string): Promise<SOPStep[]> => {
    if (!apiKey) {
        // Mock data
        return [
            { id: 1, text: "Verify power unit is disconnected.", completed: false },
            { id: 2, text: "Inspect hydraulic lines for fissures.", completed: false },
            { id: 3, text: "Check fluid levels in primary reservoir.", completed: false },
            { id: 4, text: "Confirm emergency stop mechanism is active.", completed: false },
        ];
    }

    try {
        const ai = new GoogleGenAI({ apiKey });
        // Clean base64
        const matches = referenceBase64.match(/^data:(.+);base64,(.+)$/);
        
        const parts: any[] = [{ text: "Analyze this technical document or schematic. Extract a precise, sequential safety checklist or standard operating procedure (SOP). Return a simple JSON array of strings, one for each step. Keep steps concise (under 10 words)." }];
        
        if (matches) {
            parts.push({
                inlineData: {
                    mimeType: matches[1],
                    data: matches[2]
                }
            });
        } else {
            // Handle as text prompt if not base64 (e.g. URL reference)
            parts.push({ text: `Reference Context: ${referenceBase64}` });
        }

        const response = await ai.models.generateContent({
            model: "gemini-3-pro-preview",
            contents: { parts },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                }
            }
        });

        if (response.text) {
            const steps: string[] = JSON.parse(response.text);
            return steps.map((text, idx) => ({
                id: idx + 1,
                text: text,
                completed: false
            }));
        }
        throw new Error("No text returned");
    } catch (error) {
        console.error("SOP Digitization Failed", error);
        return [{ id: 1, text: "Error digitizing SOP. Manual check required.", completed: false }];
    }
};

export const processYoutubeVideo = async (apiKey: string, url: string): Promise<{ title: string, thumbnail: string, steps: SOPStep[] }> => {
    const videoIdMatch = url.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    const videoId = videoIdMatch ? videoIdMatch[1] : null;

    if (!videoId) throw new Error("Invalid YouTube URL");

    // Standard high-quality thumbnail
    const thumbnail = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    
    // Attempt to fetch real title via oEmbed (NoEmbed service)
    let title = "External Video Protocol";
    try {
        const oembedRes = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`);
        const oembedData = await oembedRes.json();
        if (oembedData.title) title = oembedData.title;
    } catch (e) {
        console.warn("Metadata fetch failed", e);
    }

    if (!apiKey) {
         return {
             title,
             thumbnail,
             steps: [
                 { id: 1, text: `Review: ${title.substring(0, 20)}...`, completed: false, timestamp: 15, tools: [] },
                 { id: 2, text: "Verify equipment setup", completed: false, timestamp: 45, tools: ["Scanner"] },
                 { id: 3, text: "Execute procedure sequence", completed: false, timestamp: 120, tools: ["Wrench"] }
             ]
         };
    }

    try {
        const ai = new GoogleGenAI({ apiKey });
        // Generate steps based on the context of the title
        const response = await ai.models.generateContent({
             model: "gemini-3-pro-preview", 
             contents: {
                 parts: [{ text: `Context: An industrial training video titled "${title}". 
                 Task: Break this procedure down into discrete, logical 'Action Steps'. 
                 For each step, extract:
                 1. The 'Golden Frame' timestamp (seconds from start) where the step is completed.
                 2. A concise instruction text (max 10 words).
                 3. A list of tools used.
                 
                 Output: A JSON array of step objects.` }]
             },
             config: { 
                 responseMimeType: "application/json",
                 responseSchema: {
                     type: Type.ARRAY,
                     items: { 
                         type: Type.OBJECT,
                         properties: {
                             text: { type: Type.STRING },
                             timestamp: { type: Type.INTEGER, description: "Seconds from start" },
                             tools: { type: Type.ARRAY, items: { type: Type.STRING }}
                         }
                     }
                 }
             }
        });
        
        const rawSteps: any[] = response.text ? JSON.parse(response.text) : [];
        return {
            title,
            thumbnail,
            steps: rawSteps.map((s, i) => ({ 
                id: i + 1, 
                text: s.text || "Step Details", 
                completed: false,
                timestamp: s.timestamp || ((i + 1) * 30),
                tools: s.tools || []
            }))
        };

    } catch (e) {
        return {
             title,
             thumbnail,
             steps: []
        };
    }
};

export const performPreFlightCheck = async (
    apiKey: string, 
    currentFrameBase64: string, 
    referenceDataBase64: string
): Promise<PreFlightResult> => {
    if (!apiKey) {
        await new Promise(r => setTimeout(r, 2000));
        return { 
            status: 'PASS', 
            missing_items: [], 
            detected_items: ["Wrench", "Circuit Board", "Multimeter"],
            hazards: [{ label: "High Voltage", boundingBox: [100, 600, 300, 900] }]
        };
    }

    try {
        const ai = new GoogleGenAI({ apiKey });
        const cleanFrame = currentFrameBase64.replace(/^data:image\/\w+;base64,/, "");
        const refMatches = referenceDataBase64.match(/^data:(.+);base64,(.+)$/);
        
        const parts: any[] = [
             { text: "ROLE: Industrial Safety & Inventory Controller. \nTASK: 1. Analyze the Reference Image for required tools. 2. Analyze Current Frame. 3. Identify missing items. 4. IDENTIFY HAZARDOUS ZONES (e.g. High Voltage, Heat, Rotating Parts) in the Current Frame and return their bounding boxes (0-1000 scale). \nOUTPUT: JSON." },
             { inlineData: { data: cleanFrame, mimeType: "image/jpeg" } }
        ];

        if (refMatches) {
            parts.push({ inlineData: { mimeType: refMatches[1], data: refMatches[2] } });
            parts.push({ text: "Reference Schematic" });
        }

        const response = await ai.models.generateContent({
            model: "gemini-3-pro-preview",
            contents: { parts },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        status: { type: Type.STRING, enum: ["PASS", "FAIL"] },
                        missing_items: { type: Type.ARRAY, items: { type: Type.STRING } },
                        detected_items: { type: Type.ARRAY, items: { type: Type.STRING } },
                        hazards: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    label: { type: Type.STRING },
                                    boundingBox: { type: Type.ARRAY, items: { type: Type.INTEGER } }
                                }
                            }
                        }
                    }
                }
            }
        });

        if (response.text) return JSON.parse(response.text) as PreFlightResult;
        throw new Error("No Pre-Flight response");

    } catch (e) {
        console.error("Pre-Flight Failed", e);
        return { status: 'FAIL', missing_items: ["Network Error"], detected_items: [], hazards: [] };
    }
};

export const verifyToolState = async (apiKey: string, imageBase64: string, requirement: string): Promise<ToolVerificationResult> => {
    if (!apiKey) return { status: 'MATCH', instruction: "Tool Verified (Simulated)" };

    try {
        const ai = new GoogleGenAI({ apiKey });
        const cleanFrame = imageBase64.replace(/^data:image\/\w+;base64,/, "");

        const response = await ai.models.generateContent({
            model: "gemini-3-pro-preview",
            contents: {
                parts: [
                    { text: `TASK: Instrument Verifier. \nREQUIREMENT: ${requirement} \nAnalyze the image (zoomed in on tool). Read dials, switches, and screens. \nIf the tool state matches the requirement, return MATCH. \nIf not, return MISMATCH and precise instructions to fix it.` },
                    { inlineData: { mimeType: "image/jpeg", data: cleanFrame } }
                ]
            },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        status: { type: Type.STRING, enum: ["MATCH", "MISMATCH"] },
                        instruction: { type: Type.STRING }
                    }
                }
            }
        });

        if (response.text) return JSON.parse(response.text);
        throw new Error("Tool verification failed");
    } catch (e) {
        console.error(e);
        return { status: 'MISMATCH', instruction: "Verification Failed. Check manually." };
    }
};

export const detectLanguageFromAudio = async (apiKey: string, audioBase64: string): Promise<{code: Language, name: string}> => {
    if (!apiKey) {
        await new Promise(r => setTimeout(r, 1500));
        return { code: 'es', name: "Spanish (Simulated)" };
    }

    try {
        const ai = new GoogleGenAI({ apiKey });
        const cleanAudio = audioBase64.replace(/^data:audio\/\w+;base64,/, "");

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: {
                parts: [
                    { text: "Listen to the audio. Identify the primary language spoken. Return the ISO code (en, es, de, hi, zh, fr, ja) and the English name. If unsure, default to en." },
                    { inlineData: { mimeType: "audio/webm", data: cleanAudio } }
                ]
            },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        code: { type: Type.STRING, enum: ['en', 'es', 'de', 'hi', 'zh', 'fr', 'ja'] },
                        name: { type: Type.STRING }
                    },
                    required: ["code", "name"]
                }
            }
        });
        
        if (response.text) return JSON.parse(response.text);
        throw new Error("No language detected");
    } catch (e) {
        console.error("Language Detection Failed", e);
        return { code: 'en', name: "English (Fallback)" };
    }
};

export const parseARVoiceCommand = async (apiKey: string, audioBase64: string): Promise<ARVoiceCommand> => {
    if (!apiKey) {
        await new Promise(r => setTimeout(r, 1000));
        return 'MOVE_LEFT'; // Simulated result
    }

    try {
        const ai = new GoogleGenAI({ apiKey });
        const cleanAudio = audioBase64.replace(/^data:audio\/\w+;base64,/, "");

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: {
                parts: [
                    { text: "Listen to the audio command for an AR interface. Map it to one of these enums: MOVE_LEFT, MOVE_RIGHT, MOVE_UP, MOVE_DOWN, ROTATE_CW, ROTATE_CCW, SCALE_UP, SCALE_DOWN, RESET. If unclear, return UNKNOWN. Return only the enum string." },
                    { inlineData: { mimeType: "audio/webm", data: cleanAudio } }
                ]
            },
            config: {
                responseMimeType: "text/plain",
            }
        });
        
        const cmd = response.text?.trim() as ARVoiceCommand;
        if (['MOVE_LEFT','MOVE_RIGHT','MOVE_UP','MOVE_DOWN','ROTATE_CW','ROTATE_CCW','SCALE_UP','SCALE_DOWN','RESET'].includes(cmd)) {
            return cmd;
        }
        return 'UNKNOWN';
    } catch (e) {
        console.error("Voice Command Failed", e);
        return 'UNKNOWN';
    }
};

export const performEnvironmentalTranslation = async (apiKey: string, imageBase64: string, targetLang: string): Promise<TranslationOverlay[]> => {
    if (!apiKey || targetLang === 'en' || targetLang === 'auto') return [];

    try {
        const ai = new GoogleGenAI({ apiKey });
        const cleanFrame = imageBase64.replace(/^data:image\/\w+;base64,/, "");

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: {
                parts: [
                    { text: `Identify all visible text labels, signs, or instructions in this image. Translate them to ${targetLang}. Return the translation and the 2D bounding box of the text [ymin, xmin, ymax, xmax] (0-1000 scale).` },
                    { inlineData: { mimeType: "image/jpeg", data: cleanFrame } }
                ]
            },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        items: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    text: { type: Type.STRING },
                                    boundingBox: { type: Type.ARRAY, items: { type: Type.INTEGER } }
                                }
                            }
                        }
                    }
                }
            }
        });

        if (response.text) {
             const data = JSON.parse(response.text);
             return data.items || [];
        }
        return [];
    } catch (e) {
        console.error("Translation Failed", e);
        return [];
    }
};

export const analyzeCompliance = async (
  apiKey: string,
  currentFrameBase64: string, // Base64 string from webcam
  referenceDataBase64: string | null, // Image or PDF
  protocolText: string,
  targetLanguage: Language = 'auto',
  hazardZones: HazardZone[] = []
): Promise<ComplianceResponse> => {

  // Fallback to mock if no API key
  if (!apiKey) {
    console.warn("No API Key provided. Using Simulation Mode.");
    await new Promise(r => setTimeout(r, 1500)); // Simulate network lag
    // Toggle result based on randomness for demo purposes
    return Math.random() > 0.5 ? MOCK_RESPONSE_DRIFT : MOCK_RESPONSE_MATCH;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    // Handle Webcam Frame (Always JPEG)
    const cleanFrame = currentFrameBase64.replace(/^data:image\/\w+;base64,/, "");
    
    // Construct Hazard Context
    let hazardInstruction = "";
    if (hazardZones.length > 0) {
        hazardInstruction = `CRITICAL SAFETY CONTEXT: The following regions are HAZARD ZONES (High Voltage/Danger): ${JSON.stringify(hazardZones)}. 
        Note: The Edge Layer handles rapid spatial violation. The Cognitive Layer (you) should confirm if a safety breach has occurred visually (e.g., hand touching wire).`;
    }

    const parts: any[] = [
        {
            text: `You are the 'Cognitive Reasoning Layer' of a Hybrid AI Industrial System.
            
            Task: Zero-Shot Semantic Anomaly Detection.
            
            1. Analyze 'Current Reality' (Image 1) against 'Reference Standard' (Image 2 or Context).
            2. Perform Visual Question Answering (VQA) to verify compliance with: "${protocolText}".
            3. ${hazardInstruction}
            4. If state matches reference: Status = MATCH.
            5. If deviation/entropy detected: Status = DRIFT. Severity = LOW/MEDIUM/CRITICAL.
            6. Perform OBJECT LOCALIZATION on the Anomaly. Return bounding box [x, y, width, height] of the specific deviation (e.g., the loose wire, the missing bolt). If MATCH, return a safe zone box.
            7. Generate a corrective voice command (max 15 words), translated to: ${targetLanguage === 'auto' ? 'Detected Language' : targetLanguage}.`
        },
        {
            inlineData: {
                data: cleanFrame,
                mimeType: "image/jpeg"
            }
        }
    ];

    // Handle Reference (Image OR PDF)
    if (referenceDataBase64) {
        // Extract MIME type dynamically
        const matches = referenceDataBase64.match(/^data:(.+);base64,(.+)$/);
        if (matches) {
            const mimeType = matches[1];
            const data = matches[2];

            parts.push({
                inlineData: {
                    data: data,
                    mimeType: mimeType
                }
            });
            parts.push({ text: "Reference Standard (Vector Retrieval Context)" });
        } else {
             // Handle case where reference is a URL (e.g. YouTube thumbnail) or raw text
             parts.push({ text: `Reference Context URI: ${referenceDataBase64}. RAG Mode Active.`});
        }
    }

    const responseSchema: SchemaParams = {
        type: Type.OBJECT,
        properties: {
            status: { type: Type.STRING, enum: ["MATCH", "DRIFT"] },
            drift_severity: { type: Type.STRING, enum: ["LOW", "MEDIUM", "CRITICAL"] },
            coordinates: { 
                type: Type.ARRAY, 
                items: { type: Type.INTEGER },
                description: "Bounding box [x, y, width, height] of the ANOMALY or FOCUS AREA on a 0-1000 scale." 
            },
            correction_voice: { type: Type.STRING }
        },
        required: ["status", "drift_severity", "coordinates", "correction_voice"]
    };

    const result = await ai.models.generateContent({
        model: "gemini-3-pro-preview",
        contents: {
            parts: parts
        },
        config: {
            responseMimeType: "application/json",
            responseSchema: responseSchema,
            systemInstruction: "You are a multimodal industrial reasoning engine."
        }
    });

    if (result.text) {
        return JSON.parse(result.text) as ComplianceResponse;
    }

    throw new Error("Empty response from Gemini");

  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    // Fallback to mock on error to keep app usable in demo
    return MOCK_RESPONSE_DRIFT;
  }
};

export const generateSOPFromFrames = async (apiKey: string, frames: string[]): Promise<MasterSOPStep[]> => {
    if (!apiKey) {
        await new Promise(r => setTimeout(r, 2000));
        // Return dummy SOP
        return [
            { id: 1, text: "Grip the component firmly by the chassis.", completed: false, frameData: frames[0] },
            { id: 2, text: "Rotate 90 degrees clockwise to align ports.", completed: false, frameData: frames[frames.length - 1] }
        ];
    }

    try {
        const ai = new GoogleGenAI({ apiKey });
        const parts: any[] = [{ text: "Watch this sequence of frames showing an expert technician performing a task. \nTask: Reverse Engineer this into a Standard Operating Procedure (SOP). \nOutput: A JSON list of steps. For each step, provide a short instruction text, and the integer 'index' of the frame (0-based) that best visualizes this step." }];

        // Add up to 15 frames max to avoid payload limits
        const sampledFrames = frames.filter((_, i) => i % Math.ceil(frames.length / 15) === 0);
        
        sampledFrames.forEach((frame, i) => {
            const clean = frame.replace(/^data:image\/\w+;base64,/, "");
            parts.push({ inlineData: { mimeType: "image/jpeg", data: clean } });
        });

        const response = await ai.models.generateContent({
            model: "gemini-3-pro-preview",
            contents: { parts },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            text: { type: Type.STRING },
                            index: { type: Type.INTEGER }
                        }
                    }
                }
            }
        });

        if (response.text) {
            const rawSteps = JSON.parse(response.text);
            return rawSteps.map((s: any, i: number) => ({
                id: i + 1,
                text: s.text,
                completed: false,
                frameData: sampledFrames[Math.min(s.index, sampledFrames.length - 1)]
            }));
        }
        throw new Error("SOP Generation Failed");
    } catch (e) {
        console.error(e);
        return [];
    }
};

export const estimateWasteImpact = async (apiKey: string, protocolText: string): Promise<number> => {
    // Returns grams saved
    if (!apiKey) return Math.floor(Math.random() * 500) + 50;

    try {
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Based on this protocol: "${protocolText}", identify the primary physical component being worked on. Estimate the weight of this component in GRAMS. If it was damaged or ruined during this process (e-waste), what is the weight of waste? Return ONLY the integer number of grams.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: { type: Type.INTEGER }
            }
        });
        
        if (response.text) return parseInt(response.text);
        return 100;
    } catch (e) {
        return 100;
    }
};