/*
  Meeting Background Studio (/tools/meeting_background_studio) — builds a 1920x1080 branded background for Zoom,
  Google Meet and Teams. Plain canvas (no Fabric.js): the background image/video sits under a transparent canvas that
  draws the logo and QR plate; export draws everything onto one 1920x1080 canvas. Runs entirely in the browser.
*/
(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const W = 1920, H = 1080, M = 76;
  const QR_URL = "https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js";
  const el = {
    box: $("ms-box"), canvas: $("ms-canvas"), img: $("ms-bg-img"), video: $("ms-bg-video"),
    guide: $("ms-guide"), guideOn: $("ms-guide-on"), mockZoom: $("ms-mock-zoom"), mockMeet: $("ms-mock-meet"),
    bgUpload: $("ms-bg-up"), bgErr: $("ms-bg-err"), thumbs: [...document.querySelectorAll(".ms-thumb")],
    logoIn: $("ms-logo"), logoOpts: $("ms-logo-opts"), logoSize: $("ms-logo-size"), logoSizeOut: $("ms-logo-size-out"), logoRm: $("ms-logo-rm"), logoErr: $("ms-logo-err"),
    qrUrl: $("ms-qr-url"), qrErr: $("ms-qr-err"), qrOpts: $("ms-qr-opts"), qrCap: $("ms-qr-cap"), qrSize: $("ms-qr-size"), qrSizeOut: $("ms-qr-size-out"), qrRm: $("ms-qr-rm"),
    dl: $("ms-dl"), status: $("ms-status"),
  };
  if (!el.canvas) return;
  const ctx = el.canvas.getContext("2d");
  const radio = (name) => (document.querySelector(`input[name="${name}"]:checked`) || {}).value;

  /* ---------- State ---------- */
  const state = { bgKind: "image", logo: null, qr: null, sel: null };
  let bgUrl = null;   // object URL of an uploaded background (revoked on replace)

  /* An item has a top-left (x, y) in the 1920x1080 design space and a width; height follows from its shape. */
  const bounds = (it) => (it === state.logo ? { x: it.x, y: it.y, w: it.w, h: it.w * it.ratio } : { x: it.x, y: it.y, w: it.w, h: qrHeight(it) });
  const qrHeight = (q) => q.w + (q.caption ? q.w * 0.16 : 0);
  const clamp = (v, a, b) => Math.min(Math.max(v, a), Math.max(a, b));

  function snap(it) {                       // put an item on its corner preset
    if (!it || !it.corner) return;
    const b = bounds(it);
    it.x = it.corner[1] === "l" ? M : W - M - b.w;
    it.y = it.corner[0] === "t" ? M : H - M - b.h;
  }
  const keepInside = (it) => { const b = bounds(it); it.x = clamp(it.x, 0, W - b.w); it.y = clamp(it.y, 0, H - b.h); };

  /* ---------- Drawing (shared by preview and export) ---------- */
  function roundRect(c, x, y, w, h, r) {
    c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
  }
  function drawItems(c, preview) {
    const L = state.logo, Q = state.qr;
    if (L) c.drawImage(L.bmp, L.x, L.y, L.w, L.w * L.ratio);
    if (Q) {
      const h = qrHeight(Q), pad = Q.w * 0.08, inner = Q.w - pad * 2;
      c.save(); c.shadowColor = "rgba(0,0,0,.3)"; c.shadowBlur = 28; c.shadowOffsetY = 8; c.fillStyle = "#fff"; roundRect(c, Q.x, Q.y, Q.w, h, Q.w * 0.06); c.fill(); c.restore();
      c.imageSmoothingEnabled = false; c.drawImage(Q.bmp, Q.x + pad, Q.y + pad, inner, inner); c.imageSmoothingEnabled = true;
      if (Q.caption) {
        c.fillStyle = "#0b1020"; c.textAlign = "center"; c.textBaseline = "middle";
        let size = Q.w * 0.075; c.font = `700 ${size}px Manrope, system-ui, sans-serif`;
        while (c.measureText(Q.caption).width > Q.w - pad * 2 && size > 10) { size -= 1; c.font = `700 ${size}px Manrope, system-ui, sans-serif`; }
        c.fillText(Q.caption, Q.x + Q.w / 2, Q.y + Q.w + (h - Q.w) / 2 - pad * 0.1);
      }
    }
    if (preview && state.sel) {
      const b = bounds(state.sel); c.save(); c.lineWidth = 5; c.setLineDash([18, 12]); c.strokeStyle = "#00ccff"; c.strokeRect(b.x - 6, b.y - 6, b.w + 12, b.h + 12); c.restore();
    }
  }
  const render = () => { ctx.clearRect(0, 0, W, H); drawItems(ctx, true); };

  function drawCover(c, src, sw, sh) {
    const r = W / H, ir = sw / sh; let x = 0, y = 0, w = sw, h = sh;
    if (ir > r) { w = sh * r; x = (sw - w) / 2; } else { h = sw / r; y = (sh - h) / 2; }
    c.drawImage(src, x, y, w, h, 0, 0, W, H);
  }

  /* ---------- Say / errors ---------- */
  const say = (m, kind) => { el.status.textContent = m; el.status.className = "ms-status" + (kind ? " " + kind : ""); };
  const fieldErr = (node, msg) => { node.textContent = msg; node.hidden = !msg; };

  /* ---------- Preview options ---------- */
  function setMock() {
    const m = radio("mock");
    el.mockZoom.hidden = m !== "zoom"; el.mockMeet.hidden = m !== "meet";
  }
  document.querySelectorAll('input[name="mock"]').forEach((r) => r.addEventListener("change", setMock));
  el.guideOn.addEventListener("change", () => { el.guide.hidden = !el.guideOn.checked; });

  /* ---------- Background ---------- */
  function setBackground(src, isVideo, thumb) {
    state.bgKind = isVideo ? "video" : "image";
    if (isVideo) { el.img.hidden = true; el.video.hidden = false; el.video.src = src; el.video.play().catch(() => {}); }
    else { el.video.pause(); el.video.hidden = true; el.img.hidden = false; el.img.src = src; }
    el.thumbs.forEach((t) => t.setAttribute("aria-pressed", String(t === thumb)));
  }
  el.thumbs.forEach((t) => t.addEventListener("click", () => {
    if (bgUrl) { URL.revokeObjectURL(bgUrl); bgUrl = null; }
    fieldErr(el.bgErr, ""); setBackground(t.dataset.src, t.dataset.type === "video", t);
  }));
  el.bgUpload.addEventListener("change", () => {
    const f = el.bgUpload.files && el.bgUpload.files[0]; fieldErr(el.bgErr, "");
    if (!f) return;
    if (!/^(image|video)\//.test(f.type)) { fieldErr(el.bgErr, "Please choose an image or a video file."); el.bgUpload.value = ""; return; }
    if (f.size > 60 * 1024 * 1024) { fieldErr(el.bgErr, "That file is over 60 MB. Please choose a smaller one."); el.bgUpload.value = ""; return; }
    if (bgUrl) URL.revokeObjectURL(bgUrl);
    bgUrl = URL.createObjectURL(f); setBackground(bgUrl, f.type.startsWith("video/"), null); el.bgUpload.value = "";
  });
  el.img.addEventListener("error", () => fieldErr(el.bgErr, "That background couldn't be loaded. Try another."));
  el.video.addEventListener("error", () => fieldErr(el.bgErr, "That video couldn't be played. Try another."));

  /* ---------- Logo ---------- */
  function showOpts(group, on) { group.hidden = !on; }
  el.logoIn.addEventListener("change", () => {
    const f = el.logoIn.files && el.logoIn.files[0]; fieldErr(el.logoErr, "");
    if (!f) return;
    const fail = (m) => { fieldErr(el.logoErr, m); el.logoIn.value = ""; };
    if (!/^image\//.test(f.type)) return fail("Please choose an image file (PNG, JPG, WebP or SVG).");
    if (f.size > 10 * 1024 * 1024) return fail("That image is over 10 MB. Please choose a smaller one.");
    const url = URL.createObjectURL(f), img = new Image();
    img.onload = () => {
      const nw = img.naturalWidth || 400, nh = img.naturalHeight || 400, k = Math.min(1, 1200 / Math.max(nw, nh));
      const bmp = document.createElement("canvas"); bmp.width = Math.max(1, Math.round(nw * k)); bmp.height = Math.max(1, Math.round(nh * k));
      bmp.getContext("2d").drawImage(img, 0, 0, bmp.width, bmp.height); URL.revokeObjectURL(url);
      const ratio = bmp.height / bmp.width, w = Math.min(300, 220 / ratio);
      state.logo = { bmp, ratio, w: Math.round(Math.max(80, w)), x: M, y: M, corner: "tl" };
      el.logoSize.value = state.logo.w; el.logoSizeOut.textContent = `${state.logo.w}px`;
      snap(state.logo); state.sel = state.logo; showOpts(el.logoOpts, true); syncPos("logo"); render(); say("");
    };
    img.onerror = () => { URL.revokeObjectURL(url); fail("We couldn't read that image. Try a PNG or JPG."); };
    img.src = url; el.logoIn.value = "";
  });
  el.logoSize.addEventListener("input", () => {
    if (!state.logo) return; state.logo.w = +el.logoSize.value; el.logoSizeOut.textContent = `${state.logo.w}px`;
    state.sel = state.logo; snap(state.logo); keepInside(state.logo); render();
  });
  el.logoRm.addEventListener("click", () => { state.logo = null; if (state.sel && !state.qr) state.sel = null; showOpts(el.logoOpts, false); render(); el.logoIn.focus(); });

  /* ---------- QR code ---------- */
  let qrLoading;
  const loadQr = () => window.QRCode ? Promise.resolve() : (qrLoading ||= new Promise((ok, fail) => {
    const s = document.createElement("script"); s.src = QR_URL; s.onload = ok; s.onerror = () => { qrLoading = null; fail(new Error("load")); }; document.head.append(s);
  }));
  function cleanUrl(raw) {
    const t = raw.trim(); if (!t) return { empty: true };
    let u; try { u = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(t) ? t : "https://" + t); } catch { return { error: "That doesn't look like a web address. Try yourwebsite.com." }; }
    if (!/^https?:$/.test(u.protocol)) return { error: "Only web addresses (http or https) can be used." };
    if (!u.hostname.includes(".")) return { error: "That doesn't look like a web address. Try yourwebsite.com." };
    if (u.href.length > 300) return { error: "That address is too long for a clean QR code. Use a shorter link." };
    return { href: u.href };
  }
  let qrToken = 0, qrTimer;
  async function buildQr() {
    const r = cleanUrl(el.qrUrl.value), token = ++qrToken;
    el.qrUrl.setAttribute("aria-invalid", r.error ? "true" : "false"); fieldErr(el.qrErr, r.error || "");
    if (r.empty) { state.qr = null; if (state.sel && state.sel !== state.logo) state.sel = null; showOpts(el.qrOpts, false); render(); return; }
    if (r.error) return;
    try { await loadQr(); } catch { fieldErr(el.qrErr, "The QR code tool couldn't load. Check your connection and try again."); return; }
    if (token !== qrToken) return;
    const holder = document.createElement("div"); holder.style.cssText = "position:fixed;left:-9999px;top:0";
    document.body.append(holder);
    try { new window.QRCode(holder, { text: r.href, width: 512, height: 512, colorDark: "#0b1020", colorLight: "#ffffff", correctLevel: window.QRCode.CorrectLevel.M }); }
    catch { holder.remove(); fieldErr(el.qrErr, "That link is too long to turn into a QR code."); return; }
    const src = holder.querySelector("canvas"); if (!src) { holder.remove(); return; }
    const bmp = document.createElement("canvas"); bmp.width = bmp.height = 512; bmp.getContext("2d").drawImage(src, 0, 0); holder.remove();
    const prev = state.qr;
    state.qr = { bmp, w: prev ? prev.w : +el.qrSize.value, x: prev ? prev.x : 0, y: prev ? prev.y : 0, corner: prev ? prev.corner : "tr", caption: el.qrCap.value.trim() };
    if (!prev) snap(state.qr); else { snap(state.qr); keepInside(state.qr); }
    state.sel = state.qr; showOpts(el.qrOpts, true); syncPos("qr"); render();
  }
  el.qrUrl.addEventListener("input", () => { clearTimeout(qrTimer); qrTimer = setTimeout(buildQr, 400); });
  el.qrUrl.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); clearTimeout(qrTimer); buildQr(); } });
  el.qrCap.addEventListener("input", () => { if (!state.qr) return; state.qr.caption = el.qrCap.value.trim(); snap(state.qr); keepInside(state.qr); state.sel = state.qr; render(); });
  el.qrSize.addEventListener("input", () => {
    el.qrSizeOut.textContent = `${el.qrSize.value}px`; if (!state.qr) return;
    state.qr.w = +el.qrSize.value; state.sel = state.qr; snap(state.qr); keepInside(state.qr); render();
  });
  el.qrRm.addEventListener("click", () => { el.qrUrl.value = ""; buildQr(); el.qrUrl.focus(); });

  /* ---------- Position buttons ---------- */
  function syncPos(which) {
    const it = state[which];
    document.querySelectorAll(`.ms-pos[data-item="${which}"] button`).forEach((b) => b.setAttribute("aria-pressed", String(!!it && it.corner === b.dataset.c)));
  }
  document.querySelectorAll(".ms-pos button").forEach((b) => b.addEventListener("click", () => {
    const which = b.parentElement.dataset.item, it = state[which]; if (!it) return;
    it.corner = b.dataset.c; snap(it); state.sel = it; syncPos(which); render();
  }));

  /* ---------- Drag and keyboard on the canvas ---------- */
  const toDesign = (e) => { const r = el.canvas.getBoundingClientRect(); return { x: (e.clientX - r.left) * (W / r.width), y: (e.clientY - r.top) * (H / r.height) }; };
  const hit = (p) => [state.qr, state.logo].find((it) => { if (!it) return false; const b = bounds(it); return p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h; }) || null;
  let drag = null;
  el.canvas.addEventListener("touchstart", (e) => { const t = e.touches[0]; if (t && hit(toDesign(t))) e.preventDefault(); }, { passive: false });
  el.canvas.addEventListener("pointerdown", (e) => {
    const p = toDesign(e), it = hit(p);
    state.sel = it; render(); if (!it) return;
    drag = { it, dx: p.x - it.x, dy: p.y - it.y }; el.canvas.setPointerCapture(e.pointerId); el.canvas.classList.add("drag"); el.canvas.focus({ preventScroll: true });
  });
  el.canvas.addEventListener("pointermove", (e) => {
    const p = toDesign(e);
    if (!drag) { el.canvas.classList.toggle("over", !!hit(p)); return; }
    drag.it.x = p.x - drag.dx; drag.it.y = p.y - drag.dy; drag.it.corner = null; keepInside(drag.it); render();
  });
  const endDrag = () => { if (!drag) return; const which = drag.it === state.logo ? "logo" : "qr"; drag = null; el.canvas.classList.remove("drag"); syncPos(which); };
  el.canvas.addEventListener("pointerup", endDrag); el.canvas.addEventListener("pointercancel", endDrag);
  el.canvas.addEventListener("keydown", (e) => {
    const it = state.sel || state.qr || state.logo; if (!it) return;
    const step = e.shiftKey ? 60 : 12, d = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key];
    if (e.key === "Tab" && state.logo && state.qr) { return; }
    if (!d) return; e.preventDefault(); state.sel = it; it.x += d[0]; it.y += d[1]; it.corner = null; keepInside(it); syncPos(it === state.logo ? "logo" : "qr"); render();
  });
  el.canvas.addEventListener("blur", () => { /* keep selection outline so users can see what arrow keys move */ });

  /* ---------- Export ---------- */
  el.dl.addEventListener("click", async () => {
    const label = el.dl.querySelector("span"), idle = label.textContent;
    el.dl.disabled = true; label.textContent = "Preparing…"; say("");
    try {
      if (document.fonts && document.fonts.load) { try { await document.fonts.load("700 32px Manrope"); } catch { /* use fallback font */ } }
      const out = document.createElement("canvas"); out.width = W; out.height = H; const c = out.getContext("2d");
      const video = state.bgKind === "video", src = video ? el.video : el.img;
      const sw = video ? src.videoWidth : src.naturalWidth, sh = video ? src.videoHeight : src.naturalHeight;
      if (!sw || !sh || (video && src.readyState < 2)) throw new Error("bg");
      drawCover(c, src, sw, sh); drawItems(c, false);
      const png = radio("format") === "png";
      const blob = await new Promise((ok) => out.toBlob(ok, png ? "image/png" : "image/jpeg", 0.95));
      if (!blob) throw new Error("blob");
      const a = document.createElement("a"), url = URL.createObjectURL(blob);
      a.href = url; a.download = `Emmy-STACK01-Meeting-Background.${png ? "png" : "jpg"}`; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 4000);
      say(video ? "Downloaded the current video frame as an image." : "Background downloaded. Upload it in your meeting app’s background settings.", "ok");
    } catch (err) {
      console.error(err);
      say(err.message === "bg" ? "The background hasn’t finished loading yet. Wait a moment and try again." : "We couldn’t create the image. Try a different background or logo.", "err");
    } finally { el.dl.disabled = false; label.textContent = idle; }
  });

  /* ---------- Init ---------- */
  el.logoSizeOut.textContent = `${el.logoSize.value}px`; el.qrSizeOut.textContent = `${el.qrSize.value}px`;
  setMock(); el.guide.hidden = !el.guideOn.checked; render();
})();
