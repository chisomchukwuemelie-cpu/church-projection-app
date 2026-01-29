
import { get, set } from './db';

export interface BibleVerse {
    reference: string;
    text: string;
    book_name: string;
    chapter: number;
    verse: number;
    translation?: string;
}

// Bolls.life Book ID Map (Alphabetical/Standard Order)
// Note: Bolls uses integers. This map helps us convert names to IDs.
const BOLLS_BOOKS: Record<string, number> = {
    "genesis": 1, "exodus": 2, "leviticus": 3, "numbers": 4, "deuteronomy": 5,
    "joshua": 6, "judges": 7, "ruth": 8, "1 samuel": 9, "2 samuel": 10,
    "1 kings": 11, "2 kings": 12, "1 chronicles": 13, "2 chronicles": 14,
    "ezra": 15, "nehemiah": 16, "esther": 17, "job": 18, "psalms": 19, "psalm": 19,
    "proverbs": 20, "ecclesiastes": 21, "song of solomon": 22, "song of songs": 22,
    "isaiah": 23, "jeremiah": 24, "lamentations": 25, "ezekiel": 26, "daniel": 27,
    "hosea": 28, "joel": 29, "amos": 30, "obadiah": 31, "jonah": 32, "micah": 33,
    "nahum": 34, "habakkuk": 35, "zephaniah": 36, "haggai": 37, "zechariah": 38, "malachi": 39,
    "matthew": 40, "mark": 41, "luke": 42, "john": 43, "acts": 44, "romans": 45,
    "1 corinthians": 46, "2 corinthians": 47, "galatians": 48, "ephesians": 49,
    "philippians": 50, "colossians": 51, "1 thessalonians": 52, "2 thessalonians": 53,
    "1 timothy": 54, "2 timothy": 55, "titus": 56, "philemon": 57, "hebrews": 58,
    "james": 59, "1 peter": 60, "2 peter": 61, "1 john": 62, "2 john": 63, "3 john": 64,
    "jude": 65, "revelation": 66
};

// Translations that should route to Bolls.life (including the ones requested)
// Translations that should route to Bolls.life (including the ones requested)
// const USE_BOLLS = ['niv', 'esv', 'msg', 'amp', 'nlt', 'nasb', 'nkjv', 'kjv', 'web'];

const normalizeBookName = (raw: string): string => {
    let name = raw.toLowerCase().trim();
    name = name.replace(/^first\s/, '1 ');
    name = name.replace(/^second\s/, '2 ');
    name = name.replace(/^third\s/, '3 ');
    name = name.replace(/^1st\s/, '1 ');
    name = name.replace(/^2nd\s/, '2 ');
    name = name.replace(/^3rd\s/, '3 ');
    name = name.replace(/^song of songs/, 'song of solomon');
    return name;
};

// Helper: Strip HTML tags, leading verses, and artifacts
const cleanVerseText = (raw: string) => {
    if (!raw) return "";

    // 1. Remove HTML tags
    let text = raw.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();

    // 2. Remove leading verse numbers (e.g. "16 ", "16.", "16")
    text = text.replace(/^[\s\d\.\-\[\]\(\)]+/, '');

    // 3. Remove embedded Strong's numbers (letters+digits e.g. "God430")
    text = text.replace(/([a-zA-Z])\d+/g, '$1');

    // 4. Remove standalone Strong's numbers (3-5 digits, e.g. " 4250 ", " 35 ") 
    // We avoid removing single/double digits to preserve things like "12 baskets" or "7 days", 
    // unless they look very suspicious. But usually Strong's are 3+ digits.
    text = text.replace(/\b\d{3,5}\b/g, '');

    // 5. Remove footnotes/margin notes usually formatted like "word: or, alternative" or "word: Heb. alternative"
    // Regex: Match word followed by colon, space, then "or,"/"Heb."/"Gr."/"ie", and text until punctuation or end
    text = text.replace(/\b\w+:\s+(?:or|Heb|Gr|ie|Chal)\.?\s+[^.]+/gi, '');

    // 6. Clean up multiple spaces created by removals
    text = text.replace(/\s+/g, ' ').trim();

    return text;
};

