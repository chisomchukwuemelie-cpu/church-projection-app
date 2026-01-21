
import { analyzeText } from '../src/services/gemini';

// Mock console.log
const originalLog = console.log;
let logs: string[] = [];
console.log = (...args) => {
    logs.push(args.join(' '));
    originalLog(...args); // Uncomment to see logs
};

const runTest = async () => {
    originalLog("=== PARTIAL MATCH DETERMINISM TEST ===");

    // Test 1: "Genesis 21" (Standard) -> Genesis 21:1
    originalLog("\n[TEST 1] 'Genesis 21'");
    const res1 = await analyzeText("Genesis 21");
    if (res1?.reference === "Genesis 21:1") {
        originalLog("PASS: Genesis 21 -> Genesis 21:1");
    } else {
        originalLog(`FAIL: Genesis 21 -> Expected 'Genesis 21:1', Got '${res1?.reference}'`);
    }

    // Test 2: "Genesis 128" (Oversized) -> Genesis 12:8
    // Genesis Max Ch = 50. 128 > 50. Try Split -> 12:8.
    originalLog("\n[TEST 2] 'Genesis 128'");
    const res2 = await analyzeText("Genesis 128");
    if (res2?.reference === "Genesis 12:8") {
        originalLog("PASS: Genesis 128 -> Genesis 12:8");
    } else {
        originalLog(`FAIL: Genesis 128 -> Expected 'Genesis 12:8', Got '${res2?.reference}'`);
    }

    // Test 3: "Jude 5" (Single Chapter) -> Jude 1:5
    originalLog("\n[TEST 3] 'Jude 5'");
    const res3 = await analyzeText("Jude 5");
    if (res3?.reference === "Jude 1:5") {
        originalLog("PASS: Jude 5 -> Jude 1:5");
    } else {
        originalLog(`FAIL: Jude 5 -> Expected 'Jude 1:5', Got '${res3?.reference}'`);
    }
};

runTest().catch(console.error);
