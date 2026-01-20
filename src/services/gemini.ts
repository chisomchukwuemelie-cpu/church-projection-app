
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
export const BIBLE_BOOKS = [
  "Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy", "Joshua", "Judges", "Ruth", "1 Samuel", "2 Samuel", "1 Kings", "2 Kings", "1 Chronicles", "2 Chronicles", "Ezra", "Nehemiah", "Esther", "Job", "Psalms", "Psalm", "Proverbs", "Ecclesiastes", "Song of Solomon", "Isaiah", "Jeremiah", "Lamentations", "Ezekiel", "Daniel", "Hosea", "Joel", "Amos", "Obadiah", "Jonah", "Micah", "Nahum", "Habakkuk", "Zephaniah", "Haggai", "Zechariah", "Malachi", "Matthew", "Mark", "Luke", "John", "Acts", "Romans", "1 Corinthians", "2 Corinthians", "Galatians", "Ephesians", "Philippians", "Colossians", "1 Thessalonians", "2 Thessalonians", "1 Timothy", "2 Timothy", "Titus", "Philemon", "Hebrews", "James", "1 Peter", "2 Peter", "1 John", "2 John", "3 John", "Jude", "Revelation"
];

const BIBLE_CHAPTER_LIMITS: Record<string, number> = {
  "Genesis": 50, "Exodus": 40, "Leviticus": 27, "Numbers": 36, "Deuteronomy": 34,
  "Joshua": 24, "Judges": 21, "Ruth": 4, "1 Samuel": 31, "2 Samuel": 24,
  "1 Kings": 22, "2 Kings": 25, "1 Chronicles": 29, "2 Chronicles": 36,
  "Ezra": 10, "Nehemiah": 13, "Esther": 10, "Job": 42, "Psalms": 150, "Psalm": 150,
  "Proverbs": 31, "Ecclesiastes": 12, "Song of Solomon": 8, "Isaiah": 66,
  "Jeremiah": 52, "Lamentations": 5, "Ezekiel": 48, "Daniel": 12, "Hosea": 14,
  "Joel": 3, "Amos": 9, "Obadiah": 1, "Jonah": 4, "Micah": 7, "Nahum": 3,
  "Habakkuk": 3, "Zephaniah": 3, "Haggai": 2, "Zechariah": 14, "Malachi": 4,
  "Matthew": 28, "Mark": 16, "Luke": 24, "John": 21, "Acts": 28, "Romans": 16,
  "1 Corinthians": 16, "2 Corinthians": 13, "Galatians": 6, "Ephesians": 6,
  "Philippians": 4, "Colossians": 4, "1 Thessalonians": 5, "2 Thessalonians": 3,
  "1 Timothy": 6, "2 Timothy": 4, "Titus": 3, "Philemon": 1, "Hebrews": 13,
  "James": 5, "1 Peter": 5, "2 Peter": 3, "1 John": 5, "2 John": 1, "3 John": 1,
  "Jude": 1, "Revelation": 22
};

// Enhanced Regex to capture "Book Chapter:Verse [Connector] [Translation]" and Multi-word books
const SCRIPTURE_REGEX = /(\d?\s?[a-zA-Z\s]+?)\s+(?:chapter\s+)?(\d+)(?:\s*(?::|v\.?|verse)\s*|\s+)(\d+)(?:\s+(?:in|from|read|version|the|of)*\s*([a-zA-Z\s]+))?/i;
const PARTIAL_SCRIPTURE_REGEX = /(\d?\s?[a-zA-Z\s]+?)\s+(?:chapter\s+)?(\d+)(?!\s*[:\d])/i;

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

const levenshtein = (a: string, b: string): number => {
  const matrix = [];
  for (let i = 0; i <= b.length; i++) { matrix[i] = [i]; }
  for (let j = 0; j <= a.length; j++) { matrix[0][j] = j; }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1));
      }
    }
  }
  return matrix[b.length][a.length];
};

