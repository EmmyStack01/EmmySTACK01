export default async function handler(req, res) {
    // 1. DYNAMIC CORS HANDLER
    const allowedOrigins = [
        'https://emmystack01.github.io',
        'https://emmystack01.com',
        'https://emmy-stack-01.vercel.app',
        'http://127.0.0.1:5500'
    ];

    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }

    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle Preflight
    if (req.method === 'OPTIONS') return res.status(200).end();

    // 2. DATA EXTRACTION
    const { keyword, niche } = req.body;
    const API_KEY = process.env.GEMINI_API_KEY;

    // 3. ENHANCED BRAND STRATEGIST PROMPT
    const prompt = `Act as a premium brand strategist. For a ${niche} brand centered on "${keyword}", provide:
    1. Six unique, professional brand names.
    2. A 4-color hex palette (Primary, Bg, Accent, Surface).
    3. A high-end Google Font pairing (Header must be bold/unique like Orbitron or Syne, Body must be clean like Inter).
    4. A punchy 5-word brand slogan.
    
    Return ONLY a raw JSON object with this exact structure: 
    {"names":["name1", "name2"], "colors":["#hex1", "#hex2"], "fonts":{"header":"Font Name", "body":"Font Name"}, "slogan": "The brand slogan here"}`;

    try {
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

        // 4. ROBUST DATA PARSING
        if (!data.candidates || !data.candidates[0]) {
            throw new Error("Invalid AI Response");
        }

        const aiText = data.candidates[0].content.parts[0].text;
        
        // Ensure we send back a clean JSON object
        const cleanJson = JSON.parse(aiText);
        res.status(200).json(cleanJson);

    } catch (error) {
        console.error("Vercel Backend Error:", error);
        res.status(500).json({ 
            error: "Gemini Engine Offline",
            details: error.message 
        });
    }
}
