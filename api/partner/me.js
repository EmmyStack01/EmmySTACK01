// GET /api/partner/me  ->  { partner } for the signed-in partner (partner is null until they finish their profile).
import { send, getSession, db, clearSession, deviceInfo } from "../_lib/partner.js";

export default async function handler(req, res) {
  if (req.method !== "GET") { res.setHeader("Allow", "GET"); return send(res, 405, { error: "Method not allowed." }); }
  try {
    const s = await getSession(req, res);
    if (!s) return send(res, 401, { error: "Not signed in." });
    // Keeps this device's "last active" fresh. If this login was signed out from another device, end it here too.
    try {
      const t = await db("/rpc/touch_device", { method: "POST", body: deviceInfo(req), token: s.token });
      if (t.status >= 400 && String(t.data?.message) === "session_revoked") { clearSession(req, res); return send(res, 401, { error: "Not signed in." }); }
      if (t.status >= 400) console.error("touch_device", t.status, t.data);
    } catch (e) { console.error("touch_device failed", e); }
    // Row level security returns only this partner's own row.
    const r = await db("/partners?select=first_name,code,clicks,leads,orders&limit=1", { token: s.token });
    if (r.status >= 400) { console.error("me query", r.status, r.data); return send(res, 502, { error: "We couldn't load your stats." }); }
    return send(res, 200, { partner: Array.isArray(r.data) && r.data[0] ? r.data[0] : null });
  } catch (e) {
    console.error("me failed", e);
    return send(res, 502, { error: "We couldn't load your stats." });
  }
}
