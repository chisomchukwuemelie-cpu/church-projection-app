
import { analyzeText } from '../src/services/gemini';

// Mock console.log to suppress noise but capture output
const originalLog = console.log;
let logs: string[] = [];
console.log = (...args) => {
    logs.push(args.join(' '));
    // originalLog(...args); // Uncomment to see logs
};

const runTest = async () => {
    originalLog("=== CONTEXT SPEED & ACCURACY TEST ===");

    // 1. Set Context
    originalLog("\n[STEP 1] Setting Context to 'Genesis'...");
    const res1 = await analyzeText("Genesis 1:1");
    if (res1?.reference === "Genesis 1:1") {
        originalLog("PASS: Context set to Genesis.");
    } else {
        originalLog("FAIL: Could not set context. Got: " + JSON.stringify(res1));
        return;
    }

    // 2. Test "2 8" Fast Path
    originalLog("\n[STEP 2] Testing '2 8' (Should be Genesis 2:8)...");
    const start = performance.now();
    const res2 = await analyzeText("2 8");
    const end = performance.now();
    const duration = end - start;

    if (res2?.reference === "Genesis 2:8") {
        originalLog(`PASS: '2 8' -> 'Genesis 2:8'`);
    } else {
        originalLog(`FAIL: '2 8' -> Expected 'Genesis 2:8', Got '${res2?.reference}'`);
    }

    if (duration < 50) { // arbitrary threshold for "Fast" (non-AI)
        originalLog(`PASS: Speed = ${duration.toFixed(2)}ms (Instant/Local)`);
    } else {
        originalLog(`WARN: Speed = ${duration.toFixed(2)}ms (Too slow, likely hit AI)`);
    }

    // 3. Test "2 1" vs "21"
    // "Two One" -> "2 1" -> "2:1"
    originalLog("\n[STEP 3] Testing '2 1' (Should be Genesis 2:1)...");
    const res3 = await analyzeText("2 1");
    if (res3?.reference === "Genesis 2:1") {
        originalLog(`PASS: '2 1' -> 'Genesis 2:1'`);
    } else {
        originalLog(`FAIL: '2 1' -> Expected 'Genesis 2:1', Got '${res3?.reference}'`);
    }

    // "Twenty One" -> "21"
    // Currently, single number "21" does NOT trigger my new logic (needs d:d).
    // It should probably fall to AI or be noise.
    originalLog("\n[STEP 4] Testing '21' (Single number)...");
    const res4 = await analyzeText("21");
    originalLog(`INFO: '21' result: ${JSON.stringify(res4)}`);
    // If it hits AI, it depends on prompt. But it shouldn't be "fast".
};

runTest().catch(e => originalLog(e));
