
export const BIBLE_BOOKS = [
    "Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy", "Joshua", "Judges", "Ruth", "1 Samuel", "2 Samuel", "1 Kings", "2 Kings", "1 Chronicles", "2 Chronicles", "Ezra", "Nehemiah", "Esther", "Job", "Psalms", "Proverbs", "Ecclesiastes", "Song of Solomon", "Isaiah", "Jeremiah", "Lamentations", "Ezekiel", "Daniel", "Hosea", "Joel", "Amos", "Obadiah", "Jonah", "Micah", "Nahum", "Habakkuk", "Zephaniah", "Haggai", "Zechariah", "Malachi", "Matthew", "Mark", "Luke", "John", "Acts", "Romans", "1 Corinthians", "2 Corinthians", "Galatians", "Ephesians", "Philippians", "Colossians", "1 Thessalonians", "2 Thessalonians", "1 Timothy", "2 Timothy", "Titus", "Philemon", "Hebrews", "James", "1 Peter", "2 Peter", "1 John", "2 John", "3 John", "Jude", "Revelation"
];

export const BIBLE_CHAPTER_LIMITS: Record<string, number> = {
    "Genesis": 50, "Exodus": 40, "Leviticus": 27, "Numbers": 36, "Deuteronomy": 34,
    "Joshua": 24, "Judges": 21, "Ruth": 4, "1 Samuel": 31, "2 Samuel": 24,
    "1 Kings": 22, "2 Kings": 25, "1 Chronicles": 29, "2 Chronicles": 36,
    "Ezra": 10, "Nehemiah": 13, "Esther": 10, "Job": 42, "Psalms": 150,
    "Proverbs": 31, "Ecclesiastes": 12, "Song of Solomon": 8, "Isaiah": 66,
    "Jeremiah": 52, "Lamentations": 5, "Ezekiel": 48, "Daniel": 12, "Hosea": 14,
    "Joel": 3, "Amos": 9, "Obadiah": 1, "Jonah": 4, "Micah": 7, "Nahum": 3,
    "Habakkuk": 3, "Zephaniah": 3, "Haggai": 2, "Zechariah": 14, "Malachi": 4,
    "Matthew": 28, "Mark": 16, "Luke": 24, "John": 21, "Acts": 28, "Romans": 16,
    "1 Corinthians": 16, "2 Corinthians": 13, "Galatians": 6, "Ephesians": 6,
    "Philippians": 4, "Colossians": 4, "1 Thessalonians": 5, "2 Thessalonians": 3,
    "1 Timothy": 6, "2 Timothy": 4, "Titus": 3, "Philemon": 1, "Hebrews": 13,
    "James": 5, "1 Peter": 5, "2 Peter": 3, "1 John": 5, "2 John": 1, "3 John": 1,
    "Jude": 1, "Revelation": 22
};

export const TRANSLATION_MAP: Record<string, string> = {
    "niv": "NIV", "kjv": "KJV", "nkjv": "NKJV", "esv": "ESV", "nlt": "NLT",
    "amp": "AMP", "amplified": "AMP", "msg": "MSG", "message": "MSG", "web": "WEB",
    "new international": "NIV", "king james": "KJV", "new king james": "NKJV",
    "standard": "ESV", "reading": "NIV", "tpt": "TPT"
};

export const PREPROCESS_MAP: Record<string, string> = {
    "one": "1", "two": "2", "three": "3", "four": "4", "five": "5",
    "six": "6", "seven": "7", "eight": "8", "nine": "9", "ten": "10",
    "eleven": "11", "twelve": "12", "thirteen": "13", "fourteen": "14", "fifteen": "15",
    "twenty": "20", "thirty": "30", "forty": "40", "fifty": "50",
    "first": "1", "second": "2", "third": "3", "fourth": "4", "fifth": "5"
};

export const BIBLE_HOMOPHONES: Record<string, string> = {
    "gene see": "genesis", "jenesis": "genesis", "genesis": "genesis", "agencies": "genesis",
    "ex odus": "exodus", "leviticus": "leviticus", "exit us": "exodus", "eggs odus": "exodus",
    "due to ron o me": "deuteronomy", "dude a ron a me": "deuteronomy",
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
    "sams": "psalms", "sam": "psalms", "psalm": "psalms", "songs": "psalms", "palm": "psalms", "palms": "psalms", "alms": "psalms",
    "pro verbs": "proverbs", "eccle siastes": "ecclesiastes", "ecclesiastics": "ecclesiastes",
    "song of songs": "song of solomon", "solomon": "song of solomon", "song": "song of solomon",
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
    "ephesians": "ephesians", "efficiency": "ephesians", "efficiencies": "ephesians", "fees in": "ephesians",
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

export const SCRIPTURE_REGEX = /(\d?\s?[a-zA-Z\s]+?)\s+(?:chapter\s+)?(\d+)(?:\s*(?::|v\.?|verse)\s*|\s+)(\d+)(?:\s*(?:-|to|through)\s*(\d+))?(?:\s+(?:in|from|read|version|the|of)*\s*([a-zA-Z\s]+))?/i;
export const PARTIAL_SCRIPTURE_REGEX = /(\d?\s?[a-zA-Z\s]+?)\s+(?:chapter\s+)?(\d+)(?!\s*[:\d])/i;
