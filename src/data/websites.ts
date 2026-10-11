// Content and configuration for /websites.
// Edit copy and settings here. Markup lives in src/components/websites/ and src/pages/websites/index.astro.

/* ------------------------------------------------------------------ */
/* Decorative mini-website visuals (same CSS-drawn mockups as the homepage cards).
   Styles come from /style/index-style.css (.mk-*, .browser, .visual). Hidden from screen readers. */
/* ------------------------------------------------------------------ */
const L = (w: number, c = "") => `<i class="mk-line ${c}" style="--w:${w}"></i>`;
export const visuals = {
  card: `<div class="mk mk-card"><span class="mk-cover g2"></span><span class="mk-avatar g1"></span>${L(44, "strong")}${L(30)}<span class="mk-row"><b class="mk-btn">Save contact</b><b class="mk-btn ghost">WhatsApp</b></span><span class="mk-icons"><i></i><i></i><i></i><i></i></span></div>`,
  port: `<div class="mk mk-port"><span class="mk-nav">${L(20, "strong")}<em></em><em></em><em></em></span><span class="mk-mosaic"><i class="g2 a"></i><i class="g1 b"></i><i class="g3 c"></i><i class="g4 d"></i><i class="g5 e"></i></span></div>`,
  resume: `<div class="mk mk-resume"><span class="mk-side"><span class="mk-avatar g1"></span>${L(72, "strong")}${L(52)}<span class="mk-chips"><i></i><i></i><i></i></span></span><span class="mk-main">${L(42, "strong")}${L(96)}${L(82)}${L(42, "strong")}${L(92)}${L(70)}${L(86)}</span></div>`,
  blog: `<div class="mk mk-blog"><span class="mk-feature g2"></span>${L(72, "strong")}${L(96)}<span class="mk-list"><span class="mk-item"><i class="g1"></i><span>${L(84)}${L(52)}</span></span><span class="mk-item"><i class="g3"></i><span>${L(74)}${L(60)}</span></span></span></div>`,
  biz: `<div class="mk mk-biz"><span class="mk-hero"><span class="mk-hero-text">${L(86, "strong")}${L(62, "strong")}${L(94)}<b class="mk-btn">Book now</b></span><span class="mk-hero-img g2"></span></span><span class="mk-tiles"><i></i><i></i><i></i></span></div>`,
  estate: `<div class="mk mk-estate"><span class="mk-prop"><i class="g2"><b>For sale</b></i>${L(76, "strong")}${L(46)}</span><span class="mk-prop"><i class="g1"><b>4 bed</b></i>${L(66, "strong")}${L(56)}</span><span class="mk-prop"><i class="g3"><b>New</b></i>${L(80, "strong")}${L(40)}</span></div>`,
  saas: `<div class="mk mk-saas"><span class="mk-hero2">${L(62, "strong")}${L(88)}<b class="mk-btn">Start free</b></span><span class="mk-dash"><span class="mk-chart"><i style="--h:40"></i><i style="--h:62"></i><i style="--h:48"></i><i style="--h:80"></i><i style="--h:68"></i><i style="--h:94"></i></span><span class="mk-stats"><i class="g1"></i><i class="g5"></i></span></span></div>`,
  land: `<div class="mk mk-land"><span class="mk-badge">New launch</span>${L(74, "strong")}${L(52, "strong")}<b class="mk-btn">Get the app</b><span class="mk-product"><i class="g2"></i><i class="g1"></i><i class="g3"></i></span></div>`,
};

/* ------------------------------------------------------------------ */
/* The eight website types. Order here is the order on the page.       */
/* cta.href -> plain link (digital business card goes to its product page).
   cta.type -> opens /thank-you?type=<type> in a new tab, which hands off to WhatsApp with that type's message
               (messages live in src/pages/thank-you.astro). */
