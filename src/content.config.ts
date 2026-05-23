import { defineCollection, z } from 'astro:content';

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

export const collections = { articles };