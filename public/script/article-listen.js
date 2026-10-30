/* Listen to this article.  Put this file at public/script/article-listen.js
   Two modes, one player:
   1. The article has an uploaded MP3 (Keystatic "Audio version"): a normal audio player with 15s skips, speed and lock-screen controls.
   2. No MP3: the reader's own device voice reads the article aloud, paragraph by paragraph (free, no files).
   If neither works on a device, the player stays hidden and the page is unchanged. */
(() => {
  "use strict";
  const root = document.getElementById("arListen");
  const prose = document.querySelector(".prose");
  if (!root || !prose) return;

  const $ = (s) => root.querySelector(s);
  const el = { play: $("[data-play]"), icon: $("[data-play] i"), back: $("[data-back]"), fwd: $("[data-fwd]"), speed: $("[data-speed]"), range: $("[data-range]"), cur: $("[data-cur]"), dur: $("[data-dur]"), meta: $("[data-meta]"), note: $("[data-note]"), backI: $("[data-back] i"), fwdI: $("[data-fwd] i") };
  const SPEEDS = [0.85, 1, 1.25, 1.5, 1.75, 2];
  const KEY = "emmy-listen-speed";
  let speedIdx = 1;
  try { const s = parseFloat(localStorage.getItem(KEY)); const k = SPEEDS.indexOf(s); if (k >= 0) speedIdx = k; } catch (e) { /* private mode */ }

  // "Follow along": when on (default), the page scrolls to keep the paragraph being read in view. Voice mode only.
  const FKEY = "emmy-listen-follow";
  let follow = true, onFollowOn = () => {};
  try { if (localStorage.getItem(FKEY) === "off") follow = false; } catch (e) { /* private mode */ }

  const synth = window.speechSynthesis, canSpeak = !!(synth && window.SpeechSynthesisUtterance);
  const audioUrl = (root.dataset.audio || "").trim();
  const fmtT = (s) => { s = Math.max(0, Math.floor(s || 0)); return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); };
  const note = (t) => { el.note.textContent = t || ""; };
  const setPlaying = (on) => {
    root.classList.toggle("is-playing", on);
    el.icon.className = on ? "ri-pause-fill" : "ri-play-fill";
    el.play.setAttribute("aria-label", on ? "Pause" : "Play");
    el.play.setAttribute("aria-pressed", String(on));
  };
  const setSpeedLabel = () => { const v = SPEEDS[speedIdx]; el.speed.textContent = v + "×"; el.speed.setAttribute("aria-label", "Speed " + v + " times. Tap to change"); };
  setSpeedLabel();
  const nextSpeed = (apply) => { speedIdx = (speedIdx + 1) % SPEEDS.length; try { localStorage.setItem(KEY, String(SPEEDS[speedIdx])); } catch (e) { /* ignore */ } setSpeedLabel(); apply(SPEEDS[speedIdx]); };

  /* ------------------------------------------------------------ mode 1: MP3 */
  function startAudio(fallbackToVoice) {
    const a = new Audio(); a.preload = "metadata"; a.src = audioUrl;
    root.dataset.mode = "audio"; root.hidden = false;
    el.backI.className = "ri-replay-15-line"; el.fwdI.className = "ri-forward-15-line";
    el.back.setAttribute("aria-label", "Back 15 seconds"); el.fwd.setAttribute("aria-label", "Forward 15 seconds");
    el.range.disabled = true; el.meta.textContent = "Audio version"; el.dur.textContent = ""; el.cur.textContent = "0:00";
    const rate = (v) => { a.playbackRate = v; a.defaultPlaybackRate = v; }; rate(SPEEDS[speedIdx]);
    let failed = false;
    a.addEventListener("loadedmetadata", () => {
      if (!isFinite(a.duration)) return;
      el.range.max = String(Math.floor(a.duration)); el.range.disabled = false; el.dur.textContent = fmtT(a.duration);
      el.meta.textContent = "Audio version · " + fmtT(a.duration);
    });
    a.addEventListener("timeupdate", () => { el.range.value = String(Math.floor(a.currentTime)); el.cur.textContent = fmtT(a.currentTime); el.range.setAttribute("aria-valuetext", fmtT(a.currentTime) + " of " + fmtT(a.duration)); });
    a.addEventListener("play", () => setPlaying(true)); a.addEventListener("pause", () => setPlaying(false));
    a.addEventListener("ended", () => { setPlaying(false); a.currentTime = 0; });
    a.addEventListener("error", () => {
      if (failed) return; failed = true; setPlaying(false);
      if (fallbackToVoice && canSpeak) { note("The audio file could not load. Using your device voice instead."); startVoice(); }
      else { note("The audio could not load. Please try again later."); }
    });
    el.play.onclick = () => { if (failed) return; a.paused ? a.play().catch(() => note("Tap play again to start the audio.")) : a.pause(); };
    el.back.onclick = () => { a.currentTime = Math.max(0, a.currentTime - 15); };
    el.fwd.onclick = () => { a.currentTime = Math.min(a.duration || Infinity, a.currentTime + 15); };
    el.range.oninput = () => { a.currentTime = +el.range.value; };
    el.speed.onclick = () => nextSpeed(rate);
    window.addEventListener("pagehide", () => a.pause());
    if ("mediaSession" in navigator) {
      try {
        const art = root.dataset.cover ? [{ src: root.dataset.cover, sizes: "1200x630", type: "image/jpeg" }] : [];
        navigator.mediaSession.metadata = new MediaMetadata({ title: root.dataset.title || document.title, artist: root.dataset.author || "Emmy STACK01", album: "Emmy STACK01 Articles", artwork: art });
        navigator.mediaSession.setActionHandler("play", () => a.play());
        navigator.mediaSession.setActionHandler("pause", () => a.pause());
        navigator.mediaSession.setActionHandler("seekbackward", () => { a.currentTime = Math.max(0, a.currentTime - 15); });
        navigator.mediaSession.setActionHandler("seekforward", () => { a.currentTime = Math.min(a.duration || Infinity, a.currentTime + 15); });
      } catch (e) { /* not supported */ }
    }
  }

  /* ----------------------------------------------- mode 2: device voice (read aloud) */
  function startVoice() {
    if (!canSpeak) return;
    // 1. Collect what to read: the title, then headings, paragraphs, list items, quotes and tables (not code, figures or action cards)
    const skip = "pre, figure, [class*='cta'], [data-no-listen]";
    const nodes = [...prose.querySelectorAll("h1,h2,h3,h4,p,li,blockquote,table")].filter((n) => !n.closest(skip) && !(n.tagName !== "TABLE" && n.closest("table")) && !(n.tagName === "BLOCKQUOTE" && n.querySelector("p")) && !(n.tagName === "LI" && n.querySelector("p")));
    const clean = (t) => t.replace(/\s+/g, " ").trim();
    const title = clean(root.dataset.title || "");
    const items = [];                                           // { node, chunks[] }
    // Split after . ! ? only when a space follows, so numbers like 1.5 and 2,500.00 stay whole.
    const split = (text) => {
      const out = []; const sents = text.match(/.+?[.!?]+["')\]]*(?=\s|$)\s*|.+$/g) || [text]; let cur = "";
      const push = () => { if (cur.trim()) out.push(cur.trim()); cur = ""; };
      sents.forEach((s) => {
        if (s.length > 220) { push(); let rest = s; while (rest.length > 220) { let k = rest.lastIndexOf(", ", 200); if (k < 60) k = rest.lastIndexOf(" ", 200); if (k < 1) k = 200; out.push(rest.slice(0, k + 1).trim()); rest = rest.slice(k + 1); } cur = rest; return; }
        if ((cur + s).length > 220) push(); cur += s;
      });
      push(); return out;
    };
    if (title) items.push({ node: document.querySelector("h1"), chunks: split(title.replace(/[^.!?]$/, "$&.")) });
    // A table is read as an intro, then one row at a time with its column names: "Row 1. Plan: Basic. Price: 50,000."
    const tableItems = (tb) => {
      const rows = [...tb.querySelectorAll("tr")].filter((r) => r.cells.length); if (!rows.length) return [];
      const cellText = (c) => clean(c.textContent).replace(/[✓✔]/g, "yes").replace(/[✗✘✕×]/g, "no");
      const first = rows[0], hasHead = [...first.cells].every((c) => c.tagName === "TH") || !!(tb.tHead && tb.tHead.contains(first));
      const heads = hasHead ? [...first.cells].map(cellText) : [], body = hasHead ? rows.slice(1) : rows;
      const cols = Math.max(...rows.map((r) => r.cells.length)), out = [];
      const intro = "Table with " + body.length + (body.length === 1 ? " row" : " rows") + " and " + cols + (cols === 1 ? " column." : " columns.") + (heads.some(Boolean) ? " Columns: " + heads.filter(Boolean).join(", ") + "." : "");
      out.push({ node: tb, chunks: split(intro) });
      body.forEach((r, i) => {
        const parts = [...r.cells].map((c, k) => { const t = cellText(c); return t ? (heads[k] ? heads[k] + ": " + t : t) : ""; }).filter(Boolean);
        if (parts.length) out.push({ node: r, chunks: split(("Row " + (i + 1) + ". " + parts.map((x) => x.replace(/[.!?]+$/, "")).join(". ") + ".")) });
      });
      return out;
    };
    nodes.forEach((n) => {
      if (n.tagName === "TABLE") { tableItems(n).forEach((it) => items.push(it)); return; }
      let t = clean(n.textContent); if (!t) return;
      if (/^H[1-4]$/.test(n.tagName) && !/[.!?:]$/.test(t)) t += ".";   // a heading gets a pause
      items.push({ node: n, chunks: split(t) });
    });
    if (!items.length) return;
    root.dataset.mode = "voice"; root.hidden = false;
    el.backI.className = "ri-skip-back-line"; el.fwdI.className = "ri-skip-forward-line";
    el.back.setAttribute("aria-label", "Previous paragraph"); el.fwd.setAttribute("aria-label", "Next paragraph");
    const mins = Math.max(1, Math.round(items.reduce((n, it) => n + it.chunks.join(" ").split(" ").length, 0) / (160 * SPEEDS[speedIdx])));
    el.meta.textContent = "Read aloud by your device · about " + mins + " min";
    el.range.min = "0"; el.range.max = String(items.length - 1); el.range.value = "0"; el.range.disabled = false; el.dur.textContent = "";
    const showPos = (i) => { el.cur.textContent = (i + 1) + " / " + items.length; el.range.value = String(i); el.range.setAttribute("aria-valuetext", "Paragraph " + (i + 1) + " of " + items.length); };
    showPos(0);

    // 2. Voice: prefer Nigerian, then British, South African, US English
    let voice = null;
    const pick = () => { const vs = synth.getVoices(); if (!vs.length) return; for (const p of ["en-ng", "en-gb", "en-za", "en-us", "en"]) { const v = vs.find((x) => x.lang.replace("_", "-").toLowerCase().startsWith(p)); if (v) { voice = v; return; } } };
    pick(); if (synth.addEventListener) synth.addEventListener("voiceschanged", pick);

    // 3. Play from paragraph i. "gen" makes sure late events from a cancelled sentence are ignored.
    let idx = 0, chunk = 0, gen = 0, playing = false, timer = 0;
    const mark = (i) => { items.forEach((it) => it.node && it.node.classList.remove("ar-reading")); const n = items[i] && items[i].node; if (n) { n.classList.add("ar-reading"); const r = n.getBoundingClientRect(); if (follow && (r.top < 70 || r.bottom > innerHeight - 90)) n.scrollIntoView({ block: "center", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }); } };
    const stopSpeech = () => { gen++; clearTimeout(timer); try { synth.cancel(); } catch (e) { /* ignore */ } };
    const finish = () => { playing = false; setPlaying(false); mark(-1); idx = 0; chunk = 0; showPos(0); };
    const speak = () => {
      if (!playing) return; const my = ++gen; mark(idx); showPos(idx);
      const text = items[idx].chunks[chunk]; const u = new SpeechSynthesisUtterance(text);
      if (voice) { u.voice = voice; u.lang = voice.lang; } u.rate = SPEEDS[speedIdx];
      u.onend = () => {
        if (my !== gen || !playing) return;
        if (++chunk >= items[idx].chunks.length) { chunk = 0; idx++; }
        if (idx >= items.length) return finish(); speak();
      };
      u.onerror = (e) => { if (my !== gen) return; if (e && (e.error === "interrupted" || e.error === "canceled")) return; playing = false; setPlaying(false); note("Your device could not read this aloud."); };
      synth.speak(u);
    };
    const start = () => { stopSpeech(); playing = true; setPlaying(true); note(""); timer = setTimeout(speak, 60); };   // short gap after cancel: some browsers drop the next sentence without it
    const pause = () => { playing = false; stopSpeech(); setPlaying(false); };
    const jump = (i) => { idx = Math.max(0, Math.min(items.length - 1, i)); chunk = 0; mark(idx); showPos(idx); if (playing) start(); };
    onFollowOn = () => mark(idx);
    el.play.onclick = () => (playing ? pause() : start());
    el.back.onclick = () => jump(idx - (chunk > 0 ? 0 : 1));
    el.fwd.onclick = () => jump(idx + 1);
    el.range.oninput = () => jump(+el.range.value);
    el.speed.onclick = () => nextSpeed(() => { if (playing) start(); });
    window.addEventListener("pagehide", () => { playing = false; stopSpeech(); });
  }

  if (audioUrl) startAudio(true);
  else if (canSpeak) startVoice();

  /* ------------------------------------------------ floating controls (play/pause, speed, follow along)
     Appear bottom-right once the reader has pressed play and the main player has scrolled off screen.
     Wide screens: the dock sits in the empty margin beside the article, so it never covers text.
     Narrow screens: only the round play button shows; the speed and follow buttons open from a small
     controls button and close again by themselves, and the page gets spare room at the bottom. */
  (() => {
    if (!("IntersectionObserver" in window)) return;

    // Follow-along toggle in the main player (voice mode only)
    const ctl = $(".ar-l-ctl");
    let mainFollow = null;
    if (ctl) {
      mainFollow = document.createElement("button");
      mainFollow.type = "button"; mainFollow.className = "ar-l-follow";
      mainFollow.innerHTML = '<i class="ri-focus-3-line" aria-hidden="true"></i>';
      ctl.appendChild(mainFollow);
    }

    const dock = document.createElement("div");
    dock.className = "ar-l-dock"; dock.setAttribute("role", "group"); dock.setAttribute("aria-label", "Audio controls"); dock.inert = true;
    dock.innerHTML =
      '<div class="ar-l-chips" id="arChips">' +
        '<button type="button" class="ar-l-chip" data-dfollow><i class="ri-focus-3-line" aria-hidden="true"></i></button>' +
        '<button type="button" class="ar-l-chip" data-dspeed></button>' +
      '</div>' +
      '<button type="button" class="ar-l-more" aria-label="More controls" aria-expanded="false" aria-controls="arChips"><i class="ri-equalizer-line" aria-hidden="true"></i></button>' +
      '<button type="button" class="ar-l-float" aria-label="Play"><i class="ri-play-fill" aria-hidden="true"></i></button>';
    document.body.appendChild(dock);
    const q = (s) => dock.querySelector(s);
    const dPlay = q(".ar-l-float"), dIcon = q(".ar-l-float i"), dMore = q(".ar-l-more"), dSpeed = q("[data-dspeed]"), dFollow = q("[data-dfollow]");

    let started = false, inView = true, open = false, closeTimer = 0;

    const paintFollow = () => {
      const t = "Follow along: " + (follow ? "on" : "off") + ". Tap to turn " + (follow ? "off" : "on");
      [mainFollow, dFollow].forEach((b) => { if (!b) return; b.setAttribute("aria-pressed", String(follow)); b.setAttribute("aria-label", t); b.title = t; });
    };
    const setFollow = (v) => {
      follow = v; try { localStorage.setItem(FKEY, v ? "on" : "off"); } catch (e) { /* ignore */ } paintFollow();
      if (v) onFollowOn();
    };
    if (mainFollow) mainFollow.onclick = () => setFollow(!follow);
    dFollow.onclick = () => setFollow(!follow);
    paintFollow();

    const setOpen = (v) => { open = v; dock.classList.toggle("is-open", v); dMore.setAttribute("aria-expanded", String(v)); };
    const bump = () => { clearTimeout(closeTimer); if (open) closeTimer = setTimeout(() => setOpen(false), 5000); };
    dMore.onclick = () => { setOpen(!open); bump(); };
    dock.addEventListener("pointerdown", bump); dock.addEventListener("focusin", bump);
    document.addEventListener("pointerdown", (e) => { if (open && !dock.contains(e.target)) setOpen(false); });

    dPlay.onclick = () => el.play.click();
    dSpeed.onclick = () => el.speed.click();

    const layout = () => {
      const gap = innerWidth - prose.getBoundingClientRect().right;     // empty margin to the right of the article
      const gutter = gap >= 96;
      dock.classList.toggle("is-gutter", gutter);
      document.body.classList.toggle("ar-l-pad", dock.classList.contains("is-on") && !gutter);
    };
    const sync = () => {
      const playing = root.classList.contains("is-playing");
      if (playing) started = true;
      dIcon.className = playing ? "ri-pause-fill" : "ri-play-fill";
      dPlay.setAttribute("aria-label", playing ? "Pause" : "Play");
      dPlay.classList.toggle("is-playing", playing);
      dSpeed.textContent = el.speed.textContent;
      dSpeed.setAttribute("aria-label", el.speed.getAttribute("aria-label") || "Speed");
      const voice = root.dataset.mode === "voice";
      dFollow.hidden = !voice; if (mainFollow) mainFollow.hidden = !voice;
      const show = started && !inView && !root.hidden;
      dock.classList.toggle("is-on", show); dock.inert = !show; dock.setAttribute("aria-hidden", String(!show));
      if (!show) setOpen(false);
      layout();
    };
    new IntersectionObserver((entries) => { inView = entries[entries.length - 1].isIntersecting; sync(); }).observe(root);
    new MutationObserver(sync).observe(root, { attributes: true, attributeFilter: ["class", "hidden", "data-mode"] });
    new MutationObserver(sync).observe(el.speed, { childList: true, characterData: true, subtree: true });
    addEventListener("resize", layout);
    sync();
  })();
})();
