
import { GoogleGenAI } from "@google/genai";

// Inline interface to avoid import issues
export interface AnalysisResult {
  isAiGenerated: boolean;
  confidenceScore: number;
  verdict: 'Human' | 'AI' | 'Mixed/Uncertain';
  reasoning: string;
  indicators: string[];
  sources?: Array<{ uri: string; title: string }>;
}

let ai: GoogleGenAI | null = null;

const getAiClient = () => {
  if (!ai) {
    // Access process safely via global definition if needed, though usually injected
    const apiKey = process.env.API_KEY;
    if (!apiKey) console.warn("API_KEY not found in process.env");
    ai = new GoogleGenAI({ apiKey: apiKey || '' });
  }
  return ai;
};

// Schema definition
const analysisSchema = {
  type: 'OBJECT',
  properties: {
    isAiGenerated: { type: 'BOOLEAN' },
    confidenceScore: { type: 'INTEGER' },
    verdict: { type: 'STRING', enum: ["Human", "AI", "Mixed/Uncertain"] },
    reasoning: { type: 'STRING' },
    indicators: { type: 'ARRAY', items: { type: 'STRING' } },
  },
  required: ["isAiGenerated", "confidenceScore", "verdict", "reasoning", "indicators"],
};

const SYSTEM_INSTRUCTION = `
Eres un experto forense digital y analista de IA. Tu trabajo es detectar contenido generado o manipulado por Inteligencia Artificial.
Analiza el input críticamente. Busca inconsistencias lógicas, visuales o de sintaxis.
IMPORTANTE: Tu respuesta debe ser SIEMPRE un objeto JSON válido. No incluyas texto conversacional fuera del JSON.
`;

export const analyzeUrl = async (url: string): Promise<AnalysisResult> => {
  try {
    const aiClient = getAiClient();
    const response = await aiClient.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `Analiza este enlace: ${url}. Usa Google Search para verificar si el contenido es real o generado por IA.
      RESPONDE ÚNICAMENTE CON UN JSON VÁLIDO.
      Formato esperado:
      {
        "isAiGenerated": boolean,
        "confidenceScore": number,
        "verdict": "Human" | "AI" | "Mixed/Uncertain",
        "reasoning": "string",
        "indicators": ["string"]
      }`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{ googleSearch: {} }],
      },
    });

    let jsonText = response.text || "{}";
    
    // Clean up markdown code blocks
    jsonText = jsonText.replace(/```json/g, '').replace(/```/g, '');

    // Extract JSON object if surrounded by text
    const firstBrace = jsonText.indexOf('{');
    const lastBrace = jsonText.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      jsonText = jsonText.substring(firstBrace, lastBrace + 1);
    }

    const result = JSON.parse(jsonText) as AnalysisResult;
    
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (groundingChunks) {
        result.sources = groundingChunks
            .map(chunk => chunk.web)
            .filter(web => web !== undefined)
            .map(web => ({ uri: web!.uri!, title: web!.title || 'Fuente' }));
    }
    return result;
  } catch (error) {
    console.error("Error analyzing URL:", error);
    // Return a fallback result instead of crashing
    return {
      isAiGenerated: false,
      confidenceScore: 0,
      verdict: 'Mixed/Uncertain',
      reasoning: "No se pudo analizar el enlace correctamente. Es posible que el contenido sea inaccesible o la respuesta del modelo no fue válida.",
      indicators: ["Error de análisis"]
    };
  }
};

export const analyzeText = async (text: string): Promise<AnalysisResult> => {
  try {
    const aiClient = getAiClient();
    const response = await aiClient.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Analiza este texto por patrones de IA:\n"${text}"`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
      },
    });
    return JSON.parse(response.text || "{}") as AnalysisResult;
  } catch (error) {
    console.error(error);
    throw new Error("Error al analizar texto.");
  }
};

export const analyzeImage = async (base64Data: string, mimeType: string): Promise<AnalysisResult> => {
  try {
    const aiClient = getAiClient();
    const response = await aiClient.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: {
        parts: [
          { inlineData: { mimeType, data: base64Data } },
          { text: "Analiza esta imagen píxel por píxel. ¿Es generada por IA?" },
        ],
      },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
      },
    });
    return JSON.parse(response.text || "{}") as AnalysisResult;
  } catch (error) {
    console.error(error);
    throw new Error("Error al analizar imagen.");
  }
};

export const analyzeVideo = async (base64Data: string, mimeType: string): Promise<AnalysisResult> => {
  try {
    const aiClient = getAiClient();
    const response = await aiClient.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: {
        parts: [
          { inlineData: { mimeType, data: base64Data } },
          { text: "Analiza este video por inconsistencias temporales o visuales de IA." },
        ],
      },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
      },
    });
    return JSON.parse(response.text || "{}") as AnalysisResult;
  } catch (error) {
    console.error(error);
    throw new Error("Error al analizar video.");
  }
};
