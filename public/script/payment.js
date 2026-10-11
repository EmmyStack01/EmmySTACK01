/**
 * Emmy STACK01 — Secure Payment logic
 * USD amount → NGN (kobo) conversion + Paystack checkout (card/other channels + Apple Pay).
 * Loaded after https://js.paystack.co/v2/inline.js. Plain script, no build step needed.
 */
(() => {
  "use strict";

  // ---- Config -----------------------------------------------------------------------------
  const PUBLIC_KEY = "pk_live_aeec89eec2bf1d7aa2d009951872e81e9e5329e5"; // public key — safe in the browser
  const FALLBACK_RATE = 1550;          // NGN per USD, used if the live rate can't be fetched
  const RATE_URL = "https://open.er-api.com/v6/latest/USD";
  const RATE_TIMEOUT_MS = 4000;
  const MIN_USD = 1;
  const MAX_USD = 10000;               // sanity cap; bigger invoices should be arranged directly
  const SUCCESS_URL = "/success"; // ?ref=<paystack reference> is appended
  const DEFAULTS = { coffee: 5, project: 60 };
  const PLACEHOLDERS = { coffee: "Any amount", project: "Invoice total" };

  // ---- State & elements -------------------------------------------------------------------
  let type = "coffee";
  let rate = FALLBACK_RATE;
  let rateIsLive = false;
  let popup = null;
  let busy = false;

  const $ = (id) => document.getElementById(id);
  const form = $("paymentForm");
  const emailEl = $("email-address");
  const amountEl = $("amount");
  const hintEl = $("amount-hint");
  const errorEl = $("form-error");
  const payBtn = $("paystack-other-channels");
  const typeBtns = [...document.querySelectorAll(".type-btn")];
  const chipsWrap = $("chips");
  const fmtNGN = new Intl.NumberFormat("en-NG", { maximumFractionDigits: 0 });

  // ---- Helpers ----------------------------------------------------------------------------
  const usdValue = () => {
    const n = Number.parseFloat(amountEl.value);
    return Number.isFinite(n) ? n : NaN;
  };
  const toKobo = (usd) => Math.round(usd * rate * 100);

  function showError(msg, field) {
    errorEl.textContent = msg;
    errorEl.hidden = !msg;
    [emailEl, amountEl].forEach((el) => el.removeAttribute("aria-invalid"));
    if (msg && field) { field.setAttribute("aria-invalid", "true"); field.focus(); }
  }

  function updateHint() {
    const usd = usdValue();
    if (!(usd >= MIN_USD)) { hintEl.textContent = `Minimum payment is $${MIN_USD}.`; return; }
    const note = rateIsLive ? "today’s rate" : "estimated rate";
    hintEl.textContent = `≈ ₦${fmtNGN.format(usd * rate)} at ₦${fmtNGN.format(rate)}/$ (${note}). Final amount is confirmed at checkout.`;
  }

  function setBusy(on) {
    busy = on;
    payBtn.disabled = on;
    payBtn.innerHTML = on
      ? '<i class="ri-loader-4-line spin" aria-hidden="true"></i> Opening secure checkout…'
      : '<i class="ri-secure-payment-fill" aria-hidden="true"></i> Pay with Paystack';
  }

  // ---- Payment type toggle & quick amounts ------------------------------------------------
  function setType(next) {
    type = next;
    typeBtns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.type === next)));
    amountEl.value = DEFAULTS[next];
    amountEl.placeholder = PLACEHOLDERS[next];
    chipsWrap.hidden = next !== "coffee";
    showError("");
    updateHint();
  }

  // ---- Live exchange rate (never blocks the page) -----------------------------------------
  async function loadRate() {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), RATE_TIMEOUT_MS);
    try {
      const res = await fetch(RATE_URL, { signal: ctrl.signal });
      const data = await res.json();
      const ngn = Number(data && data.rates && data.rates.NGN);
      if (Number.isFinite(ngn) && ngn > 300 && ngn < 5000) { rate = ngn; rateIsLive = true; }
    } catch (_) { /* keep fallback */ }
    finally { clearTimeout(t); updateHint(); }
  }

  // ---- Paystack ---------------------------------------------------------------------------
  function initPaystack(attempt = 0) {
    if (typeof window.PaystackPop === "undefined") {
      if (attempt < 25) return void setTimeout(() => initPaystack(attempt + 1), 200); // wait up to ~5s
      return;
    }
    popup = new window.PaystackPop();
    const wrap = $("paystack-apple-pay");
    if (!wrap) return;
    try {
      // Apple Pay button — Paystack only renders it on supported Safari devices.
      popup.paymentRequest({
        key: PUBLIC_KEY,
        container: "paystack-apple-pay",
        email: () => emailEl.value.trim() || "customer@emmystack01.com",
        amount: () => toKobo(Math.min(Math.max(usdValue() || MIN_USD, MIN_USD), MAX_USD)),
        currency: "NGN",
        onSuccess: (res) => { location.href = `${SUCCESS_URL}?ref=${encodeURIComponent(res.reference)}`; },
      });
    } catch (_) { /* Apple Pay unavailable — the main button still works */ }
  }

  function pay(e) {
    e.preventDefault();
    if (busy) return;

    const email = emailEl.value.trim();
    const usd = usdValue();

    if (!email || !emailEl.checkValidity()) return showError("Please enter a valid email address.", emailEl);
    if (!(usd >= MIN_USD)) return showError(`The minimum payment is $${MIN_USD}.`, amountEl);
    if (usd > MAX_USD) return showError(`For payments above $${MAX_USD.toLocaleString()}, please contact us on WhatsApp.`, amountEl);
    if (!popup) return showError("The payment gateway couldn’t load. Check your connection and refresh the page.");

    showError("");
    setBusy(true);
    try {
      popup.newTransaction({
        key: PUBLIC_KEY,
        email,
        amount: toKobo(usd),
        currency: "NGN",
        metadata: {
          custom_fields: [
            { display_name: "Payment Type", variable_name: "type", value: type },
            { display_name: "USD Amount", variable_name: "usd_val", value: usd },
            { display_name: "Rate Used", variable_name: "rate", value: rate },
          ],
        },
        onSuccess: (tx) => { location.href = `${SUCCESS_URL}?ref=${encodeURIComponent(tx.reference)}`; },
        onCancel: () => setBusy(false),
        onError: () => { setBusy(false); showError("Something went wrong opening checkout. Please try again."); },
      });
      // If the popup was blocked silently, don't leave the button stuck.
      setTimeout(() => { if (busy) setBusy(false); }, 8000);
    } catch (_) {
      setBusy(false);
      showError("Something went wrong opening checkout. Please try again.");
    }
  }

  // ---- Start ------------------------------------------------------------------------------
  typeBtns.forEach((b) => b.addEventListener("click", () => setType(b.dataset.type)));
  chipsWrap.addEventListener("click", (e) => {
    const chip = e.target.closest("[data-amount]");
    if (!chip) return;
    amountEl.value = chip.dataset.amount;
    showError("");
    updateHint();
  });
  amountEl.addEventListener("input", () => { showError(""); updateHint(); });
  emailEl.addEventListener("input", () => showError(""));
  form.addEventListener("submit", pay);

  setType("coffee");
  loadRate();     // in parallel — the form is usable immediately
  initPaystack();
})();
