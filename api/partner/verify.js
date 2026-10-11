// POST /api/partner/verify  { email, code }  ->  signs the partner in (httpOnly cookies) and returns their profile, if any.
import { guardPost, send, throttle, clientIp, normEmail, normCode, auth, db, setSession } from "../_lib/partner.js";

export default async function handler(req, res) {
  const body = guardPost(req, res); if (!body) return;
  const email = normEmail(body.email), code = normCode(body.code);
  if (!email || !code) return send(res, 400, { error: "Enter the code from your email." });
  if (!throttle(`verify:${clientIp(req)}`, 12, 10 * 60 * 1000) || !throttle(`verify:${email}`, 8, 10 * 60 * 1000)) {
    return send(res, 429, { error: "Too many attempts. Please wait a few minutes and try again." });
  }

  try {
    const v = await auth("/verify", { method: "POST", body: { type: "email", email, token: code } });
    if (v.status !== 200 || !v.data?.access_token) {
      if (v.status >= 500) return send(res, 502, { error: "We couldn't check the code. Please try again." });
      return send(res, 401, { error: "That code is incorrect or has expired. Check it or ask for a new one." });
    }
    setSession(req, res, v.data);

    // Links an imported partner (matched on the verified email) to this login and returns the partner, or null for new people.
    const c = await db("/rpc/claim_partner", { method: "POST", body: {}, token: v.data.access_token });
    if (c.status >= 400) { console.error("claim_partner", c.status, c.data); return send(res, 502, { error: "Signed in, but we couldn't load your account. Please try again." }); }
    return send(res, 200, { ok: true, partner: c.data || null });
  } catch (e) {
    console.error("verify failed", e);
    return send(res, 502, { error: "We couldn't check the code. Please try again." });
  }
}
