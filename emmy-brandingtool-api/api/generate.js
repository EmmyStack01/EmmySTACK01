export default async function handler(req, res) {
    // 1. CORS Headers (Keep these to protect your API)
        const allowedOrigins = [
        'https://emmystack01.github.io',
        'https://emmystack01.com',
        'http://127.0.0.1:5500' // For your local testing
    ];

    const origin = req.headers.origin;

    if (allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }

    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const { keyword, niche } = req.body;
    const API_KEY = process.env.GEMINI_API_KEY;

    const prompt = `Act as a premium brand strategist. For a ${niche} brand with keyword "${keyword}", provide:
    1. Six unique brand names.
    2. A 4-color hex palette (Primary, Bg, Accent, Surface).
    3. A Google Font pairing (Header and Body).
    Return ONLY a raw JSON object: {"names":[], "colors":[], "fonts":{"header":"", "body":""}}`;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { responseMimeType: "application/json" }
            })
        });

        const data = await response.json();
        
        // Gemini's response structure is a bit deeper than OpenAI's
        const aiText = data.candidates[0].content.parts[0].text;
        res.status(200).json(JSON.parse(aiText));

    } catch (error) {
        res.status(500).json({ error: "Gemini Engine Offline" });
    }
}
