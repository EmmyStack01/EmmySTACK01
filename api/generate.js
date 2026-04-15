import fetch from 'node-fetch';

export default async function handler(req, res) {
    // 1. Handle Preflight
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: "Use POST" });

    try {
        // 2. SAFE BODY PARSING
        let body = req.body;
        if (typeof body === 'string') {
            try { body = JSON.parse(body); } catch (e) { throw new Error("Invalid JSON in request body"); }
        }
        
        const { keyword, niche } = body || {};
        if (!keyword || !niche) throw new Error("Missing keyword or niche");

        const API_KEY = process.env.GEMINI_API_KEY;
        if (!API_KEY) throw new Error("GEMINI_API_KEY is missing in Vercel settings");

        // 3. PROMPT SETUP
        const prompt = `Act as a premium brand strategist. For a ${niche} brand centered on "${keyword}", provide:
        1. Six unique brand names. 2. A 4-color hex palette. 3. A high-end Google Font pairing. 4. A 5-word slogan.
        Return ONLY raw JSON: {"names":["name1"], "colors":["#hex1"], "fonts":{"header":"Font", "body":"Font"}, "slogan": "Slogan"}`;

        // 4. CALL GEMINI API
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.7 }
            })
        });

        const data = await response.json();

        // 5. ROBUST ERROR CHECKING
        if (data.error) throw new Error(`Gemini API: ${data.error.message}`);
        
        if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
            // This catches "Safety" blocks or empty responses
            console.error("Incomplete Gemini Response:", JSON.stringify(data));
            throw new Error("Gemini blocked the request or returned empty content.");
        }

        let aiText = data.candidates[0].content.parts[0].text;
        
        // Strip Markdown and parse
        const cleanText = aiText.replace(/```json/g, '').replace(/```/g, '').trim();
        const cleanJson = JSON.parse(cleanText);

        return res.status(200).json(cleanJson);

    } catch (error) {
        console.error("BACKEND CRASH:", error.message);
        return res.status(500).json({ 
            error: "DNA Sync Failed",
            details: error.message 
        });
    }
} // <--- THIS BRACKET WAS MISSING!
            
