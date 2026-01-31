
import { GoogleGenAI } from "@google/genai";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const getSearchGroundedResponse = async (prompt: string) => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
    },
  });

  const text = response.text || "I'm sorry, I couldn't generate a response.";
  const sources: any[] = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  
  return {
    text,
    sources: sources.map(s => ({
      title: s.web?.title,
      uri: s.web?.uri
    })).filter(s => s.uri)
  };
};

export const analyzeImage = async (imageB64: string, prompt: string) => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: {
      parts: [
        { inlineData: { mimeType: 'image/jpeg', data: imageB64 } },
        { text: prompt }
      ]
    }
  });
  return response.text || "Failed to analyze image.";
};
