import fetch from 'node-fetch';

export default async function handler(req, res) {
    // 1. Handle Preflight (Browser security check)
    if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: "Method not allowed. Use POST." });
    }

    try {
        // 2. MANUAL BODY PARSING (The "Crash Fix")
        let body = req.body;
        if (typeof body === 'string') {
            body = JSON.parse(body);
        }
        
        const { keyword, niche } = body;

        if (!keyword || !niche) {
            throw new Error("Missing keyword or niche in request body.");
        }

        const API_KEY = process.env.GEMINI_API_KEY;
        if (!API_KEY) {
            throw new Error("GEMINI_API_KEY is not defined in Vercel settings.");
        }

        // 3. PROMPT SETUP
        const prompt = `Act as a premium brand strategist. For a ${niche} brand centered on "${keyword}", provide:
        1. Six unique, professional brand names.
        2. A 4-color hex palette (Primary, Bg, Accent, Surface).
        3. A high-end Google Font pairing.
        4. A punchy 5-word brand slogan.
        
        Return ONLY a raw JSON object: 
        {"names":["name1", "name2"], "colors":["#hex1", "#hex2"], "fonts":{"header":"Font", "body":"Font"}, "slogan": "Slogan"}`;

        // 4. CALL GEMINI API
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { 
                    responseMimeType: "application/json",
                    temperature: 0.7 
                }
            })
        });

        const data = await response.json();

        if (!data.candidates || !data.candidates[0]) {
            console.error("Gemini Error:", data);
            throw new Error("Gemini API returned an empty response.");
        }

        const aiText = data.candidates[0].content.parts[0].text;
        const cleanJson = JSON.parse(aiText);

        res.status(200).json(cleanJson);

    } catch (error) {
        console.error("Backend Error:", error.message);
        res.status(500).json({ 
            error: "Internal Server Error",
            details: error.message 
        });
    }
            }
            