/* ------------------------------------------------------------------ */
export type WebsiteType = {
  id: string;
  icon: string;
  title: string;
  navLabel: string;
  navFor: string;
  audience: string;
  quick: string;
  problem: string;
  help: string;
  scenario: string;
  examplesLabel?: string;
  examples?: string[];
  features: string[];
  approach: string;
  caveat?: string;
  note: string;
  cta: { label: string; href?: string; type?: string };
  resources?: { label: string; href: string }[];
  visual: keyof typeof visuals;
};

export const websiteTypes: WebsiteType[] = [
  {
    id: "digital-business-card",
    icon: "ri-id-card-line",
    title: "Digital Business Card Websites",
    navLabel: "Digital Business Card",
    navFor: "Entrepreneurs and professionals",
    audience: "Entrepreneurs, professionals, creators, consultants and business owners",
    quick: "A digital business card website puts your professional details in one shareable online profile, so people can find your services, work and contact options from a single link.",
    problem: "Clients meet you in one place, then look you up across Instagram, LinkedIn, WhatsApp and a PDF someone once sent. Your details are scattered, and some people give up before they find the right one.",
    help: "One profile can hold your services, work samples, contact buttons and social links. You share one link or QR code instead of several.",
    scenario: "You meet a potential client at a networking event. Instead of reading out a list of handles, you share one link or QR code. They open your profile, see what you do, save your contact details and message you on WhatsApp from the same page.",
    features: ["Professional profile", "Contact details", "Social media links", "Services", "Portfolio or work samples", "Save-contact button", "QR code sharing", "Direct contact buttons"],
    approach: "This is Emmy STACK01's flagship product, with its own page, live demos and launch package. Start there to see the card layouts and what is included before you decide.",
    note: "Replace a stack of separate links with one profile that people can open, save and share.",
    cta: { label: "Build your card", href: "/products/digital-business-card" },
    resources: [
      { label: "View live card demos", href: "/products/digital-business-card#demo" },
      { label: "See the launch package", href: "/products/digital-business-card#launch-package" },
    ],
    visual: "card",
  },
  {
    id: "creator-portfolio-websites",
    icon: "ri-palette-line",
    title: "Creator & Portfolio Websites",
    navLabel: "Creator & Portfolio",
    navFor: "Photographers, musicians, creators",
    audience: "Photographers, musicians, videographers, designers, artists and content creators",
    quick: "A portfolio website gives your best work a dedicated home, with clear categories, a short bio and an obvious way to enquire.",
    problem: "Social feeds bury older work. A prospective client has to scroll through months of posts to find the kind of project they want to hire you for.",
    help: "A portfolio lets you decide what visitors see first. You can group work by type, add context to each project and put booking details next to the work itself.",
    scenario: "A photographer posts on social media, but clients struggle to find relevant examples. A portfolio can group the work into portraits, weddings, events and commercial shoots. A musician might feature releases, videos, shows and booking information instead.",
    features: ["Project galleries", "Portfolio categories", "Selected projects", "About or biography section", "Service descriptions", "Enquiry buttons", "Booking information", "Embedded media where appropriate"],
    approach: "The feature list changes with the profession. A photographer needs fast galleries and clear categories. A musician needs releases, video embeds and a booking route. We choose the features that fit your work and goals, then leave out the rest.",
    note: "Show visitors your selected work, explain what you offer, and make it easier for interested clients to enquire.",
    cta: { label: "Start your portfolio website", type: "portfolio" },
    visual: "port",
  },
  {
    id: "resume-personal-websites",
    icon: "ri-article-line",
    title: "Resume & Personal Websites",
    navLabel: "Resume & Personal",
    navFor: "Job seekers and tech professionals",
    audience: "Job seekers, developers, designers, freelancers, consultants and experienced professionals",
    quick: "A personal website expands on your CV by putting your experience, projects, skills and case studies in one place that you control.",
    problem: "A CV has to stay short. Hiring managers and clients often see a list of job titles without the projects and decisions behind them.",
    help: "A personal site gives you room to explain what you built, how you work and how to reach you. It can also link to your CV and professional profiles.",
    scenario: "A software developer lists projects and explains the problem each one solved. A UI/UX designer shows case studies covering research, design decisions and outcomes. A consultant describes their expertise and the services they offer.",
    features: ["Professional introduction", "Skills and experience", "Project portfolio", "Case studies", "CV or résumé link", "Professional achievements", "Contact information", "Relevant professional profiles"],
    approach: "We organise the page around the person reading it. A recruiter wants a quick summary and a link to your CV. A client wants proof that you have solved a similar problem. The layout keeps both within easy reach.",
    caveat: "A personal website supports your application or pitch. It does not guarantee a job or new clients.",
    note: "Bring your experience, projects, skills and professional information together in one place.",
    cta: { label: "Build your personal website", type: "resume" },
    visual: "resume",
  },
  {
    id: "blog-content-websites",
    icon: "ri-edit-line",
    title: "Blog & Content Websites",
    navLabel: "Blog & Content",
    navFor: "Writers, influencers, publishers",
    audience: "Writers, bloggers, influencers, publishers, educators and businesses that publish content",
    quick: "A blog website is a dedicated home for your articles, with stable URLs, categories and links between related posts.",
    problem: "Social posts disappear down the feed and cannot be organised. A reader who wants your earlier answers has nowhere to look.",
    help: "Articles on your own site keep a permanent address, sit in categories and link to each other, so a reader can keep going after one post. A simple publishing workflow lets you add new articles without rebuilding anything.",
    scenario: "A consultant keeps answering the same questions from prospective clients. Publishing clear articles on those questions builds a resource library that visitors can read before they get in touch.",
    features: ["Article publishing", "Categories and tags", "Search where useful", "Related articles", "Author information", "Responsive reading layouts", "Internal linking", "CMS integration where appropriate"],
    approach: "We set up the reading experience first: comfortable type, fast pages and clear categories. If you plan to publish often, a CMS lets you write and edit articles yourself.",
    caveat: "Search visibility depends on many factors, including content quality and time. A blog gives your content a clear structure, not a guaranteed ranking.",
    note: "Give your writing a permanent home that readers can browse, search and share.",
    cta: { label: "Discuss your blog website", type: "blog" },
    resources: [{ label: "Browse Emmy STACK01 articles", href: "/articles" }],
    visual: "blog",
  },
  {
    id: "business-service-websites",
    icon: "ri-briefcase-line",
    title: "Business & Service Websites",
    navLabel: "Business & Service",
    navFor: "Clinics, law firms, shops, salons",
    audience: "Barbers, salons, consultants, law firms, clinics, repair services, cleaning companies, shops and restaurants",
    quick: "A business website shows customers what you offer, where to find you and how to take the next step.",
    problem: "Enquiries arrive through DMs and comments, and the same questions come up every time. What do you charge? Where are you? When are you open?",
    help: "One site can answer those questions up front: your services, hours, location and a clear way to contact or book.",
    scenario: "A barber gets enquiries on social media but has no single place showing services, prices, hours, location and booking options. A website puts those details together and gives customers a clear path from finding the business to getting in touch.",
    examplesLabel: "More examples",
    examples: [
      "A consultant can explain their services and consultation process.",
      "A law firm can introduce its practice areas and offer suitable enquiry options.",
      "A clinic can present its services, opening hours and appointment information.",
      "A shop can show its products, opening hours and purchasing options.",
    ],
    features: ["Service pages", "Pricing or service menus where appropriate", "Business hours", "Location and directions", "Contact details", "WhatsApp or enquiry buttons", "Booking where required", "Genuine testimonials or reviews", "Frequently asked questions"],
    approach: "We start from what a customer needs to know before they contact you, then arrange the site so those answers come first. Sectors such as law and healthcare need careful wording around services and enquiries, so we agree it with you.",
    caveat: "A website helps customers find information and act on it. It does not on its own bring customers or revenue.",
    note: "Help potential customers understand your services, find essential information and contact your business.",
    cta: { label: "Start your business website", type: "business" },
    resources: [{ label: "See per-page pricing", href: "/pricing" }],
    visual: "biz",
  },
  {
    id: "real-estate-websites",
    icon: "ri-home-4-line",
    title: "Real Estate Websites",
    navLabel: "Real Estate",
    navFor: "Agents, agencies, developers",
    audience: "Real estate agents, realtors, property managers, agencies and property developers",
    quick: "A real estate website gives each property its own page, so buyers and renters can review the details before they contact an agent.",
    problem: "Listings shared on social media are hard to compare. Prices, photos, locations and contact details end up spread across posts and chats.",
    help: "Each listing gets its photographs, description, price, location and enquiry route in one place, and listings can be grouped by type or area.",
    scenario: "An agent promotes several properties on social media. A dedicated website gives each property a page with photographs, a description, the price, the location and enquiry details. A developer can use a project showcase to present a new estate.",
    features: ["Property listings", "Property detail pages", "Image galleries", "Property categories", "Location information", "Enquiry forms", "Agent profiles", "Project showcases for developers"],
    approach: "We structure listings so they are easy to add and update, because an outdated listing costs trust. Emmy STACK01 designs the structure. The property details, prices and locations come from you.",
    caveat: "Listings and availability need to be kept accurate after launch.",
    note: "Let buyers and renters compare properties and contact you with the details already in front of them.",
    cta: { label: "Discuss your real estate website", type: "real-estate" },
    visual: "estate",
  },
  {
    id: "startup-saas-websites",
    icon: "ri-command-line",
    title: "Startup & SaaS Websites",
    navLabel: "Startup & SaaS",
    navFor: "Startups, SaaS, product teams",
    audience: "Startup founders, software companies, SaaS businesses, agencies and digital product teams",
    quick: "A startup or SaaS website explains your product, who it is for, how it works and what a visitor should do next.",
    problem: "Founders know the product well, but a new visitor does not. Without a clear explanation they leave before they understand what it does.",
    help: "A marketing site walks a visitor from the problem to the product to a next step, such as signing up or booking a demo.",
    scenario: "A startup has built an invoicing tool. Its marketing website explains the problem the tool solves, shows the key features, answers common questions and guides interested visitors to register or request a demo.",
    features: ["Product overview", "Feature explanations", "Product screenshots", "Pricing information where available", "FAQs", "Registration or demo call to action", "Contact information", "Integrations where supported"],
    approach: "We build the public website that explains and promotes the product. The registration or demo flow can link out to your application.",
    caveat: "A marketing website is separate from the SaaS application. Building it does not include developing the application itself.",
    note: "Help new visitors understand your product quickly, and give interested ones a clear way in.",
    cta: { label: "Discuss your product website", type: "saas" },
    visual: "saas",
  },
  {
    id: "landing-pages-brochures",
    icon: "ri-rocket-line",
    title: "Landing Pages & Digital Brochures",
    navLabel: "Landing Pages & Brochures",
    navFor: "Launches, apps, campaigns, offers",
    audience: "Product founders, app developers, campaign managers, event organisers and businesses promoting specific offers",
    quick: "A landing page presents one product, service, campaign or offer with a single purpose and a clear next step.",
    problem: "A full website has many paths. When you are promoting one thing, extra menus and unrelated pages pull visitors away from the action you want.",
    help: "A focused page keeps the explanation, the supporting details and the call to action together. A digital brochure gives people something short to read and share.",
    scenario: "A business launches a new product. A focused landing page explains what it does, shows the benefits, answers common questions and guides visitors to buy or enquire.",
    features: ["Clear headline", "Product or service explanation", "Relevant images", "Benefits and features", "FAQs", "Contact or registration call to action", "Links to download or purchase", "Supporting information for the campaign"],
    approach: "We decide the one action the page exists for, then cut anything that does not support it. The same approach works for an app launch, an event or a seasonal offer.",
    note: "Give a single product or offer one focused page with one clear next step.",
    cta: { label: "Discuss your landing page", type: "landing" },
    visual: "land",
  },
];

