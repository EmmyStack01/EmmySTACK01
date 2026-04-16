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

        // Try gemini-pro (the most compatible version globally)
        const URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`;

        const prompt = `Generate a brand DNA for a ${niche} business named "${keyword}". 
        Return ONLY valid JSON: {"names":["6 options"], "colors":["4 hex"], "fonts":{"header":"Google Font", "body":"Google Font"}, "slogan":"5 words"}`;

        const response = await fetch(URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        const resultData = await response.json();

        // If Google rejects the model, send a specific error we can read
        if (resultData.error) {
            return res.status(500).json({ 
                error: "DNA Sync Refused",
                details: resultData.error.message 
            });
        }

        const rawText = resultData.candidates[0].content.parts[0].text;
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        
        if (!jsonMatch) throw new Error("DNA sequence corrupted.");

        return res.status(200).json(JSON.parse(jsonMatch[0]));

    } catch (error) {
        return res.status(500).json({ error: "Biometric Failure", details: error.message });
    }
}
