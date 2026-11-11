import { getCollection } from "astro:content";
import { CATEGORIES, type Category } from "@/lib/categories";
import type { Projet } from "@/lib/projects";

/**
 * `/projets/<slug>/` serves both category listings and project pages, so one
 * route handles both. Category slugs are reserved and cannot be project ids.
 */
export type ProjetsRouteProps =
  { kind: "category"; category: Category } | { kind: "projet"; projet: Projet };

export async function projetsStaticPaths() {
  const projets = await getCollection("projets", ({ data }) =>
    import.meta.env.PROD ? !data.draft : true
  );
  const categoryPaths = CATEGORIES.map((category) => ({
    params: { slug: category },
    props: { kind: "category", category } satisfies ProjetsRouteProps,
  }));
  const projetPaths = projets
    .filter((projet) => !(CATEGORIES as readonly string[]).includes(projet.id))
    .map((projet) => ({
      params: { slug: projet.id },
      props: { kind: "projet", projet } satisfies ProjetsRouteProps,
    }));
  return [...categoryPaths, ...projetPaths];
}