export const searchBible = async (query: string, translation: string = 'kjv'): Promise<BibleVerse[]> => {
    const cleanRef = query.trim().toLowerCase();
    const requestedTranslation = translation.toLowerCase(); // e.g. 'niv'

    // 1. PARSE REFERENCE - NOW SUPPORTS "to", "through", "verse", AND SPACE SEPARATORS
    // Regex breakdown:
    // Group 1: Book (e.g. "1 John", "Genesis", "Song of Solomon") - lazy match
    // Group 2: Chapter
    // Group 3: Start Verse
    // Group 4: End Verse (Optional, handles "-", "to", "through")
    // CHANGED: Separator between Chapter and Verse can be colon OR space OR 'v'
    const refMatch = cleanRef.match(/^(\d?\s?[a-z\s]+?)\s+(?:chapter\s+)?(\d+)(?:\s*[:v\s]\s*|\s+)(\d+)(?:\s*(?:-|to|through)\s*(\d+))?$/i);
    let parsed: { book: string, chapter: number, startVerse: number, endVerse?: number } | null = null;

    if (refMatch) {
        parsed = {
            book: refMatch[1].trim(),
            chapter: parseInt(refMatch[2]),
            startVerse: parseInt(refMatch[3]),
            endVerse: refMatch[4] ? parseInt(refMatch[4]) : undefined
        };
    } else {
        console.warn(`[BIBLE] Could not parse reference: ${query}`);
        // Fallback for simple search if needed, but for now strict ref mode
    }

    if (parsed) {
        const normalizedBook = normalizeBookName(parsed.book);
        const bookId = BOLLS_BOOKS[normalizedBook];

        // CACHE KEY: Store by CHAPTER (so fetching John 3:16 caches all of John 3)
        // CACHE KEY: Store by CHAPTER (so fetching John 3:16 caches all of John 3)
        // VERSION 2: Invalidate old cache to ensure cleaner text
        const chapterCacheKey = `bible_v2_${requestedTranslation}_${normalizedBook}_${parsed.chapter}`;

        // 2. CHECK CACHE (IndexedDB)
        try {
            const cachedChapter = await get(chapterCacheKey);
            if (cachedChapter && Array.isArray(cachedChapter)) {
                console.log(`[BIBLE] Cache Hit (IDB): ${query} (${translation})`);
                // RE-CLEAN on read to ensure even cached data is stripped of artifacts
                const cleanCached = cachedChapter.map((v: any) => ({ ...v, text: cleanVerseText(v.text) }));
                return filterVerses(cleanCached, parsed.book, parsed.chapter, parsed.startVerse, parsed.endVerse, translation);
            }
        } catch (e) {
            console.warn("[BIBLE] IDB Read Error", e);
        }

        // 3. FETCH FROM BOLLS.LIFE
        if (bookId) {
            console.log(`[BIBLE] Fetching from Network: ${query} (${translation})`);
            try {
                // Determine Bolls translation code
                let bollsTrans = requestedTranslation.toUpperCase();
                // Map common aliases if needed, though most match (NIV, ESV, MSG, AMP)

                const url = `https://bolls.life/get-chapter/${bollsTrans}/${bookId}/${parsed.chapter}/`;
                const response = await fetch(url);

                if (response.ok) {
                    const data = await response.json();
                    if (Array.isArray(data)) {
                        // Format data for storage
                        // Bolls returns: [{ verse: 1, text: "..." }, ...]
                        const formattedChapter = data.map((v: any) => ({
                            verse: v.verse,
                            text: cleanVerseText(v.text),
                            book_name: parsed!.book, // Store standardized name or original? usage varies
                            chapter: parsed!.chapter
                        }));

                        // Store in IDB
                        await set(chapterCacheKey, formattedChapter);

                        return filterVerses(formattedChapter, parsed!.book, parsed!.chapter, parsed!.startVerse, parsed!.endVerse, translation);
                    }
                } else {
                    console.error(`[BIBLE] Bolls API Error: ${response.status}`);
                }
            } catch (e) {
                console.error("[BIBLE] Network Request Failed", e);
            }
        }
    }

    // 4. FALLBACK: TEXT SEARCH (Bolls.life)
    // If strict regex failed, we treat it as a text search (e.g. "beholding him")
    console.log(`[BIBLE] Search Text: "${cleanRef}"`);
    try {
        const bollsTrans = requestedTranslation.toUpperCase();
        // Bolls Search API: https://bolls.life/find/KJV/?search=phrase
        const url = `https://bolls.life/find/${bollsTrans}/?search=${encodeURIComponent(cleanRef)}`;
        const response = await fetch(url);

        if (response.ok) {
            const data = await response.json();
            // Bolls returns object keys as text or array? 
            // Format: [{ "pk": 123, "verse": 1, "text": "..." }, ...] or dictionary
            // Actually Bolls /find/ returns list of { pk, book, chapter, verse, text }

            if (Array.isArray(data) && data.length > 0) {
                console.log(`[BIBLE] Found ${data.length} matches.`);
                // Limit to top 10 to avoid overload
                return data.map((v: any) => {
                    const bookName = getBookNameFromId(v.book);
                    return {
                        reference: `${bookName} ${v.chapter}:${v.verse}`,
                        text: cleanVerseText(v.text),
                        book_name: bookName,
                        chapter: v.chapter,
                        verse: v.verse,
                        translation: bollsTrans
                    };
                }).filter((v: any) => v.book_name !== "Unknown"); // Filter out Apocrypha/Unmapped books
            }
        }
    } catch (e) {
        console.error("[BIBLE] Search Error", e);
    }

    // 5. LAST RESORT (Bible-API.com)
    // ... (Keep existing bible-api fallback if Bolls fails)
    try {
        let fallbackTrans = translation;
        if (['amp', 'niv', 'msg', 'nlt'].includes(requestedTranslation)) {
            fallbackTrans = 'kjv';
        }

        const url = `https://bible-api.com/${encodeURIComponent(query)}?translation=${fallbackTrans}`;
        const res = await fetch(url);
        if (res.ok) {
            const data = await res.json();
            if (data.verses) {
                return data.verses.map((v: any) => ({
                    reference: `${v.book_name} ${v.chapter}:${v.verse}`,
                    text: cleanVerseText(v.text),
                    book_name: v.book_name,
                    chapter: v.chapter,
                    verse: v.verse,
                    translation: data.translation_identifier || fallbackTrans.toUpperCase()
                }));
            }
        }
    } catch (e) { /* ignore */ }

    return [];
};

// Helper: Reverse Map for Bolls Book IDs
const getBookNameFromId = (id: number): string => {
    const entry = Object.entries(BOLLS_BOOKS).find(([_, val]) => val === id);
    return entry ? entry[0].charAt(0).toUpperCase() + entry[0].slice(1) : "Unknown";
};

// Start is inclusive, End is inclusive

// Start is inclusive, End is inclusive
const filterVerses = (chapterData: any[], bookName: string, chapter: number, start: number, end: number | undefined, trans: string): BibleVerse[] => {
    const endV = end || start;
    const filtered = chapterData.filter(v => v.verse >= start && v.verse <= endV);

    return filtered.map(v => ({
        reference: `${bookName} ${chapter}:${v.verse}`,
        text: v.text,
        book_name: bookName,
        chapter: chapter,
        verse: v.verse,
        translation: trans.toUpperCase()
    })).map(v => {
        // Capitalize Book Name First Letter
        v.reference = v.reference.replace(/\b\w/g, (c) => c.toUpperCase());
        return v;
    });
};
