
import { BIBLE_BOOKS, BIBLE_HOMOPHONES, PREPROCESS_MAP } from './constants';

/**
 * Phonetic Normalizer
 * Simplifies a word to its core sounds to handle misspellings and mispronunciations.
 * Optimized for Bible book names.
 */
export const phoneticNormalize = (word: string): string => {
    let s = word.toLowerCase().replace(/[^a-z]/g, '');
    if (!s) return '';

    // 1. Initial transformations
    s = s.replace(/^kn/g, 'n');
    s = s.replace(/^wr/g, 'r');
    s = s.replace(/^ps/g, 's');
    s = s.replace(/^x/g, 's');

    // 2. Common sound-alikes & Phonemes
    s = s.replace(/tion/g, 'xn'); // Revelation -> Revelaxn
    s = s.replace(/sion/g, 'xn');
    s = s.replace(/ph/g, 'f');
    s = s.replace(/gh/g, 'f');
    s = s.replace(/ch/g, 'k');
    s = s.replace(/sh/g, 'x');
    s = s.replace(/th/g, '0');
    s = s.replace(/v/g, 'f');
    s = s.replace(/z/g, 's');
    s = s.replace(/j/g, 'g');

    // Handle 'c'
    s = s.replace(/c(?=[iey])/g, 's');
    s = s.replace(/c/g, 'k');

    // 3. Remove all vowels (except at the start)
    const firstChar = s[0];
    const rest = s.substring(1).replace(/[aeiouy]/g, '');
    s = firstChar + rest;

    // 4. Remove duplicate adjacent letters
    s = s.replace(/([a-z0-0])\1+/g, '$1');

    return s.toUpperCase();
};

const PHONETIC_MAP: Record<string, string> = {};
BIBLE_BOOKS.forEach(book => {
    // Remove numbers for phonetic indexing (store separately)
    const nameOnly = book.toLowerCase().replace(/^\d\s*/, '').replace(/[^a-z]/g, '');
    PHONETIC_MAP[book] = phoneticNormalize(nameOnly);
});

export const levenshtein = (a: string, b: string): number => {
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

export const findClosestBook = (input: string): string | null => {
    if (!input) return null;

    // 1. Clean Input & Extract Number
    let processedInput = input.toLowerCase()
        .replace(/\bfirst\b/g, '1')
        .replace(/\bsecond\b/g, '2')
        .replace(/\bthird\b/g, '3');

    const inputNumMatch = processedInput.match(/^(\d)/);
    const inputNum = inputNumMatch ? inputNumMatch[1] : null;

    // String for matching (without number)
    const inputClean = processedInput.replace(/^\d\s*/, '').replace(/[^a-z]/g, '');

    // 2. Exact Match Check (High Priority)
    for (const book of BIBLE_BOOKS) {
        const bookClean = book.toLowerCase().replace(/[^a-z0-9]/g, '');
        const processedInputClean = processedInput.replace(/[^a-z0-9]/g, '');
        if (bookClean === processedInputClean) return book;
    }

    // 3. Phonetic Match
    const inputPhonetic = phoneticNormalize(inputClean);

    for (const book of BIBLE_BOOKS) {
        const bookNumMatch = book.match(/^(\d)/);
        const bookNum = bookNumMatch ? bookNumMatch[1] : null;

        // Number must match exactly if present
        if (inputNum !== bookNum) continue;

        if (PHONETIC_MAP[book] === inputPhonetic) {
            // Tie-breaker: If input is "Sam", prefer "Psalms" (already handled by homophones usually, but good to be safe)
            // Actually, returning the first one found is usually fine.
            return book;
        }
    }

    // 4. Fuzzy Match (Fallback)
    let bestFuzzyMatch = null;
    let minDist = Infinity;
    const processedInputFullClean = processedInput.replace(/[^a-z0-9]/g, '');

    for (const book of BIBLE_BOOKS) {
        const bookClean = book.toLowerCase().replace(/[^a-z0-9]/g, '');
        const dist = levenshtein(processedInputFullClean, bookClean);

        let threshold = 2;
        if (bookClean.length < 4) threshold = 0;
        else if (bookClean.length <= 6) threshold = 1;
        else if (bookClean.length > 9) threshold = 3;

        if (dist <= threshold && dist < minDist) {
            minDist = dist;
            bestFuzzyMatch = book;
        }
    }

    return bestFuzzyMatch;
};

export const preprocessText = (text: string): string => {
    // 1. Clean punctuation
    let processed = text.replace(/[,.-\/]/g, ' ');

    // 2. Manual Homophones (Critical Overrides)
    for (const [bad, good] of Object.entries(BIBLE_HOMOPHONES)) {
        const regex = new RegExp(`\\b${bad}\\b`, 'gi');
        processed = processed.replace(regex, good);
    }

    // 3. Map Number Words
    processed = processed.toLowerCase().split(/\s+/).map(word => {
        const clean = word.replace(/[^a-z0-9:]/g, '');
        return PREPROCESS_MAP[clean] || word;
    }).join(' ');

    // 4. Standardize common church terms
    processed = processed.replace(/\bbook of\b/g, '');
    processed = processed.replace(/\bpoint\b/g, ' ');
    processed = processed.replace(/\bchapter\b/g, ' ');
    processed = processed.replace(/\bverse\b/g, ' ');

    // 5. Connect numbers: "3 16" -> "3:16" but avoid "1 John" -> "1:john"
    // Heuristic: If we see Number + Space + Number, connect them.
    // To avoid "1 John", we check if the first number is followed by another number.
    processed = processed.replace(/(\d+)\s+(\d+)/g, '$1:$2');

    // 6. Handle ranges: "3:16 to 18" -> "3:16-18"
    processed = processed.replace(/(\d+):(\d+)\s+(?:to|and|through)\s+(\d+)/g, '$1:$2-$3');

    return processed;
};
