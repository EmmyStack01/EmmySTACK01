import fetch from 'node-fetch';

export default async function handler(req, res) {
    // 1. DYNAMIC CORS & SECURITY
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: "Use POST" });

    try {
        const { keyword, niche } = req.body;
        const API_KEY = process.env.GEMINI_API_KEY;

        if (!API_KEY) throw new Error("GEMINI_API_KEY is missing in Vercel settings.");

        // 2. STABLE 2026 ENDPOINT & MODEL
        const URL = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;

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

        // 3. ENGINE ERROR CATCH
        if (resultData.error) {
            console.error("Gemini Engine Error:", resultData.error);
            return res.status(resultData.error.code || 500).json({ 
                error: "DNA Sync Refused",
                details: resultData.error.message 
            });
        }

        // 4. THE JSON EXTRACTOR
        const rawText = resultData.candidates[0].content.parts[0].text.trim();
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        
        if (!jsonMatch) throw new Error("AI output was not in valid DNA sequence format.");

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
        
