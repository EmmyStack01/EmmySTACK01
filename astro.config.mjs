import { defineConfig } from 'astro/config';
import markdoc from '@astrojs/markdoc';
import sitemap from '@astrojs/sitemap';
import keystatic from '@keystatic/astro';
import vercel from "@astrojs/vercel";
import react from '@astrojs/react';

export default defineConfig({
  site: 'https://emmystack01.com',
  output: 'server',
  adapter: vercel({
    webAnalytics: { enabled: true }
  }),
  legacy: {
    collectionsBackwardsCompat: true // <-- The correct Astro v6 flag for older collection formats
  },
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
    react()
  ],
});