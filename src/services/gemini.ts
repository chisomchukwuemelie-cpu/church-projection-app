
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
    // Lower temperature for more consistency
    // Set safety settings to none to avoid false blocks on biblical content
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
  type: 'scripture' | 'lyrics' | 'noise' | 'quote';
  content?: string;
  reference?: string; // For scriptures (e.g., "John 3:16")
};

// Fallback: Advanced pattern matching for scripture references in natural speech
const detectScripturePattern = (text: string): DetectedContent | null => {
  // Normalize text for better matching
  const normalized = text.toLowerCase();

  // All Bible books with common variations
  const books = [
    // Old Testament
    'genesis', 'gen', 'exodus', 'ex', 'exo', 'leviticus', 'lev', 'numbers', 'num',
    'deuteronomy', 'deut', 'dt', 'joshua', 'josh', 'judges', 'judg', 'ruth',
    '1 samuel', '2 samuel', 'first samuel', 'second samuel', '1 sam', '2 sam', '1st samuel', '2nd samuel',
    '1 kings', '2 kings', 'first kings', 'second kings', '1 ki', '2 ki', '1st kings', '2nd kings',
    '1 chronicles', '2 chronicles', 'first chronicles', 'second chronicles', '1 chr', '2 chr', '1st chronicles', '2nd chronicles',
    'ezra', 'nehemiah', 'neh', 'esther', 'est', 'job',
    'psalm', 'psalms', 'ps', 'proverbs', 'prov', 'pr', 'ecclesiastes', 'eccl', 'ecc',
    'song of solomon', 'song', 'isaiah', 'isa', 'is', 'jeremiah', 'jer',
    'lamentations', 'lam', 'ezekiel', 'ezek', 'ez', 'daniel', 'dan',
    'hosea', 'hos', 'joel', 'amos', 'obadiah', 'obad', 'jonah', 'jon',
    'micah', 'mic', 'nahum', 'nah', 'habakkuk', 'hab', 'zephaniah', 'zeph',
    'haggai', 'hag', 'zechariah', 'zech', 'malachi', 'mal',
    // New Testament
    'matthew', 'matt', 'mt', 'mark', 'mk', 'luke', 'lk', 'john', 'jn',
    'acts', 'romans', 'rom', 'rm',
    '1 corinthians', '2 corinthians', 'first corinthians', 'second corinthians', '1 cor', '2 cor', '1st corinthians', '2nd corinthians',
    'galatians', 'gal', 'ephesians', 'eph', 'philippians', 'phil', 'colossians', 'col',
    '1 thessalonians', '2 thessalonians', 'first thessalonians', 'second thessalonians', '1 thess', '2 thess', '1st thessalonians', '2nd thessalonians',
    '1 timothy', '2 timothy', 'first timothy', 'second timothy', '1 tim', '2 tim', '1st timothy', '2nd timothy',
    'titus', 'tit', 'philemon', 'phlm', 'hebrews', 'heb',
    'james', 'jas', '1 peter', '2 peter', 'first peter', 'second peter', '1 pet', '2 pet', '1st peter', '2nd peter',
    '1 john', '2 john', '3 john', 'first john', 'second john', 'third john', '1 jn', '2 jn', '3 jn', '1st john', '2nd john', '3rd john',
    'jude', 'revelation', 'rev'
  ];

  // Try multiple patterns to catch different speech variations
  const patterns = [
    // "John 3:16" or "John 3 16"
    /\b([\w\s]+?)\s+(\d+)[\s:]+(\d+)\b/i,
    // "turn to John chapter 3 verse 16"
    /(?:turn to|read|go to|open to|look at)\s+([\w\s]+?)\s+(?:chapter\s+)?(\d+)[\s:]+(?:verse\s+)?(\d+)/i,
    // "John chapter 3 verse 16"
    /([\w\s]+?)\s+chapter\s+(\d+)\s+verse\s+(\d+)/i,
    // "in John 3:16"
    /(?:in|from)\s+([\w\s]+?)\s+(\d+)[\s:]+(\d+)/i
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (match) {
      const chapter = match[2];
      const verse = match[3];

      // Check if the book candidate contains any known book name
      const matchedBook = books.find(book => {
        const bookName = book.toLowerCase();
        return normalized.includes(bookName);
      });

      if (matchedBook) {
        // Proper capitalization
        const displayBook = matchedBook
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');

        const reference = `${displayBook} ${chapter}:${verse}`;
        console.log("[FALLBACK] Ultra-sensitive match:", reference);

        return {
          type: 'scripture',
          reference: reference
        };
      }
    }
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
    const prompt = `You are a high-precision church audio analyzer. Your CORE objective is to detect Bible scriptures and spiritual quotes.

INPUT: "${text}"

PRIORITY HIERARCHY:
1. SCRIPTURE REFERENCE (Highest)
   - Rule: ANY Bible book + numbers (e.g., "John 3:16", "Romans 8 28", "Psalm 23").
   - Action: Return { "type": "scripture", "reference": "Book Chapter:Verse" }

2. BIBLE QUOTE (High)
   - Rule: Direct quotes from the Bible WITHOUT an explicit reference.
   - Look for: KJV archaic terms (thee, thou, thy, hath, saith) or distinct biblical phrasing.
   - Keywords: Salvation, Covenant, Tabernacle, Righteousness, Anointing, Kingdom, Grace.
   - Action: Return { "type": "quote", "content": "exact quote text" }

3. WORSHIP LYRICS (Medium)
   - Rule: Repetitive, poetic praise directed at God.
   - Action: Return { "type": "lyrics", "content": "exact lyrics" }

4. PASTORAL NOISE (Lowest - SKIP)
   - Rule: Casual talk, housekeeping, filler, or teaching commentary that isn't a direct quote.
   - Examples: "Let's welcome the choir", "Can everyone stand up", "Isn't God good today", "I was talking to my wife yesterday".
   - Action: Return { "type": "noise" }

CRITICAL RULES:
- If a sentence contains a Bible book followed by numbers, it MUST be type 'scripture'.
- If a sentence is a known scripture verse (like "I press toward the mark"), it MUST be type 'quote'.
- Return ONLY valid JSON. No markdown. No extras.

EXAMPLES:
- "The Lord is my shepherd I shall not want" -> {"type":"quote","content":"The Lord is my shepherd I shall not want"}
- "Open your Bibles to 1st Corinthians chapter 13 verse 4" -> {"type":"scripture","reference":"1 Corinthians 13:4"}
- "I press toward the mark for the prize of the high calling" -> {"type":"quote","content":"I press toward the mark for the prize"}
- "He leadeth me beside the still waters" -> {"type":"quote","content":"He leadeth me beside the still waters"}
- "We pray that you would move in this place" -> {"type":"lyrics","content":"We pray that you would move in this place"}
- "I want to share a story about a man I met" -> {"type":"noise"}

FINAL REMINDER: Be extremely sensitive! If you hear a book name and numbers, it IS a scripture. If you hear poetic biblical language, it IS a quote.`;

    console.log("[GEMINI] Sending prompt for text:", text.substring(0, 50));

    // Simple retry loop for robustness
    let result = null;
    let attempts = 0;
    while (attempts < 3) {
      try {
        result = await modelInstance.generateContent(prompt);
        if (result) break;
      } catch (e: any) {
        console.warn(`[GEMINI] Attempt ${attempts + 1} failed:`, e.message);
        attempts++;
        if (attempts >= 3) throw e;
        await new Promise(r => setTimeout(r, 1000)); // Wait before retry
      }
    }

    if (!result) {
      console.error("[GEMINI] generateContent returned null after 3 attempts");
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
        return json; // Return the object instead of null
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
