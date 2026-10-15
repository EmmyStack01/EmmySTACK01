// GET  /api/partner/devices                         ->  { devices: [...] }  the signed-in partner's own logins
// POST /api/partner/devices { action: "revoke", id } ->  signs one OTHER device out
// POST /api/partner/devices { action: "others" }     ->  signs every device out except this one
// The database decides who "this partner" is from the verified login token, so nobody can touch another partner's devices.
import { guardPost, send, getSession, db, throttle } from "../_lib/partner.js";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const s = await getSession(req, res);
      if (!s) return send(res, 401, { error: "Not signed in." });
      const r = await db("/rpc/list_devices", { method: "POST", body: {}, token: s.token });
      if (r.status >= 400) { console.error("list_devices", r.status, r.data); return send(res, 502, { error: "We couldn't load your devices." }); }
      return send(res, 200, { devices: Array.isArray(r.data) ? r.data : [] });
    }

    const body = guardPost(req, res); if (!body) return;
    const s = await getSession(req, res);
    if (!s) return send(res, 401, { error: "Please sign in again." });
    if (!throttle(`devices:${s.user.id}`, 30, 10 * 60 * 1000)) return send(res, 429, { error: "Too many attempts. Please wait a few minutes." });

    if (body.action === "revoke") {
      const id = String(body.id || "");
      if (!UUID.test(id)) return send(res, 400, { error: "Invalid request." });
      const r = await db("/rpc/revoke_device", { method: "POST", body: { p_id: id }, token: s.token });
      if (r.status >= 400) {
        if (String(r.data?.message) === "current_device") return send(res, 400, { error: "Use Sign out for the device you are using now." });
        console.error("revoke_device", r.status, r.data); return send(res, 502, { error: "We couldn't sign that device out. Please try again." });
      }
      return send(res, 200, { ok: true, removed: r.data === true });
    }
    if (body.action === "others") {
      const r = await db("/rpc/revoke_other_devices", { method: "POST", body: {}, token: s.token });
      if (r.status >= 400) { console.error("revoke_other_devices", r.status, r.data); return send(res, 502, { error: "We couldn't sign the other devices out. Please try again." }); }
      return send(res, 200, { ok: true, removed: Number(r.data) || 0 });
    }
    return send(res, 400, { error: "Invalid request." });
  } catch (e) {
    console.error("devices failed", e);
    return send(res, 502, { error: "We couldn't complete that. Please try again." });
  }
}
