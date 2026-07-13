# Emmy STACK01 | Digital DNA 🧬

Welcome to the official production repository for Emmy STACK01. We are a digital agency powering custom web builds, advanced digital business cards, and bespoke creator engines. Built on a static-first, server-hybrid architecture utilizing Astro 6, Keystatic CMS, and Vercel.

## 🚀 Live Production & Tools
* **Main Website:** [https://emmystack01.com/](https://emmystack01.com/)
* **The Digital DNA Log (Blog):** [https://emmystack01.com/articles](https://emmystack01.com/articles)
* **Keystatic Admin Panel:** [https://emmystack01.com/keystatic](https://emmystack01.com/keystatic) (Protected)

---

## 🛠 The Tech Stack
* **Framework:** [Astro v6.4.4](https://astro.build/) (Static-first with `output: 'server'` for dynamic CMS routes)
* **Headless CMS:** [Keystatic v5.1.0](https://keystatic.com/) (Configured in GitHub storage mode)
* **Hosting & Deployment:** [Vercel](https://vercel.com/) via `@astrojs/vercel` SSR adapter
* **Styling & Aesthetics:** Custom performance-optimized CSS, dark-glass aesthetic, Orbitron & Montserrat typography, and custom SVG animations
* **Package Management:** Node 22.x (Deployed with `--legacy-peer-deps` for strict dependency handling)

---

## ✨ Key Features & Native Apps

### 1. Hybrid Keystatic CMS Integration ✍️
Powers our digital publication, **The Digital DNA Log**.
* **GitHub Storage Mode:** Edits made in the admin UI directly commit JSON data and uploaded assets to this GitHub repository.
* **Component Blocks:** Utilizes dynamic, custom Markdoc-style blocks like Contextual Action Cards (CTA) rendered natively via `ArticleRenderer.tsx`.
* **Instant SEO Syncing:** Automatic sitemap rebuilding and automated URL submissions to Bing and Google via `astro-indexnow` on every production build.

### 2. Built-in Micro-Apps & Free Utility Suite 🧰
* **Digital DNA Auditor (`/tools/website-auditor`):** A GSAP and Vanta.js-fueled performance & technical SEO crawler that outputs high-fidelity client PDFs via a custom sandboxed `html2canvas` renderer.
* **Emmy Sign (`/tools/emmy-sign`):** A lightweight, browser-based electronic signature pad.
* **Document Engine (`/document-engine`):** Generates branded A4 legal documents (White-Label Licensing / Development Agreements). Proxied dynamically from separate GitHub Pages source code.
* **Other Utilities:** Brand Engine, Naira Wise, Social Architect, and Meeting Background Studio.

### 3. SEO & GEO (Generative Engine Optimization) 🔍
* Highly targeted JSON-LD Schema.org `@graph` structured data mapped directly to micro-data attributes.
* Custom, profession-specific structured schemas integrated into our Digital Business Card (DBC) prototypes to influence Google Knowledge Panels and AI crawler discovery indices.

---

## 📂 Repository Structure
Based on the current production branch configuration:

| File/Folder | Purpose |
| :--- | :--- |
| `.github/workflows/` | CI/CD automation pipelines. |
| `api/` | Serverless API backend helper endpoints. |
| `public/` | Global static assets (favicons, fonts, raw SVGs, and CMS uploaded images under `/asset/`). |
| `src/` | Primary source directory (Astro pages, layout systems, React renderers, styles). |
| `.nojekyll` | Prevents GitHub Pages static engine bypass conflicts. |
| `astro.config.mjs` | Astro configuration file with integrations (React, Keystatic, IndexNow, Sitemap, Vercel Adapter). |
| `keystatic.config.ts` | Complete CMS collections, singletons, schemas, and GitHub project sync parameters. |
| `tsconfig.json` | Custom TypeScript configuration mapping JSX overrides for compilation. |
| `vercel.json` | Deployment parameters, short URL redirects, COOP/COEP security overrides, and CMS rewrites. |

---

## ⚙️ Development & Local Run

1. **Install Dependencies:**
```bash
   npm install --legacy-peer-deps
```

2. **Setup Local Environment Variables (`.env`):**
```env
   KEYSTATIC_GITHUB_CLIENT_ID=your_github_app_id
   KEYSTATIC_GITHUB_CLIENT_SECRET=your_github_app_secret
   KEYSTATIC_SECRET=minimum_32_character_random_string
```

3. **Run Dev Environment:**
```bash
   npm run dev
```

---

## 📜 License
This project is licensed under the **CC-BY-NC-ND 4.0 License**.
* **Attribution:** Appropriate credit must be provided.
* **NonCommercial:** Material may not be used for commercial purposes.
* **NoDerivatives:** Modified versions of this material may not be distributed.

---

## 📧 Contact & Network
* **Lead Architect:** Wisdom Ezuduemoih
* **Email:** [hello@emmystack01.com](mailto:hello@emmystack01.com)
* **X (Twitter):** [@Emmy_STACK01](https://x.com/Emmy_STACK01)

> "Let's build your Digital DNA."
