import { config, fields, collection, singleton } from '@keystatic/core';

export default config({
  // 1. Storage Strategy: Set to 'local' for development, switch to 'github' when deploying live
  storage: {
    kind: process.env.NODE_ENV === 'production' ? 'github' : 'local',
    repo: 'EmmyStack01/EmmySTACK01', 
  },

  collections: {
    articles: collection({
      label: 'Articles (Log)',
      slugField: 'title',
      path: 'src/content/articles/*', // Location for content data files
      format: { data: 'json', contentField: 'content' }, // Keeps your schema clean and readable
      schema: {
        title: fields.slug({ name: { label: 'Title' } }),
        
        // Added author field to safely supply the dynamic loop requirement
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

        // Changed directory path to standard public/asset folder structure to align with test hooks
        coverImage: fields.image({
          label: 'Cover Image Artwork',
          directory: 'public/asset',
          publicPath: '/asset/',
        }),

        // Rich Text Area using Markdoc
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

  // 3. Global Site Terminals Configuration
  singletons: {
    settings: singleton({
      label: 'Site Settings',
      path: 'src/content/settings',
      schema: {
        siteTitle: fields.text({ label: 'Site Title', defaultValue: 'Emmy STACK01' }),
        description: fields.text({ label: 'Global SEO Description', multiline: true }),
        whatsappLink: fields.url({ label: 'WhatsApp CTA Redirect Link' }),
      },
    }),
  },
});