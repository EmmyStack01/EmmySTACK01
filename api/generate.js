import fetch from 'node-fetch';

export default async function handler(req, res) {
    // 1. HEADERS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: "Use POST" });

    try {
        const { keyword, niche } = req.body;
        const API_KEY = process.env.GEMINI_API_KEY;

        if (!API_KEY) throw new Error("API Key missing in Vercel settings.");

        // 2. THE 2026 UNIVERSAL STABLE MODEL
        // Using gemini-2.0-flash which is the stable production anchor right now.
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

        const resultData = await response.json();

        // 3. DETAILED ERROR DECODER
        if (resultData.error) {
            console.error("API Error:", resultData.error);
            // This will send the exact model name Google expects back to your frontend alert
            return res.status(resultData.error.code || 500).json({ 
                error: "Engine Sync Failed",
                details: `Google says: ${resultData.error.message}. (Code: ${resultData.error.code})` 
            });
        }

        const rawText = resultData.candidates[0].content.parts[0].text;
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        
        if (!jsonMatch) throw new Error("DNA sequence corrupted.");

        return res.status(200).json(JSON.parse(jsonMatch[0]));

    
        } catch (error) {
            let friendlyMessage = "The engine is cooling down. Please wait 60 seconds.";
            if (error.message.includes("429")) {
                return res.status(429).json({ error: "System Overloaded", details: friendlyMessage });
            }
            return res.status(500).json({ error: "DNA Sync Failed", details: error.message });
        }
            }
