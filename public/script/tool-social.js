/*
  Social Architect (/tools/social-architect) — turns a raw paragraph into a scannable LinkedIn / X post
  and shows, on a phone mock-up, how much of it readers see before "see more". Runs entirely in the browser.
  Everything the visitor types is written with textContent, never innerHTML.
*/
(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const el = {
    input: $("sa-in"), count: $("sa-count"), sample: $("sa-sample"), clear: $("sa-clear"),
    fillers: $("sa-fillers"), phone: $("sa-phone"), screen: $("sa-screen"), post: $("sa-post"), rest: $("sa-rest"), more: $("sa-more"),
    checks: $("sa-checks"), copy: $("sa-copy"), status: $("sa-status"), note: $("sa-note"),
  };
  if (!el.input) return;

  // Approximate "see more" points. Platforms change these, so the page says so.
  const PLATFORMS = {
    linkedin: { name: "LinkedIn", chars: 210, lines: 3, max: 3000, note: "LinkedIn on mobile usually shows about 3 lines (around 210 characters) before “see more”. This is an estimate." },
    x:        { name: "X",        chars: 280, lines: 99, max: 280,  note: "X shows about 280 characters before “Show more” on longer posts. Standard accounts are limited to 280." },
  };
  const SAMPLE = "We just launched a new website for a Lagos logistics company and honestly the results surprised us. Page load time dropped from 6 seconds to under 2. Enquiries through the contact form tripled in one month. Most people think design is decoration, but it is really about trust. If your site feels slow, visitors assume your service is too.";
  const FILLERS = /\b(actually|basically|really|literally|honestly|simply|just|very)\b,?\s*/gi;
  const KEY = "sa-prefs-v1";

  const radio = (name) => (document.querySelector(`input[name="${name}"]:checked`) || {}).value;
  const store = {
    get() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } },
    set(o) { try { localStorage.setItem(KEY, JSON.stringify(o)); } catch { /* storage blocked */ } },
  };

  /* ---------- Formatting engine ---------- */
  const seg = typeof Intl !== "undefined" && Intl.Segmenter ? new Intl.Segmenter("en", { granularity: "sentence" }) : null;
  const ABBR = /(?:^|[\s(])(?:mr|mrs|ms|dr|prof|sr|jr|st|vs|etc|e\.g|i\.e|no|inc|ltd|co|approx)\.$/i;
  const mergeAbbr = (parts) => parts.reduce((o, p) => { if (o.length && ABBR.test(o[o.length - 1])) o[o.length - 1] += " " + p; else o.push(p); return o; }, []);
  const sentences = (line) => mergeAbbr((seg
    ? [...seg.segment(line)].map((s) => s.segment.trim())
    : line.split(/(?<=[.!?])\s+(?=[A-Z"'\u201c\u2018(\d])/).map((s) => s.trim())).filter(Boolean));

  const upFirst = (s) => s.replace(/^(\W*)([a-z])/, (_, a, b) => a + b.toUpperCase());
  function stripFillers(s) {
    return upFirst(s.replace(FILLERS, "").replace(/\s{2,}/g, " ").replace(/\s+([,.;:!?])/g, "$1").replace(/^[\s,;:]+/, "").replace(/,\s*,/g, ",").trim());
  }

  function format(raw, tone, dropFillers) {
    let list = raw.replace(/\r\n?/g, "\n").split("\n").map((l) => l.trim()).filter(Boolean).flatMap(sentences);
    if (dropFillers) list = list.map(stripFillers);
    list = list.filter((s) => /[\p{L}\p{N}]/u.test(s));
    if (!list.length) return "";
    const [hook, ...rest] = list;
    if (tone === "chaos") {
      const end = /\?+$/.test(hook) ? "?" : "!";
      const head = `⚡ ${hook.replace(/[.!?]+$/, "").toUpperCase()}${end}`;
      return [head, ...rest].join("\n\n");
    }
    return rest.length ? `${hook}\n\n${rest.map((s) => `• ${s}`).join("\n")}` : hook;
  }

  /* Where does the hook end? The earlier of the character limit and the line limit. */
  function cutAt(text, p) {
    let c = Math.min(text.length, p.chars), nl = 0;
    for (let i = 0; i < text.length && i < c; i++) if (text[i] === "\n" && ++nl >= p.lines) { c = i; break; }
    if (c < text.length && text[c] !== "\n" && text[c] !== " ") { const sp = text.lastIndexOf(" ", c); if (sp > c - 25 && sp > 0) c = sp; }
    return c;
  }

  /* ---------- Render ---------- */
  let out = "";
  const li = (cls, icon, text) => { const n = document.createElement("li"); n.className = cls; const i = document.createElement("i"); i.className = icon; i.setAttribute("aria-hidden", "true"); const s = document.createElement("span"); s.textContent = text; n.append(i, s); return n; };

  function render() {
    const raw = el.input.value, p = PLATFORMS[radio("platform")] || PLATFORMS.linkedin;
    const words = (raw.trim().match(/\S+/g) || []).length;
    out = format(raw, radio("tone") || "corporate", el.fillers.checked);
    el.count.textContent = `${raw.length.toLocaleString()} characters · ${words.toLocaleString()} words`;
    el.note.textContent = p.note;
    el.copy.disabled = !out;
    el.clear.hidden = !raw;

    if (!out) {
      el.post.className = "sa-post empty"; el.post.textContent = "Your formatted post will appear here as you type.";
      el.more.hidden = true; el.rest.hidden = true;
      el.checks.replaceChildren(li("idle", "ri-information-line", "Paste a paragraph to see how your hook performs."));
      return;
    }
    const c = cutAt(out, p), cut = c < out.length;
    el.post.className = "sa-post"; el.post.textContent = out.slice(0, c).trimEnd();
    el.more.hidden = !cut;
    el.rest.hidden = !cut;
    if (cut) { el.rest.replaceChildren(Object.assign(document.createElement("span"), { className: "sa-rest-lbl", textContent: "Hidden until “see more”" }), document.createTextNode(out.slice(c).trim())); }

    const first = out.split("\n")[0], rows = [];
    rows.push(first.length <= 70 ? li("ok", "ri-checkbox-circle-fill", `Opening line is ${first.length} characters, short enough to scan.`) : li("warn", "ri-error-warning-fill", `Opening line is ${first.length} characters. Aim for about 70 or fewer.`));
    rows.push(first.length <= c ? li("ok", "ri-checkbox-circle-fill", "Your first line shows in full before “see more”.") : li("warn", "ri-error-warning-fill", "Your first line is cut off before “see more”. Shorten it."));
    rows.push(/[0-9?]/.test(first) ? li("ok", "ri-checkbox-circle-fill", "Opening line has a number or a question, which tends to draw readers in.") : li("idle", "ri-lightbulb-line", "Tip: open with a number or a question."));
    rows.push(out.length <= p.max ? li("ok", "ri-checkbox-circle-fill", `${out.length.toLocaleString()} of ${p.max.toLocaleString()} characters used on ${p.name}.`) : li("warn", "ri-error-warning-fill", `${(out.length - p.max).toLocaleString()} characters over the ${p.name} limit${p.name === "X" ? ". Split it into a thread." : "."}`));
    el.checks.replaceChildren(...rows);
  }

  /* ---------- Copy ---------- */
  const say = (m, ok) => { el.status.textContent = m; el.status.style.color = ok ? "#067647" : ""; };
  async function copyText(t) {
    if (navigator.clipboard && window.isSecureContext) { try { await navigator.clipboard.writeText(t); return true; } catch { /* fall through */ } }
    const ta = document.createElement("textarea"); ta.value = t; ta.setAttribute("readonly", ""); ta.style.cssText = "position:fixed;top:0;left:0;opacity:0";
    document.body.append(ta); ta.select(); let ok = false; try { ok = document.execCommand("copy"); } catch { /* ignore */ } ta.remove(); return ok;
  }
  let timer;
  el.copy.addEventListener("click", async () => {
    if (!out) return;
    const lbl = el.copy.querySelector("span"), ok = await copyText(out);
    clearTimeout(timer);
    el.copy.classList.toggle("done", ok); lbl.textContent = ok ? "Copied!" : "Copy failed";
    say(ok ? "Post copied. Paste it into LinkedIn or X." : "We couldn't copy automatically. Select the text in the preview and copy it.", ok);
    timer = setTimeout(() => { el.copy.classList.remove("done"); lbl.textContent = "Copy post"; }, 2200);
  });

  /* ---------- Wiring ---------- */
  const save = () => store.set({ platform: radio("platform"), tone: radio("tone"), fillers: el.fillers.checked, theme: radio("theme"), draft: el.input.value.slice(0, 5000) });
  const apply = () => { el.phone.dataset.theme = radio("theme") === "dark" ? "dark" : "light"; render(); save(); };
  document.querySelectorAll('input[name="platform"],input[name="tone"],input[name="theme"]').forEach((r) => r.addEventListener("change", apply));
  el.fillers.addEventListener("change", apply);
  el.input.addEventListener("input", apply);
  el.sample.addEventListener("click", () => { el.input.value = SAMPLE; apply(); el.input.focus(); });
  el.clear.addEventListener("click", () => { el.input.value = ""; apply(); el.input.focus(); });

  const s = store.get();
  const pick = (name, v) => { const r = v && document.querySelector(`input[name="${name}"][value="${v}"]`); if (r) r.checked = true; };
  pick("platform", s.platform); pick("tone", s.tone); pick("theme", s.theme);
  if (typeof s.fillers === "boolean") el.fillers.checked = s.fillers;
  if (typeof s.draft === "string") el.input.value = s.draft;
  apply();
})();