const findClosestBook = (input: string): string | null => {
  // Helper: map 'first' -> '1', 'second' -> '2' just in case
  let processedInput = input.toLowerCase()
    .replace(/\bfirst\b/g, '1')
    .replace(/\bsecond\b/g, '2')
    .replace(/\bthird\b/g, '3');

  const normalize = (s: string) => s.replace(/[^a-z0-9]/g, '');
  const cleanInput = normalize(processedInput);

  let bestMatch = null;
  let minDist = Infinity;

  for (const book of BIBLE_BOOKS) {
    const cleanBook = normalize(book.toLowerCase()); // Lowercase for comparison
    if (cleanBook === cleanInput) return book; // Return original Title Case

    // Allow partials if length is sufficient (e.g. "corinth" -> "1 corinthians" is risky, handle carefully)
    // We focus on fuzzy spelling errors mostly
    const dist = levenshtein(cleanInput, cleanBook);

    // Threshold: Allow 1 edit for short words, 2-3 for longer
    const threshold = cleanBook.length < 5 ? 1 : 3;

    if (dist <= threshold && dist < minDist) {
      minDist = dist;
      bestMatch = book; // Return original Title Case
    }
  }
  return bestMatch;
};

const PREPROCESS_MAP: Record<string, string> = {
  "one": "1", "two": "2", "three": "3", "four": "4", "five": "5",
  "six": "6", "seven": "7", "eight": "8", "nine": "9", "ten": "10",
  "eleven": "11", "twelve": "12", "thirteen": "13", "fourteen": "14", "fifteen": "15",
  "twenty": "20", "thirty": "30", "forty": "40", "fifty": "50",
  "first": "1", "second": "2", "third": "3", "fourth": "4", "fifth": "5"
};

const BIBLE_HOMOPHONES: Record<string, string> = {
  "gene see": "genesis", "jenesis": "genesis", "genesis": "genesis",
  "ex odus": "exodus", "leviticus": "leviticus",
  "josh wa": "joshua", "joshua": "joshua",
  "sams": "psalms", "sam": "psalm", "psalm": "psalm", "songs": "psalms",
  "pro verbs": "proverbs", "eccle siastes": "ecclesiastes",
  "song of songs": "song of solomon",
  "isa ah": "isaiah", "eye zaya": "isaiah",
  "jeremiah": "jeremiah",
  "math you": "matthew", "mathew": "matthew", "math ew": "matthew",
  "mark": "mark", "luke": "luke", "john": "john",
  "ax": "acts", "act": "acts",
  "rome ans": "romans", "roman": "romans",
  "corinthians": "corinthians",
  "galatians": "galatians", "galations": "galatians",
  "ephesians": "ephesians",
  "philip ians": "philippians", "filippians": "philippians", "phillipians": "philippians",
  "colossians": "colossians",
  "thessalonians": "thessalonians",
  "timothy": "timothy", "tim": "timothy",
  "titus": "titus", "tight us": "titus",
  "file mon": "philemon", "philemon": "philemon",
  "hebrews": "hebrews", "he brews": "hebrews",
  "james": "james",
  "peter": "peter",
  "jude": "jude", "hey jude": "jude",
  "revelation": "revelation", "revelations": "revelation"
};

const preprocessText = (text: string): string => {
  // 1. Clean punctuation (replace , - with space)
  let processed = text.replace(/[,.-]/g, ' ');

  // 1.5 Homophone Correction (Pre-tokenization)
  // Simple Replace for known phrases
  for (const [bad, good] of Object.entries(BIBLE_HOMOPHONES)) {
    const regex = new RegExp(`\\b${bad}\\b`, 'gi');
    processed = processed.replace(regex, good);
  }

  // 2. Map words to numbers/symbols
  processed = processed.toLowerCase().split(/\s+/).map(word => {
    const clean = word.replace(/[^a-z0-9:]/g, ''); // keep colon
    return PREPROCESS_MAP[clean] || word;
  }).join(' ');

  // 3. Remove "book of" prefix, connectors, and Labels
  processed = processed.replace(/\bbook of\b/g, '');
  processed = processed.replace(/\band\b/g, ' ');
  processed = processed.replace(/\bpoint\b/g, ' ');
  processed = processed.replace(/\bdot\b/g, ' ');
  processed = processed.replace(/\bchapter\b/g, ' ');
  processed = processed.replace(/\bverse\b/g, ' ');

  // 4. HEURISTIC: Convert "1 1" -> "1:1", "3 16" -> "3:16"

  // 4. HEURISTIC: Convert "1 1" -> "1:1", "3 16" -> "3:16"
  // This helps capturing "Genesis 1 1" as "Genesis 1:1" instead of "Genesis 11" (if something else merged it) or just 1 1
  return processed.replace(/(\d)\s+(\d)/g, '$1:$2');
};

