import { defineConfig } from 'astro/config';
import markdoc from '@astrojs/markdoc';
import sitemap from '@astrojs/sitemap';
import keystatic from '@keystatic/astro';
import vercel from '@astrojs/vercel/serverless';

export default defineConfig({
  site: 'https://emmystack01.com',
  output: 'hybrid', // Keeps your 21 core pages lightning fast and static, but enables the live dashboard function
  adapter: vercel(),
  integrations: [
    markdoc(),
    keystatic(),
    sitemap({
      // Filter out pages you do not want indexed
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