export const locales = ["fr", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "fr";

/**
 * Show the FR/EN switch in the nav. Off for now: /en/ pages still build and
 * are indexed, and can be shared directly, but are not linked from the menu.
 */
export const showLocaleSwitch = false;

/**
 * Static interface strings. CMS content is French-first with optional English
 * fields (see `loc()` below); only the chrome lives here.
 */
export const ui = {
  fr: {
    siteTitle: "NH & AB graphistes",
    siteDescription:
      "Nicolas Hubert et Amélina Bouchez, graphistes à Paris : édition, signalétique, identité visuelle.",
    "nav.projets": "Projets",
    "nav.infos": "Infos",
    "nav.contact": "Contact",
    "nav.menuOpen": "Ouvrir le menu",
    "nav.menuClose": "Fermer le menu",
    "nav.switchLocale": "En",
    "nav.switchLocaleLabel": "English version",
    "category.edition": "Édition",
    "category.signaletique": "Signalétique",
    "category.identite": "Identité",
    "category.archives": "Archives",
    "project.client": "Client",
    "project.year": "Année",
    "project.related": "Projets liés :",
    "project.prev": "projet précédent",
    "project.next": "projet suivant",
    "project.home": "accueil",
    "project.new": "Nouveau",
    "home.slideshowPrev": "Image précédente",
    "home.slideshowNext": "Image suivante",
    "notFound.title": "Page introuvable",
    "notFound.body": "Cette page n’existe pas ou a été déplacée.",
    "notFound.link": "Retour à l’accueil",
  },
  en: {
    siteTitle: "NH & AB graphistes",
    siteDescription:
      "Nicolas Hubert and Amélina Bouchez, graphic designers in Paris: publishing, signage, visual identity.",
    "nav.projets": "Projects",
    "nav.infos": "About",
    "nav.contact": "Contact",
    "nav.menuOpen": "Open menu",
    "nav.menuClose": "Close menu",
    "nav.switchLocale": "Fr",
    "nav.switchLocaleLabel": "Version française",
    "category.edition": "Publishing",
    "category.signaletique": "Signage",
    "category.identite": "Identity",
    "category.archives": "Archives",
    "project.client": "Client",
    "project.year": "Year",
    "project.related": "Related projects:",
    "project.prev": "previous project",
    "project.next": "next project",
    "project.home": "home",
    "project.new": "New",
    "home.slideshowPrev": "Previous image",
    "home.slideshowNext": "Next image",
    "notFound.title": "Page not found",
    "notFound.body": "This page does not exist or has moved.",
    "notFound.link": "Back to home",
  },
} as const satisfies Record<Locale, Record<string, string>>;

export type UiKey = keyof (typeof ui)["fr"];

export function t(locale: Locale) {
  return (key: UiKey): string => ui[locale][key] ?? ui[defaultLocale][key];
}

/** Prefix a site-relative path for the given locale. FR lives at the root. */
export function localePath(locale: Locale, path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const withSlash = normalized.endsWith("/") ? normalized : `${normalized}/`;
  return locale === defaultLocale ? withSlash : `/en${withSlash}`;
}

/** Strip the locale prefix so the same path can be compared across locales. */
export function stripLocale(pathname: string): string {
  return pathname.replace(/^\/en(?=\/|$)/, "") || "/";
}

export function otherLocale(locale: Locale): Locale {
  return locale === "fr" ? "en" : "fr";
}

/**
 * Localised field lookup for CMS data: `title` in French, `title_en` optional.
 * Falls back to French when the English value is empty.
 */
export function loc<T extends Record<string, unknown>>(
  data: T,
  field: string,
  locale: Locale
): string {
  const fr = data[field];
  const en = data[`${field}_en`];
  const value =
    locale === "en" && typeof en === "string" && en.trim() ? en : fr;
  return typeof value === "string" ? value : "";
}
