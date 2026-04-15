import fetch from 'node-fetch';

export default async function handler(req, res) {
    // 1. DYNAMIC CORS & HEADERS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: "Use POST" });

    try {
        // 2. PARSE BODY
        let body = req.body;
        if (typeof body === 'string') {
            body = JSON.parse(body);
        }
        
        const { keyword, niche } = body || {};
        if (!keyword || !niche) throw new Error("Missing keyword or niche");

        const API_KEY = process.env.GEMINI_API_KEY;
        if (!API_KEY) throw new Error("GEMINI_API_KEY is missing in Vercel settings");

        // 3. PROMPT SETUP
        const prompt = `Act as a premium brand strategist. For a ${niche} brand centered on "${keyword}", provide:
        1. Six unique brand names. 2. A 4-color hex palette. 3. A high-end Google Font pairing. 4. A 5-word slogan.
        Return ONLY a raw JSON object with this exact structure: 
        {"names":["name1"], "colors":["#hex1"], "fonts":{"header":"Font", "body":"Font"}, "slogan": "Slogan"}`;

        // 4. CALL GEMINI API (Updated to v1 Stable)
        const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { 
                    temperature: 0.7,
                    responseMimeType: "application/json" 
                }
            })
        });

        const data = await response.json();

        // 5. ERROR HANDLING
        if (data.error) throw new Error(`Gemini API: ${data.error.message}`);
        
        if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
            throw new Error("Gemini returned an empty or blocked response.");
        }

        const aiText = data.candidates[0].content.parts[0].text.trim();
        
        // Final JSON parse and send
        res.status(200).json(JSON.parse(aiText));

    } catch (error) {
        console.error("EMMY STACK01 ENGINE ERROR:", error.message);
        res.status(500).json({ 
            error: "DNA Sync Failed",
            details: error.message 
        });
    }
            }
            
