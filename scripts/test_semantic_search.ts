import 'dotenv/config';
import { analyzeText } from '../src/services/gemini/index';
import dotenv from 'dotenv';
dotenv.config();

const RUN_TESTS = async () => {
    console.log("Running Semantic Scripture Search Tests...\n");

    const testCases = [
        "The Lord is my shepherd I shall not want", // Psalm 23:1
        "Jesus wept", // John 11:35
        "For God so loved the world that he gave his only begotten son", // John 3:16
        "In the beginning God created the heavens and the earth", // Genesis 1:1
        "I can do all things through Christ who strengthens me" // Philippians 4:13
    ];

    for (const text of testCases) {
        console.log(`\nInput: "${text}"`);
        try {
            const result = await analyzeText(text);
            console.log("Result:", JSON.stringify(result, null, 2));
        } catch (error) {
            console.error("Error:", error);
        }
        // Rate limit protection
        await new Promise(resolve => setTimeout(resolve, 35000));
    }
};

RUN_TESTS();
