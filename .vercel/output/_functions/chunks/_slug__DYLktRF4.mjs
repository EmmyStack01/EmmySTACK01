import { c as createComponent } from './astro-component_BELpjruW.mjs';
import 'piccolore';
import { j as addAttribute, s as renderHead, t as renderTemplate, q as renderComponent } from './entrypoint_IIOa5YlT.mjs';
import { k as keystaticReader } from './reader_CIVxZPd1.mjs';

async function getStaticPaths() {
  const articles = await keystaticReader.collections.articles.all();
  return articles.map((article) => ({
    params: { slug: article.slug },
    props: {
      title: article.entry.title,
      description: article.entry.description,
      date: article.entry.date,
      category: article.entry.category,
      readingTime: article.entry.readingTime,
      // 2. Keystatic passes the auto-generated asset path right here!
      image: article.entry.coverImage,
      author: article.entry.author,
      content: article.entry.content
    }
  }));
}
const $$slug = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$slug;
  const { title, description, date, readingTime, category, image, author, content } = Astro2.props;
  return renderTemplate`<html lang="en" data-astro-cid-xw3clhsd> <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><meta name="robots" content="index, follow"><title>${title} | Emmy STACK01</title><meta name="description"${addAttribute(description, "content")}><link rel="canonical"${addAttribute(Astro2.url.href, "href")}><meta property="og:type" content="article"><meta property="og:title"${addAttribute(title, "content")}><meta property="og:description"${addAttribute(description, "content")}><meta property="og:url"${addAttribute(Astro2.url.href, "content")}><meta property="og:image"${addAttribute(image, "content")}><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title"${addAttribute(title, "content")}><meta name="twitter:description"${addAttribute(description, "content")}><meta name="twitter:image"${addAttribute(image, "content")}><link rel="apple-touch-icon" sizes="180x180" href="https://emmystack01.com/favicon_io/apple-touch-icon.png"><link rel="icon" type="image/png" sizes="32x32" href="https://emmystack01.com/favicon_io/favicon-32x32.png"><link rel="icon" type="image/png" sizes="16x16" href="https://emmystack01.com/favicon_io/favicon-16x16.png"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400..900&family=Montserrat:wght@300..600;700&display=swap" rel="stylesheet"><link href="https://cdn.jsdelivr.net/npm/remixicon@4.7.0/fonts/remixicon.css" rel="stylesheet">${renderHead()}</head> <body data-astro-cid-xw3clhsd> <div style="max-width: 800px; margin: 0 auto; padding: 2rem 1.5rem 0 1.5rem;" data-astro-cid-xw3clhsd> <a href="/articles" class="back-btn" data-astro-cid-xw3clhsd> <i class="ri-arrow-left-line" data-astro-cid-xw3clhsd></i> Back to DNA Log
</a> </div> <main style="max-width: 800px; margin: 0 auto; padding: 2rem 1.5rem 6rem 1.5rem;" data-astro-cid-xw3clhsd> <header style="margin-bottom: 2.5rem;" data-astro-cid-xw3clhsd> <span style="display: inline-block; background: rgba(0, 204, 255, 0.1); color: #00ccff; padding: 0.2rem 0.6rem; border-radius: 4px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; border: 1px solid rgba(0, 204, 255, 0.2); margin-bottom: 1rem;" data-astro-cid-xw3clhsd> ${category} </span> <h1 class="title-font" style="font-size: clamp(1.75rem, 5vw, 2.6rem); color: #fff; line-height: 1.3; margin: 0 0 1.25rem 0; letter-spacing: 0.5px;" data-astro-cid-xw3clhsd> ${title} </h1> <div style="display: flex; flex-wrap: wrap; gap: 1.5rem; font-size: 0.85rem; color: #8b949e; border-bottom: 1px solid rgba(49, 56, 65, 0.6); padding-bottom: 1.5rem;" data-astro-cid-xw3clhsd> <span data-astro-cid-xw3clhsd><i class="ri-user-3-line" style="color: #2d66b4;" data-astro-cid-xw3clhsd></i> By ${author}</span> <span data-astro-cid-xw3clhsd><i class="ri-calendar-todo-line" data-astro-cid-xw3clhsd></i> ${date}</span> <span data-astro-cid-xw3clhsd><i class="ri-time-line" data-astro-cid-xw3clhsd></i> ${readingTime}</span> </div> </header> ${image && renderTemplate`<div style="width: 100%; height: clamp(200px, 45vw, 400px); overflow: hidden; border-radius: 12px; margin-bottom: 3rem; border: 1px solid rgba(49, 56, 65, 0.4);" data-astro-cid-xw3clhsd> <img${addAttribute(image, "src")}${addAttribute(title, "alt")} style="width: 100%; height: 100%; object-fit: cover;" data-astro-cid-xw3clhsd> </div>`} <article class="rich-text" style="margin-bottom: 5rem; color: #e6edf3; line-height: 1.8;" data-astro-cid-xw3clhsd> <div class="prose prose-invert" style="max-width: 750px; margin: 0 auto; line-height: 1.8;" data-astro-cid-xw3clhsd> ${renderComponent($$result, "DocumentRenderer", DocumentRenderer, { "document": content, "data-astro-cid-xw3clhsd": true })} </div> </article> <section class="glass-card" style="padding: 2.5rem; text-align: center; border-color: rgba(0, 204, 255, 0.3);" data-astro-cid-xw3clhsd> <h3 class="title-font" style="color: #fff; font-size: 1.4rem; margin: 0 0 0.75rem 0; letter-spacing: 0.5px;" data-astro-cid-xw3clhsd>
READY TO OWN YOUR DIGITAL IDENTITY?
</h3> <p style="color: #8b949e; max-width: 550px; margin: 0 auto 2rem auto; font-size: 0.95rem; line-height: 1.6;" data-astro-cid-xw3clhsd>
Stop leaving your professional network pipeline in the hands of third-party platforms. Launch a high-performance digital identity card that scales your authority.
</p> <div data-astro-cid-xw3clhsd> <a href="/products/digital-business-card" class="btn-glow" style="display: inline-block; padding: 0.8rem 2rem; border-radius: 6px; font-size: 0.9rem;" data-astro-cid-xw3clhsd>
Deploy Your Brand <i class="ri-rocket-2-line" style="margin-left: 6px; vertical-align: middle;" data-astro-cid-xw3clhsd></i> </a> </div> </section> </main> </body></html>`;
}, "C:/Users/WISDOM/Desktop/emmystack01.com-main/src/pages/articles/[slug].astro", void 0);

const $$file = "C:/Users/WISDOM/Desktop/emmystack01.com-main/src/pages/articles/[slug].astro";
const $$url = "/articles/[slug]";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$slug,
  file: $$file,
  getStaticPaths,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
