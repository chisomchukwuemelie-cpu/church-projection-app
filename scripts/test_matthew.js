
const BOLLS_BOOKS = {
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

// Simulation of searchBible
async function searchBible(query, translation = 'kjv') {
    const cleanRef = query.trim().toLowerCase();
    const requestedTranslation = translation.toLowerCase();

    // PARSE REFERENCE
    const refMatch = cleanRef.match(/^(\d?\s?[a-z\s]+)\s+(?:chapter\s+)?(\d+)[:\s](\d+)(?:-(\d+))?$/i);
    let parsed = null;

    if (refMatch) {
        parsed = {
            book: refMatch[1].trim(),
            chapter: parseInt(refMatch[2]),
            startVerse: parseInt(refMatch[3]),
            endVerse: refMatch[4] ? parseInt(refMatch[4]) : undefined
        };
        console.log("PARSED:", parsed);
    } else {
        console.log("PARSE FAILED for:", cleanRef);
        return;
    }

    // 3. FALLBACK: BIBLE-API.COM (KJV)
    try {
        const url = `https://bible-api.com/${encodeURIComponent(query)}?translation=kjv`;
        console.log(`FETCHING: ${url}`);
        const response = await fetch(url);
        if (response.ok) {
            const data = await response.json();
            if (data.verses) {
                console.log(`SUCCESS: Found ${data.verses.length} verses.`);
                console.log(`TEXT: ${data.verses[0].text}`);
            } else {
                console.log("API returned OK but no verses.");
            }
        } else {
            console.log("API Error Status:", response.status);
        }
    } catch (e) {
        console.error("Fetch Error:", e);
    }
}

searchBible("matthew 6:4");
