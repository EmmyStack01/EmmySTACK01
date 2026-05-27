import { defineConfig } from 'astro/config';
import markdoc from '@astrojs/markdoc';
import sitemap from '@astrojs/sitemap';
import keystatic from '@keystatic/astro';
import vercel from "@astrojs/vercel";
import react from '@astrojs/react';
import indexnow from 'astro-indexnow';

export default defineConfig({
  site: 'https://emmystack01.com',
  trailingSlash: 'never',
  output: 'server',
  vite: {
    optimizeDeps: {
      include: ['react', 'react-dom'] // Forces Vite to pre-bundle CommonJS exports into clean ES modules
    },
    build: {
      sourcemap: false // Keeps your terminal clear of those yellow warnings!
    }
  },
  adapter: vercel({
    webAnalytics: { enabled: true }
  }),
  legacy: {
    collectionsBackwardsCompat: true // <-- The correct Astro v6 flag for older collection formats
  },
  integrations: [
    react(), // <-- FIXED: Always initialize React first so Keystatic can consume it safely
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
    indexnow({
      site: 'https://emmystack01.com',
      key: 'ec64748f40c8436da57b45e04b431172',
      keyLocation: 'https://emmystack01.com/ec64748f40c8436da57b45e04b431172.txt'
    })
  ],
});