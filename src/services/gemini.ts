
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
    model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
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

// Fallback: Simple pattern matching for obvious scripture references
const detectScripturePattern = (text: string): DetectedContent | null => {
  // Pattern: Book name followed by chapter:verse or chapter verse
  const scripturePattern = /\b(Genesis|Exodus|Leviticus|Numbers|Deuteronomy|Joshua|Judges|Ruth|1 Samuel|2 Samuel|1 Kings|2 Kings|1 Chronicles|2 Chronicles|Ezra|Nehemiah|Esther|Job|Psalms?|Proverbs|Ecclesiastes|Song of Solomon|Isaiah|Jeremiah|Lamentations|Ezekiel|Daniel|Hosea|Joel|Amos|Obadiah|Jonah|Micah|Nahum|Habakkuk|Zephaniah|Haggai|Zechariah|Malachi|Matthew|Mark|Luke|John|Acts|Romans|1 Corinthians|2 Corinthians|Galatians|Ephesians|Philippians|Colossians|1 Thessalonians|2 Thessalonians|1 Timothy|2 Timothy|Titus|Philemon|Hebrews|James|1 Peter|2 Peter|1 John|2 John|3 John|Jude|Revelation)\s+(\d+)[\s:]+(\d+)/i;

  const match = text.match(scripturePattern);
  if (match) {
    const book = match[1];
    const chapter = match[2];
    const verse = match[3];
    const reference = `${book} ${chapter}:${verse}`;
    console.log("[FALLBACK] Pattern matched scripture:", reference);
    return {
      type: 'scripture',
      reference: reference
    };
  }

  return null;
};

export const analyzeText = async (text: string): Promise<DetectedContent | null> => {
  // Try fallback pattern matching first for reliability
  const patternMatch = detectScripturePattern(text);
  if (patternMatch) {
    console.log("[GEMINI] Using pattern-matched result instead of AI");
    return patternMatch;
  }

  const modelInstance = getModel();
  if (!modelInstance) {
    console.error("[GEMINI] Model not initialized - check API key");
    return null;
  }

  try {
    const prompt = `You are analyzing church audio. Classify the input into one of these categories:

INPUT: "${text}"

RULES:
1. SCRIPTURE: If you detect a Bible reference (like "John 3:16", "Psalm 23", "Romans 8:28") OR a direct Bible quote
   Return: { "type": "scripture", "reference": "Book Chapter:Verse" }
   DO NOT include "content" - we will fetch it separately
   
2. LYRICS: If you detect song/worship lyrics (poetic, repetitive, praise language)
   Return: { "type": "lyrics", "content": "the exact lyrics" }
   
3. NOISE: If it's preaching, teaching, casual talk, or announcements
   Return: { "type": "noise" }

CRITICAL: Return ONLY valid JSON. No markdown, no explanation, no extra text.

Examples:
- "Turn to John chapter 3 verse 16" → {"type":"scripture","reference":"John 3:16"}
- "Amazing grace how sweet the sound" → {"type":"lyrics","content":"Amazing grace how sweet the sound"}
- "Good morning everyone, let's begin" → {"type":"noise"}`;

    console.log("[GEMINI] Sending prompt for text:", text.substring(0, 50));

    const result = await modelInstance.generateContent(prompt);

    if (!result) {
      console.error("[GEMINI] generateContent returned null/undefined");
      return null;
    }

    const response = await result.response;

    if (!response) {
      console.error("[GEMINI] response is null/undefined");
      return null;
    }

    const textOutput = response.text().replace(/```json|```/g, '').trim();
    console.log("[GEMINI] Raw output:", textOutput);

    if (!textOutput) {
      console.error("[GEMINI] Empty response text");
      return null;
    }

    try {
      // Robust JSON extraction
      const start = textOutput.indexOf('{');
      const end = textOutput.lastIndexOf('}');

      if (start === -1 || end === -1 || end <= start) {
        console.error("[GEMINI] No valid JSON found in output:", textOutput);
        return null;
      }

      const jsonStr = textOutput.substring(start, end + 1);
      const json = JSON.parse(jsonStr);

      console.log("[GEMINI] Parsed JSON:", json);

      // Validate the response structure
      if (!json.type) {
        console.error("[GEMINI] Response missing 'type' field:", json);
        return null;
      }

      if (json.type === 'noise') {
        console.log("[GEMINI] Classified as noise");
        return null;
      }

      if (json.type === 'scripture' && !json.reference) {
        console.error("[GEMINI] Scripture response missing 'reference' field:", json);
        return null;
      }

      if (json.type === 'lyrics' && !json.content) {
        console.error("[GEMINI] Lyrics response missing 'content' field:", json);
        return null;
      }

      return json;

    } catch (parseError) {
      console.error("[GEMINI] JSON parse error:", parseError);
      console.error("[GEMINI] Failed to parse:", textOutput);
      return null;
    }

  } catch (error: any) {
    console.error("[GEMINI] API Error:", error);
    console.error("[GEMINI] Error details:", {
      message: error.message,
      name: error.name,
      stack: error.stack
    });
    return null;
  }
};
