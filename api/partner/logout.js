// POST /api/partner/logout  ->  ends the session and clears the cookies.
import { guardPost, send, auth, clearSession } from "../_lib/partner.js";

export default async function handler(req, res) {
  if (!guardPost(req, res)) return;
  const at = /(?:^|;\s*)emmy_at=([^;]+)/.exec(req.headers.cookie || "");
  if (at) { try { await auth("/logout?scope=local", { method: "POST", token: decodeURIComponent(at[1]) }); } catch (e) { console.error("logout upstream", e); } }
  clearSession(req, res);
  return send(res, 200, { ok: true });
}
