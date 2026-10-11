// POST /api/partner/click  { code }  ->  counts one click per visitor per partner per day. Called by the /go page.
import { guardPost, send, throttle, clientIp, db, hashVisitor } from "../_lib/partner.js";

const BOTS = /bot|crawl|spider|slurp|preview|facebookexternalhit|embedly|headless|lighthouse|pingdom|uptime|curl|wget|python-requests|node-fetch/i;

export default async function handler(req, res) {
  const body = guardPost(req, res); if (!body) return;
  const code = String(body.code || "").trim().toUpperCase();
  const ua = String(req.headers["user-agent"] || "");
  if (!/^[A-Z0-9]{3,16}$/.test(code)) return send(res, 200, { ok: true });
  if (!ua || BOTS.test(ua)) return send(res, 200, { ok: true });                  // not counted, not an error
  const ip = clientIp(req);
  if (!throttle(`click:${ip}`, 30, 60 * 1000)) return send(res, 200, { ok: true });

  try {
    // Same network + browser + partner on the same day counts once.
    await db("/rpc/log_click", { method: "POST", service: true, body: { p_code: code, p_visitor: hashVisitor(ip, ua, code) } });
  } catch (e) { console.error("click failed", e); }
  return send(res, 200, { ok: true });
}
