import fetch from 'node-fetch';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: "Use POST" });

    try {
        const { keyword, niche } = req.body;
        const API_KEY = process.env.GEMINI_API_KEY;

        // Use the v1 stable endpoint which is generally more reliable for flash
        const URL = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

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

        const resultData = await response.json();

        // Specific handling for the "model not found" error
        if (resultData.error) {
            console.error("Gemini Error Detail:", resultData.error);
            return res.status(resultData.error.code || 500).json({ 
                error: `Engine Mismatch: ${resultData.error.message}` 
            });
        }

        const rawText = resultData.candidates[0].content.parts[0].text;
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        
        if (!jsonMatch) throw new Error("Invalid DNA sequence received.");

        return res.status(200).json(JSON.parse(jsonMatch[0]));

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
            }
