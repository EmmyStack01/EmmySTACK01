/**
 * Emmy Sign — client-side PDF signer (Emmy STACK01)
 * Everything happens in the browser: the PDF never leaves the visitor's device.
 *
 * Page contract (see emmy-sign.astro): #pdf-upload, #stage, #empty-state, #pdf-container, #pdf-render-canvas,
 * #prev-page, #next-page, #current-page, #total-pages, #zoom-in, #zoom-out, #zoom-level, #file-name,
 * #add-text-btn, #add-date-btn, #open-sig-btn, #download-btn, .sg-sw[data-color], #sg-msg,
 * <dialog id="sig-modal"> with #sig-pad, #clear-pad, #close-modal, #save-sig-btn, #pad-msg.
 *
 * Positions are stored as fractions of the page width, so signatures stay put when the
 * visitor zooms, resizes the window, or rotates their phone, and export maps them exactly.
 */
(() => {
  "use strict";

  const PDFJS_URL = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
  const PDFJS_WORKER = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
  const PDFLIB_URL = "https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js";

  const TEXT_RATIO = 0.7;   // font size = box height * 0.7
  const ZOOM_MIN = 0.5, ZOOM_MAX = 3, ZOOM_STEP = 0.25;
  const MAX_CANVAS_PIXELS = 16e6;

  const $ = (id) => document.getElementById(id);
  const stage = $("stage"), container = $("pdf-container"), canvas = $("pdf-render-canvas");
  const dlg = $("sig-modal"), pad = $("sig-pad"), padCtx = pad.getContext("2d");

  // ---- state ----
  let pdfDoc = null, pdfBytes = null, fileName = "document";
  let pageNum = 1, zoom = 1, pageW = 0, pageH = 0;
  let items = [];            // { id, type:'sig'|'text', page, x, y, w, h, color, src?, ratio?, text? } (x,y,w,h = fractions of page width)
  let selectedId = null;
  let color = "#000000";
  let renderToken = 0, renderTask = null;
  let uid = 1;

  // ---- helpers ----
  const loaders = {};
  const loadScript = (src) => loaders[src] || (loaders[src] = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src; s.async = true; s.onload = resolve;
    s.onerror = () => { delete loaders[src]; reject(new Error("Could not load " + src)); };
    document.head.appendChild(s);
  }));
  const ensurePdfjs = async () => {
    if (!window.pdfjsLib) await loadScript(PDFJS_URL);
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER;
  };
  const ensurePdfLib = async () => { if (!window.PDFLib) await loadScript(PDFLIB_URL); };

  const msg = (text, kind) => { const m = $("sg-msg"); m.textContent = text || ""; m.dataset.kind = kind || ""; };
  const clamp = (v, a, b) => Math.min(Math.max(v, a), b);
  const hexToRgb = (hex) => {
    const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return r ? { r: parseInt(r[1], 16), g: parseInt(r[2], 16), b: parseInt(r[3], 16) } : { r: 0, g: 0, b: 0 };
  };
  const byId = (id) => items.find((i) => i.id === id);
  const elOf = (id) => container.querySelector(`.sg-item[data-id="${id}"]`);

  const setEnabled = (on) => {
    ["add-text-btn", "add-date-btn", "open-sig-btn", "download-btn", "zoom-in", "zoom-out"].forEach((id) => { $(id).disabled = !on; });
    document.querySelectorAll(".sg-sw[data-scope='bar']").forEach((b) => { b.disabled = !on; });
  };
  const updateNav = () => {
    const n = pdfDoc ? pdfDoc.numPages : 0;
    $("current-page").textContent = pdfDoc ? pageNum : 0;
    $("total-pages").textContent = n;
    $("prev-page").disabled = !pdfDoc || pageNum <= 1;
    $("next-page").disabled = !pdfDoc || pageNum >= n;
    $("zoom-level").textContent = Math.round(zoom * 100) + "%";
    $("zoom-out").disabled = !pdfDoc || zoom <= ZOOM_MIN + 1e-6;
    $("zoom-in").disabled = !pdfDoc || zoom >= ZOOM_MAX - 1e-6;
  };

  // ---- colour ----
  const markSwatches = (c) => document.querySelectorAll(".sg-sw").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.color.toLowerCase() === c.toLowerCase())));
  const tint = (src, c) => new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const cv = document.createElement("canvas"); cv.width = img.width; cv.height = img.height;
      const x = cv.getContext("2d"); x.drawImage(img, 0, 0);
      x.globalCompositeOperation = "source-in"; x.fillStyle = c; x.fillRect(0, 0, cv.width, cv.height);
      resolve(cv.toDataURL("image/png"));
    };
    img.onerror = () => resolve(src);
    img.src = src;
  });
  const setColor = async (c, recolorSelected) => {
    color = c; markSwatches(c);
    const it = recolorSelected && selectedId != null ? byId(selectedId) : null;
    if (!it) return;
    it.color = c;
    const el = elOf(it.id); if (!el) return;
    el.style.setProperty("--c", c);
    if (it.type === "text") el.querySelector(".sg-text").style.color = c;
    else { it.src = await tint(it.src, c); el.querySelector("img").src = it.src; }
  };
  document.querySelectorAll(".sg-sw").forEach((b) => b.addEventListener("click", () => setColor(b.dataset.color, b.dataset.scope === "bar")));

  // ---- loading a PDF ----
  const openFile = async (file) => {
    if (!file) return;
    if (file.type !== "application/pdf" && !/\.pdf$/i.test(file.name)) return msg("Please choose a PDF file.", "err");
    msg("Opening your PDF…");
    try {
      const buf = new Uint8Array(await file.arrayBuffer());
      await ensurePdfjs();
      const doc = await window.pdfjsLib.getDocument({ data: buf.slice(0) }).promise;
      pdfDoc = doc; pdfBytes = buf; fileName = file.name.replace(/\.pdf$/i, "").replace(/[^\w\- ]+/g, "").trim() || "document";
      items = []; selectedId = null; pageNum = 1; zoom = 1;
      $("file-name").textContent = file.name;
      $("empty-state").hidden = true; container.hidden = false; stage.classList.add("has-doc");
      setEnabled(true); msg("");
      await renderPage(1);
      (window.requestIdleCallback || ((f) => setTimeout(f, 800)))(() => ensurePdfLib().catch(() => {}));
    } catch (e) {
      const locked = e && e.name === "PasswordException";
      msg(locked ? "This PDF is password-protected. Remove the password and try again." : "Sorry, we couldn't open that PDF. It may be damaged.", "err");
    }
  };
  $("pdf-upload").addEventListener("change", (e) => { openFile(e.target.files[0]); e.target.value = ""; });
  ["dragenter", "dragover"].forEach((t) => stage.addEventListener(t, (e) => { e.preventDefault(); stage.classList.add("drag"); }));
  ["dragleave", "drop"].forEach((t) => stage.addEventListener(t, (e) => { e.preventDefault(); stage.classList.remove("drag"); }));
  stage.addEventListener("drop", (e) => openFile(e.dataTransfer.files[0]));

  // ---- rendering ----
  async function renderPage(num) {
    if (!pdfDoc) return;
    pageNum = clamp(num, 1, pdfDoc.numPages);
    const token = ++renderToken;
    if (renderTask) { try { renderTask.cancel(); } catch (e) {} }
    const page = await pdfDoc.getPage(pageNum);
    if (token !== renderToken) return;

    const cs = getComputedStyle(stage);
    const avail = stage.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    const base = page.getViewport({ scale: 1 });
    const viewport = page.getViewport({ scale: (avail / base.width) * zoom });

    let dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    while (viewport.width * viewport.height * dpr * dpr > MAX_CANVAS_PIXELS && dpr > 1) dpr -= 0.25;
    canvas.width = Math.floor(viewport.width * dpr); canvas.height = Math.floor(viewport.height * dpr);
    canvas.style.width = viewport.width + "px"; canvas.style.height = viewport.height + "px";
    canvas.setAttribute("aria-label", `Page ${pageNum} of ${pdfDoc.numPages} of your PDF`);

    renderTask = page.render({ canvasContext: canvas.getContext("2d"), viewport, transform: dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : null });
    try { await renderTask.promise; }
    catch (e) { if (e && e.name === "RenderingCancelledException") return; throw e; }
    if (token !== renderToken) return;

    pageW = viewport.width; pageH = viewport.height;
    container.style.width = pageW + "px";
    updateNav();
    layoutItems();
  }

  // ---- items (signatures and text) ----
  const place = (el, it) => {
    el.style.left = it.x * pageW + "px"; el.style.top = it.y * pageW + "px";
    el.style.height = it.h * pageW + "px";
    if (it.type === "sig") el.style.width = it.w * pageW + "px";
    else el.querySelector(".sg-text").style.fontSize = it.h * pageW * TEXT_RATIO + "px";
  };

  function select(id) {
    selectedId = id;
    container.querySelectorAll(".sg-item").forEach((el) => el.classList.toggle("sel", Number(el.dataset.id) === id));
    const it = id != null ? byId(id) : null;
    if (it) markSwatches(it.color);
  }

  function removeItem(id) {
    items = items.filter((i) => i.id !== id);
    const el = elOf(id); if (el) el.remove();
    if (selectedId === id) select(null);
    msg("Removed.");
    stage.focus({ preventScroll: true });
  }

  function createEl(it) {
    const el = document.createElement("div");
    el.className = "sg-item " + it.type;
    el.dataset.id = it.id; el.tabIndex = 0; el.setAttribute("role", "group");
    el.setAttribute("aria-label", it.type === "sig" ? "Signature. Arrow keys move it, Delete removes it." : "Text. Arrow keys move it, Delete removes it.");
    el.style.setProperty("--c", it.color);
    if (it.id === selectedId) el.classList.add("sel");

    if (it.type === "sig") {
      const img = new Image(); img.src = it.src; img.alt = ""; img.draggable = false; el.appendChild(img);
    } else {
      const t = document.createElement("div");
      t.className = "sg-text"; t.contentEditable = "true"; t.spellcheck = false;
      t.setAttribute("role", "textbox"); t.setAttribute("aria-label", "Text, type to edit");
      t.style.color = it.color; t.textContent = it.text;
      t.addEventListener("input", () => { it.text = t.textContent; });
      t.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); t.blur(); el.focus(); } else if (e.key === "Escape") { t.blur(); el.focus(); } });
      t.addEventListener("paste", (e) => { e.preventDefault(); document.execCommand("insertText", false, (e.clipboardData.getData("text/plain") || "").replace(/\s+/g, " ")); });
      el.appendChild(t);
    }
    el.insertAdjacentHTML("beforeend",
      '<span class="sg-grip" aria-hidden="true"><i class="ri-drag-move-2-line"></i> Move</span>' +
      '<span class="sg-rz" aria-hidden="true"></span>' +
      '<button type="button" class="sg-del" aria-label="Delete">&times;</button>');
    el.querySelector(".sg-del").addEventListener("click", (e) => { e.stopPropagation(); removeItem(it.id); });

    // pointer: move (grip, or the signature body) / resize (handle) / edit (text body)
    el.addEventListener("pointerdown", (e) => {
      if (e.target.closest(".sg-del")) return;
      e.stopPropagation();
      select(it.id);
      const resizing = !!e.target.closest(".sg-rz"), grip = !!e.target.closest(".sg-grip");
      if (it.type === "text" && !resizing && !grip) return;       // let the visitor edit the text
      e.preventDefault(); el.focus({ preventScroll: true });
      const sx = e.clientX, sy = e.clientY, o = { x: it.x, y: it.y, w: it.w, h: it.h };
      el.setPointerCapture(e.pointerId);
      el.onpointermove = (m) => {
        const dx = (m.clientX - sx) / pageW, dy = (m.clientY - sy) / pageW;
        if (resizing) {
          if (it.type === "sig") { it.w = clamp(o.w + dx, 0.04, 1 - it.x); it.h = it.w * it.ratio; }
          else it.h = clamp(o.h + (dx + dy) / 2, 0.012, 0.15);
        } else {
          const wFrac = el.offsetWidth / pageW;
          it.x = clamp(o.x + dx, 0, Math.max(0, 1 - wFrac));
          it.y = clamp(o.y + dy, 0, Math.max(0, pageH / pageW - it.h));
        }
        place(el, it);
      };
      const end = () => { el.onpointermove = null; el.onpointerup = null; el.onpointercancel = null; };
      el.onpointerup = end; el.onpointercancel = end;
    });

    // keyboard: move / delete
    el.addEventListener("keydown", (e) => {
      if (e.target !== el) return;
      const step = e.shiftKey ? 0.02 : 0.005;
      const move = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key];
      if (move) {
        e.preventDefault();
        const wFrac = el.offsetWidth / pageW;
        it.x = clamp(it.x + move[0], 0, Math.max(0, 1 - wFrac)); it.y = clamp(it.y + move[1], 0, Math.max(0, pageH / pageW - it.h));
        place(el, it);
      } else if (e.key === "Delete" || e.key === "Backspace") { e.preventDefault(); removeItem(it.id); }
      else if (e.key === "Enter" && it.type === "text") { e.preventDefault(); const t = el.querySelector(".sg-text"); t.focus(); }
    });
    el.addEventListener("focus", () => { if (selectedId !== it.id) select(it.id); });

    place(el, it);
    return el;
  }

  function layoutItems() {
    container.querySelectorAll(".sg-item").forEach((el) => el.remove());
    items.filter((i) => i.page === pageNum).forEach((it) => container.appendChild(createEl(it)));
  }

  const addItem = (it) => {
    const n = items.filter((i) => i.page === pageNum).length;
    Object.assign(it, { id: uid++, page: pageNum, x: 0.08 + (n % 5) * 0.02, color });
    items.push(it); container.appendChild(createEl(it)); select(it.id);
    return it;
  };
  const addText = (text, y) => {
    const it = addItem({ type: "text", text, h: 0.035, y });
    const t = elOf(it.id).querySelector(".sg-text");
    t.focus(); const r = document.createRange(); r.selectNodeContents(t); const s = getSelection(); s.removeAllRanges(); s.addRange(r);
    msg("Type your text. Drag Move to position it, and use the round handle to resize.");
  };
  $("add-text-btn").addEventListener("click", () => addText("Your text", 0.12));
  $("add-date-btn").addEventListener("click", () => addText(new Date().toLocaleDateString("en-GB"), 0.2));

  // deselect when the page background is pressed
  container.addEventListener("pointerdown", (e) => { if (e.target === container || e.target === canvas) { select(null); if (document.activeElement && document.activeElement.blur) document.activeElement.blur(); } });

  // ---- paging & zoom ----
  $("prev-page").addEventListener("click", () => renderPage(pageNum - 1));
  $("next-page").addEventListener("click", () => renderPage(pageNum + 1));
  const setZoom = (z) => { zoom = clamp(Math.round(z * 100) / 100, ZOOM_MIN, ZOOM_MAX); renderPage(pageNum); };
  $("zoom-in").addEventListener("click", () => setZoom(zoom + ZOOM_STEP));
  $("zoom-out").addEventListener("click", () => setZoom(zoom - ZOOM_STEP));
  let lastW = stage.clientWidth, rt;
  window.addEventListener("resize", () => {
    clearTimeout(rt);
    rt = setTimeout(() => { if (pdfDoc && stage.clientWidth !== lastW) { lastW = stage.clientWidth; renderPage(pageNum); } }, 150);
  });

  // ---- signature pad (native <dialog>) ----
  let drawing = false, hasInk = false;
  const clearPad = () => { padCtx.clearRect(0, 0, pad.width, pad.height); hasInk = false; $("pad-msg").textContent = ""; };
  const pos = (e) => { const r = pad.getBoundingClientRect(); return { x: (e.clientX - r.left) * (pad.width / r.width), y: (e.clientY - r.top) * (pad.height / r.height) }; };
  pad.addEventListener("pointerdown", (e) => {
    drawing = true; hasInk = true; $("pad-msg").textContent = "";
    const p = pos(e);
    padCtx.strokeStyle = color; padCtx.fillStyle = color; padCtx.lineWidth = 6; padCtx.lineCap = "round"; padCtx.lineJoin = "round";
    padCtx.beginPath(); padCtx.arc(p.x, p.y, 3, 0, Math.PI * 2); padCtx.fill();   // a tap leaves a dot
    padCtx.beginPath(); padCtx.moveTo(p.x, p.y);
    pad.setPointerCapture(e.pointerId);
  });
  pad.addEventListener("pointermove", (e) => { if (!drawing) return; const p = pos(e); padCtx.lineTo(p.x, p.y); padCtx.stroke(); });
  const stopDraw = () => { drawing = false; };
  pad.addEventListener("pointerup", stopDraw); pad.addEventListener("pointercancel", stopDraw);

  const trimmed = () => {
    const { width: w, height: h } = pad, d = padCtx.getImageData(0, 0, w, h).data;
    let x0 = w, y0 = h, x1 = -1, y1 = -1;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] > 8) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    if (x1 < 0) return null;
    const m = 10; x0 = Math.max(0, x0 - m); y0 = Math.max(0, y0 - m); x1 = Math.min(w - 1, x1 + m); y1 = Math.min(h - 1, y1 + m);
    const cv = document.createElement("canvas"); cv.width = x1 - x0 + 1; cv.height = y1 - y0 + 1;
    cv.getContext("2d").drawImage(pad, x0, y0, cv.width, cv.height, 0, 0, cv.width, cv.height);
    return { src: cv.toDataURL("image/png"), ratio: cv.height / cv.width };
  };

  $("open-sig-btn").addEventListener("click", () => { clearPad(); markSwatches(color); document.body.classList.add("no-scroll"); typeof dlg.showModal === "function" ? dlg.showModal() : dlg.setAttribute("open", ""); });
  const closeDlg = () => { if (dlg.open) dlg.close(); };
  dlg.addEventListener("close", () => { document.body.classList.remove("no-scroll"); clearPad(); $("open-sig-btn").focus({ preventScroll: true }); });
  dlg.addEventListener("click", (e) => { if (e.target === dlg) closeDlg(); });
  $("close-modal").addEventListener("click", closeDlg);
  $("clear-pad").addEventListener("click", clearPad);
  $("save-sig-btn").addEventListener("click", () => {
    const t = hasInk ? trimmed() : null;
    if (!t) { $("pad-msg").textContent = "Please draw your signature first."; return; }
    const w = Math.min(0.25, 0.2 / t.ratio);
    const it = addItem({ type: "sig", src: t.src, ratio: t.ratio, w, h: w * t.ratio, y: 0.1 });
    closeDlg();
    elOf(it.id)?.focus({ preventScroll: true });
    msg("Signature added. Drag it into place and use the round handle to resize.");
  });

  // ---- export ----
  const encodable = (text, font) => {
    let set = null;
    try { set = new Set(font.getCharacterSet()); } catch (e) {}
    return [...text.replace(/₦/g, "NGN ")].map((ch) => {
      const cp = ch.codePointAt(0);
      return (set ? set.has(cp) : (cp >= 32 && cp <= 126) || (cp >= 160 && cp <= 255)) ? ch : "?";
    }).join("");
  };

  async function download() {
    if (!pdfBytes) return;
    if (!items.length) return msg("Add a signature or some text first.", "err");
    const btn = $("download-btn"), label = btn.querySelector("span");
    btn.disabled = true; label.textContent = "Preparing…"; msg("");
    try {
      await ensurePdfLib();
      const { PDFDocument, StandardFonts, rgb } = window.PDFLib;
      const doc = await PDFDocument.load(pdfBytes.slice(0));
      const font = await doc.embedFont(StandardFonts.Helvetica);
      const pages = doc.getPages(), images = {};
      for (const it of items) {
        const pg = pages[it.page - 1]; if (!pg) continue;
        if (pg.getRotation().angle % 360 !== 0) throw new Error("rotated");
        const cb = pg.getCropBox(), pw = cb.width, ph = cb.height;
        if (it.type === "sig") {
          const img = images[it.src] || (images[it.src] = await doc.embedPng(it.src));
          pg.drawImage(img, { x: cb.x + it.x * pw, y: cb.y + ph - (it.y + it.h) * pw, width: it.w * pw, height: it.h * pw });
        } else {
          const text = encodable(it.text || "", font); if (!text.trim()) continue;
          const size = it.h * pw * TEXT_RATIO, c = hexToRgb(it.color);
          const baselineFromTop = (it.y + it.h / 2) * pw + size * 0.26;
          pg.drawText(text, { x: cb.x + it.x * pw, y: cb.y + ph - baselineFromTop, size, font, color: rgb(c.r / 255, c.g / 255, c.b / 255) });
        }
      }
      const bytes = await doc.save();
      const url = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
      const a = document.createElement("a"); a.href = url; a.download = `${fileName}_signed.pdf`;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
      msg("Signed PDF downloaded.", "ok");
    } catch (e) {
      msg(e && e.message === "rotated" ? "This PDF has rotated pages, which Emmy Sign can't export yet." : "Sorry, we couldn't create the signed PDF. Please try again.", "err");
    } finally {
      btn.disabled = false; label.textContent = "Download signed PDF";
    }
  }
  $("download-btn").addEventListener("click", download);

  // warn before leaving with unsaved signatures
  window.addEventListener("beforeunload", (e) => { if (items.length) { e.preventDefault(); e.returnValue = ""; } });

  markSwatches(color); setEnabled(false); updateNav();
})();
