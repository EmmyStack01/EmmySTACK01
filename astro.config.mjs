import { defineConfig } from 'astro/config';
import markdoc from '@astrojs/markdoc';
import sitemap from '@astrojs/sitemap';
import keystatic from '@keystatic/astro';
import vercel from '@astrojs/vercel/serverless';

export default defineConfig({
  site: 'https://emmystack01.com',
  output: 'hybrid',
  adapter: vercel({
    webAnalytics: { enabled: true },
    // Ensures everything defaults to standard serverless node blocks
    edgeMiddleware: false 
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