
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import type { DetectedContent } from './types';
import { BIBLE_BOOKS, BIBLE_CHAPTER_LIMITS, SCRIPTURE_REGEX, PARTIAL_SCRIPTURE_REGEX, TRANSLATION_MAP } from './constants';
import { preprocessText, findClosestBook } from './utils';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || localStorage.getItem('VITE_GEMINI_API_KEY');

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

// State for Context Awareness
let lastBook: string | null = null;

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
            lastBook = validBook; // Update Context
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

    // NEW: Fast-Path for Contextual Numbers (e.g. "2 8", "1 1") -> "LastBook 2:8"
    // This addresses "it is not fast" by skipping AI for simple verse navigations.
    if (!match && !partialMatch && lastBook) {
        // Check for "Number Number" pattern (processed by preprocessText into "d:d" or "d d")
        // preprocessText converts "1 1" -> "1:1". So we look for that.
        const contextMatch = cleanText.match(/^(\d+)[:\s](\d+)$/);
        if (contextMatch) {
            const ch = parseInt(contextMatch[1]);
            const v = parseInt(contextMatch[2]);
            const maxChapters = BIBLE_CHAPTER_LIMITS[lastBook] || 150;

            if (ch <= maxChapters) {
                console.log(`[GEMINI] Context Fast-Path: ${lastBook} ${ch}:${v}`);
                return {
                    type: 'scripture',
                    reference: `${lastBook} ${ch}:${v}`,
                    translation: detectedTranslation
                };
            }
        }
    }

    if (partialMatch) {
        const bookCandidate = partialMatch[1].toLowerCase();
        const numberVal = parseInt(partialMatch[2]);

        // Validate book name
        const validBook = findClosestBook(bookCandidate);

        if (validBook) {
            // AMBIGUITY CHECK:
            const hasExplicitChapter = /\bchapter\b/i.test(cleanText);
            const isClearlyChapter = hasExplicitChapter;

            // If single chapter book (Jude), WE TRUST IT (Jude 5 -> Jude 1:5). Return immediately.
            const singleChapterBooks = ["Obadiah", "Philemon", "2 John", "3 John", "Jude"];

            if (isClearlyChapter || singleChapterBooks.includes(validBook)) {
                let finalChapter = numberVal;
                let finalVerse = 1;
                if (singleChapterBooks.includes(validBook)) {
                    finalChapter = 1;
                    finalVerse = numberVal;
                }
                lastBook = validBook;
                console.log(`[GEMINI] Partial/Chapter Hit: ${validBook} ${finalChapter}:${finalVerse}`);
                return {
                    type: 'scripture',
                    reference: `${validBook} ${finalChapter}:${finalVerse}`,
                    translation: detectedTranslation
                };
            }

            // FALLTHROUGH: Deterministic Partial Match
            const maxChapters = BIBLE_CHAPTER_LIMITS[validBook] || 50;
            let finalChapter = numberVal;
            let finalVerse = 1;

            // Heuristic: If number is huge (e.g. 128), try split?
            if (finalChapter > maxChapters) {
                const chStr = finalChapter.toString();
                if (chStr.length === 3) {
                    const probableCh = parseInt(chStr.slice(0, 2)); // 12
                    const probableV = parseInt(chStr.slice(2));     // 8
                    if (probableCh <= maxChapters) {
                        finalChapter = probableCh;
                        finalVerse = probableV;
                        console.log(`[GEMINI] Partial Split: ${chStr} -> ${finalChapter}:${finalVerse}`);
                    }
                } else if (chStr.length === 2 && maxChapters < finalChapter) {
                    // e.g. "Mark 45". Max 16.
                    finalChapter = parseInt(chStr[0]);
                    finalVerse = parseInt(chStr[1]);
                    console.log(`[GEMINI] Partial Split: ${chStr} -> ${finalChapter}:${finalVerse}`);
                }
            }

            lastBook = validBook;
            console.log(`[GEMINI] Partial Hit (Deterministic): ${validBook} ${finalChapter}:${finalVerse}`);
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
    LAST DETECTED BOOK: "${lastBook || 'None'}"
    
    INSTRUCTIONS:
    0. **PRIORITY**: SCRIPTURE DETECTION IS YOUR MAIN GOAL.
    1. **NOISE TOLERANCE (DISTANT AUDIO)**:
       - The audio may be distant, faint, or muffled.
       - DO NOT classify as 'noise' if there is even a 10% chance it is a Bible reference.
       - If you hear "Matt 5", assume "Matthew 5". GUESS AGGRESSIVELY.
    2. **SCRIPTURE**:
       - Convert ANY "Book + Number" pattern into a Bible reference.
       - **CONTEXT**: If you hear ONLY numbers (e.g., "12 8" or "One Five") and a LAST DETECTED BOOK exists, use it!
         - "12 8" (with Last Book: Exodus) -> "Exodus 12:8"
         - "One Five" (with Last Book: Exodus) -> "Exodus 1:5"
       - **SMASHED NUMBERS**: Split smashed numbers aggressively if they make sense as Chapter:Verse.
         - "Genesis 18" -> "Genesis 1:8" (Prefer C:V split over Chapter 18 if ambiguous, unless "Chapter" is said)
         - "Exodus 15" -> "Exodus 1:5"
         - "Matthew 64" -> "Matthew 6:4"
         - "128" (with Last Book) -> "12:8"
       - "Matthew 6 4" -> "Matthew 6:4"
       - "Matthew 64" (if you hear it as one number) -> "Matthew 6:4" (Prefer Chapter:Verse split)
       - "One One" -> "1:1"
       - "Two Three" -> "2:3"
       - "One Four Eight" -> "14:8"
       - "Four Five" -> "4:5"
       - "Genesis 1" -> "Genesis 1:1" (Default to verse 1)
       - "Jude 5" -> "Jude 1:5" (Single chapter book)
       - **PHONETIC CORRECTION**: If you hear a word that sounds like a Bible book followed by numbers, incorrectly transcribed, correct it.
         - "Math you 5 7" -> "Matthew 5:7"
         - "Have a cook 2 2" -> "Habakkuk 2:2"
         - "Filament 1 6" -> "Philemon 1:6"
       - **CONNECTORS**:
         - "Matthew 4 and 5" -> "Matthew 4:5" (Assume user meant Chapter:Verse)
         - "John 3 16" -> "John 3:16"
       - ALWAYS prefer 'scripture' type if a Bible book is mentioned with numbers.
       - NEVER return "Chapter:1" if you detect a second number. Assume "4 5" is "4:5".
    3. **COMMANDS**:
       - "Background mountains", "Change theme to blue" -> 'command': "SET_THEME", 'visual': "mountains/blue"
       - "Clear screen", "Show logo" -> 'command'.
    4. **LYRICS**: If it sounds like a song, return 'lyrics'.
    5. **NOISE**: 
       - ONLY return 'noise' if the text is completely gibberish or clearly conversation ("hello mic check").
       - If you see numbers and a potential book name, IT IS SCRIPTURE. Not noise.
    
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
                        let finalChapter = parseInt(refMatch[2]);
                        let finalVerse = parseInt(refMatch[3]);

                        // Enforce Chapter Limits & Split Smashed Numbers from AI (e.g. "Philippians 11")
                        const maxChapters = BIBLE_CHAPTER_LIMITS[validBook] || 50;
                        if (finalChapter > maxChapters) {
                            const chStr = finalChapter.toString();
                            if (chStr.length === 2) {
                                finalChapter = parseInt(chStr[0]);
                                finalVerse = parseInt(chStr[1]);
                            } else if (chStr.length === 3) {
                                const opt1Ch = parseInt(chStr.slice(0, 2));
                                if (opt1Ch <= maxChapters) {
                                    finalChapter = opt1Ch;
                                    finalVerse = parseInt(chStr[2]);
                                } else {
                                    finalChapter = parseInt(chStr[0]);
                                    finalVerse = parseInt(chStr.slice(1));
                                }
                            }
                            console.log(`[GEMINI] AI Fixed Limits: ${validBook} ${chStr} -> ${finalChapter}:${finalVerse}`);
                        }

                        json.reference = `${validBook} ${finalChapter}:${finalVerse}`;
                        console.log(`[GEMINI] Standardized AI Reference: ${json.reference}`);
                    } else {
                        console.warn(`[GEMINI] Rejected invalid book from AI: ${bookCandidate}`);
                        return { type: 'noise' };
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

export type { DetectedContent };
export { BIBLE_BOOKS, BIBLE_CHAPTER_LIMITS };
