
import { preprocessText, findClosestBook } from '../src/services/gemini/utils';
import { BIBLE_BOOKS } from '../src/services/gemini/constants';

console.log("=== UNIVERSAL PHONETIC TEST ===\n");

const scenarios = [
    // Original User Complaint
    { input: "Efficiency 4 7", expectedBook: "Ephesians", note: "Efficiency -> Ephesians" },

    // Hard Phonetics
    { input: "Gen a sis 1 1", expectedBook: "Genesis", note: "Phonetic Genesis" },
    { input: "X O DUS 2 1", expectedBook: "Exodus", note: "Xodus" },
    { input: "Fill a mon 1 2", expectedBook: "Philemon", note: "Philemon (F match)" },
    { input: "Reve lay shun 3 1", expectedBook: "Revelation", note: "Revelation" },
    { input: "Sam 23", expectedBook: "Psalms", note: "Psalm/Sam" },
    { input: "Agencies 1 1", expectedBook: "Genesis", note: "Agencies -> Genesis" },
    { input: "Exit us 20", expectedBook: "Exodus", note: "Exit us -> Exodus" },
    // Numbered Books
    { input: "1 Peter 2 3", expectedBook: "1 Peter", note: "Numbered" },
    { input: "2 John 1 1", expectedBook: "2 John", note: "Numbered" },

    // Messy Verse Patterns
    { input: "John 3 16", expectedBook: "John", note: "Space instead of colon" },
    { input: "John chapter 3 verse 16", expectedBook: "John", note: "Explicit words" },
    { input: "Genesis 1 1 to 5", expectedBook: "Genesis", note: "Verse range" },
    { input: "Ephesians 2 8 and 9", expectedBook: "Ephesians", note: "Verse range with and" }
];

let passes = 0;

scenarios.forEach(sc => {
    console.log(`Input: "${sc.input}"`);

    // 1. Preprocess
    const processed = preprocessText(sc.input);
    console.log(`  -> Preprocessed: "${processed}"`);

    // 2. Extract potential book (Simulate STT -> Regex)
    // SCRIPTURE_REGEX: /(\d?\s?[a-zA-Z\s]+?)\s+(?:chapter\s+)?(\d+)(?:\s*(?::|v\.?|verse)\s*|\s+)(\d+)
    const match = processed.match(/(\d?\s?[a-zA-Z\s]+?)\s+(?:chapter\s+)?(\d+)[:\s](\d+)/i);
    const potentialBook = match ? match[1].trim() : processed.split(/[\d:]/)[0].trim();
    console.log(`  -> Candidate Book String: "${potentialBook}"`);

    // 3. Find Closest
    const finalMatch = findClosestBook(potentialBook);
    console.log(`  -> Final Match: ${finalMatch || 'NULL'}`);

    if (finalMatch === sc.expectedBook) {
        console.log("  ✅ PASS");
        passes++;
    } else {
        console.log(`  ❌ FAIL (Expected ${sc.expectedBook})`);
    }
    console.log("---");
});

console.log(`\nResult: ${passes}/${scenarios.length} Passed`);
