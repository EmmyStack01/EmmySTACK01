import fetch from 'node-fetch';

export default async function handler(req, res) {
    // 1. DYNAMIC CORS HEADERS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: "Method not allowed. Use POST." });

    try {
        const { keyword, niche } = req.body;
        const API_KEY = process.env.GEMINI_API_KEY;

        if (!API_KEY) throw new Error("API Key is missing in server environment.");

        // 2. STABLE V1 ENDPOINT WITH 1.5 PRO
        const URL = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent?key=${API_KEY}`;

        const prompt = `Act as a premium brand strategist for Emmy STACK01. 
        For a ${niche} brand centered on "${keyword}", provide:
        1. Names: 6 unique professional options.
        2. Colors: 4-color hex palette (Primary, Bg, Accent, Surface).
        3. Fonts: A Google Font pairing (header and body).
        4. Slogan: A punchy 5-word brand tagline.
        
        Output ONLY a raw JSON object: {"names":[], "colors":[], "fonts":{"header":"", "body":""}, "slogan":""}`;

        const response = await fetch(URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        const resultData = await response.json();

        // 3. ROBUST ERROR HANDLING
        if (resultData.error) {
            console.error("Gemini Engine Error:", resultData.error);
            return res.status(resultData.error.code || 500).json({ 
                error: "DNA Sync Refused",
                details: resultData.error.message 
            });
        }

        // 4. THE ULTIMATE JSON CLEANER
        const rawText = resultData.candidates[0].content.parts[0].text.trim();
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        
        if (!jsonMatch) {
            throw new Error("AI output was not in valid DNA sequence format.");
        }

        const cleanJson = JSON.parse(jsonMatch[0]);
        return res.status(200).json(cleanJson);

    } catch (error) {
        console.error("EMMY STACK01 CRASH:", error.message);
        return res.status(500).json({ 
            error: "Biometric Failure", 
            details: error.message 
        });
    }
}
