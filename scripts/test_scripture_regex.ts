
const cases = [
    "16 For God so loved...",
    "16. For God so loved...",
    "16  For God so loved...",
    "(16) For God so loved...",
    "[16] For God so loved...",
    "10-12 For God so loved...",
    "  16  For God so loved...",
    "And God430 called7121 the dry3004 land Earth776", // Strong's numbers
    "For God so loved..." // Should remain unchanged
];

const cleanVerseText = (raw: string) => {
    if (!raw) return "";
    let text = raw.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
    // THE REGEX BEING TESTED
    text = text.replace(/^[\s\d\.\-\[\]\(\)]+/, '');
    // Strong's Fix
    text = text.replace(/([a-zA-Z])\d+/g, '$1');
    return text.trim();
};

cases.forEach(c => {
    console.log(`Input: "${c}"`);
    console.log(`Output: "${cleanVerseText(c)}"`);
    console.log('---');
});
