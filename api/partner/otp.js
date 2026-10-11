// POST /api/partner/otp  { email }  ->  emails a one-time code. Works for new and returning partners alike.
import { guardPost, send, throttle, clientIp, normEmail, auth } from "../_lib/partner.js";

export default async function handler(req, res) {
  const body = guardPost(req, res); if (!body) return;
  const email = normEmail(body.email);
  if (!email) return send(res, 400, { error: "Please enter a valid email address." });
  if (!throttle(`otp:${clientIp(req)}`, 8, 10 * 60 * 1000)) return send(res, 429, { error: "Too many attempts. Please wait a few minutes and try again." });

  try {
    const r = await auth("/otp", { method: "POST", body: { email, create_user: true } });
    if (r.status === 429) return send(res, 429, { error: "Please wait a minute before asking for another code." });
    if (r.status >= 500) { console.error("otp upstream", r.status, r.data); return send(res, 502, { error: "We couldn't send the code. Please try again." }); }
    if (r.status >= 400) { console.error("otp rejected", r.status, r.data); return send(res, 400, { error: "We couldn't send a code to that address." }); }
    return send(res, 200, { ok: true });
  } catch (e) {
    console.error("otp failed", e);
    return send(res, 502, { error: "We couldn't send the code. Please try again." });
  }
}
