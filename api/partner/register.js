// POST /api/partner/register  { firstName, lastName, method, ...payout fields }  (must be signed in)
import { guardPost, send, getSession, db, text, notifyAdmin } from "../_lib/partner.js";

export default async function handler(req, res) {
  const body = guardPost(req, res); if (!body) return;
  try {
    const s = await getSession(req, res);
    if (!s) return send(res, 401, { error: "Please sign in again." });

    const method = body.method === "bank" || body.method === "crypto" ? body.method : "";
    const p = {
      p_first_name: text(body.firstName, 60), p_last_name: text(body.lastName, 60), p_method: method,
      p_bank_name: text(body.bankName, 120), p_account_name: text(body.accountName, 120), p_account_number: text(body.accountNumber, 60),
      p_crypto_name: text(body.cryptoName, 60), p_network: text(body.cryptoNetwork, 60), p_wallet_address: text(body.walletAddress, 200),
    };
    if (!p.p_first_name || !p.p_last_name || !method) return send(res, 400, { error: "Please fill in all the required fields." });

    // The database takes the email from the login token and creates the code itself.
    const r = await db("/rpc/register_partner", { method: "POST", body: p, token: s.token });
    if (r.status >= 400) {
      const msg = String(r.data?.message || "");
      if (msg === "invalid_input") return send(res, 400, { error: "Please fill in all the required fields." });
      console.error("register_partner", r.status, r.data);
      return send(res, 502, { error: "We couldn't create your account. Please try again." });
    }
    const partner = r.data;
    if (partner?.created) await notifyAdmin(`New partner joined: ${p.p_first_name}`, `New partner registered.\n\nName: ${p.p_first_name} ${p.p_last_name}\nCode: ${partner.code}\nPayout method: ${method}`);
    if (partner) delete partner.created;
    return send(res, 200, { partner });
  } catch (e) {
    console.error("register failed", e);
    return send(res, 502, { error: "We couldn't create your account. Please try again." });
  }
}
