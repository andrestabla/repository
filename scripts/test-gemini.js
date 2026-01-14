const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs");
const path = require("path");

function getApiKey() {
    try {
        const envPath = path.join(process.cwd(), ".env");
        if (fs.existsSync(envPath)) {
            const env = fs.readFileSync(envPath, "utf-8");
            const match = env.match(/GEMINI_API_KEY=["']?([^"'\n]+)["']?/);
            if (match) return match[1];
        }
    } catch (e) { }
    return process.env.GEMINI_API_KEY;
}

async function testGemini() {
    const apiKey = getApiKey();
    if (!apiKey) {
        console.error("No API Key found");
        return;
    }

    const models = [
        "gemini-1.5-flash",
        "gemini-1.5-flash-latest",
        "gemini-1.5-flash-8b",
        "gemini-1.5-pro",
        "gemini-pro",
        "gemini-1.0-pro"
    ];

    console.log("--- Connectivity Test (Direct Fetch to API) ---");
    // We try to fetch the model list via REST to see if the key is valid
    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
        const response = await fetch(url);
        const data = await response.json();
        if (data.error) {
            console.error(`❌ API Key Error: ${data.error.message} (${data.error.status})`);
        } else {
            console.log(`✅ API Key is Valid. Models found: ${data.models?.length || 0}`);
            data.models?.forEach(m => console.log(`  - ${m.name}`));
        }
    } catch (e) {
        console.error("❌ Network or Fetch Error:", e.message);
    }

    console.log("\n--- SDK Generation Test ---");
    for (const modelName of models) {
        try {
            console.log(`Checking [${modelName}]...`);
            const g = new GoogleGenerativeAI(apiKey);
            const model = g.getGenerativeModel({ model: modelName });

            // Minimal prompt
            const res = await model.generateContent("hi");
            const response = await res.response;
            console.log(`✅ [${modelName}] Success: ${response.text().substring(0, 20)}...`);
        } catch (err) {
            console.error(`❌ [${modelName}] Failed: ${err.message}`);
        }
    }
}

testGemini();
