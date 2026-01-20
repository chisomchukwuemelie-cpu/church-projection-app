
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

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
    model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.1,
        topP: 0.95,
        topK: 64,
        maxOutputTokens: 1024,
      },
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      ]
    });
    return model;
  } catch (error) {
    console.error("Error initializing Gemini:", error);
    return null;
  }
};


export type DetectedContent = {
  type: 'scripture' | 'lyrics' | 'noise' | 'quote' | 'command';
  content?: string;
  reference?: string; // For scriptures
  translation?: string; // e.g., KJV, NIV, AMP
  title?: string;     // For custom labels
  command?: 'SHOW_LOGO' | 'CLEAR_SCREEN' | 'SET_THEME';
  visual?: string; // "mountains", "blue", "stars", "particles"
};

// Deterministic Regex for standard scripture references (e.g., "John 3:16", "1 John 1:1")
const BIBLE_BOOKS = [
  "genesis", "exodus", "leviticus", "numbers", "deuteronomy", "joshua", "judges", "ruth", "1 samuel", "2 samuel", "1 kings", "2 kings", "1 chronicles", "2 chronicles", "ezra", "nehemiah", "esther", "job", "psalms", "psalm", "proverbs", "ecclesiastes", "song of solomon", "isaiah", "jeremiah", "lamentations", "ezekiel", "daniel", "hosea", "joel", "amos", "obadiah", "jonah", "micah", "nahum", "habakkuk", "zephaniah", "haggai", "zechariah", "malachi", "matthew", "mark", "luke", "john", "acts", "romans", "1 corinthians", "2 corinthians", "galatians", "ephesians", "philippians", "colossians", "1 thessalonians", "2 thessalonians", "1 timothy", "2 timothy", "titus", "philemon", "hebrews", "james", "1 peter", "2 peter", "1 john", "2 john", "3 john", "jude", "revelation"
];

// Enhanced Regex to capture "Book Chapter:Verse [Connector] [Translation]"
// Handles: "John 3:16", "John 3:16 NIV", "John Chapter 3 Verse 16", "Read John 3:16 please"
// Remove ^ and $ anchors to allow partial matching within sentences
const SCRIPTURE_REGEX = /(\d?\s?[a-zA-Z]+)\s+(?:chapter\s+)?(\d+)[:\s](\d+)(?:\s+(?:in|from|read|version|the|of)*\s*([a-zA-Z\s]+))?/i;

const TRANSLATION_MAP: Record<string, string> = {
  "niv": "NIV",
  "kjv": "KJV",
  "nkjv": "NKJV",
  "esv": "ESV",
  "nlt": "NLT",
  "amp": "AMP",
  "amplified": "AMP",
  "msg": "MSG",
  "message": "MSG",
  "web": "WEB",
  "new international": "NIV",
  "king james": "KJV",
  "new king james": "NKJV",
  "standard": "ESV",
  "reading": "NIV",
  "tpt": "TPT"
};

export const analyzeText = async (text: string): Promise<DetectedContent | null> => {
  if (!text) return null;
  const cleanText = text.trim();

  // 0. DETERMINISTIC PRE-CHECK (Fast & Reliable)
  const match = cleanText.match(SCRIPTURE_REGEX);

  // Specific check for translation in the whole string if regex missed it (e.g. "John 3:16 in NIV")
  let detectedTranslation = undefined;
  for (const [key, value] of Object.entries(TRANSLATION_MAP)) {
    // match whole word only
    if (new RegExp(`\\b${key}\\b`, 'i').test(text)) {
      detectedTranslation = value;
      break;
    }
  }

  if (match) {
    const bookCandidate = match[1].toLowerCase();
    const chapter = match[2];
    const verse = match[3];
    // If regex captured a suffix, try to map it too if global check failed
    if (match[4] && !detectedTranslation) {
      const potentialTrans = match[4].toLowerCase().trim();
      for (const [key, value] of Object.entries(TRANSLATION_MAP)) {
        if (potentialTrans.includes(key)) {
          detectedTranslation = value;
          break;
        }
      }
      // If it's a short 3-4 letter code, assume it's a translation (e.g. "TPT")
      if (!detectedTranslation && potentialTrans.length <= 4) {
        detectedTranslation = potentialTrans.toUpperCase();
      }
    }

    const validBook = BIBLE_BOOKS.find(b => bookCandidate.includes(b) || b.includes(bookCandidate));

    if (validBook) {
      console.log(`[GEMINI] Regex Hit: ${validBook} ${chapter}:${verse} (${detectedTranslation || 'Def'})`);
      return {
        type: 'scripture',
        reference: `${match[1]} ${chapter}:${verse}`,
        translation: detectedTranslation
      };
    }
  }

  // 1. AI FALLBACK
  const modelInstance = getModel();
  if (!modelInstance) return null;

  try {
    const prompt = `You are a church projection assistant. Your ONLY job is to extract Bible references, song lyrics, or commands from the transcript.
    
    TRANSCRIPT: "${cleanText}"
    
    INSTRUCTIONS:
    1. **SCRIPTURE**: Look for Book Chapter:Verse patterns (e.g., "John 3:16", "Genesis 1:1").
       - ALSO extract the translation if mentioned (e.g. "read from NLT", "NKJV version").
       - Normalize to "Book Chapter:Verse".
       - If user says "Romans Chapter 8", assume Verse 1 if missing.
    2. **LYRICS**: If the text sounds like a song line, classify as 'lyrics'.
    2. **LYRICS**: If the text sounds like a song line, classify as 'lyrics'.
    3. **COMMANDS**: 
       - "Clear screen", "Show logo", "Blackout" -> 'command'.
       - "Background mountains", "Change theme to blue", "Set visual to stars" -> 'command': "SET_THEME", 'visual': "mountains/blue/stars".
    4. **NOISE**: Only return 'noise' if the input matches NOTHING above.
    
    OUTPUT FORMAT (JSON ONLY):
    {
      "type": "scripture" | "lyrics" | "command" | "noise",
      "reference": "John 3:16",
      "translation": "KJV",
      "content": "Song lyrics here",
      "command": "SHOW_LOGO" | "CLEAR_SCREEN" | "SET_THEME",
      "visual": "mountains"
    }
    
    IMPORTANT:
    - BE AGGRESSIVE with Scripture detection.
    - Respond with RAW JSON only.`;

    console.log("[GEMINI] Analyzing:", cleanText);

    let result = null;
    let attempts = 0;
    while (attempts < 2) {
      try {
        result = await modelInstance.generateContent(prompt);
        if (result && result.response) break;
      } catch (e: any) {
        attempts++;
        if (attempts >= 2) break;
        await new Promise(r => setTimeout(r, 500));
      }
    }

    if (!result || !result.response) return { type: 'noise' };

    try {
      const textOutput = result.response.text();
      console.log("[GEMINI] RAW RESPONSE:", textOutput);

      const jsonMatch = textOutput.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.warn("[GEMINI] No JSON found in response");
        return { type: 'noise' };
      }

      const json = JSON.parse(jsonMatch[0]);
      return json.type ? json : { type: 'noise' };
    } catch (e) {
      console.error("[GEMINI] Parse error:", e);
      return { type: 'noise' };
    }

  } catch (error: any) {
    console.error("[GEMINI] API Error:", error);
    return null;
  }
};
