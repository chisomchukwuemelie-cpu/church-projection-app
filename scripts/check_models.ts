
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
dotenv.config();

const run = async () => {
    const key = process.env.VITE_GEMINI_API_KEY;
    if (!key) {
        console.error("No API Key found");
        return;
    }
    const genAI = new GoogleGenerativeAI(key);
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        // Note: SDK doesn't have a direct 'listModels' on the main class in some versions, 
        // but let's try to see if we can just test a simple prompt with 'gemini-pro' first.
        // Actually, let's try to query the unexpected model just to see error, 
        // or finding a way to list models if the SDK supports it.
        // The error message said: "Call ListModels to see the list..."

        // But strictly for the SDK, usually it's hard to list models without using the REST API directly or specific SDK method?
        // Let's try to use 'gemini-pro' and see if it works.

        console.log("Trying gemini-pro...");
        const proModel = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await proModel.generateContent("Hello");
        console.log("gemini-pro result:", result.response.text());

        console.log("Trying gemini-1.5-flash...");
        const flashModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const flashResult = await flashModel.generateContent("Hello");
        console.log("gemini-1.5-flash result:", flashResult.response.text());

    } catch (e: any) {
        console.error("Error:", e.message);
    }
}
run();
