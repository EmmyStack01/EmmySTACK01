// scripts/add-analytics.mjs — adds Vercel Web Analytics to every full page in src/pages.
//
// Run from the project folder (after `npm i @vercel/analytics`):
//   node scripts/add-analytics.mjs --dry     shows what would change, edits nothing
//   node scripts/add-analytics.mjs           makes the changes
//
// For each page it adds, and only if missing:
//   in the top "---" block :  import Analytics from '@vercel/analytics/astro';
//   just before </head>    :  <Analytics />
// Safe to run again: pages that already have it are skipped. Pages that are not a full HTML document (they use a layout
// component instead) are listed so you can add the two lines by hand.
import { readdirSync, readFileSync, writeFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

const ROOT = "src/pages";
const SKIP = ["launchpad"];            // paths (inside src/pages) that should NOT be tracked, e.g. internal team pages
const IMPORT = "import Analytics from '@vercel/analytics/astro';";
const dry = process.argv.includes("--dry");

const walk = (dir) => readdirSync(dir).flatMap((n) => {
  const p = join(dir, n);
  return statSync(p).isDirectory() ? walk(p) : p.endsWith(".astro") ? [p] : [];
});

let changed = 0; const notes = [];
for (const file of walk(ROOT)) {
  const rel = relative(ROOT, file).split(sep).join("/");
  if (SKIP.some((s) => rel === s || rel.startsWith(s + "/") || rel.startsWith(s + "."))) { notes.push(`skip (excluded)      ${rel}`); continue; }
  let src = readFileSync(file, "utf8");
  if (src.includes("@vercel/analytics/astro")) { notes.push(`skip (already done)  ${rel}`); continue; }

  // Split off the frontmatter (the block between the first two --- lines), if the page has one.
  let front = "", rest = src;
  const m = /^---\r?\n[\s\S]*?\r?\n---\r?\n?/.exec(src);
  if (m) { front = m[0]; rest = src.slice(front.length); }
  if (!/<!doctype html/i.test(rest) || !/<\/head>/i.test(rest)) { notes.push(`CHECK (not a full page) ${rel}  <- add the two lines by hand if it should be tracked`); continue; }

  const nl = src.includes("\r\n") ? "\r\n" : "\n";
  front = front ? front.replace(/^---\r?\n/, (x) => x + IMPORT + nl) : `---${nl}${IMPORT}${nl}---${nl}`;
  rest = rest.replace(/<\/head>/i, (x) => `    <Analytics />${nl}${x}`);   // first </head> only
  if (!dry) writeFileSync(file, front + rest);
  changed++; notes.push(`${dry ? "would update" : "updated"}        ${rel}`);
}
console.log(notes.join("\n"));
console.log(`\n${dry ? "Dry run: " : ""}${changed} page(s) ${dry ? "would be " : ""}updated.`);
