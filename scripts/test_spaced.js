
const PREPROCESS_MAP = {
    "one": "1", "two": "2", "three": "3", "four": "4", "five": "5",
    "six": "6", "seven": "7", "eight": "8", "nine": "9", "ten": "10",
    "eleven": "11", "twelve": "12", "thirteen": "13", "fourteen": "14", "fifteen": "15",
    "twenty": "20", "thirty": "30", "forty": "40", "fifty": "50",
    "first": "1", "second": "2", "third": "3", "fourth": "4", "fifth": "5",
    "colon": ":"
};

const preprocessText = (text) => {
    let processed = text.replace(/[,.-]/g, ' ');

    processed = processed.toLowerCase().split(/\s+/).map(word => {
        const clean = word.replace(/[^a-z0-9:]/g, '');
        return PREPROCESS_MAP[clean] || word;
    }).join(' ');

    processed = processed.replace(/\bbook of\b/g, '');

    // Explicitly remove "space" word if user says it?
    // processed = processed.replace(/\bspace\b/g, ' '); 

    // Heuristic
    return processed.replace(/(\d)\s+(\d)/g, '$1:$2');
};

const SCRIPTURE_REGEX = /(\d?\s?[a-zA-Z\s]+?)\s+(?:chapter\s+)?(\d+)(?:\s*(?::|v\.?|verse)\s*|\s+)(\d+)(?:\s+(?:in|from|read|version|the|of)*\s*([a-zA-Z\s]+))?/i;

const inputs = [
    "Genesis 1 1",
    "Genesis 1   1",
    "Genesis 1 verse 1",
    "Genesis one one",
    "song of solomon 1 1",
    "1 kings 1 1",
    "First Kings 1 1"
];

inputs.forEach(input => {
    const p = preprocessText(input);
    console.log(`\nRAW: "${input}"`);
    console.log(`PRE: "${p}"`);
    const match = p.match(SCRIPTURE_REGEX);
    if (match) {
        console.log(`MATCH: "${match[0]}" -> Book="${match[1]}" Ch="${match[2]}" V="${match[3]}"`);
    } else {
        console.log("NO MATCH");
    }
});
