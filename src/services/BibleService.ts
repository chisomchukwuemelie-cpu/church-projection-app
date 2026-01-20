

export interface BibleVerse {
    reference: string;
    text: string;
    book_name: string;
    chapter: number;
    verse: number;
    translation?: string;
}

const CACHE_KEY = 'bible_cache_v2';

// Bolls.life Book ID Map (Alphabetical/Standard Order)
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

// Translations that should route to Bolls.life
const USE_BOLLS = ['niv', 'esv', 'msg', 'amp', 'nlt', 'nasb', 'nkjv'];

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

const getCache = (): Record<string, BibleVerse[]> => {
    const stored = localStorage.getItem(CACHE_KEY);
    return stored ? JSON.parse(stored) : {};
};

const setCache = (key: string, verses: BibleVerse[]) => {
    const cache = getCache();
    cache[key] = verses;
    const keys = Object.keys(cache);
    if (keys.length > 50) delete cache[keys[0]];
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
};

export const searchBible = async (query: string, translation: string = 'kjv'): Promise<BibleVerse[]> => {
    const cleanRef = query.trim().toLowerCase();
    const requestedTranslation = translation.toLowerCase();
    const cacheKey = `${cleanRef}_${requestedTranslation}`;

    // 1. CACHE CHECK
    const cache = getCache();
    if (cache[cacheKey]) {
        console.log(`[BIBLE] Cache Hit: ${query} (${translation})`);
        return cache[cacheKey];
    }

    console.log(`[BIBLE] Fetching: ${query} (${translation})`);

    // PARSE REFERENCE (Needed for Bolls & Local)
    const refMatch = cleanRef.match(/^(\d?\s?[a-z\s]+)\s+(?:chapter\s+)?(\d+)[:\s](\d+)(?:-(\d+))?$/i);
    let parsed: { book: string, chapter: number, startVerse: number, endVerse?: number } | null = null;

    if (refMatch) {
        parsed = {
            book: refMatch[1].trim(),
            chapter: parseInt(refMatch[2]),
            startVerse: parseInt(refMatch[3]),
            endVerse: refMatch[4] ? parseInt(refMatch[4]) : undefined
        };
    }

    // 1.5 TRY LOCAL JSON (Faster/Offline)
    // Structure assumed from ThiagoBodruk: Array of books. We need to load standard format.
    // Actually, loading 5MB JSON on every request is bad. Better to fetch it once or valid checking.
    // We will try to fetch `/bibles/{translation}.json`
    try {
        const localUrl = `/bibles/${requestedTranslation}.json`;
        const res = await fetch(localUrl, { method: 'HEAD' }); // Check exist
        if (res.ok) {
            const jsonRes = await fetch(localUrl);
            const bibleData = await jsonRes.json();
            // Assume thiagobodruk structure: [ { name: "Genesis", chapters: [ [ "In the beginning...", "And the earth..." ] ] } ]
            // Note: chapters are 0-indexed in array usually? Or 1-indexed? ThiagoBodruk: chapters are array of array of strings.
            if (parsed && Array.isArray(bibleData)) {
                // Map book name to index or find by name
                const book = bibleData.find((b: any) => normalizeBookName(b.name).includes(normalizeBookName(parsed!.book)));
                if (book && book.chapters) {
                    const chapterIdx = parsed.chapter - 1;
                    if (book.chapters[chapterIdx]) {
                        const versesText = book.chapters[chapterIdx]; // Array of strings (verses)
                        // versesText is array of strings. Index 0 is Verse 1.

                        const results: BibleVerse[] = [];
                        const start = parsed.startVerse - 1;
                        const end = parsed.endVerse ? parsed.endVerse - 1 : start;

                        for (let i = start; i <= end; i++) {
                            if (versesText[i]) {
                                results.push({
                                    reference: `${parsed.book} ${parsed.chapter}:${i + 1}`,
                                    text: versesText[i],
                                    book_name: parsed.book,
                                    chapter: parsed.chapter,
                                    verse: i + 1,
                                    translation: translation.toUpperCase()
                                });
                            }
                        }

                        if (results.length > 0) {
                            console.log(`[BIBLE] Local Hit: ${query}`);
                            setCache(cacheKey, results);
                            return results;
                        }
                    }
                }
            }
        }
    } catch (e) {
        // console.log("Local fetch failed or not found", e);
    }

    // 2. TRY BOLLS.LIFE (For copyrighted versions)
    if (USE_BOLLS.includes(requestedTranslation) && parsed) {
        const normalizedBook = normalizeBookName(parsed.book);
        const bookId = BOLLS_BOOKS[normalizedBook];
        if (bookId) {
            try {
                // Fetch whole chapter (Bolls doesn't do range filtering nicely in url)
                const bollsTrans = requestedTranslation === 'msg' ? 'MSG' : requestedTranslation.toUpperCase();
                const url = `https://bolls.life/get-chapter/${bollsTrans}/${bookId}/${parsed.chapter}/`;

                const response = await fetch(url);
                if (response.ok) {
                    const data = await response.json();
                    // Validator: Bolls returns an array of verses. If it returned an object or something else, it failed.
                    if (Array.isArray(data)) {
                        // Filter verses
                        const relevantVerses = data.filter((v: any) => {
                            if (parsed!.endVerse) {
                                return v.verse >= parsed!.startVerse && v.verse <= parsed!.endVerse;
                            }
                            return v.verse === parsed!.startVerse;
                        });

                        if (relevantVerses.length > 0) {
                            const results = relevantVerses.map((v: any) => ({
                                reference: `${parsed!.book} ${parsed!.chapter}:${v.verse}`,
                                text: v.text.replace(/<[^>]*>/g, ''), // Strip HTML
                                book_name: parsed!.book,
                                chapter: parsed!.chapter,
                                verse: v.verse,
                                translation: translation.toUpperCase()
                            }));

                            results.forEach((r: any) => {
                                r.reference = r.reference.replace(/\b\w/g, (c: string) => c.toUpperCase());
                            });

                            setCache(cacheKey, results);
                            return results;
                        }
                    }
                }
            } catch (e) {
                console.error("[BIBLE] Bolls.life failed, falling back:", e);
            }
        }
    }

    // 3. FALLBACK: BIBLE-API.COM (KJV, WEB, etc.)
    try {
        let fallbackTrans = USE_BOLLS.includes(requestedTranslation) ? 'kjv' : requestedTranslation;

        if (['amp', 'msg', 'niv', 'esv', 'nlt'].includes(requestedTranslation)) {
            fallbackTrans = 'kjv';
        }

        // Strategy: Try raw query first. If that fails (e.g. weird spacing/chars), try Constructed Reference.
        let url = `https://bible-api.com/${encodeURIComponent(query)}?translation=${encodeURIComponent(fallbackTrans)}`;
        let response = await fetch(url);

        // RETRY MECHANISM: If raw query failed but we successfully parsed it, try the clean format "Book Ch:V"
        if (!response.ok && parsed && parsed.book) {
            const cleanRef = `${parsed.book} ${parsed.chapter}:${parsed.startVerse}`;
            console.log(`[BIBLE] Raw query failed. Retrying with clean ref: ${cleanRef}`);
            url = `https://bible-api.com/${encodeURIComponent(cleanRef)}?translation=${encodeURIComponent(fallbackTrans)}`;
            response = await fetch(url);
        }

        if (response.ok) {
            const data = await response.json();
            if (data.verses) {
                const verses = data.verses.map((v: any) => ({
                    reference: `${v.book_name} ${v.chapter}:${v.verse}`,
                    text: v.text.trim(),
                    book_name: v.book_name,
                    chapter: v.chapter,
                    verse: v.verse,
                    translation: data.translation_identifier || fallbackTrans.toUpperCase()
                }));
                // Mark fallback if needed
                if (fallbackTrans !== requestedTranslation) {
                    const Copyrighted = ['amp', 'msg', 'nlt', 'nkjv'];
                    if (Copyrighted.includes(requestedTranslation)) {
                        verses.forEach((v: any) => v.translation = `KJV (Fallback: ${requestedTranslation.toUpperCase()} is Copyrighted/Unavailable)`);
                    } else {
                        verses.forEach((v: any) => v.translation = `${fallbackTrans.toUpperCase()} (Fallback for ${requestedTranslation.toUpperCase()})`);
                    }
                }

                setCache(cacheKey, verses);
                return verses;
            }
        }
    } catch (e) {
        console.error("[BIBLE] bible-api.com failed:", e);
    }

    // 4. LAST RESORT (Network/Labs)
    // ... (Keep existing labs logic if needed, or remove for cleanliness)

    return [];
};
