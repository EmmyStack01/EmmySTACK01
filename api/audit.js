// api/audit.js — Vercel serverless function behind the Website Auditor (/tools/website-auditor).
//
//   GET /api/audit?url=https://example.com&strategy=mobile|desktop
//
// It calls Google PageSpeed Insights (Lighthouse) with the PAGESPEED_API_KEY environment variable and returns a small,
// ready-to-render payload instead of the full ~1 MB Lighthouse result:
//
//   {
//     url, finalUrl, strategy, fetchedAt,
//     scores:  { performance, seo, accessibility },          // 0-100
//     metrics: [{ id, title, displayValue, score }],         // headline lab metrics
//     issues:  { performance: [...], seo: [...], accessibility: [...] },  // failing audits, worst first
//     counts:  { performance, seo, accessibility, total }    // number of failing checks per category
//   }
//   each issue: { id, title, description, learnMore, displayValue, score }

// PageSpeed often takes 15-40 s. Vercel's default function limit is shorter, so ask for more time.
export const config = { maxDuration: 60 };

const KEYS = {
  performance: ["modern-image-formats", "uses-optimized-images", "render-blocking-resources", "server-response-time", "offscreen-images", "unused-javascript", "total-byte-weight", "cumulative-layout-shift", "largest-contentful-paint"],
  seo: ["viewport", "document-title", "meta-description", "http-status-code", "is-crawlable"],
  accessibility: ["color-contrast", "button-name", "image-alt", "link-name", "label"],
};
const METRICS = ["first-contentful-paint", "largest-contentful-paint", "total-blocking-time", "cumulative-layout-shift", "speed-index"];
const PASS = 0.9;

const json = (res, status, body, cache) => {
  if (cache) res.setHeader("Cache-Control", cache);
  else res.setHeader("Cache-Control", "no-store");
  return res.status(status).json(body);
};

// Accept only public http(s) websites. Google fetches the page, not this server, but there is no point spending quota on junk.
function cleanUrl(raw) {
  if (typeof raw !== "string" || raw.length > 2048) return null;
  let u;
  try { u = new URL(raw.trim()); } catch { return null; }
  if (u.protocol !== "http:" && u.protocol !== "https:") return null;
  if (u.username || u.password) return null;
  const h = u.hostname.toLowerCase();
  if (!h.includes(".") || h.endsWith(".local") || h.endsWith(".internal") || h.endsWith(".localhost")) return null;
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(h) || h.includes(":")) return null;   // IP addresses
  return u.href;
}

// "Reduce unused JavaScript. [Learn more](https://web.dev/...)." -> { text: "Reduce unused JavaScript.", link: "https://web.dev/..." }
function describe(desc = "") {
  const m = desc.match(/\[[^\]]*\]\((https:\/\/[^)\s]+)\)/);
  const plain = desc.replace(/\[([^\]]*)\]\([^)]*\)/g, "$1").replace(/`/g, "").replace(/\s+/g, " ").trim();
  const first = plain.match(/^.*?(?<!\be\.g|\bi\.e|\betc|\bvs)[.!?](?=\s+[A-Z]|$)/);   // first sentence, not fooled by "e.g."
  let text = (first ? first[0] : plain).replace(/\s*Learn more\.?$/i, "").trim();
  if (text.length > 220) text = text.slice(0, 217).trimEnd() + "…";
  return { text, link: m ? m[1] : null };
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return json(res, 405, { error: "Method not allowed." });
  }

  const url = cleanUrl(req.query.url);
  if (!url) return json(res, 400, { error: "Please enter a valid public website address, like example.com." });
  const strategy = req.query.strategy === "desktop" ? "desktop" : "mobile";

  const API_KEY = process.env.PAGESPEED_API_KEY;
  if (!API_KEY) {
    console.error("PAGESPEED_API_KEY is not set");
    return json(res, 500, { error: "The audit service isn't configured yet. Please try again later." });
  }

  const endpoint = new URL("https://www.googleapis.com/pagespeedonline/v5/runPagespeed");
  endpoint.searchParams.set("url", url);
  endpoint.searchParams.set("key", API_KEY);
  endpoint.searchParams.set("strategy", strategy);
  endpoint.searchParams.set("locale", "en");
  ["PERFORMANCE", "SEO", "ACCESSIBILITY"].forEach((c) => endpoint.searchParams.append("category", c));

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 55000);

  try {
    const response = await fetch(endpoint, { signal: ctrl.signal });
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const status = response.status;
      const googleMsg = data?.error?.message || "";
      console.error("PageSpeed error", status, googleMsg);
      if (status === 429) return json(res, 429, { error: "We're getting a lot of audits right now. Please try again in a minute." });
      if (status === 400 || /FAILED_DOCUMENT_REQUEST|unable to (reach|resolve)|ERR_/i.test(googleMsg)) {
        return json(res, 422, { error: "We couldn't load that website. Check the address and make sure the site is online." });
      }
      return json(res, 502, { error: "The audit service had a problem. Please try again shortly." });
    }

    const lh = data?.lighthouseResult;
    const cats = lh?.categories;
    if (!lh || lh.runtimeError || !cats?.performance || cats.performance.score == null) {
      return json(res, 422, { error: "We couldn't load that website. Check the address and make sure the site is online." });
    }

    const pct = (c) => Math.round((cats[c]?.score ?? 0) * 100);
    const audits = lh.audits || {};

    const issues = {}, counts = {};
    let total = 0;
    for (const [cat, keys] of Object.entries(KEYS)) {
      issues[cat] = keys
        .map((id) => ({ id, a: audits[id] }))
        .filter(({ a }) => a && typeof a.score === "number" && a.score < PASS)
        .sort((x, y) => x.a.score - y.a.score)
        .map(({ id, a }) => {
          const d = describe(a.description);
          return { id, title: a.title, description: d.text, learnMore: d.link, displayValue: a.displayValue || "", score: a.score };
        });
      counts[cat] = issues[cat].length;
      total += counts[cat];
    }
    counts.total = total;

    const metrics = METRICS.map((id) => audits[id]).filter(Boolean)
      .map((a) => ({ id: a.id, title: a.title, displayValue: a.displayValue || "", score: typeof a.score === "number" ? a.score : null }));

    // Identical audits can be reused for an hour, which saves PageSpeed quota.
    return json(res, 200, {
      url,
      finalUrl: lh.finalDisplayedUrl || lh.finalUrl || url,
      strategy,
      fetchedAt: lh.fetchTime || new Date().toISOString(),
      scores: { performance: pct("performance"), seo: pct("seo"), accessibility: pct("accessibility") },
      metrics, issues, counts,
    }, "public, s-maxage=3600, stale-while-revalidate=86400");
  } catch (error) {
    if (error?.name === "AbortError") return json(res, 504, { error: "That site took too long to analyze. Please try again." });
    console.error("Audit error:", error);
    return json(res, 500, { error: "Something went wrong. Please try again later." });
  } finally {
    clearTimeout(timer);
  }
}
