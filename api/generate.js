import fetch from 'node-fetch';

export default async function handler(req, res) {
    // 1. DYNAMIC CORS & SECURITY HEADERS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle Preflight
    if (req.method === 'OPTIONS') return res.status(200).end();
    
    // Only allow POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: "Method not allowed. Use POST." });
    }

    try {
        // 2. SAFE BODY PARSING
        let body = req.body;
        if (typeof body === 'string') {
            body = JSON.parse(body);
        }
        
        const { keyword, niche } = body || {};
        if (!keyword || !niche) {
            throw new Error("Missing required parameters: keyword or niche.");
        }

        const API_KEY = process.env.GEMINI_API_KEY;
        if (!API_KEY) {
            throw new Error("SERVER_ERROR: API Key configuration missing.");
        }

        // 3. THE "STRICT" PROMPT SETUP
        const prompt = `Act as a premium brand strategist for Emmy STACK01. 
        For a ${niche} brand centered on "${keyword}", provide:
        1. Six unique, professional brand names.
        2. A 4-color hex palette (Primary, Bg, Accent, Surface).
        3. A high-end Google Font pairing (header and body).
        4. A punchy 5-word brand slogan.
        
        IMPORTANT: Output ONLY a raw JSON object. Do not include any preamble, markdown backticks, or conversational text.
        Structure: {"names":["name1", "name2"], "colors":["#hex1", "#hex2"], "fonts":{"header":"Font Name", "body":"Font Name"}, "slogan": "Slogan Text"}`;

        // 4. CALL GEMINI API (v1 Stable Endpoint)
        const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { 
                    temperature: 0.7
                }
            })
        });

        const data = await response.json();

        // 5. ERROR CHECKING
        if (data.error) {
            throw new Error(`Gemini API: ${data.error.message}`);
        }
        
        if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
            throw new Error("AI engine returned an empty or blocked response.");
        }

        const rawText = data.candidates[0].content.parts[0].text.trim();
        
        // 6. THE "ULTIMATE CLEANER" (REGEX)
        // This extracts only the content inside the first { and last }
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        
        if (!jsonMatch) {
            console.error("No JSON block found in AI response:", rawText);
            throw new Error("AI response was not in a valid JSON format.");
        }

        // Parse the extracted JSON string
        const cleanJson = JSON.parse(jsonMatch[0]);

        // 7. SUCCESS RESPONSE
        return res.status(200).json(cleanJson);

    } catch (error) {
        console.error("EMMY STACK01 ENGINE CRASH:", error.message);
        return res.status(500).json({ 
            error: "DNA Sync Failed",
            details: error.message 
        });
    }
                                      }
                            
