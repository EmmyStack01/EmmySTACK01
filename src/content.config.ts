import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const articles = defineCollection({
  type: 'content',
  schema: ({ image }) => z.object({
    title: z.string(),
    description: z.string(), 
    date: z.string(),        
    category: z.string(),    
    readingTime: z.string(), 
    coverImage: image(), // Astro handles the type tracking naturally here
  }),
});

// Website projects are edited in Keystatic (collection "Website Projects") and read through src/lib/cms.ts.
// Defining the folder here stops Astro auto-generating it as a collection (deprecated) and removes the
// "No files found matching .md/.mdoc" warning. The schema is deliberately loose so Keystatic stays the
// single source of truth for the fields.
const projects = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/projects' }),
  schema: z.record(z.string(), z.any()),
});

export const collections = { articles, projects };
