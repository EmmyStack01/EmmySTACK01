// Build-time reads from Keystatic for the /websites projects and the footer / mobile-menu links.
// Every reader has a safe fallback, so an empty or missing CMS entry never breaks a page.
import { keystaticReader } from "../reader";

/* ------------------------------------------------------------------ */
/* Social and contact links (singleton: settings)                      */
/* ------------------------------------------------------------------ */
const DEFAULTS = {
  whatsApp: "https://wa.me/2349076991076",
  x: "https://x.com/Emmy_STACK01",
  email: "hello@emmystack01.com",
};

export type SiteLink = { key: string; label: string; href: string; icon: string; external: boolean };

const clean = (v?: string | null) => (v ?? "").trim();
// Only real web links are allowed in the URL fields. A link pasted without "https://" (e.g. youtube.com/@name) gets it added.
const web = (v?: string | null) => {
  const t = clean(v);
  if (/^https?:\/\//i.test(t)) return t;
  if (/^[a-z0-9-]+(\.[a-z0-9-]+)+(\/|$)/i.test(t)) return `https://${t}`;
  return "";
};

export async function getSiteLinks(): Promise<SiteLink[]> {
  let s: any = null;
  try {
    s = await keystaticReader.singletons.settings.read();
  } catch (e) {
    console.warn("[cms] Could not read the settings singleton, using default links.", e);
  }
  const email = clean(s?.email).replace(/^mailto:/i, "") || DEFAULTS.email;

  const all: SiteLink[] = [
    { key: "x", label: "Emmy STACK01 on X", href: web(s?.x) || DEFAULTS.x, icon: "ri-twitter-x-line", external: true },
    { key: "whatsapp", label: "Emmy STACK01 on WhatsApp", href: web(s?.whatsApp) || DEFAULTS.whatsApp, icon: "ri-whatsapp-line", external: true },
    { key: "email", label: "Email Emmy STACK01", href: `mailto:${email}`, icon: "ri-mail-line", external: false },
    { key: "youtube", label: "Emmy STACK01 on YouTube", href: web(s?.youtube), icon: "ri-youtube-line", external: true },
    { key: "linkedin", label: "Emmy STACK01 on LinkedIn", href: web(s?.linkedin), icon: "ri-linkedin-box-line", external: true },
    { key: "instagram", label: "Emmy STACK01 on Instagram", href: web(s?.instagram), icon: "ri-instagram-line", external: true },
  ];
  // WhatsApp, X and email always have a value. YouTube, LinkedIn and Instagram only show once a link is added.
  return all.filter((l) => l.href);
}

/* ------------------------------------------------------------------ */
/* Recent projects on /websites (collection: projects, singleton: recentProjectsSection) */
/* ------------------------------------------------------------------ */
export type RecentProject = {
  slug: string;
  name: string;
  websiteType: string;
  image: string | null;
  imageAlt: string;
  overview: string;
  need: string;
  built: string;
  strategy: string;
  liveUrl: string | null;
};

const SECTION_DEFAULTS = {
  heading: "See what we've built",
  description: "Explore real projects and see how each website is designed around its purpose, audience and goals.",
};

export async function getRecentProjects() {
  let section: any = null;
  try {
    section = await keystaticReader.singletons.recentProjectsSection.read();
  } catch (e) {
    console.warn("[cms] Could not read the recentProjectsSection singleton, using default text.", e);
  }

  let raw: any[] = [];
  try {
    raw = await keystaticReader.collections.projects.all();
  } catch (e) {
    console.warn("[cms] Could not read the projects collection, hiding Recent Projects.", e);
  }

  const projects: (RecentProject & { order: number })[] = raw
    .filter((p) => p.entry.published !== false)
    .map((p) => ({
      slug: p.slug,
      name: clean(p.entry.name),
      websiteType: clean(p.entry.websiteType),
      // Stored as a public path; a bare filename is also resolved to the projects image folder.
      image: clean(p.entry.image) ? (/^(\/|https?:)/i.test(clean(p.entry.image)) ? clean(p.entry.image) : `/asset/projects/${clean(p.entry.image)}`) : null,
      imageAlt: clean(p.entry.imageAlt) || `Screenshot of the ${clean(p.entry.name)} website`,
      overview: clean(p.entry.overview),
      need: clean(p.entry.need),
      built: clean(p.entry.built),
      strategy: clean(p.entry.strategy),
      liveUrl: web(p.entry.liveUrl) || null,
      order: p.entry.order ?? 0,
    }))
    .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));

  return {
    heading: clean(section?.heading) || SECTION_DEFAULTS.heading,
    description: clean(section?.description) || SECTION_DEFAULTS.description,
    projects,
  };
}
