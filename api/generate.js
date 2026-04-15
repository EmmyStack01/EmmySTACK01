import fetch from 'node-fetch';

export default async function handler(req, res) {
    // 1. CORS & Headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: "Use POST" });

    try {
        const { keyword, niche } = req.body;
        const API_KEY = process.env.GEMINI_API_KEY;

        // 2. STABLE API ENDPOINT (v1beta is currently most reliable for 1.5-flash)
        const URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

        const prompt = `Act as a brand strategist. Generate a brand identity for a ${niche} called "${keyword}". 
        Return ONLY a JSON object with this structure:
        {"names":["Name1", "Name2"], "colors":["#hex1", "#hex2", "#hex3", "#hex4"], "fonts":{"header":"Orbitron", "body":"Montserrat"}, "slogan":"5 word slogan"}`;

        const response = await fetch(URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        const resultData = await response.json(); // Renamed to resultData to avoid frontend confusion

        if (!response.ok) {
            throw new Error(resultData.error?.message || "Gemini API Failure");
        }

        // 3. SAFE PARSING (Regex to find JSON block)
        const rawText = resultData.candidates[0].content.parts[0].text;
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        
        if (!jsonMatch) throw new Error("AI did not return valid JSON");

        const cleanJson = JSON.parse(jsonMatch[0]);
        return res.status(200).json(cleanJson);

    } catch (error) {
        console.error("Engine Error:", error.message);
        return res.status(500).json({ error: error.message });
    }
}
