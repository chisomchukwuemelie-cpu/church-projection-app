const BIBLE_BOOKS = [
    "genesis", "exodus"
]; // simplified for test

const SCRIPTURE_REGEX = /(\d?\s?[a-zA-Z]+)\s+(?:chapter\s+)?(\d+)(?:\s*(?::|v\.?|verse)\s*|\s+)(\d+)(?:\s+(?:in|from|read|version|the|of)*\s*([a-zA-Z\s]+))?/i;
const PARTIAL_SCRIPTURE_REGEX = /(\d?\s?[a-zA-Z]+)\s+(?:chapter\s+)?(\d+)(?!\s*[:\d])/i;

const inputs = [
    "Genesis 1:1",
    "Genesis 1 1",
    "Genesis 11",
    "Genesis Chapter 1 Verse 1",
    "Genesis Chapter 1",
    "Genesis Chapter"
];

const PREPROCESS_MAP = {
    "one": "1", "two": "2", "three": "3", "four": "4", "five": "5",
    "six": "6", "seven": "7", "eight": "8", "nine": "9", "ten": "10",
    "eleven": "11", "twelve": "12", "thirteen": "13", "fourteen": "14", "fifteen": "15",
    "twenty": "20", "thirty": "30", "forty": "40", "fifty": "50",
    "first": "1", "second": "2", "third": "3", "fourth": "4", "fifth": "5"
};
const preprocessText = (text) => text.toLowerCase().split(/\s+/).map(w => PREPROCESS_MAP[w.replace(/[^a-z]/g, '')] || w).join(' ');

inputs.forEach(input => {
    const processed = preprocessText(input);
    console.log(`\nInput: "${input}" -> Preprocessed: "${processed}"`);
    let match = processed.match(SCRIPTURE_REGEX);
    if (match) {
        console.log(`  FULL REGEX MATCH: Book="${match[1]}" Ch="${match[2]}" V="${match[3]}"`);
    } else {
        console.log(`  FULL REGEX FAIL`);
        match = input.match(PARTIAL_SCRIPTURE_REGEX);
        if (match) {
            console.log(`  PARTIAL MATCH: Book="${match[1]}" Ch="${match[2]}"`);
        } else {
            console.log(`  PARTIAL FAIL`);
        }
    }
});
