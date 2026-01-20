
const PREPROCESS_MAP = {
    "one": "1", "two": "2", "three": "3", "four": "4", "five": "5",
    "six": "6", "seven": "7", "eight": "8", "nine": "9", "ten": "10",
    "eleven": "11", "twelve": "12", "thirteen": "13", "fourteen": "14", "fifteen": "15",
    "twenty": "20", "thirty": "30", "forty": "40", "fifty": "50",
    "first": "1", "second": "2", "third": "3", "fourth": "4", "fifth": "5"
};

const preprocessText = (text) => {
    const processed = text.toLowerCase().split(/\s+/).map(word => {
        const clean = word.replace(/[^a-z]/g, '');
        return PREPROCESS_MAP[clean] || word;
    }).join(' ');
    return processed.replace(/(\d)\s+(\d)/g, '$1:$2');
};

const SCRIPTURE_REGEX = /(\d?\s?[a-zA-Z]+)\s+(?:chapter\s+)?(\d+)(?:\s*(?::|v\.?|verse)\s*|\s+)(\d+)(?:\s+(?:in|from|read|version|the|of)*\s*([a-zA-Z\s]+))?/i;

const BIBLE_BOOKS = [
    "genesis", "exodus", "1 corinthians", "2 corinthians", "psalms"
];

const levenshtein = (a, b) => {
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

const findClosestBook = (input) => {
    let processedInput = input.toLowerCase()
        .replace(/\bfirst\b/g, '1')
        .replace(/\bsecond\b/g, '2')
        .replace(/\bthird\b/g, '3');
    const normalize = (s) => s.replace(/[^a-z0-9]/g, '');
    const cleanInput = normalize(processedInput);
    let bestMatch = null;
    let minDist = Infinity;
    for (const book of BIBLE_BOOKS) {
        const cleanBook = normalize(book);
        if (cleanBook === cleanInput) return book;
        const dist = levenshtein(cleanInput, cleanBook);
        const threshold = cleanBook.length < 5 ? 1 : 3;
        if (dist <= threshold && dist < minDist) {
            minDist = dist;
            bestMatch = book;
        }
    }
    return bestMatch;
};

const inputs = [
    "Corinthians 5 12",
    "Corinthians 5 1 2",
    "First Corinthians 5 12",
    "Genesis 1 1",
    "Genesis One One",
    "Corinthians Chapter 5 Verse 12"
];

inputs.forEach(input => {
    const p = preprocessText(input);
    console.log(`\nRAW: "${input}"`);
    console.log(`PRE: "${p}"`);
    const match = p.match(SCRIPTURE_REGEX);
    if (match) {
        const fuzzyBook = findClosestBook(match[1]);
        console.log(`MATCH: Book="${match[1]}" -> Fuzzy="${fuzzyBook}" Ch="${match[2]}" V="${match[3]}"`);
    } else {
        console.log("NO MATCH");
    }
});
