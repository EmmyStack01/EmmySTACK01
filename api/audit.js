export default async function handler(req, res) {
    // 1. Get the URL from the frontend request
    const { url } = req.query;
    const API_KEY = process.env.PAGESPEED_API_KEY;

    if (!url) {
        return res.status(400).json({ error: "Please provide a website URL to audit." });
    }

    // 2. Build the PageSpeed Insights Endpoint
    // We request Performance, SEO, and Accessibility categories for mobile
    const endpoint = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&key=${API_KEY}&category=PERFORMANCE&category=SEO&category=ACCESSIBILITY&strategy=mobile`;

    try {
        const response = await fetch(endpoint);
        
        if (!response.ok) {
            const errorData = await response.json();
            return res.status(response.status).json({ error: errorData.error.message || "Failed to fetch audit data." });
        }

        const data = await response.json();
        
        // 3. Return only the necessary data to keep the frontend fast
        return res.status(200).json({
            scores: {
                performance: data.lighthouseResult.categories.performance.score * 100,
                seo: data.lighthouseResult.categories.seo.score * 100,
                accessibility: data.lighthouseResult.categories.accessibility.score * 100
            },
            audits: data.lighthouseResult.audits
        });

    } catch (error) {
        console.error("Audit Error:", error);
        return res.status(500).json({ error: "Internal Server Error. Please try again later." });
    }
}
