// api/_lib/partner.js — shared helpers for the partner API routes. The leading underscore keeps Vercel from
// turning this file into a route.
//
// Environment variables (Vercel > Project > Settings > Environment Variables):
//   SUPABASE_URL                e.g. https://abcd1234.supabase.co
//   SUPABASE_ANON_KEY           the public key: "Publishable key" (sb_publishable_...) or the legacy "anon" key. Safe on the
//                               server; row level security protects the data. SUPABASE_PUBLISHABLE_KEY also works.
//   SUPABASE_SERVICE_ROLE_KEY   SECRET: "Secret key" (sb_secret_...) or the legacy "service_role" key. Used only by
//                               /api/partner/click. Never expose it to the browser. SUPABASE_SECRET_KEY also works.
//   CLICK_SALT                  any long random string; used to hash visitors for click de-duplication
//   ALLOWED_ORIGINS             optional, comma separated, e.g. https://emmystack01.com,https://www.emmystack01.com
//   RESEND_API_KEY, ADMIN_EMAIL, MAIL_FROM   optional: email you when a new partner joins

import { createHash } from "node:crypto";

const SITE = "https://emmystack01.com";
const AT = "emmy_at", RT = "emmy_rt";            // access token and refresh token cookies
const COOKIE_PATH = "/api/partner";
const REFRESH_MAX_AGE = 60 * 60 * 24 * 30;

/* ---------- responses ---------- */
export function send(res, status, body) {
  res.setHeader("Cache-Control", "no-store");
  return res.status(status).json(body);
}

/* ---------- request guards ---------- */
const allowedOrigins = (req) => {
  const list = (process.env.ALLOWED_ORIGINS || `${SITE},https://www.emmystack01.com`).split(",").map((s) => s.trim()).filter(Boolean);
  if (req.headers.host) {
    list.push(`https://${req.headers.host}`);                       // same-origin (also covers preview deployments)
    if (/^(localhost|127\.0\.0\.1)(:|$)/.test(req.headers.host)) list.push(`http://${req.headers.host}`);   // local development only
  }
  return list;
};

// POST only, JSON only, and the Origin header must be ours. Returns the parsed body, or null after replying.
export function guardPost(req, res) {
  if (req.method !== "POST") { res.setHeader("Allow", "POST"); send(res, 405, { error: "Method not allowed." }); return null; }
  const origin = req.headers.origin;
  if (!origin || !allowedOrigins(req).includes(origin)) { send(res, 403, { error: "Request blocked." }); return null; }
  if (!/^application\/json\b/i.test(req.headers["content-type"] || "")) { send(res, 415, { error: "Unsupported request." }); return null; }
  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = null; } }
  if (!body || typeof body !== "object" || Array.isArray(body)) { send(res, 400, { error: "Invalid request." }); return null; }
  return body;
}

/* ---------- best-effort throttle ----------
   Serverless instances do not share memory, so this only slows a single warm instance down. Real limits belong in
   Vercel's firewall (Settings > Firewall > rate limiting) and in Supabase's own auth limits. */
const hits = new Map();
export function throttle(key, max, windowMs) {
  const now = Date.now(), entry = (hits.get(key) || []).filter((t) => now - t < windowMs);
  entry.push(now); hits.set(key, entry);
  if (hits.size > 5000) for (const [k, v] of hits) if (!v.some((t) => now - t < windowMs)) hits.delete(k);
  return entry.length <= max;
}
export const clientIp = (req) => String(req.headers["x-forwarded-for"] || req.headers["x-real-ip"] || req.socket?.remoteAddress || "").split(",")[0].trim();

/* ---------- input ---------- */
export function normEmail(v) {
  const e = String(v || "").trim().toLowerCase();
  return e.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) ? e : "";
}
export const normCode = (v) => { const c = String(v || "").replace(/\s+/g, ""); return /^\d{6,10}$/.test(c) ? c : ""; };
export const text = (v, max) => String(v == null ? "" : v).replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);

