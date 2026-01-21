
// POLYFILLS for Node Environment
global.localStorage = {
    _data: {},
    getItem: function (key) { return this._data[key] || null; },
    setItem: function (key, val) { this._data[key] = val; },
    removeItem: function (key) { delete this._data[key]; }
};

// MOCK FETCH for File System (since we are in Node, not Browser)
// We sadly can't easily mock the 'fetch("/bibles/...")' logic which is browser-relative.
// So we will verify the API Fallback paths mainly,/
// OR we can rely on BibleService to catch the fetch error and fall back to remote.

// Import Services
// Note: We need to use tsx to run this.
import { searchBible } from '../src/services/BibleService';
import { getSongs, searchSongs, saveSong } from '../src/services/SongService'; // Fixed path
import { getThemeByKeyword } from '../src/services/ThemeService';

async function runTests() {
    console.log("=== STARTING FEATURE VERIFICATION ===");

    // 1. TEST SONGS
    console.log("\n--- Testing Songs ---");
    const initialSongs = getSongs();
    console.log(`Initial Songs: ${initialSongs.length}`); // Should be 2 (seed)

    saveSong({ id: 'test', title: 'Test Song', lyrics: 'This is a test song\nHallelujah' });
    const addedSongs = getSongs();
    console.log(`After Add: ${addedSongs.length}`); // Should be 3

    const searchRes = searchSongs('hallelujah');
    console.log(`Search 'hallelujah': Found ${searchRes.length} (Expected 1)`);
    if (searchRes.length > 0 && searchRes[0].title === 'Test Song') console.log("✔ Song Search PASS");
    else console.error("❌ Song Search FAIL");

    // 2. TEST THEMES
    console.log("\n--- Testing Themes ---");
    const t1 = getThemeByKeyword('mountains');
    const t2 = getThemeByKeyword('blue');
    const t3 = getThemeByKeyword('unknown thing');

    if (t1 && t1.name === 'Mountains') console.log("✔ Theme 'matches' PASS");
    else console.error("❌ Theme 'mountains' FAIL");

    if (t2 && t2.name === 'Deep Blue') console.log("✔ Theme 'blue' PASS");
    else console.error("❌ Theme 'blue' FAIL");

    if (t3 === null) console.log("✔ Theme 'unknown' PASS");
    else console.error("❌ Theme 'unknown' FAIL");

    // 3. TEST BIBLE (Remote API Fallback)
    // Since we can't serve the local JSONs in this node script easily, this primarily tests the API fallback logic
    console.log("\n--- Testing Bible (External APIs) ---");
    try {
        const verses = await searchBible("John 3:16", "KJV");
        if (verses.length > 0 && verses[0].text.includes("loved")) {
            console.log(`✔ Bible Fetch KJV PASS: "${verses[0].reference}"`);
        } else {
            console.error("❌ Bible Fetch KJV FAIL");
            console.log(verses);
        }
    } catch (e) {
        console.error("❌ Bible Fetch Error:", e);
    }

    console.log("\n=== VERIFICATION COMPLETE ===");
}

runTests();
