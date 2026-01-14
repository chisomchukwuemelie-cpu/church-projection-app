
import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

let genAI: GoogleGenerativeAI | null = null;
let model: any = null;

const getModel = () => {
  if (model) return model;
  if (!API_KEY) {
    console.warn("Gemini API Key missing");
    return null;
  }
  try {
    genAI = new GoogleGenerativeAI(API_KEY);
    model = genAI.getGenerativeModel({ model: "gemini-pro" });
    return model;
  } catch (error) {
    console.error("Error initializing Gemini:", error);
    return null;
  }
};


export type DetectedContent = {
  type: 'scripture' | 'lyrics' | 'noise';
  content?: string;
  reference?: string; // For scriptures (e.g., "John 3:16")
};

export const analyzeText = async (text: string): Promise<DetectedContent | null> => {
  const modelInstance = getModel();
  if (!modelInstance) {
    return null;
  }

  try {
    const prompt = `
      You are an AI assistant for a church projection system. Analyze the spoken text.
      Return a JSON object with the following structure based on the content:

      1. **Scripture**: If it contains a Bible verse citation or quote.
         { "type": "scripture", "reference": "Book Chapter:Verse", "content": "The verse text..." }
      
      2. **Lyrics**: If it looks like song lyrics.
         { "type": "lyrics", "content": "Line 1\nLine 2..." }
      
      3. **Noise**: Casual speech, preaching, or irrelevant text.
         { "type": "noise" }

      Input text: "${text}"
      
      RETURN ONLY THE JSON OBJECT. No markdown.
    `;

    const result = await modelInstance.generateContent(prompt);
    const response = await result.response;
    const textOutput = response.text().replace(/```json|```/g, '').trim();

    try {
      const json = JSON.parse(textOutput);
      if (json.type === 'noise') return null;
      return json;
    } catch (e) {
      console.error("Failed to parse Gemini JSON:", textOutput);
      return null;
    }

  } catch (error) {
    console.error("Gemini detection error:", error);
    return null;
  }
};

