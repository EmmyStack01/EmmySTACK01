import { defineConfig } from 'astro/config';
import markdoc from '@astrojs/markdoc';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://emmystack01.com',
  integrations: [
    markdoc(),
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