/* ---------- cookies ---------- */
const parseCookies = (req) => Object.fromEntries(String(req.headers.cookie || "").split(";").map((p) => p.trim()).filter(Boolean).map((p) => { const i = p.indexOf("="); return [p.slice(0, i), decodeURIComponent(p.slice(i + 1))]; }));
const secure = (req) => !/^(localhost|127\.0\.0\.1)(:|$)/.test(req.headers.host || "");
function addCookie(res, line) { const prev = res.getHeader("Set-Cookie"); res.setHeader("Set-Cookie", [].concat(prev || [], line)); }
const cookie = (req, name, value, maxAge) => `${name}=${encodeURIComponent(value)}; Path=${COOKIE_PATH}; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${secure(req) ? "; Secure" : ""}`;

export function setSession(req, res, s) {
  addCookie(res, cookie(req, AT, s.access_token, Math.max(60, Math.min(Number(s.expires_in) || 3600, 86400))));
  addCookie(res, cookie(req, RT, s.refresh_token, REFRESH_MAX_AGE));
}
export function clearSession(req, res) { addCookie(res, cookie(req, AT, "", 0)); addCookie(res, cookie(req, RT, "", 0)); }

/* ---------- Supabase ---------- */
const conf = () => {
  const url = String(process.env.SUPABASE_URL || "").replace(/\/+$/, ""), anon = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !anon) throw new Error("SUPABASE_URL or SUPABASE_ANON_KEY is not set");
  return { url, anon };
};

async function call(url, { method = "GET", headers = {}, body } = {}) {
  const r = await fetch(url, { method, headers: { "Content-Type": "application/json", ...headers }, body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(15000) });
  let data = null; try { data = await r.json(); } catch { /* empty body */ }
  return { status: r.status, data };
}

// Supabase Auth (GoTrue). `token` is a partner's access token when the call is made on their behalf.
export function auth(path, { method = "GET", body, token } = {}) {
  const { url, anon } = conf();
  return call(`${url}/auth/v1${path}`, { method, body, headers: { apikey: anon, ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
}

// Database (PostgREST). With a partner token, row level security applies. With `service: true` it runs as the server.
export function db(path, { method = "GET", body, token, service = false } = {}) {
  const { url, anon } = conf();
  const key = service ? (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY) : anon;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  // New-style secret keys (sb_secret_...) are not JWTs, so they travel in the apikey header only.
  const headers = { apikey: key };
  if (!service) headers.Authorization = `Bearer ${token}`;
  else if (!key.startsWith("sb_")) headers.Authorization = `Bearer ${key}`;
  return call(`${url}/rest/v1${path}`, { method, body, headers });
}

/* Returns { token, user } for a signed-in partner, refreshing the session when needed, or null. Throws on network errors. */
export async function getSession(req, res) {
  const c = parseCookies(req);
  if (c[AT]) {
    const r = await auth("/user", { token: c[AT] });
    if (r.status === 200 && r.data?.id) return { token: c[AT], user: r.data };
  }
  if (c[RT]) {
    const r = await auth("/token?grant_type=refresh_token", { method: "POST", body: { refresh_token: c[RT] } });
    if (r.status === 200 && r.data?.access_token) { setSession(req, res, r.data); return { token: r.data.access_token, user: r.data.user }; }
  }
  if (c[AT] || c[RT]) clearSession(req, res);
  return null;
}

// What we remember about a device: browser text from the request, and the city/country Vercel works out from the IP.
// The IP address itself is never stored. Outside Vercel the geo headers are simply absent.
export function deviceInfo(req) {
  const h = req.headers, dec = (v) => { try { return decodeURIComponent(String(v || "")); } catch { return String(v || ""); } };
  return { p_user_agent: text(h["user-agent"], 300), p_city: text(dec(h["x-vercel-ip-city"]), 80), p_country: text(h["x-vercel-ip-country"], 2) };
}

export const hashVisitor = (...parts) => createHash("sha256").update([process.env.CLICK_SALT || "", ...parts].join("|")).digest("hex");

/* ---------- optional "new partner" email ---------- */
export async function notifyAdmin(subject, body) {
  const { RESEND_API_KEY: key, ADMIN_EMAIL: to, MAIL_FROM: from } = process.env;
  if (!key || !to) return;
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: from || "Emmy STACK01 <partners@emmystack01.com>", to: [to], subject, text: body }), signal: AbortSignal.timeout(8000),
    });
  } catch (e) { console.error("Admin notification failed", e); }
}
