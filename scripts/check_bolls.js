
const translations = ['NIV', 'AMP', 'MSG', 'ESV', 'NLT', 'NKJV'];

async function checkTranslations() {
    console.log("Checking translations on bolls.life...");

    // Get list of all translations
    try {
        const response = await fetch('https://bolls.life/static/bolls/app/views/languages.json');
        if (!response.ok) throw new Error("Failed to fetch languages");

        // This endpoint might be wrong, let's try a known one or just try fetching a verse
        // Actually closest is /get-books/{translation}/

        for (const trans of translations) {
            const url = `https://bolls.life/get-books/${trans}/`;
            const res = await fetch(url);
            if (res.ok) {
                const books = await res.json();
                console.log(`[OK] ${trans}: Found ${books.length} books.`);
            } else {
                console.log(`[FAIL] ${trans}: ${res.status} ${res.statusText}`);
            }
        }

    } catch (e) {
        console.error("Error:", e);
    }
}

checkTranslations();
