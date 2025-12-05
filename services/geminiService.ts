import { GoogleGenAI } from "@google/genai";
import { blobToBase64 } from "../utils";

const MODEL_NAME = 'gemini-2.5-flash';

export const transcribeAndTranslateToBurmese = async (audioBlob: Blob): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const base64Audio = await blobToBase64(audioBlob);
    
    // Determine mimeType based on blob, default to audio/webm if undefined
    const mimeType = audioBlob.type || 'audio/webm';

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Audio
            }
          },
          {
            text: `
              You are an expert transcriber and translator for the Burmese language.
              
              Task:
              1. Listen to the provided audio.
              2. If the audio is in Burmese, transcribe it exactly, correcting only minor grammatical errors to make it suitable for a formal essay.
              3. If the audio is in another language (like English), translate it accurately into formal, essay-quality Burmese.
              4. Ensure the tone is academic, respectful, and coherent.
              5. Output ONLY the Burmese text. Do not include any introductory or concluding remarks in English or other languages.
            `
          }
        ]
      }
    });

    return response.text || "No text generated.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to process audio. Please try again.");
  }
};
