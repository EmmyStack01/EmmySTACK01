import { defineConfig } from 'astro/config';
import markdoc from '@astrojs/markdoc';
import sitemap from '@astrojs/sitemap';
import keystatic from '@keystatic/astro';
import vercel from "@astrojs/vercel";
import react from '@astrojs/react';
import indexnow from 'astro-indexnow';

export default defineConfig({
  site: 'https://emmystack01.com',
  output: 'server',
  vite: {
    build: {
      sourcemap: false
    },
    resolve: {
      dedupe: ['react', 'react-dom']
    },
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-dom/client']
    }
  },
  adapter: vercel({
    webAnalytics: { enabled: true }
  }),
  legacy: {
    collectionsBackwardsCompat: true
  },
  integrations: [
    react(),
    markdoc(), 
    keystatic(), 
    sitemap({
      lastmod: new Date(),
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