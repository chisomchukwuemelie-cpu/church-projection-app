
const BIBLE_BOOKS = [
    "Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy", "Joshua", "Judges", "Ruth", "1 Samuel", "2 Samuel", "1 Kings", "2 Kings", "1 Chronicles", "2 Chronicles", "Ezra", "Nehemiah", "Esther", "Job", "Psalms", "Psalm", "Proverbs", "Ecclesiastes", "Song of Solomon", "Isaiah", "Jeremiah", "Lamentations", "Ezekiel", "Daniel", "Hosea", "Joel", "Amos", "Obadiah", "Jonah", "Micah", "Nahum", "Habakkuk", "Zephaniah", "Haggai", "Zechariah", "Malachi", "Matthew", "Mark", "Luke", "John", "Acts", "Romans", "1 Corinthians", "2 Corinthians", "Galatians", "Ephesians", "Philippians", "Colossians", "1 Thessalonians", "2 Thessalonians", "1 Timothy", "2 Timothy", "Titus", "Philemon", "Hebrews", "James", "1 Peter", "2 Peter", "1 John", "2 John", "3 John", "Jude", "Revelation"
];

const PREPROCESS_MAP = {
    "one": "1", "two": "2", "three": "3", "four": "4", "five": "5",
    "six": "6", "seven": "7", "eight": "8", "nine": "9", "ten": "10",
    "eleven": "11", "twelve": "12", "thirteen": "13", "fourteen": "14", "fifteen": "15",
    "twenty": "20", "thirty": "30", "forty": "40", "fifty": "50",
    "first": "1", "second": "2", "third": "3", "fourth": "4", "fifth": "5"
};

const BIBLE_HOMOPHONES = {
    "gene see": "genesis", "jenesis": "genesis", "genesis": "genesis",
    "ex odus": "exodus", "leviticus": "leviticus",
    "josh wa": "joshua", "joshua": "joshua",
    "judges": "judges", "judgez": "judges",
    "ruth": "ruth", "root": "ruth", "roof": "ruth",
    "first samuel": "1 samuel", "1st samuel": "1 samuel",
    "second samuel": "2 samuel", "2nd samuel": "2 samuel",
    "first kings": "1 kings", "1st kings": "1 kings",
    "second kings": "2 kings", "2nd kings": "2 kings",
    "first chronicles": "1 chronicles", "1st chronicles": "1 chronicles",
    "second chronicles": "2 chronicles", "2nd chronicles": "2 chronicles",
    "ezra": "ezra",
    "nehemiah": "nehemiah", "nehemia": "nehemiah",
    "esther": "esther", "easter": "esther",
    "job": "job",
    "sams": "psalms", "sam": "psalm", "psalm": "psalm", "songs": "psalms", "palm": "psalm", "palms": "psalms", "alms": "psalms",
    "pro verbs": "proverbs", "eccle siastes": "ecclesiastes", "ecclesiastics": "ecclesiastes",
    "song of songs": "song of solomon", "solomon": "song of solomon",
    "isa ah": "isaiah", "eye zaya": "isaiah", "isiah": "isaiah",
    "jeremiah": "jeremiah", "jerry meyer": "jeremiah",
    "lamentations": "lamentations", "lamentation": "lamentations",
    "ezekiel": "ezekiel",
    "daniel": "daniel",
    "hosea": "hosea", "jose a": "hosea",
    "joel": "joel", "jole": "joel",
    "amos": "amos", "famous": "amos",
    "obadiah": "obadiah",
    "jonah": "jonah",
    "micah": "micah", "mike a": "micah",
    "nahum": "nahum",
    "habakkuk": "habakkuk", "have a cook": "habakkuk",
    "zephaniah": "zephaniah", "zephyr": "zephaniah",
    "haggai": "haggai",
    "zechariah": "zechariah",
    "malachi": "malachi", "ma la kai": "malachi", "my latch key": "malachi",
    "math you": "matthew", "mathew": "matthew", "math ew": "matthew", "matthew": "matthew",
    "mark": "mark",
    "luke": "luke",
    "john": "john",
    "ax": "acts", "act": "acts", "axe": "acts", "ask": "acts",
    "rome ans": "romans", "roman": "romans", "romans": "romans",
    "corinthians": "corinthians",
    "galatians": "galatians", "galations": "galatians",
    "ephesians": "ephesians",
    "philip ians": "philippians", "filippians": "philippians", "phillipians": "philippians", "phillip": "philippians",
    "colossians": "colossians", "collision": "colossians",
    "thessalonians": "thessalonians",
    "timothy": "timothy", "tim": "timothy",
    "titus": "titus", "tight us": "titus",
    "file mon": "philemon", "philemon": "philemon", "filament": "philemon",
    "hebrews": "hebrews", "he brews": "hebrews",
    "james": "james",
    "peter": "peter",
    "jude": "jude", "hey jude": "jude", "judy": "jude", "jew": "jude",
    "revelation": "revelation", "revelations": "revelation"
};

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

    // Exact match first
    for (const book of BIBLE_BOOKS) {
        if (normalize(book.toLowerCase()) === cleanInput) return book;
    }

    for (const book of BIBLE_BOOKS) {
        const cleanBook = normalize(book.toLowerCase());
        const dist = levenshtein(cleanInput, cleanBook);
        const threshold = cleanBook.length < 5 ? 1 : 3;

        if (dist <= threshold && dist < minDist) {
            minDist = dist;
            bestMatch = book;
        }
    }
    return bestMatch;
};

