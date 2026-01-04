
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { TranslationResult } from "../types";
import { decode } from "../utils/audioUtils";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const analyzeAndTranslate = async (imageBase64: string): Promise<TranslationResult> => {
  const model = "gemini-3-flash-preview";
  
  const prompt = `
    Perform the following tasks on the provided image:
    1. IMAGE TO TEXT (OCR): Extract all readable English text. Ignore logos and watermarks.
    2. TRANSLATION: If text is English, translate it into natural, fluent, conversational Telugu. 
       If the text is already Telugu, keep it as is.
    3. Ensure the Telugu translation is spoken/conversational and not overly formal.
    
    Return the result strictly in JSON format.
  `;

  const response = await ai.models.generateContent({
    model,
    contents: {
      parts: [
        { inlineData: { mimeType: "image/jpeg", data: imageBase64 } },
        { text: prompt }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          englishText: { type: Type.STRING, description: "The extracted English text" },
          teluguText: { type: Type.STRING, description: "The translated Telugu text" }
        },
        required: ["englishText", "teluguText"]
      }
    }
  });

  try {
    const data = JSON.parse(response.text || '{}');
    return data as TranslationResult;
  } catch (e) {
    throw new Error("Failed to parse AI response. Please try again with a clearer image.");
  }
};

export const generateTeluguAudio = async (text: string): Promise<Uint8Array> => {
  const model = "gemini-2.5-flash-preview-tts";
  
  const response = await ai.models.generateContent({
    model,
    contents: [{ parts: [{ text: `Say clearly in a professional and natural Indian Telugu accent: ${text}` }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' }, // Neutral, pleasant voice
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) {
    throw new Error("No audio data received from Gemini TTS.");
  }

  return decode(base64Audio);
};
