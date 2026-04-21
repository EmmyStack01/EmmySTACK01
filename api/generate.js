export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') {
        return res.status(405).json({ error: "Use POST" });
    }

    try {
        // ✅ SAFE BODY PARSE
        const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        console.log("REQUEST BODY:", body);

        const { keyword, niche } = body;

        if (!keyword) {
            return res.status(400).json({ error: "Missing keyword" });
        }

        const API_KEY = process.env.GEMINI_API_KEY;

        if (!API_KEY) {
            throw new Error("Missing GEMINI_API_KEY in environment variables");
        }

        const URL = `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

        const prompt = `Act as a premium brand strategist. For a ${niche} brand called "${keyword}", generate:
1. Names: 6 creative options.
2. Colors: 4 hex codes (Primary, BG, Accent, Surface).
3. Fonts: A Google Font for header and body.
4. Slogan: A short 5-word tagline.

Output ONLY a JSON object: {"names":[], "colors":[], "fonts":{"header":"", "body":""}, "slogan":""}`;

        const response = await fetch(URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        console.log("GEMINI STATUS:", response.status);

        const resultData = await response.json();
        console.log("GEMINI RAW RESPONSE:", JSON.stringify(resultData, null, 2));

        // ❌ NO CUSTOM ERROR MESSAGES — SHOW RAW
        if (!response.ok || resultData.error) {
            return res.status(response.status).json(resultData);
        }

        if (!resultData.candidates || resultData.candidates.length === 0) {
            return res.status(500).json(resultData);
        }

        const rawText = resultData.candidates[0]?.content?.parts?.[0]?.text;
        console.log("RAW TEXT:", rawText);

        const jsonMatch = rawText?.match(/\{[^]*\}/);

        if (!jsonMatch) {
            return res.status(500).json({
                error: "No JSON found",
                rawText
            });
        }

        const cleanDNA = JSON.parse(jsonMatch[0]);

        return res.status(200).json(cleanDNA);

    } catch (error) {
        console.error("🔥 SERVER CRASH:", error);

        return res.status(500).json({
            error: error.message,
            stack: error.stack // ⚠️ REMOVE THIS IN PRODUCTION
        });
    }
}