const preprocessText = (text) => {
    let processed = text.replace(/[,.-]/g, ' ');

    for (const [bad, good] of Object.entries(BIBLE_HOMOPHONES)) {
        const regex = new RegExp(`\\b${bad}\\b`, 'gi');
        processed = processed.replace(regex, good);
    }

    processed = processed.toLowerCase().split(/\s+/).map(word => {
        const clean = word.replace(/[^a-z0-9:]/g, '');
        return PREPROCESS_MAP[clean] || word;
    }).join(' ');

    processed = processed.replace(/\bbook of\b/g, '');
    processed = processed.replace(/\band\b/g, ' ');
    processed = processed.replace(/\bpoint\b/g, ' ');
    processed = processed.replace(/\bdot\b/g, ' ');
    processed = processed.replace(/\bchapter\b/g, ' ');
    processed = processed.replace(/\bverse\b/g, ' ');

    // Heuristic: "1 1" -> "1:1"
    processed = processed.replace(/(\d+)\s+(\d+)/g, '$1:$2');

    return processed;
};

// Simulation of SCRIPTURE_REGEX
const SCRIPTURE_REGEX = /(\d?\s?[a-zA-Z\s]+?)\s+(?:chapter\s+)?(\d+)(?:\s*(?::|v\.?|verse)\s*|\s+)(\d+)(?:\s+(?:in|from|read|version|the|of)*\s*([a-zA-Z\s]+))?/i;

function test(input) {
    console.log(`\nInput: "${input}"`);
    const processed = preprocessText(input);
    console.log(`Processed: "${processed}"`);

    const match = processed.match(SCRIPTURE_REGEX);
    if (match) {
        const bookCandidate = match[1].trim();
        const validBook = findClosestBook(bookCandidate);
        console.log(`MATCH: ${validBook} ${match[2]}:${match[3]}`);
    } else {
        console.log("NO REGEX MATCH");
    }
}

// TEST CASES
const cases = [
    "Matthew 4 and 5",
    "Math you 5 7",
    "Genesis 1 1",
    "First John 1 9",
    "1 John 1:9",
    "Psalms 23 1",
    "Philemon 1 5",
    "Jude 5",
    "Acts 2 38",
    "Ax 2 38",
    "Revelations 21 4",
    "He brews 11 1",
    "First Samuel 3 4",
    "Second Kings 2 9",
    "Easter 4 14",
    "Root 1 16",
    "Tight us 2 1",
    "Filament 1 6",
    "Ma la kai 3 10",
    "Have a cook 2 4",
    "Zephyr 3 17",
    "Collision 3 23",
    "Judy 1 24",
    "Jew 1 24" // Might be risky if "Jew" is used in other contexts, but context of numbers helps
];

cases.forEach(test);
