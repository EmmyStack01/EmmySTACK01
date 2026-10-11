/**
 * Emmy STACK01 — Website Auditor (Digital DNA Auditor)
 * Talks to /api/audit (see api/audit.js), renders the report, and builds a multi-page PDF in the browser.
 *
 * Page contract (website-auditor.astro): #audit-form, #url-input, #audit-btn, input[name=strategy], #audit-err,
 * #au-scan, #au-status, #au-results, #au-results-title, #au-meta, #g-performance/#g-seo/#g-accessibility (.au-gauge),
 * #au-metrics, #au-issues, #au-cta, #download-btn.
 */
(() => {
  "use strict";

  const JSPDF_URL = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
  const WA_NUMBER = "2349076991076";
  const MAX_SHOWN = 4;                 // findings shown per category
  const TIMEOUT_MS = 75000;

  const CATS = [
    { key: "performance", gauge: "g-performance", title: "Performance findings", pdf: "Performance", icon: "ri-dashboard-3-line", color: "#ff4e42", pdfColor: [255, 78, 66] },
    { key: "seo", gauge: "g-seo", title: "SEO criticals", pdf: "SEO", icon: "ri-search-eye-line", color: "#2d66b4", pdfColor: [79, 172, 254] },
    { key: "accessibility", gauge: "g-accessibility", title: "UX & accessibility", pdf: "UX & Accessibility", icon: "ri-user-smile-line", color: "#d98a00", pdfColor: [255, 187, 0] },
  ];
  const STATUS_MESSAGES = [
    "Fetching DOM structure…",
    "Analyzing asset compression…",
    "Checking render-blocking resources…",
    "Decoding digital DNA…",
    "Compiling performance & SEO report…",
    "Still working. Big sites take a little longer…",
  ];

  const $ = (id) => document.getElementById(id);
  const form = $("audit-form"), input = $("url-input"), btn = $("audit-btn");
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let busy = false, last = null, statusTimer = null;

  // ---------- helpers ----------
  const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };
  const tone = (pct) => (pct >= 90 ? "good" : pct >= 50 ? "mid" : "bad");
  const toneWord = { good: "Good", mid: "Needs work", bad: "Poor" };
  const scoreTone = (s) => (s == null ? "na" : s >= 0.9 ? "good" : s >= 0.5 ? "mid" : "bad");
  const hostOf = (u) => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return u; } };

  // "emmystack01.com", "https://emmystack01.com/", "emmystack01.com," -> a clean https URL, or null
  function normalizeUrl(raw) {
    let s = (raw || "").trim().replace(/[,\s]+$/, "");
    if (!s || /\s/.test(s)) return null;
    if (!/^https?:\/\//i.test(s)) s = "https://" + s;
    try {
      const u = new URL(s);
      if (!/^https?:$/.test(u.protocol) || !u.hostname.includes(".") || u.hostname.endsWith(".")) return null;
      return u.href;
    } catch { return null; }
  }

  const showErr = (text) => { const e = $("audit-err"); e.textContent = text; e.hidden = !text; };

  function setBusy(on) {
    busy = on;
    btn.disabled = on;
    btn.querySelector("span").textContent = on ? "Analyzing…" : "Analyze site";
    form.setAttribute("aria-busy", String(on));
    $("au-scan").hidden = !on;
    if (on) {
      let i = 0; $("au-status").textContent = STATUS_MESSAGES[0];
      statusTimer = setInterval(() => { if (i < STATUS_MESSAGES.length - 1) $("au-status").textContent = STATUS_MESSAGES[++i]; }, 3500);
    } else { clearInterval(statusTimer); }
  }

  // ---------- run an audit ----------
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (busy) return;
    const url = normalizeUrl(input.value);
    if (!url) { showErr("Please enter a valid website address, like example.com."); input.focus(); return; }
    input.value = url;
    const strategy = form.querySelector("input[name=strategy]:checked").value;

    showErr(""); $("au-results").hidden = true; setBusy(true);
    $("au-scan").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });

    const ctrl = new AbortController(), timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(`/api/audit?url=${encodeURIComponent(url)}&strategy=${strategy}`, { signal: ctrl.signal });
      let data = null; try { data = await res.json(); } catch {}
      if (!res.ok || !data || data.error) {
        throw new Error((data && data.error) || (res.status === 504 || res.status === 502 ? "The audit timed out. Please try again." : "Something went wrong. Please try again."));
      }
      last = data;
      setBusy(false);
      render(data);
    } catch (err) {
      setBusy(false);
      const offline = err instanceof TypeError;
      showErr(err.name === "AbortError" ? "That site took too long to analyze. Please try again." : offline ? "Connection problem. Check your internet and try again." : err.message);
      input.focus({ preventScroll: true });
    } finally { clearTimeout(timer); }
  });

  // ---------- render ----------
  function animateGauge(g, pct) {
    g.className = `au-gauge ${tone(pct)}-c`;
    const num = g.querySelector("b");
    if (reduceMotion) { g.style.setProperty("--p", pct); num.textContent = pct; return; }
    const t0 = performance.now(), dur = 900;
    const step = (t) => {
      const k = Math.min(1, (t - t0) / dur), v = Math.round(pct * (1 - Math.pow(1 - k, 3)));
      g.style.setProperty("--p", v); num.textContent = v;
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  function render(d) {
    const host = hostOf(d.finalUrl || d.url);
    $("au-results-title").textContent = `Results for ${host}`;
    const when = new Date(d.fetchedAt);
    $("au-meta").textContent = `${d.strategy === "desktop" ? "Desktop" : "Mobile"} test · ${isNaN(when) ? "just now" : when.toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}`;

    CATS.forEach((c) => {
      const pct = d.scores[c.key], t = tone(pct), card = $(c.gauge).closest(".au-gcard");
      animateGauge($(c.gauge), pct);
      const pill = card.querySelector(".au-pill"); pill.className = `au-pill ${t}`; pill.textContent = toneWord[t];
      $(c.gauge).setAttribute("aria-label", `${c.pdf} score ${pct} out of 100, ${toneWord[t]}`);
    });

    const m = $("au-metrics"); m.replaceChildren();
    (d.metrics || []).forEach((x) => {
      const box = el("div", "au-metric");
      box.append(el("dt", "", x.title), el("dd", scoreTone(x.score), x.displayValue || "—"));
      m.append(box);
    });
    m.hidden = !m.children.length;

    const list = $("au-issues"); list.replaceChildren();
    CATS.forEach((c) => {
      const items = (d.issues && d.issues[c.key]) || [], pct = d.scores[c.key];
      const group = el("section", "au-group"); group.style.setProperty("--c", c.color);
      if (pct >= 90 || !items.length) {
        const h = el("h3"); h.innerHTML = `<i class="${c.icon}" aria-hidden="true"></i>`; h.append(c.pdf === "UX & Accessibility" ? "User accessibility" : c.pdf);
        group.append(h);
        const pass = el("div", "au-pass" + (pct >= 90 ? "" : " minor"));
        pass.append(el("span", "", pct >= 90 ? "All critical checks passed." : "Minor optimizations suggested."), el("strong", "", `${pct}%`));
        group.append(pass);
      } else {
        const h = el("h3"); h.innerHTML = `<i class="${c.icon}" aria-hidden="true"></i>`; h.append(c.title, el("span", "", `${items.length} to fix`));
        group.append(h);
        const ul = el("ul", "au-issues");
        items.slice(0, MAX_SHOWN).forEach((it) => {
          const li = el("li", "au-issue");
          li.append(el("h4", "", it.title));
          const sev = it.score < 0.5 ? "High impact" : "Medium impact";
          li.append(el("div", "au-impact", it.displayValue ? `${sev} · ${it.displayValue}` : sev));
          if (it.description) li.append(el("p", "", it.description));
          if (it.learnMore && /^https:\/\//.test(it.learnMore)) {
            const a = el("a", "", "Learn more"); a.href = it.learnMore; a.target = "_blank"; a.rel = "noopener noreferrer";
            li.append(a);
          }
          ul.append(li);
        });
        group.append(ul);
        if (items.length > MAX_SHOWN) group.append(el("p", "au-more", `+ ${items.length - MAX_SHOWN} more ${items.length - MAX_SHOWN === 1 ? "issue" : "issues"} found. They are included when we fix the site.`));
      }
      list.append(group);
    });

    buildCta(d);
    $("au-results").hidden = false;
    const title = $("au-results-title"); title.focus({ preventScroll: true });
    title.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
  }

  function buildCta(d) {
    const perf = d.scores.performance, seo = d.scores.seo, ux = d.scores.accessibility, count = d.counts ? d.counts.total : 0;
    let headline, sub;
    if (perf < 50) { headline = `Found ${count} critical ${count === 1 ? "leak" : "leaks"}.`; sub = `Your SEO (${seo}%) and UX (${ux}%) are noted, but your site speed is currently a major revenue leak.`; }
    else if (perf < 90) { headline = "Optimization required."; sub = `You've done well with SEO (${seo}%) and accessibility (${ux}%), but we can still shave seconds off your load time.`; }
    else { headline = "Your Digital DNA is looking sharp!"; sub = "Top-tier performance, SEO and accessibility. You're leading the market."; }

    const closing = count > 0
      ? `⚠️ The tool identified ${count} critical leaks. I'd like to discuss fixing these bottlenecks!`
      : "✅ The tool identified 0 leaks, excellent! I'd like to discuss maintaining this performance or adding new features.";
    const message = `Hi Emmy STACK01! 🚀\n\nI just audited my site using the Digital DNA Auditor:\n🔗 ${d.url}\n\n📊 *My Results:*\n• Performance: *${perf}%*\n• SEO Score: *${seo}%*\n• Accessibility: *${ux}%*\n\n${closing}`;

    const box = $("au-cta"); box.replaceChildren();
    const a = el("a", "hero-cta btn-white"); a.href = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(message)}`; a.target = "_blank"; a.rel = "noopener noreferrer";
    a.innerHTML = '<i class="ri-whatsapp-line" aria-hidden="true"></i> Discuss my audit';
    box.append(el("h2", "", headline), el("p", "", sub), a);
  }

  // ---------- PDF report (real text, multiple pages) ----------
  let jspdfLoading;
  const loadJsPdf = () => window.jspdf ? Promise.resolve() : (jspdfLoading ||= new Promise((ok, fail) => {
    const s = document.createElement("script"); s.src = JSPDF_URL; s.onload = ok;
    s.onerror = () => { jspdfLoading = null; fail(new Error("load")); }; document.head.append(s);
  }));

  // jsPDF's built-in fonts only cover Latin-1, so swap typographic characters and drop the rest.
  const pdfText = (s) => String(s ?? "")
    .replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[–—]/g, "-").replace(/…/g, "...").replace(/ /g, " ")
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, "").replace(/\s+/g, " ").trim();

  async function downloadPdf() {
    if (!last) return;
    const b = $("download-btn"), label = b.querySelector("span"); b.disabled = true; label.textContent = "Preparing report…";
    try {
      await loadJsPdf();
      const d = last, { jsPDF } = window.jspdf, doc = new jsPDF({ unit: "mm", format: "a4" });
      const W = 210, H = 297, M = 16, CW = W - 2 * M;
      const BG = [10, 14, 28], CARD = [18, 26, 46], WHITE = [255, 255, 255], MUTED = [150, 160, 180], ACCENT = [79, 172, 254];
      const toneRgb = { good: [12, 206, 107], mid: [255, 164, 0], bad: [255, 78, 66] };
      let y = M;

      const paint = () => { doc.setFillColor(...BG); doc.rect(0, 0, W, H, "F"); };
      const newPage = () => { doc.addPage(); paint(); y = M; };
      const ensure = (h) => { if (y + h > H - 20) newPage(); };
      const text = (s, x, yy, size, color, style = "normal", opts) => { doc.setFont("helvetica", style); doc.setFontSize(size); doc.setTextColor(...color); doc.text(s, x, yy, opts); };

      paint();
      // header
      text("EMMY ", M, y + 6, 20, WHITE, "bold");
      text("STACK01", M + doc.getTextWidth("EMMY "), y + 6, 20, ACCENT, "bold");
      text("HIGH-PERFORMANCE DIGITAL DNA AUDIT", M, y + 12, 7.5, MUTED);
      const host = hostOf(d.finalUrl || d.url), when = new Date(d.fetchedAt);
      text(pdfText(`Analysis for: ${host}`), W - M, y + 5, 10, ACCENT, "bold", { align: "right" });
      text(`${d.strategy === "desktop" ? "Desktop" : "Mobile"} test · ${isNaN(when) ? "" : when.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}`, W - M, y + 11, 8, MUTED, "normal", { align: "right" });
      y += 17; doc.setDrawColor(...ACCENT); doc.setLineWidth(0.6); doc.line(M, y, W - M, y); y += 9;

      // scores
      const bw = (CW - 10) / 3;
      CATS.forEach((c, i) => {
        const pct = d.scores[c.key], t = tone(pct), x = M + i * (bw + 5);
        doc.setFillColor(...CARD); doc.roundedRect(x, y, bw, 30, 3, 3, "F");
        text(c.pdf.toUpperCase(), x + bw / 2, y + 8, 7, MUTED, "bold", { align: "center" });
        text(String(pct), x + bw / 2, y + 21, 24, toneRgb[t], "bold", { align: "center" });
        text(toneWord[t], x + bw / 2, y + 27, 7.5, toneRgb[t], "normal", { align: "center" });
      });
      y += 38;

      // key metrics
      if (d.metrics && d.metrics.length) {
        text("KEY METRICS", M, y, 8, MUTED, "bold"); y += 5;
        const cw = CW / 2;
        d.metrics.forEach((m, i) => {
          const col = i % 2, x = M + col * cw;
          text(pdfText(m.title), x, y, 9, WHITE); text(pdfText(m.displayValue || "-"), x + cw - 6, y, 9, toneRgb[tone((m.score ?? 0) * 100)], "bold", { align: "right" });
          if (col === 1 || i === d.metrics.length - 1) y += 6;
        });
        y += 5;
      }

      // findings
      CATS.forEach((c) => {
        const items = (d.issues && d.issues[c.key]) || [], pct = d.scores[c.key];
        ensure(22);
        doc.setFillColor(...c.pdfColor); doc.rect(M, y - 4.5, 1.6, 7, "F");
        text(c.pdf === "UX & Accessibility" ? "UX Blockers" : c.pdf === "SEO" ? "SEO Criticals" : "Performance Findings", M + 5, y, 13, WHITE, "bold"); y += 7;
        if (pct >= 90 || !items.length) {
          ensure(14); doc.setFillColor(...CARD); doc.roundedRect(M, y, CW, 11, 2, 2, "F");
          text(pct >= 90 ? "All critical checks passed." : "Minor optimizations suggested.", M + 5, y + 7, 9.5, toneRgb[pct >= 90 ? "good" : "mid"]); y += 17; return;
        }
        items.slice(0, MAX_SHOWN).forEach((it) => {
          const title = doc.setFont("helvetica", "bold").setFontSize(10).splitTextToSize(pdfText(it.title), CW - 12);
          const desc = doc.setFont("helvetica", "normal").setFontSize(8.5).splitTextToSize(pdfText(it.description), CW - 12);
          const sev = it.score < 0.5 ? "High impact" : "Medium impact", impact = pdfText(it.displayValue ? `${sev} - ${it.displayValue}` : sev);
          const h = 6 + title.length * 4.6 + 5 + (desc.length ? desc.length * 4 + 1 : 0) + (it.learnMore ? 5 : 0) + 3;
          ensure(h + 3);
          doc.setFillColor(...CARD); doc.roundedRect(M, y, CW, h, 2, 2, "F"); doc.setFillColor(...c.pdfColor); doc.rect(M, y + 1, 1.4, h - 2, "F");
          let yy = y + 7;
          doc.setFont("helvetica", "bold").setFontSize(10).setTextColor(...WHITE); doc.text(title, M + 6, yy); yy += title.length * 4.6;
          text(impact, M + 6, yy, 8.5, c.pdfColor, "bold"); yy += 5;
          if (desc.length) { doc.setFont("helvetica", "normal").setFontSize(8.5).setTextColor(...MUTED); doc.text(desc, M + 6, yy); yy += desc.length * 4 + 1; }
          if (it.learnMore) { doc.setFontSize(7.5).setTextColor(...ACCENT); doc.textWithLink("Learn more", M + 6, yy + 1, { url: it.learnMore }); }
          y += h + 3;
        });
        if (items.length > MAX_SHOWN) { text(`+ ${items.length - MAX_SHOWN} more ${items.length - MAX_SHOWN === 1 ? "issue" : "issues"} found.`, M, y + 2, 8.5, MUTED); y += 8; }
        y += 6;
      });

      // closing call to action
      ensure(26); doc.setFillColor(...CARD); doc.roundedRect(M, y, CW, 20, 3, 3, "F");
      text("Want these fixed? Talk to Emmy STACK01", W / 2, y + 8.5, 10.5, WHITE, "bold", { align: "center" });
      text("emmystack01.com  |  hello@emmystack01.com", W / 2, y + 14.5, 9, ACCENT, "bold", { align: "center" });

      // footer on every page
      const pages = doc.getNumberOfPages();
      for (let p = 1; p <= pages; p++) {
        doc.setPage(p); text("Scores are lab data from Google PageSpeed Insights (Lighthouse) and can vary between runs.", M, H - 9, 7, MUTED);
        text(`${p} / ${pages}`, W - M, H - 9, 7, MUTED, "normal", { align: "right" });
      }
      doc.save(`EmmySTACK01-Audit-${host.replace(/[^a-z0-9.-]/gi, "")}.pdf`);
    } catch (e) {
      showErr("We couldn't create the PDF report. Please try again.");
      $("audit-err").scrollIntoView({ block: "center" });
    } finally {
      b.disabled = false; label.textContent = "Download full report (PDF)";
    }
  }
  $("download-btn").addEventListener("click", downloadPdf);
})();
