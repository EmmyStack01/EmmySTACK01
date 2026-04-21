import fetch from 'node-fetch';

export default async function handler(req, res) {
    // 1. SECURITY & CORS HEADERS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: "Use POST" });

    try {
        const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
const { keyword, niche } = body;
        const API_KEY = process.env.GEMINI_API_KEY;

        if (!API_KEY) throw new Error("API Key missing in Vercel settings.");

        // 2. THE 2026 UNIVERSAL STABLE MODEL
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

        // 3. BRANDED ERROR DECODER
        if (resultData.error) {
            console.error("API Error Trace:", resultData.error);
            
            let userMessage = "The DNA Sequencer is recalibrating. Please try again in 10 seconds.";
            let statusCode = resultData.error.code || 500;

            if (statusCode === 503 || resultData.error.message.includes("high demand")) {
                userMessage = "SYSTEM OVERLOAD: Too many brands initializing at once. Please wait 15 seconds for the engine to cool down.";
            } else if (statusCode === 429) {
                userMessage = "BIOMETRIC LIMIT REACHED: The engine needs a 60-second recharge before the next scan.";
            } else if (statusCode === 400) {
                userMessage = "SEQUENCE REJECTED: The keywords provided could not be stabilized into a DNA profile. Try simpler terms.";
            }

            return res.status(statusCode).json({ 
                error: "Engine Sync Paused",
                details: userMessage 
            });
        }

        // 4. RESPONSE VALIDATION (Safety Gate)
        if (!resultData.candidates || resultData.candidates.length === 0) {
            return res.status(500).json({ 
                error: "DNA Sync Failed", 
                details: "The engine couldn't stabilize the sequence. High interference detected." 
            });
        }

        // 5. JSON EXTRACTION & CLEANUP
        const rawText = resultData.candidates[0].content.parts[0].text;
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        
        if (!jsonMatch) {
            return res.status(500).json({ 
                error: "DNA Corrupted", 
                details: "The generated sequence was unstable. Initializing a fresh scan is recommended." 
            });
        }

        try {
            const cleanDNA = JSON.parse(jsonMatch[0]);
            return res.status(200).json(cleanDNA);
        } catch (parseError) {
            return res.status(500).json({ 
                error: "Data Malformation", 
                details: "The brand DNA arrived in an unreadable format. Retrying..." 
            });
        }

    } catch (error) {
        // 6. GLOBAL CATCH (The "Flicker" Error)
        console.error("Critical System Error:", error);
        return res.status(500).json({ 
            error: "DNA Sync Interrupted", 
            details: "The connection flickered. Please initialize the scan again." 
        });
    }
}
