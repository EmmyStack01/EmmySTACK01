import { config, fields, collection, singleton, component } from '@keystatic/core';

export default config({
  // 1. Storage Strategy: Safely switches using Vite's production environment flag
  storage: {
    kind: 'github',
    repo: 'EmmyStack01/EmmySTACK01',
    clientId: 'Ov23liiWkFQmHreEOPia',
    clientSecret: '353f3b642bbf67c8246ba7bbd6a5080b11d654b0',
    secret: 'f7K9pL2qR8vT5wX1zB4mN6yA0cE34q4q',
  },

  collections: {
    articles: collection({
      label: 'Articles (Log)',
      slugField: 'title',
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

        content: fields.document({
          label: 'Content',
          formatting: true,
          dividers: true,
          links: true,
          images: {
            directory: 'public/asset/blog-inline',
            publicPath: '/asset/blog-inline/',
          },
          componentBlocks: {
            cta: component({
              label: 'Contextual Action Card',
              schema: {
                title: fields.text({ label: 'Card Title', defaultValue: 'IS YOUR HOMEPAGE CURRENTLY SITTING EMPTY?' }),
                text: fields.text({ label: 'Description', multiline: true }),
                btnText: fields.text({ label: 'Button Text', defaultValue: 'DEPLOY YOUR DIGITAL DNA ➔' }),
                btnLink: fields.text({ label: 'Redirect Link', defaultValue: '/products/digital-business-card' })
              },
              preview: (props) => props.fields.title.value || 'Contextual Action Card'
            })
          }
        }),
      },
    }),
  },

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