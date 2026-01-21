
import { BIBLE_BOOKS } from '../src/services/gemini';

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
    let processedInput = input.toLowerCase()
        .replace(/\bfirst\b/g, '1')
        .replace(/\bsecond\b/g, '2')
        .replace(/\bthird\b/g, '3');

    const normalize = (s: string) => s.replace(/[^a-z0-9]/g, '');
    const cleanInput = normalize(processedInput);

    let bestMatch = null;
    let minDist = Infinity;

    const BIBLE_BOOKS_LIST = [
        "Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy", "Joshua", "Judges", "Ruth", "1 Samuel", "2 Samuel", "1 Kings", "2 Kings", "1 Chronicles", "2 Chronicles", "Ezra", "Nehemiah", "Esther", "Job", "Psalms", "Psalm", "Proverbs", "Ecclesiastes", "Song of Solomon", "Isaiah", "Jeremiah", "Lamentations", "Ezekiel", "Daniel", "Hosea", "Joel", "Amos", "Obadiah", "Jonah", "Micah", "Nahum", "Habakkuk", "Zephaniah", "Haggai", "Zechariah", "Malachi", "Matthew", "Mark", "Luke", "John", "Acts", "Romans", "1 Corinthians", "2 Corinthians", "Galatians", "Ephesians", "Philippians", "Colossians", "1 Thessalonians", "2 Thessalonians", "1 Timothy", "2 Timothy", "Titus", "Philemon", "Hebrews", "James", "1 Peter", "2 Peter", "1 John", "2 John", "3 John", "Jude", "Revelation"
    ];

    for (const book of BIBLE_BOOKS_LIST) {
        const cleanBook = normalize(book.toLowerCase());
        if (cleanBook === cleanInput) return book;

        const dist = levenshtein(cleanInput, cleanBook);

        // NEW STRICTER LOGIC
        // < 4 chars: Exact match only (0 tolerance) - prevents "Ian" -> "Dan"?
        // 4-6 chars: 1 edit tolerance.
        // > 6 chars: 2 edits tolerance.

        let threshold = 2; // Default for long words
        if (cleanBook.length < 4) threshold = 0;
        else if (cleanBook.length <= 6) threshold = 1;

        // Special cases:
        // "Matthew" (7 chars) -> threshold 2. "Math" (4). M-a-t-h vs M-a-t-t-h-e-w.
        // M=M, a=a, t=t, t!=h, h!=e, +w. Dist=3. "Math" fails. Correct.

        if (dist <= threshold && dist < minDist) {
            minDist = dist;
            bestMatch = book;
        }
    }
    return bestMatch;
};

// TEST CASES
const cases = [
    { input: "Exodus", expected: "Exodus" }, // Exact
    { input: "Exoduse", expected: "Exodus" }, // 1 extra char. Exodus(6) -> Thresh 1. Dist 1. Match? Yes.
    { input: "Exods", expected: "Exodus" }, // 1 missing. Match.
    { input: "Extras", expected: null }, // Extras (6) vs Exodus (6). Dist 3. Thresh 1. FAIL. GOOD.
    { input: "Genius", expected: null }, // Genius(6) vs Genesis(7). Dist 3. Thresh 2 (Genesis is 7). FAIL. GOOD.
    { input: "Song", expected: "Song of Solomon" }, // Song vs Song of Solomon. Dist 9. Fail. GOOD.
    { input: "Math", expected: null }, // Math vs Matthew (7). Dist 3. Thresh 2. FAIL. GOOD.
    { input: "Mathew", expected: "Matthew" }, // Mathew vs Matthew. Dist 1. Thresh 2. Match. GOOD.
    { input: "Fillipians", expected: "Philippians" }, // Fillipians(10) vs Philippians(11).
    // F!=P, i!=h, l=i, l=l, i=i, p=p, i=p?? 
    // Let's rely on test execution.
];

console.log("=== STRICTER FUZZY MATCH TEST ===");
cases.forEach(c => {
    const res = findClosestBook(c.input);
    const passed = (res === c.expected);

    if (passed) {
        console.log(`[PASS] '${c.input}' -> '${res}'`);
    } else {
        console.log(`[FAIL] '${c.input}' -> Expected '${c.expected}', Got '${res}'`);
    }
});
