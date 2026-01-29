
import 'dotenv/config';

const run = async () => {
    const key = process.env.VITE_GEMINI_API_KEY;
    if (!key) {
        console.error("No API Key");
        return;
    }
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        const flashModels = data.models.filter((m: any) => m.name.includes('flash') && m.supportedGenerationMethods.includes('generateContent'));
        console.log("Flash Models:", JSON.stringify(flashModels.map((m: any) => m.name), null, 2));
    } catch (e) {
        console.error("Error:", e);
    }
}
run();