export const analyzeText = async (text: string): Promise<DetectedContent | null> => {
  if (!text) return null;
  // Preprocess: "First John Chapter One" -> "1 John Chapter 1"
  // "Genesis one one" -> "Genesis 1 1"
  const cleanText = preprocessText(text.trim());

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

    // Validate book name to avoid false positives on random text
    const validBook = findClosestBook(bookCandidate);

    if (validBook) {
      let finalChapter = parseInt(chapter);
      let finalVerse = parseInt(verse);

      // HEURISTIC: Fix STT merging numbers (e.g. "Matthew 148" -> "14:8")
      const maxChapters = BIBLE_CHAPTER_LIMITS[validBook] || 50;
      if (finalChapter > maxChapters) {
        const chStr = finalChapter.toString();
        // If 2 digits (e.g. 45 -> 4:5 if Max 28) or 3 digits (e.g. 148 -> 14:8)
        if (chStr.length >= 2) {
          // Try greedily taking digits until valid chapter
          // For "148" -> take "14" (Ch), "8" (Verse). 
          // For "45" -> take "4" (Ch), "5" (Verse).
          if (chStr.length === 2) {
            finalChapter = parseInt(chStr[0]);
            finalVerse = parseInt(chStr[1]);
          } else if (chStr.length === 3) {
            // For 3 digits, we usually want 2 digits for chapter (e.g. 14 8)
            const opt1Ch = parseInt(chStr.slice(0, 2));
            if (opt1Ch <= maxChapters) {
              finalChapter = opt1Ch;
              finalVerse = parseInt(chStr[2]);
            } else {
              finalChapter = parseInt(chStr[0]);
              finalVerse = parseInt(chStr.slice(1));
            }
          }
          console.log(`[GEMINI] Deterministic split: ${chStr} -> ${finalChapter}:${finalVerse}`);
        }
      }

      console.log(`[GEMINI] Regex Hit: ${validBook} ${finalChapter}:${finalVerse} (${detectedTranslation || 'Def'})`);
      return {
        type: 'scripture',
        reference: `${validBook} ${finalChapter}:${finalVerse}`, // Use standardized book name
        translation: detectedTranslation
      };
    }
  }

  // 0.5 PARTIAL REGEX CHECK (e.g. "John 3", "Genesis Chapter 1", "Jude 5")
  const partialMatch = cleanText.match(PARTIAL_SCRIPTURE_REGEX);
  if (partialMatch) {
    const bookCandidate = partialMatch[1].toLowerCase();
    const numberVal = parseInt(partialMatch[2]);

    // Validate book name
    const validBook = findClosestBook(bookCandidate);

    if (validBook) {
      let finalChapter = numberVal;
      let finalVerse = 1;

      // SINGLE CHAPTER BOOKS CHECK (Jude, Philemon, etc.)
      // Behave like "Book 1:Num"
      const singleChapterBooks = ["Obadiah", "Philemon", "2 John", "3 John", "Jude"];
      if (singleChapterBooks.includes(validBook)) {
        finalChapter = 1;
        finalVerse = numberVal;
        console.log(`[GEMINI] Single Chapter Book detected: ${validBook} ${numberVal} -> ${validBook} 1:${finalVerse}`);
      } else {
        // MULTI-CHAPTER BOOK
        // Check limits. If user says "Genesis 60" (Max 50), maybe they meant "Genesis 6:0"? Or just "Genesis 1:60"?
        // Let's stick to the "Smashed Number" logic or Default to Verse 1.
        const maxChapters = BIBLE_CHAPTER_LIMITS[validBook] || 50;

        if (finalChapter > maxChapters) {
          // Heuristic: "Corinthians 512" -> "5:12"
          // "Genesis 51" -> "5:1"
          const chStr = finalChapter.toString();
          if (chStr.length >= 2) {
            if (chStr.length === 2) {
              // 51 -> 5:1
              finalChapter = parseInt(chStr[0]);
              finalVerse = parseInt(chStr[1]);
            } else if (chStr.length === 3) {
              // 123 -> 1:23? or 12:3?
              // Prefer Chapter fit.
              const opt1Ch = parseInt(chStr.slice(0, 2));
              if (opt1Ch <= maxChapters) {
                finalChapter = opt1Ch;
                finalVerse = parseInt(chStr[2]);
              } else {
                finalChapter = parseInt(chStr[0]);
                finalVerse = parseInt(chStr.slice(1));
              }
            } else if (chStr.length >= 4) {
              // 4 digits: "1010" -> "10:10", "1224" -> "12:24"
              finalChapter = parseInt(chStr.slice(0, 2));
              finalVerse = parseInt(chStr.slice(2));
            }
            console.log(`[GEMINI] Partial Split: ${chStr} -> ${finalChapter}:${finalVerse}`);
          }
        }
      }

      console.log(`[GEMINI] Partial Regex Hit: ${validBook} ${finalChapter}:${finalVerse} (Def/Split)`);
      return {
        type: 'scripture',
        reference: `${validBook} ${finalChapter}:${finalVerse}`,
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
    0. **PRIORITY**: SCRIPTURE DETECTION IS YOUR MAIN GOAL.
    1. **SCRIPTURE**:
       - Convert ANY "Book + Number" pattern into a Bible reference.
       - "Matthew 6 4" -> "Matthew 6:4"
       - "Matthew 64" (if you hear it as one number) -> "Matthew 6:4" (Prefer Chapter:Verse split)
       - "One One" -> "1:1"
       - "Two Three" -> "2:3"
       - "One Four Eight" -> "14:8"
       - "Four Five" -> "4:5"
       - "Genesis 1" -> "Genesis 1:1" (Default to verse 1)
       - ALWAYS prefer 'scripture' type if a Bible book is mentioned with numbers.
       - NEVER return "Chapter:1" if you detect a second number. Assume "4 5" is "4:5".
    2. **COMMANDS**:
       - "Background mountains", "Change theme to blue" -> 'command': "SET_THEME", 'visual': "mountains/blue"
       - "Clear screen", "Show logo" -> 'command'.
    3. **LYRICS**: If it sounds like a song, return 'lyrics'.
    4. **NOISE**: Only return 'noise' for casual filler like "testing", "hello", "check check". 
       - NEVER classify a Bible book name + numbers as noise.
    
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
    - Respond with RAW JSON only.
    - If numbers are mentioned after a book name, assume they are Chapter:Verse even if they are heard as a single number (e.g. "twenty three" -> "2:3").
    - If you hear "One Fourteen", is it Chapter 1 Verse 14 or Chapter 114? Check if the Bible book even has 114 chapters. If not, it MUST be 1:14.`;

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

      // Post-process AI result to ensure Book Name is standardized
      if (json.type === 'scripture' && json.reference) {
        // Parse "Genesis 1:1" or "Gen 1:1" from AI
        const refMatch = json.reference.match(/^(\d?\s?[a-zA-Z\s]+)\s+(\d+)[:\s](\d+)$/);
        if (refMatch) {
          const bookCandidate = refMatch[1];
          const validBook = findClosestBook(bookCandidate);
          if (validBook) {
            json.reference = `${validBook} ${refMatch[2]}:${refMatch[3]}`;
            console.log(`[GEMINI] Standardized AI Reference: ${json.reference}`);
          }
        }
      }
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
