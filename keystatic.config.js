import { config, fields, collection, singleton } from '@keystatic/core';

export default config({
  // 1. Storage Strategy: Safely switches using Vite's production environment flag
  storage: {
    kind: import.meta.env.PROD ? 'github' : 'local',
    repo: 'EmmyStack01/EmmySTACK01', 
  },

  collections: {
    articles: collection({
      label: 'Articles (Log)',
      slugField: 'title',
      // Keystatic maps content relative to the root. This path remains perfectly intact.
      path: 'src/content/articles/*', 
      format: { data: 'json', contentField: 'content' }, 
      schema: {
        title: fields.slug({ name: { label: 'Title' } }),
        
        author: fields.text({
          label: 'Author Name',
          defaultValue: 'Wisdom Ezuduemoih',
        }),

        description: fields.text({ 
          label: 'Description / Hook', 
          description: 'A sharp, high-converting hook for the preview card and Google SEO.',
          multiline: true 
        }),
        
        date: fields.date({
          label: 'Published Date',
          defaultValue: { kind: 'today' },
        }),
        
        category: fields.select({
          label: 'Category',
          options: [
            { label: 'Branding', value: 'Branding' },
            { label: 'Web Development', value: 'Web Development' },
            { label: 'Technical SEO', value: 'Technical SEO' },
            { label: 'Partnership', value: 'Partnership' }
          ],
          defaultValue: 'Branding',
        }),

        readingTime: fields.text({
          label: 'Reading Time',
          defaultValue: '5 min read',
          description: 'e.g., 5 min read'
        }),

        coverImage: fields.image({
          label: 'Cover Image Artwork',
          directory: 'public/asset',
          publicPath: '/asset/',
        }),

        content: fields.markdoc({
          label: 'Content',
          options: {
            image: {
              directory: 'public/asset/blog-inline',
              publicPath: '/asset/blog-inline/',
            },
          },
        }),
      },
    }),
  },

  singletons: {
    settings: singleton({
      label: 'Site Settings',
      path: 'src/content/settings', // Keystatic internal content paths map normally
      schema: {
        siteTitle: fields.text({ label: 'Site Title', defaultValue: 'Emmy STACK01' }),
        description: fields.text({ label: 'Global SEO Description', multiline: true }),
        whatsappLink: fields.url({ label: 'WhatsApp CTA Redirect Link' }),
      },
    }),
  },
});