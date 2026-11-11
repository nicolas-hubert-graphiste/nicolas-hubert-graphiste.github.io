/**
 * Category slugs shared by the nav island (client), routes and schema.
 * Kept free of `astro:content` imports so it can be bundled for the browser.
 */
export const CATEGORIES = [
  "edition",
  "signaletique",
  "identite",
  "archives",
] as const;
export type Category = (typeof CATEGORIES)[number];