/* ------------------------------------------------------------------ */
/* Recent projects are edited in Keystatic ("Website Projects" collection and the                */
/* "Websites page: Recent Projects heading" singleton). They are read by src/lib/cms.ts.        */
/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/* FAQs. Answers may contain simple HTML (links only); content is static and trusted. */
/* ------------------------------------------------------------------ */
export const faqs: { q: string; a: string }[] = [
  {
    q: "What type of website does my business need?",
    a: 'It depends on what a visitor needs to do. If people mainly need to contact you quickly, a digital business card fits. If they need to see your work, choose a portfolio. If they need to compare services or properties, a business or real estate website fits. Use the <a href="#website-types">website type guide</a> above, and if you are unsure, we can talk it through before any work starts.',
  },
  {
    q: "How much does a website cost in Nigeria?",
    a: 'It depends on the number of pages and any extra features. Emmy STACK01 uses per-page pricing so you know the total investment before the project begins. Hosting on GitHub Pages, domain configuration and SSL setup are included at no extra cost. See the <a href="/pricing">rate card</a> for current pricing.',
  },
  {
    q: "How long does it take to build a website?",
    a: "Emmy STACK01 websites are built to go live within 14 days. The exact timeline depends on your scope and on how quickly you supply content and feedback, and we confirm it with you before starting.",
  },
  {
    q: "What information do I need before starting a website project?",
    a: "Bring your goal for the site and who it is for, a list of your services or products, your contact details and WhatsApp number, and any logo, colours or photos you already have. If you own a domain name, bring that too. Rough notes are enough, because we help shape the content with you.",
  },
  {
    q: "Can Emmy STACK01 build a website for my profession?",
    a: "Yes, if your profession fits one of the eight website types on this page, or sits close to one. If it does not match exactly, we start from the nearest type and adjust the features to suit how your customers actually decide.",
  },
  {
    q: "Can I update my website after launch?",
    a: 'Yes. Small changes such as text or image swaps are handled as minor updates for a flat fee per request. New pages or added functionality are quoted as separate modules. If you want to edit content yourself, we can set up a CMS for a one-time fee. See <a href="/pricing#custom">website management options</a> for details.',
  },
  {
    q: "Can my website appear on Google?",
    a: "Yes, it can. We set up Google indexing and build on-page SEO basics into the site. Where and how often a site appears in search results depends on many factors, including content quality, competition and time, so no one can honestly promise rankings or traffic.",
  },
  {
    q: "Will my website work on mobile phones?",
    a: "Yes. Every website is built to adapt to phones, tablets and desktop screens, and layouts are checked on small screens so text, buttons and menus stay easy to use.",
  },
  {
    q: "Can I connect my domain to my website?",
    a: "Yes. We handle domain name configuration and SSL setup at no extra cost. You can connect a domain you already own, or buy one from a registrar and we will configure it.",
  },
  {
    q: "Do I need a website if I already use social media?",
    a: "Social media is useful for being discovered, but you do not control how it displays your content, and older posts get buried. A website gives you one stable place for services, prices, work and contact details. The two work best together, with social posts pointing people to the site.",
  },
  {
    q: "Can you build a website around my existing brand?",
    a: "Yes. Share your logo, colours and fonts and we design around them. If you do not have a brand yet, Emmy STACK01 also offers branding and UI/UX design.",
  },
  {
    q: "Can I request additional features for my website?",
    a: "Yes. Features outside the standard scope, such as a newsletter signup, a CMS, booking or a dark mode, are treated as extra modules and quoted separately, so you only pay for what your site needs.",
  },
];
