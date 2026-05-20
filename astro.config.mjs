import { defineConfig } from 'astro/config';
import markdoc from '@astrojs/markdoc';
import sitemap from '@astrojs/sitemap';
import keystatic from '@keystatic/astro';
import vercel from '@astrojs/vercel';

export default defineConfig({
  site: 'https://emmystack01.com',
<<<<<<< HEAD
  output: 'hybrid', // Pre-renders portfolio pages as static HTML while leaving CMS functions server-rendered
=======
  output: 'static', 
>>>>>>> edea0fe19b731aa2f86f941f8de324653ed82941
  adapter: vercel({
    webAnalytics: { enabled: true }
  }),
  integrations: [
    markdoc(),
    keystatic(),
    sitemap({
      filter: (page) => 
        !page.includes('/script') && 
        !page.includes('/success') &&
        !page.includes('/thank-you') &&
        !page.includes('/go') &&
        !page.includes('/.well-known') &&
        !page.includes('/payment') &&
        !page.includes('/preview')
    }),
  ],
});
