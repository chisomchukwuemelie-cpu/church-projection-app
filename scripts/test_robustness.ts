
import { analyzeText } from '../src/services/gemini';

async function runTests() {
    console.log("=== STARTING SLASH VERIFICATION ===");

    // TEST 1: Deterministic Parsing of "Matthew 6 4"
    console.log("\n[TEST 1] Testing 'Matthew 6 4'");
    const res3 = await analyzeText("Matthew 6 4");
    if (res3 && res3.reference === "Matthew 6:4") {
        console.log("PASS: Matthew 6:4 detected");
    } else {
        console.log("FAIL/AI: Got", res3);
    }

    // TEST 2: Slash Parsing "exodus 12/8"
    // Users reported this was "Noise". It should be "Exodus 12:8".
    console.log("\n[TEST 2] Testing Slash: 'exodus 12/8'");
    const res4 = await analyzeText("exodus 12/8");
    if (res4 && res4.reference === "Exodus 12:8") {
        console.log("PASS: Exodus 12:8 detected from slash input");
    } else {
        console.log("FAIL: Got", res4);
    }

    // TEST 3: Slash Parsing "12/8" (Contextless - should be noise or fallback? Without context it won't be a book)
    // Actually, "12/8" alone without LastBook is invalid.
    // But "exodus 12/8" IS valid.

    console.log("=== DONE ===");
}

runTests();
