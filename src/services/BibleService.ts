
export interface BibleVerse {
    reference: string;
    text: string;
    book_name: string;
    chapter: number;
    verse: number;
}

export const searchBible = async (query: string): Promise<BibleVerse[]> => {
    // Primary API: bible-api.com
    const url = `https://bible-api.com/${encodeURIComponent(query)}?translation=kjv`;
    console.log("DEBUG: BibleService calling primary URL:", url);

    try {
        const response = await fetch(url);
        if (response.ok) {
            const data = await response.json();
            if (data.verses && data.verses.length > 0) {
                return data.verses.map((v: any) => ({
                    reference: `${v.book_name} ${v.chapter}:${v.verse}`,
                    text: v.text.trim(),
                    book_name: v.book_name,
                    chapter: v.chapter,
                    verse: v.verse
                }));
            } else if (data.text) {
                return [{
                    reference: data.reference || query,
                    text: data.text.trim(),
                    book_name: '',
                    chapter: 0,
                    verse: 0
                }];
            }
        }
    } catch (e) {
        console.warn("DEBUG: Primary Bible API failed, trying fallback...", e);
    }

    // Fallback API: labs.bible.org (NET Bible, but very reliable for testing connection)
    // Note: This API returns plain text usually, we use it as a 'last resort' 
    // to prove connectivity and provide some content.
    try {
        const fallbackUrl = `https://labs.bible.org/api/?passage=${encodeURIComponent(query)}&type=json`;
        console.log("DEBUG: BibleService calling fallback URL:", fallbackUrl);
        const fbResponse = await fetch(fallbackUrl);
        if (fbResponse.ok) {
            const fbData = await fbResponse.json();
            if (Array.isArray(fbData) && fbData.length > 0) {
                return fbData.map((v: any) => ({
                    reference: `${v.bookname} ${v.chapter}:${v.verse}`,
                    text: v.text.trim(),
                    book_name: v.bookname,
                    chapter: parseInt(v.chapter),
                    verse: parseInt(v.verse)
                }));
            }
        }
    } catch (e) {
        console.error("DEBUG: Fallback Bible API also failed:", e);
    }

    return [];
};
