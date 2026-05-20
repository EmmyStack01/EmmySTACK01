import { defineConfig } from 'astro/config';
import markdoc from '@astrojs/markdoc';
import sitemap from '@astrojs/sitemap';
import keystatic from '@keystatic/astro';
import vercel from '@astrojs/vercel';

export default defineConfig({
  site: 'https://emmystack01.com',
  output: 'static', 
  adapter: vercel({
    webAnalytics: { enabled: true },
    // Explicitly force all SSR/dynamic routes to use Node Serverless instead of Edge
    functionPerRoute: false, 
    imagesConfig: { sizes: [320, 640, 1200] }
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
