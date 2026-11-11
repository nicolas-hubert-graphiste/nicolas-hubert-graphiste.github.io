import { getCollection, getEntry, type CollectionEntry } from "astro:content";
import type { Locale } from "@/i18n/ui";

import { CATEGORIES, type Category } from "@/lib/categories";
export { CATEGORIES, type Category };

export const DESIGNERS = {
  nh: "Nicolas Hubert",
  ab: "Amélina Bouchez",
} as const;

export type Projet = CollectionEntry<"projets">;
export type Client = CollectionEntry<"clients">;

export function isCategory(value: string): value is Category {
  return (CATEGORIES as readonly string[]).includes(value);
}

/** Year desc, then manual order, then title. Undefined years sort last. */
export function sortProjects(entries: Projet[]): Projet[] {
  return [...entries].sort((a, b) => {
    const ya = a.data.year ?? -Infinity;
    const yb = b.data.year ?? -Infinity;
    if (ya !== yb) return yb - ya;
    if (a.data.order !== b.data.order) return a.data.order - b.data.order;
    return a.data.title.localeCompare(b.data.title, "fr");
  });
}

export async function getProjects(category?: Category): Promise<Projet[]> {
  const all = await getCollection("projets", ({ data }) => {
    if (data.draft && import.meta.env.PROD) return false;
    return category ? data.categories.includes(category) : true;
  });
  return sortProjects(all);
}

export async function getClientFor(
  projet: Projet
): Promise<Client | undefined> {
  return getEntry(projet.data.client);
}

export function getPrevNext(sorted: Projet[], id: string) {
  const index = sorted.findIndex((p) => p.id === id);
  if (index === -1 || sorted.length < 2)
    return { prev: undefined, next: undefined };
  const prev = sorted[(index - 1 + sorted.length) % sorted.length];
  const next = sorted[(index + 1) % sorted.length];
  return { prev, next };
}

export function projectPath(locale: Locale, id: string) {
  return locale === "fr" ? `/projets/${id}/` : `/en/projets/${id}/`;
}

export function categoryPath(locale: Locale, category?: Category) {
  const base = category ? `/projets/${category}/` : "/projets/";
  return locale === "fr" ? base : `/en${base}`;
}

/** Group consecutive `half` items into pairs; everything else is a full row. */
export function groupMedia<T extends { layout: "full" | "half" }>(
  items: T[]
): T[][] {
  const rows: T[][] = [];
  for (const item of items) {
    const last = rows[rows.length - 1];
    if (
      item.layout === "half" &&
      last &&
      last.length === 1 &&
      last[0]?.layout === "half"
    ) {
      last.push(item);
    } else {
      rows.push([item]);
    }
  }
  return rows;
}

export function isVideo(src: string) {
  return /\.(mp4|webm|mov)(\?.*)?$/i.test(src);
}
