/*
  Naira-Wise invoice generator (/tools/naira-wise) — runs entirely in the browser; nothing is uploaded.
  - Form -> live HTML preview (all user text goes in through textContent, never innerHTML).
  - PDF is drawn with jsPDF as real text (sharp, searchable, multi-page, clickable footer link), loaded only when needed.
  - Money is calculated in whole kobo/cents so totals never drift.
*/
(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const JSPDF_URL = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
  const VAT_RATE = 0.075;
  const STORE_KEY = "nw-profile-v1";
  const PAPER_W = 794, MIN_Z = 0.3, MAX_Z = 1.5;
  const MAX_QTY = 1e6, MAX_PRICE = 1e10;

  const el = {
    logoIn: $("nw-logo"), logoThumb: $("nw-logo-thumb"), logoClear: $("nw-logo-clear"), logoErr: $("nw-logo-err"),
    biz: $("nw-biz"), addr: $("nw-addr"), no: $("nw-no"), cur: $("nw-cur"), issue: $("nw-issue"), due: $("nw-due"),
    client: $("nw-client"), clientInfo: $("nw-client-info"),
    items: $("nw-items"), add: $("nw-add"), vat: $("nw-vat"), bank: $("nw-bank"), notes: $("nw-notes"),
    dl: $("nw-dl"), status: $("nw-status"),
    stage: $("nw-stage"), sizer: $("nw-sizer"), paper: $("nw-paper"),
    zin: $("nw-zin"), zout: $("nw-zout"), zfit: $("nw-zfit"), zval: $("nw-zval"),
    pLogo: $("nw-p-logo"), pBiz: $("nw-p-biz"), pAddr: $("nw-p-addr"), pNo: $("nw-p-no"), pIssue: $("nw-p-issue"), pDue: $("nw-p-due"),
    pClient: $("nw-p-client"), pClientInfo: $("nw-p-clientinfo"), pBody: $("nw-p-body"),
    pSub: $("nw-p-sub"), pVatRow: $("nw-p-vatrow"), pVat: $("nw-p-vat"), pTotal: $("nw-p-total"),
    pBankBlock: $("nw-p-bankblock"), pBank: $("nw-p-bank"), pNotesBlock: $("nw-p-notesblock"), pNotes: $("nw-p-notes"),
  };
  if (!el.paper) return;

  /* ---------- State ---------- */
  let uid = 0;
  const items = [];              // { id, desc, qty, price }  (qty/price are plain numbers)
  let logo = null;               // { url (PNG data URL), w, h }

  const symbol = () => el.cur.value === "USD" ? "$" : "₦";
  const toNum = (v, max) => { const n = parseFloat(v); return Number.isFinite(n) && n > 0 ? Math.min(n, max) : 0; };
  const cents = (it) => Math.round(Math.round(it.qty * 1000) / 1000 * Math.round(it.price * 100));   // qty may be fractional (e.g. 1.5 hrs)
  const nf = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const money = (c) => nf.format(c / 100);
  const qtyText = (q) => String(Math.round(q * 1000) / 1000);

  const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const niceDate = (v) => {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v || ""); if (!m) return "";
    return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
  };

  function totals() {
    const sub = items.reduce((s, it) => s + cents(it), 0);
    const vat = el.vat.checked ? Math.round(sub * VAT_RATE) : 0;
    return { sub, vat, total: sub + vat };
  }

  /* ---------- Line item rows ---------- */
  function field(cls, label, input) {
    const wrap = document.createElement("div"); wrap.className = "nw-field " + cls;
    const l = document.createElement("label"); l.htmlFor = input.id; l.textContent = label;
    wrap.append(l, input); return wrap;
  }
  function makeRow(it) {
    const row = document.createElement("div"); row.className = "nw-item"; row.dataset.id = it.id;
    const head = document.createElement("div"); head.className = "nw-item-head";
    const h = document.createElement("span"); h.className = "nw-item-n";
    const rm = document.createElement("button"); rm.type = "button"; rm.className = "nw-remove"; rm.dataset.act = "remove";
    rm.innerHTML = '<i class="ri-delete-bin-6-line" aria-hidden="true"></i>';
    head.append(h, rm);

    const d = document.createElement("input"); d.type = "text"; d.id = `nw-d-${it.id}`; d.className = "nw-in"; d.placeholder = "e.g. Website design"; d.value = it.desc; d.dataset.k = "desc"; d.autocomplete = "off"; d.maxLength = 300;
    const q = document.createElement("input"); q.type = "number"; q.id = `nw-q-${it.id}`; q.className = "nw-in"; q.min = "0"; q.step = "any"; q.inputMode = "decimal"; q.value = it.qty; q.dataset.k = "qty";
    const p = document.createElement("input"); p.type = "number"; p.id = `nw-p-${it.id}`; p.className = "nw-in"; p.min = "0"; p.step = "any"; p.inputMode = "decimal"; p.placeholder = "0.00"; p.value = it.price || ""; p.dataset.k = "price";

    const grid = document.createElement("div"); grid.className = "nw-item-grid";
    const lt = document.createElement("div"); lt.className = "nw-line-total";
    const lts = document.createElement("span"); lts.textContent = "Line total";
    const out = document.createElement("output"); out.className = "nw-lt"; out.htmlFor = `nw-q-${it.id} nw-p-${it.id}`;
    lt.append(lts, out);
    grid.append(field("desc", "Description", d), field("", "Qty", q), field("", "Unit price", p), lt);
    row.append(head, grid);
    return row;
  }
  function renumber() {
    el.items.querySelectorAll(".nw-item").forEach((row, i) => {
      row.querySelector(".nw-item-n").textContent = `Item ${i + 1}`;
      const rm = row.querySelector(".nw-remove");
      rm.setAttribute("aria-label", `Remove item ${i + 1}`);
      rm.disabled = items.length < 2;
    });
  }
  function addItem(focus) {
    const it = { id: ++uid, desc: "", qty: 1, price: 0 }; items.push(it);
    const row = makeRow(it); el.items.append(row); renumber(); render();
    if (focus) row.querySelector('[data-k="desc"]').focus();
  }

  el.items.addEventListener("input", (e) => {
    const t = e.target, row = t.closest(".nw-item"); if (!row || !t.dataset.k) return;
    const it = items.find((x) => x.id === +row.dataset.id); if (!it) return;
    if (t.dataset.k === "desc") it.desc = t.value;
    else it[t.dataset.k] = toNum(t.value, t.dataset.k === "qty" ? MAX_QTY : MAX_PRICE);
    render();
  });
  el.items.addEventListener("click", (e) => {
    const b = e.target.closest('[data-act="remove"]'); if (!b || items.length < 2) return;
    const row = b.closest(".nw-item"), i = items.findIndex((x) => x.id === +row.dataset.id);
    items.splice(i, 1); row.remove(); renumber(); render();
    const next = el.items.querySelectorAll(".nw-item")[Math.min(i, items.length - 1)];
    (next && next.querySelector('[data-k="desc"]') || el.add).focus();
  });
  el.add.addEventListener("click", () => addItem(true));

  /* ---------- Preview ---------- */
  const txt = (node, v) => { node.textContent = v; };
  function render() {
    const s = symbol(), t = totals();
    txt(el.pBiz, el.biz.value.trim() || "Your business");
    txt(el.pAddr, el.addr.value.trim());
    txt(el.pNo, el.no.value.trim() || "—");
    txt(el.pIssue, niceDate(el.issue.value) || "—");
    txt(el.pDue, niceDate(el.due.value) || "—");
    el.due.setAttribute("aria-invalid", el.due.value && el.issue.value && el.due.value < el.issue.value ? "true" : "false");
    txt(el.pClient, el.client.value.trim() || "Client name");
    txt(el.pClientInfo, el.clientInfo.value.trim());
    el.pClientInfo.hidden = !el.clientInfo.value.trim();
    el.pAddr.hidden = !el.addr.value.trim();

    el.pBody.replaceChildren(...items.map((it) => {
      const tr = document.createElement("tr");
      [it.desc.trim() || "—", qtyText(it.qty), `${s}${money(Math.round(it.price * 100))}`, `${s}${money(cents(it))}`].forEach((v) => {
        const td = document.createElement("td"); td.textContent = v; tr.append(td);
      });
      return tr;
    }));
    el.items.querySelectorAll(".nw-item").forEach((row, i) => { row.querySelector(".nw-lt").textContent = `${s}${money(cents(items[i]))}`; });

    txt(el.pSub, `${s}${money(t.sub)}`);
    el.pVatRow.hidden = !el.vat.checked; txt(el.pVat, `${s}${money(t.vat)}`);
    txt(el.pTotal, `${s}${money(t.total)}`);
    txt(el.pBank, el.bank.value.trim()); el.pBankBlock.hidden = !el.bank.value.trim();
    txt(el.pNotes, el.notes.value.trim()); el.pNotesBlock.hidden = !el.notes.value.trim();
    layout();
  }

  /* Zoom: fit-to-width by default; buttons and Ctrl/Cmd+wheel change it; the stage scrolls natively (touch + keyboard). */
  let zoom = 1, fit = true;
  function layout() {
    const avail = el.stage.clientWidth - parseFloat(getComputedStyle(el.stage).paddingLeft) * 2;
    if (fit && avail > 0) zoom = Math.min(1, avail / PAPER_W);
    el.paper.style.transform = `scale(${zoom})`;
    el.sizer.style.width = `${PAPER_W * zoom}px`;
    el.sizer.style.height = `${el.paper.offsetHeight * zoom}px`;
    el.zval.textContent = `${Math.round(zoom * 100)}%`;
    el.zin.disabled = zoom >= MAX_Z - 0.001; el.zout.disabled = zoom <= MIN_Z + 0.001;
  }
  const setZoom = (z) => { fit = false; zoom = Math.min(MAX_Z, Math.max(MIN_Z, Math.round(z * 100) / 100)); layout(); };
  el.zin.addEventListener("click", () => setZoom(zoom + 0.1));
  el.zout.addEventListener("click", () => setZoom(zoom - 0.1));
  el.zfit.addEventListener("click", () => { fit = true; layout(); });
  el.stage.addEventListener("wheel", (e) => { if (!(e.ctrlKey || e.metaKey)) return; e.preventDefault(); setZoom(zoom + (e.deltaY < 0 ? 0.05 : -0.05)); }, { passive: false });
  el.stage.addEventListener("keydown", (e) => {
    if (!(e.ctrlKey || e.metaKey)) return;
    if (e.key === "+" || e.key === "=") { e.preventDefault(); setZoom(zoom + 0.1); }
    else if (e.key === "-") { e.preventDefault(); setZoom(zoom - 0.1); }
    else if (e.key === "0") { e.preventDefault(); fit = true; layout(); }
  });
  if ("ResizeObserver" in window) { new ResizeObserver(layout).observe(el.stage); new ResizeObserver(layout).observe(el.paper); }
  else window.addEventListener("resize", layout);

  /* ---------- Logo (normalised to PNG so any image type works in both preview and PDF) ---------- */
  function setLogo(next) {
    logo = next;
    el.pLogo.hidden = el.logoThumb.hidden = el.logoClear.hidden = !logo;
    if (logo) { el.pLogo.src = el.logoThumb.src = logo.url; } else { el.pLogo.removeAttribute("src"); el.logoThumb.removeAttribute("src"); el.logoIn.value = ""; }
    layout();
  }
  el.logoIn.addEventListener("change", () => {
    const f = el.logoIn.files && el.logoIn.files[0]; el.logoErr.hidden = true;
    if (!f) return;
    const fail = (m) => { el.logoErr.textContent = m; el.logoErr.hidden = false; el.logoIn.value = ""; };
    if (!/^image\//.test(f.type)) return fail("Please choose an image file (PNG, JPG, WebP or SVG).");
    if (f.size > 5 * 1024 * 1024) return fail("That image is over 5 MB. Please choose a smaller one.");
    const url = URL.createObjectURL(f), img = new Image();
    img.onload = () => {
      const k = Math.min(1, 480 / Math.max(img.naturalWidth || 1, img.naturalHeight || 1));
      const w = Math.max(1, Math.round((img.naturalWidth || 300) * k)), h = Math.max(1, Math.round((img.naturalHeight || 100) * k));
      const c = document.createElement("canvas"); c.width = w; c.height = h; c.getContext("2d").drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url); setLogo({ url: c.toDataURL("image/png"), w, h });
    };
    img.onerror = () => { URL.revokeObjectURL(url); fail("We couldn't read that image. Try a PNG or JPG."); };
    img.src = url;
  });
  el.logoClear.addEventListener("click", () => { setLogo(null); el.logoIn.focus(); });

  /* ---------- Remembered business details (this browser only) ---------- */
  const store = {
    get() { try { return JSON.parse(localStorage.getItem(STORE_KEY)) || {}; } catch { return {}; } },
    set(o) { try { localStorage.setItem(STORE_KEY, JSON.stringify(o)); } catch { /* private mode etc. */ } },
  };
  const saveProfile = () => store.set({ biz: el.biz.value, addr: el.addr.value, bank: el.bank.value, cur: el.cur.value, vat: el.vat.checked });

  /* ---------- PDF ---------- */
  let jspdfLoading;
  const loadJsPdf = () => window.jspdf ? Promise.resolve() : (jspdfLoading ||= new Promise((ok, fail) => {
    const s = document.createElement("script"); s.src = JSPDF_URL; s.onload = ok;
    s.onerror = () => { jspdfLoading = null; fail(new Error("load")); }; document.head.append(s);
  }));
  // jsPDF's built-in fonts cover Latin-1 only: map typographic characters and the naira sign, drop the rest.
  const pdfText = (s) => String(s ?? "").replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[–—]/g, "-").replace(/…/g, "...")
    .replace(/₦/g, "NGN ").replace(/ /g, " ").replace(/[^\n\x20-\x7E\xA0-\xFF]/g, "").replace(/[ \t]+/g, " ");

  const fileName = () => "Invoice-" + (el.no.value.trim().replace(/[^\w.-]+/g, "-").replace(/^-+|-+$/g, "") || "Naira-Wise") + ".pdf";

  async function buildPdf() {
    await loadJsPdf();
    const { jsPDF } = window.jspdf, doc = new jsPDF({ unit: "mm", format: "a4" });
    const W = 210, H = 297, M = 16, CW = W - 2 * M, FOOT = 14;
    const PRIMARY = [45, 102, 180], SECOND = [34, 56, 110], ACCENT = [0, 204, 255], INK = [27, 36, 56], MUTED = [91, 100, 121], LINE = [226, 232, 242], TINT = [238, 243, 250], DARK = [11, 16, 32];
    const sym = symbol(), naira = sym === "₦", t = totals();
    const set = (rgb) => doc.setTextColor(rgb[0], rgb[1], rgb[2]);
    const font = (size, style) => { doc.setFont("helvetica", style || "normal"); doc.setFontSize(size); };
    const lines = (s, w) => doc.splitTextToSize(pdfText(s), w);
    const LH = (size) => size * 0.3528 * 1.35;        // line height in mm for a font size in pt
    let y = 0;

    // Amount with currency symbol, right-aligned at x. The naira sign is drawn (an N with two bars) because built-in fonts lack it.
    const amount = (value, x, yy, size, style, color) => {
      font(size, style); set(color || INK);
      if (!naira) { doc.text(pdfText("$" + value), x, yy, { align: "right" }); return; }
      const nw = doc.getTextWidth(value), gw = doc.getTextWidth("N"), gap = size * 0.3528 * 0.12, left = x - nw - gap - gw;
      doc.text(value, x, yy, { align: "right" }); doc.text("N", left, yy);
      const cap = size * 0.3528 * 0.72; doc.setDrawColor(...(color || INK)); doc.setLineWidth(Math.max(0.15, size * 0.3528 * 0.045));
      [0.38, 0.62].forEach((r) => doc.line(left - gw * 0.12, yy - cap * r, left + gw * 1.12, yy - cap * r));
    };

    const bar = () => { doc.setFillColor(...PRIMARY); doc.rect(0, 0, W * 0.7, 3.5, "F"); doc.setFillColor(...ACCENT); doc.rect(W * 0.7, 0, W * 0.3, 3.5, "F"); };
    const newPage = () => { doc.addPage(); bar(); y = M + 2; };
    const need = (h) => { if (y + h > H - FOOT - 4) { newPage(); return true; } return false; };

    bar(); y = M + 4;

    /* Header: business (left) and invoice details (right) */
    let ly = y;
    if (logo) {
      const maxH = 16, maxW = 50; let h = maxH, w = (logo.w / logo.h) * h; if (w > maxW) { w = maxW; h = (logo.h / logo.w) * w; }
      doc.addImage(logo.url, "PNG", M, ly, w, h, undefined, "FAST"); ly += h + 4;
    }
    font(18, "bold"); set(SECOND);
    const bizLines = lines((el.biz.value.trim() || "Your business").toUpperCase(), 100);
    bizLines.forEach((l) => { ly += LH(18) * 0.85; doc.text(l, M, ly); });
    ly += 1;
    const addr = el.addr.value.trim();
    if (addr) { font(9, "normal"); set(MUTED); lines(addr, 100).forEach((l) => { ly += LH(9); doc.text(l, M, ly); }); }

    let ry = y;
    font(28, "bold"); doc.setTextColor(176, 197, 228); ry += 9; doc.text("INVOICE", W - M, ry, { align: "right" });
    ry += 4;
    [["Invoice no.", el.no.value.trim() || "-"], ["Issue date", niceDate(el.issue.value) || "-"], ["Due date", niceDate(el.due.value) || "-"]].forEach(([k, v]) => {
      ry += 5.2; font(7.5, "bold"); set(MUTED); doc.text(k.toUpperCase(), W - M - 52, ry); font(10, "bold"); set(INK); doc.text(pdfText(v), W - M, ry, { align: "right", maxWidth: 48 });
    });
    y = Math.max(ly, ry) + 10;

    /* Bill to */
    font(8, "bold"); set(PRIMARY); doc.text("BILL TO", M, y); y += 6;
    font(13, "bold"); set(INK);
    lines(el.client.value.trim() || "Client name", CW).forEach((l) => { doc.text(l, M, y); y += LH(13); });
    const ci = el.clientInfo.value.trim();
    if (ci) { font(9, "normal"); set(MUTED); lines(ci, 100).forEach((l) => { doc.text(l, M, y); y += LH(9); }); }
    y += 6;

    /* Table */
    const X = { desc: M + 3, qty: M + CW - 36 - 34 - 22 - 3, price: M + CW - 36 - 3, total: M + CW - 3 };
    const descW = X.qty - 12 - X.desc;
    const thead = () => {
      doc.setFillColor(...TINT); doc.rect(M, y, CW, 8, "F"); font(7.5, "bold"); set(MUTED);
      doc.text("DESCRIPTION", X.desc, y + 5.3); doc.text("QTY", X.qty, y + 5.3, { align: "center" });
      doc.text("PRICE", X.price, y + 5.3, { align: "right" }); doc.text("TOTAL", X.total, y + 5.3, { align: "right" }); y += 8;
    };
    thead();
    items.forEach((it) => {
      font(10, "normal"); const dl = lines(it.desc.trim() || "-", descW), h = Math.max(1, dl.length) * LH(10) + 5.5;
      if (need(h + 2)) thead();
      const base = y + 3.6 + 2.2;
      font(10, "normal"); set(INK); dl.forEach((l, i) => doc.text(l, X.desc, base + i * LH(10)));
      font(10, "normal"); set(INK); doc.text(qtyText(it.qty), X.qty, base, { align: "center" });
      amount(money(Math.round(it.price * 100)), X.price, base, 10, "normal");
      amount(money(cents(it)), X.total, base, 10, "bold");
      y += h; doc.setDrawColor(...LINE); doc.setLineWidth(0.25); doc.line(M, y, M + CW, y);
    });
    y += 6;

    /* Totals */
    need(t.vat || el.vat.checked ? 40 : 32);
    const bx = W - M - 82;
    const row = (label, value) => { font(10, "normal"); set(MUTED); doc.text(label, bx + 3, y); amount(value, W - M - 3, y, 10, "normal"); y += 6.5; };
    row("Subtotal", money(t.sub));
    if (el.vat.checked) row("VAT (7.5%)", money(t.vat));
    y += 1; doc.setFillColor(...TINT); doc.roundedRect(bx, y, 82, 13, 2.5, 2.5, "F");
    font(11, "bold"); set(SECOND); doc.text("TOTAL", bx + 4, y + 8.4);
    amount(money(t.total), W - M - 4, y + 8.6, 15, "bold", SECOND); y += 13 + 10;

    /* Payment details + notes */
    const block = (label, body, style, color) => {
      const bl = lines(body, CW); need(7 + bl.length * LH(10) + 6);
      font(8, "bold"); set(PRIMARY); doc.text(label, M, y); y += 5.5;
      font(10, style); set(color); bl.forEach((l) => { need(LH(10)); doc.text(l, M, y); y += LH(10); }); y += 6;
    };
    if (el.bank.value.trim()) block("PAYMENT DETAILS", el.bank.value.trim(), "bold", INK);
    if (el.notes.value.trim()) block("NOTES", el.notes.value.trim(), "normal", MUTED);

    /* Footer on every page */
    const pages = doc.getNumberOfPages();
    for (let p = 1; p <= pages; p++) {
      doc.setPage(p); doc.setFillColor(...DARK); doc.rect(0, H - FOOT, W, FOOT, "F");
      font(8, "normal"); doc.setTextColor(207, 214, 230);
      const lead = "POWERED BY ", brand = "EMMYSTACK01.COM", tw = doc.getTextWidth(lead + brand), x0 = W / 2 - tw / 2, fy = H - FOOT / 2 + 1.1;
      doc.text(lead, x0, fy); doc.setTextColor(...ACCENT); doc.setFont("helvetica", "bold");
      doc.textWithLink(brand, x0 + doc.getTextWidth(lead), fy, { url: "https://emmystack01.com/" });
      if (pages > 1) { doc.setFont("helvetica", "normal"); doc.setTextColor(207, 214, 230); doc.text(`Page ${p} of ${pages}`, W - M, fy, { align: "right" }); }
    }
    doc.setProperties({ title: `Invoice ${pdfText(el.no.value.trim())}`, creator: "Naira-Wise by Emmy STACK01" });
    return doc;
  }

  const say = (msg, kind) => { el.status.textContent = msg; el.status.className = "nw-status" + (kind ? " " + kind : ""); };
  el.dl.addEventListener("click", async () => {
    const label = el.dl.querySelector("span"), idle = label.textContent;
    if (totals().total <= 0) { say("Add at least one line item with a price first.", "err"); const p = el.items.querySelector('[data-k="price"]'); if (p) p.focus(); return; }
    el.dl.disabled = true; label.textContent = "Preparing PDF…"; say("");
    try { (await buildPdf()).save(fileName()); say("Invoice downloaded. Check your downloads folder.", "ok"); }
    catch (err) { console.error(err); say("We couldn't create the PDF. Check your connection and try again.", "err"); }
    finally { el.dl.disabled = false; label.textContent = idle; }
  });

  /* ---------- Init ---------- */
  const today = new Date(), later = new Date(today.getTime() + 7 * 864e5);
  el.issue.value = iso(today); el.due.value = iso(later);
  const saved = store.get();
  if (typeof saved.biz === "string") el.biz.value = saved.biz;
  if (typeof saved.addr === "string") el.addr.value = saved.addr;
  if (typeof saved.bank === "string") el.bank.value = saved.bank;
  if (saved.cur === "USD" || saved.cur === "NGN") el.cur.value = saved.cur;
  if (typeof saved.vat === "boolean") el.vat.checked = saved.vat;
  addItem(false);

  [el.biz, el.addr, el.no, el.cur, el.issue, el.due, el.client, el.clientInfo, el.vat, el.bank, el.notes].forEach((n) => n.addEventListener("input", () => { render(); if ([el.biz, el.addr, el.cur, el.vat, el.bank].includes(n)) saveProfile(); }));
  el.due.addEventListener("change", render); el.issue.addEventListener("change", render); el.cur.addEventListener("change", () => { render(); saveProfile(); });
  render();
  document.fonts && document.fonts.ready && document.fonts.ready.then(layout);
})();
