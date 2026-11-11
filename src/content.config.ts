import { defineCollection, reference } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const CATEGORIES = ["edition", "signaletique", "identite", "archives"] as const;

const url = z.url();
const optionalText = z.string().optional();

/** Mirrors public/admin/config.yml – keep the two in sync. */
const mediaItem = z.object({
  src: url,
  poster: url.optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  caption: optionalText,
  caption_en: optionalText,
  layout: z.enum(["full", "half"]).default("full"),
});

const projets = defineCollection({
  loader: glob({ pattern: "*.md", base: "./src/content/projets" }),
  schema: z.object({
    title: z.string(),
    title_en: optionalText,
    client: reference("clients"),
    categories: z.array(z.enum(CATEGORIES)).min(1),
    year: z.number().int().optional(),
    nouveau: z.boolean().default(false),
    designers: z.array(z.enum(["nh", "ab"])).default(["nh", "ab"]),
    cover: url,
    media: z.array(mediaItem).default([]),
    related: z.array(reference("projets")).default([]),
    /** Lines shown under Client / Année, e.g. "Format : 21 x 30 cm, relié". */
    credits: optionalText,
    credits_en: optionalText,
    body_en: optionalText,
    order: z.number().int().default(0),
    draft: z.boolean().default(false),
  }),
});

const clients = defineCollection({
  loader: glob({ pattern: "*.yml", base: "./src/content/clients" }),
  schema: z.object({
    short: z.string(),
    short_en: optionalText,
    full: z.string(),
    full_en: optionalText,
    order: z.number().int().default(0),
  }),
});

const home = defineCollection({
  loader: glob({ pattern: "home.yml", base: "./src/content" }),
  schema: z.object({
    slides: z
      .array(
        z.object({
          image: url,
          width: z.number().int().positive().optional(),
          height: z.number().int().positive().optional(),
          projet: reference("projets"),
          navColor: z.enum(["black", "white"]).default("white"),
        })
      )
      .default([]),
  }),
});

const namedList = z.object({
  heading: z.string(),
  heading_en: optionalText,
  names: z.string(),
});

const infos = defineCollection({
  loader: glob({ pattern: "infos.yml", base: "./src/content" }),
  schema: z.object({
    studio: z.string(),
    studio_en: optionalText,
    collaborations: z.array(namedList).default([]),
    clients: z.array(namedList).default([]),
  }),
});

const contact = defineCollection({
  loader: glob({ pattern: "contact.yml", base: "./src/content" }),
  schema: z.object({
    name: z.string(),
    address: z.string(),
    phone: optionalText,
    email: optionalText,
    bookRequest: z
      .object({
        label: z.string(),
        label_en: optionalText,
        emails: z.array(z.string()).default([]),
      })
      .optional(),
    instagram: url.optional(),
    credit: optionalText,
    credit_en: optionalText,
  }),
});

export const collections = { projets, clients, home, infos, contact };
