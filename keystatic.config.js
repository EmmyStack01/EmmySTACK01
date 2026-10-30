import { config, fields, collection, singleton, component } from '@keystatic/core';

const isProd = process.env.NODE_ENV === 'production';

// Same trick as the articles collection: an unused last field keeps the dashboard scroll bug
// from hiding the real fields above it. Do not put anything in it.
const footerSpacer = fields.text({
  label: 'Built by Emmy STACK01',
  description: 'This field is intentionally unused — keeps the dashboard scroll bug from hiding real fields. So do not input anything here.',
  validation: { isRequired: false },
  defaultValue: '',
});

export default config({
  storage: isProd ? {
    kind: 'github',
    repo: 'EmmyStack01/EmmySTACK01',
    clientId: process.env.KEYSTATIC_GITHUB_CLIENT_ID,
    clientSecret: process.env.KEYSTATIC_GITHUB_CLIENT_SECRET,
  } : {
    kind: 'local',
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

        // Optional recording of the article. When a file is uploaded the article shows an audio player;
        // when empty, readers can still use the free "read aloud" voice on their own device.
        audio: fields.file({
          label: 'Audio version (MP3, optional)',
          description: 'Upload a recording of this article as an MP3. Leave empty to let readers use the free read-aloud voice on their device.',
          directory: 'public/asset/audio',
          publicPath: '/asset/audio/',
        }),

        content: fields.document({
          label: 'Content',
          formatting: true,
          dividers: true,
          links: true,
          tables: true,
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
        footerSpacer: fields.text({
          label: 'Built by Emmy STACK01',
          description: 'This field is intentionally unused — keeps the dashboard scroll bug from hiding real fields. So do not input anything here.',
          validation: { isRequired: false },
          defaultValue: '',
        }),
      },
    }),

    // Recent Projects on /websites. One entry per project.
    // The section only appears on the site while at least one entry has "Show on /websites" ticked.
    projects: collection({
      label: 'Website Projects (/websites)',
      slugField: 'name',
      path: 'src/content/projects/*',
      format: 'json',
      schema: {
        name: fields.slug({ name: { label: 'Project name' } }),

        websiteType: fields.text({
          label: 'Website type',
          description: 'e.g. School Website, Personal Brand & Creator Website',
          validation: { isRequired: true },
        }),

        image: fields.image({
          label: 'Project image or screenshot',
          description: 'A landscape screenshot of the homepage works best (roughly 16:10).',
          directory: 'public/asset/projects',
          publicPath: '/asset/projects/',
        }),

        imageAlt: fields.text({
          label: 'Image description (alt text)',
          description: 'Say what the screenshot shows, for screen readers. e.g. Homepage of the Owaaghedo website.',
        }),

        overview: fields.text({
          label: 'Project overview',
          description: 'A short summary of the project.',
          multiline: true,
          validation: { isRequired: true },
        }),

        need: fields.text({
          label: 'The need',
          description: 'What the client or audience needed.',
          multiline: true,
          validation: { isRequired: true },
        }),

        built: fields.text({
          label: 'What we built',
          description: 'The actual work completed.',
          multiline: true,
          validation: { isRequired: true },
        }),

        strategy: fields.text({
          label: 'The strategy (optional)',
          description: 'Shown after "What we built" when filled in. Leave blank to hide it.',
          multiline: true,
        }),

        liveUrl: fields.url({
          label: 'Live website URL',
          description: 'Adds the "View Live Website" button. Leave blank to hide the button.',
        }),

        order: fields.integer({
          label: 'Display order',
          description: 'Lower numbers appear first.',
          defaultValue: 1,
        }),

        published: fields.checkbox({
          label: 'Show on /websites',
          description: 'Untick to hide this project without deleting it.',
          defaultValue: true,
        }),

        footerSpacer,
      },
    }),
  },

  singletons: {
    // Heading and intro text for the Recent Projects section on /websites.
    recentProjectsSection: singleton({
      label: 'Websites page: Recent Projects heading',
      path: 'src/content/recent-projects-section',
      schema: {
        heading: fields.text({
          label: 'Section heading',
          defaultValue: "See what we've built",
        }),
        description: fields.text({
          label: 'Intro text',
          multiline: true,
          defaultValue: 'Explore real projects and see how each website is designed around its purpose, audience and goals.',
        }),
        footerSpacer,
      },
    }),

    // Social and contact links used by the footer and the mobile menu on every page.
    // WhatsApp, X and email fall back to the current links if left blank. YouTube, LinkedIn and Instagram
    // stay hidden until a link is added.
    settings: singleton({
      label: 'Social and Contact links',
      path: 'src/content/settings',
      schema: {
        whatsApp: fields.url({
          label: 'WhatsApp link',
          description: 'Chat link, e.g. https://wa.me/2349076991076. Leave blank to keep the default.',
          defaultValue: 'https://wa.me/2349076991076',
        }),
        x: fields.url({
          label: 'X (Twitter) link',
          description: 'Leave blank to keep the default.',
          defaultValue: 'https://x.com/Emmy_STACK01',
        }),
        email: fields.text({
          label: 'Contact email',
          description: 'Just the address, e.g. hello@emmystack01.com. Leave blank to keep the default.',
          defaultValue: 'hello@emmystack01.com',
          // Blank is allowed (falls back to the default); anything typed must look like an email address.
          validation: { pattern: { regex: /^$|^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email address' } },
        }),
        youtube: fields.url({
          label: 'YouTube link',
          description: 'Optional. The icon appears in the footer and mobile menu once a link is added.',
        }),
        linkedin: fields.url({
          label: 'LinkedIn link',
          description: 'Optional. The icon appears in the footer and mobile menu once a link is added.',
        }),
        instagram: fields.url({
          label: 'Instagram link',
          description: 'Optional. The icon appears in the footer and mobile menu once a link is added.',
        }),
        // Kept from the original setup so an already-saved settings file stays valid. Optional and not shown on the site.
        whatsAppChannelLink: fields.url({
          label: 'WhatsApp Channel URL (optional)',
          description: 'Kept from the original setup. Not shown on the site yet.',
        }),
        footerSpacer,
      },
    }),
  },
});
