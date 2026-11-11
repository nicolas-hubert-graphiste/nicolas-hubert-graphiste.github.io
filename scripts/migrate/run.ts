/**
 * Rails (Postgres) -> Astro content migration. See README.md in this folder.
 *
 * Run with: DATABASE_URL=... S3_BASE=... bun run migrate [--dry-run] [--only=projets,clients,home]
 *
 * Deliberately dependency-light: uses Bun's built-in `sql` client and `yaml`.
 */
import { sql } from "bun";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import YAML from "yaml";

const ROOT = path.resolve(import.meta.dir, "../..");
const OUT = {
  projets: path.join(ROOT, "src/content/projets"),
  clients: path.join(ROOT, "src/content/clients"),
  home: path.join(ROOT, "src/content/home.yml"),
  redirects: path.join(ROOT, "scripts/migrate/redirects.json"),
};
const S3_BASE = (
  process.env.S3_BASE ??
  "https://nicolashubert-graphiste-production.s3.amazonaws.com"
).replace(/\/$/, "");
const LISTING = path.join(ROOT, "scripts/migrate/input/s3-listing.txt");

const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run");
const only = new Set(
  [...args]
    .find((a) => a.startsWith("--only="))
    ?.slice(7)
    .split(",") ?? ["projets", "clients", "home"]
);

/** Old category slug -> new category slug. */
const CATEGORY_MAP: Record<
  string,
  "edition" | "signaletique" | "identite" | "archives"
> = {
  edition: "edition",
  signaletique: "signaletique",
  "identite-communication": "identite",
  archives: "archives",
};
const DESIGNER_MAP: Record<string, "nh" | "ab"> = {
  "Nicolas Hubert": "nh",
  "Amélina Bouchez": "ab",
};

// ---------- DB rows ----------
type ClientRow = {
  id: number;
  slug: string;
  short_fr: string;
  short_en: string | null;
  full_fr: string;
  full_en: string | null;
  position: number | null;
};
type ProjetRow = {
  id: number;
  slug: string;
  title_fr: string;
  title_en: string | null;
  created_year: Date | null;
  dateinfo_fr: string | null;
  dateinfo_en: string | null;
  description_fr: string | null;
  description_en: string | null;
  client_id: number | null;
  nouveau: boolean | null;
};
type AssetRow = {
  id: number;
  projet_id: number;
  position: number | null;
  asset_file_name: string;
  asset_content_type: string;
  asset_dimensions: string | null;
  description_fr: string | null;
  description_en: string | null;
  poster_file_name: string | null;
};
type HomeRow = {
  id: number;
  position: number | null;
  projet_id: number;
  image_file_name: string;
  white_arrow: boolean | null;
};

// ---------- helpers ----------
const report = {
  projets: 0,
  clients: 0,
  slides: 0,
  assets: 0,
  videos: 0,
  warnings: [] as string[],
};
const warn = (message: string) => report.warnings.push(message);

const listing = existsSync(LISTING)
  ? new Set(
      (await readFile(LISTING, "utf8"))
        .split("\n")
        .map((line) => line.trim().split(/\s+/).pop() ?? "")
        .filter(Boolean)
    )
  : null;

function basename(fileName: string) {
  return fileName.replace(/\.[^.]+$/, "");
}
function ext(fileName: string) {
  return fileName.split(".").pop()?.toLowerCase() ?? "";
}
/** Paperclip path convention used by the Rails models. */
function s3Url(
  folder: "projet_assets" | "home_images",
  fileName: string,
  style: "original" | "xlarge"
) {
  const extension = style === "xlarge" ? "jpg" : ext(fileName);
  const key = `${folder}/${basename(fileName)}.${style}.${extension}`;
  if (listing && !listing.has(key)) warn(`missing in S3 listing: ${key}`);
  return `${S3_BASE}/${key}`;
}
/** Rails serialised `[w, h]` arrays come back as YAML ("---\n- 2560\n- 1707\n"). */
function dimensions(raw: string | null): { width?: number; height?: number } {
  if (!raw) return {};
  const parsed = YAML.parse(raw);
  if (Array.isArray(parsed) && parsed.length === 2)
    return { width: Number(parsed[0]), height: Number(parsed[1]) };
  return {};
}
/** Plain text from simple_format: keep paragraphs, keep single line breaks (marked renders them with `breaks`). */
function toMarkdown(...parts: Array<string | null | undefined>) {
  return parts
    .map((part) => (part ?? "").replace(/\r\n/g, "\n").trim())
    .filter(Boolean)
    .join("\n\n")
    .replace(/^Client\s*:.*\n?/im, "") // rendered from the client field now
    .trim();
}
function frontmatter(data: Record<string, unknown>, body: string) {
  const clean = Object.fromEntries(
    Object.entries(data).filter(
      ([, value]) => value !== undefined && value !== null && value !== ""
    )
  );
  return `---\n${YAML.stringify(clean, { lineWidth: 0 })}---\n\n${body}\n`;
}
async function emit(file: string, content: string) {
  if (dryRun) return;
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, content, "utf8");
}
async function reset(dir: string) {
  if (dryRun) return;
  await rm(dir, { recursive: true, force: true });
  await mkdir(dir, { recursive: true });
}

// ---------- load ----------
const clients =
  (await sql`select * from clients order by position nulls last, id`) as ClientRow[];
const projets =
  (await sql`select * from projets order by created_year desc nulls last, id`) as ProjetRow[];
const assets =
  (await sql`select * from projet_assets order by projet_id, position nulls last, id`) as AssetRow[];
const homes =
  (await sql`select * from homes order by position nulls last, id`) as HomeRow[];
const categorizations = (await sql`
  select c.projet_id, cat.slug from categorizations c join categories cat on cat.id = c.category_id`) as {
  projet_id: number;
  slug: string;
}[];
const contributors = (await sql`
  select co.projet_id, d.name from contributors co join designers d on d.id = co.designer_id`) as {
  projet_id: number;
  name: string;
}[];
const relationships =
  (await sql`select projet_id, related_id from relationships`) as {
    projet_id: number;
    related_id: number;
  }[];

const clientById = new Map(clients.map((c) => [c.id, c]));
const projetById = new Map(projets.map((p) => [p.id, p]));
const groupBy = <T, K>(rows: T[], key: (row: T) => K) => {
  const map = new Map<K, T[]>();
  for (const row of rows)
    map.set(key(row), [...(map.get(key(row)) ?? []), row]);
  return map;
};
const assetsByProjet = groupBy(assets, (a) => a.projet_id);
const categoriesByProjet = groupBy(categorizations, (c) => c.projet_id);
const designersByProjet = groupBy(contributors, (c) => c.projet_id);
const relatedByProjet = groupBy(relationships, (r) => r.projet_id);

// ---------- clients ----------
if (only.has("clients")) {
  await reset(OUT.clients);
  for (const client of clients) {
    await emit(
      path.join(OUT.clients, `${client.slug}.yml`),
      YAML.stringify({
        short: client.short_fr,
        short_en: client.short_en || undefined,
        full: client.full_fr || client.short_fr,
        full_en: client.full_en || undefined,
        order: client.position ?? 0,
      })
    );
    report.clients++;
  }
}

// ---------- projets ----------
const redirects: Record<string, string> = {
  "/fr": "/",
  "/en": "/en/",
  "/fr/projets": "/projets/",
  "/en/projets": "/en/projets/",
  "/fr/a_propos": "/infos/",
  "/en/a_propos": "/en/infos/",
};
for (const [oldCat, newCat] of Object.entries(CATEGORY_MAP)) {
  redirects[`/fr/projets/${oldCat}`] = `/projets/${newCat}/`;
  redirects[`/en/projets/${oldCat}`] = `/en/projets/${newCat}/`;
}

if (only.has("projets")) {
  await reset(OUT.projets);
  for (const projet of projets) {
    const client = projet.client_id
      ? clientById.get(projet.client_id)
      : undefined;
    if (!client) {
      warn(`projet ${projet.slug} has no client – skipped`);
      continue;
    }
    const oldCategories = (categoriesByProjet.get(projet.id) ?? []).map(
      (c) => c.slug
    );
    const categories = [
      ...new Set(
        oldCategories.map((slug) => CATEGORY_MAP[slug]).filter(Boolean)
      ),
    ];
    if (categories.length === 0) {
      warn(
        `projet ${projet.slug} has no mapped category (${oldCategories.join(", ")}) – put in archives`
      );
      categories.push("archives");
    }
    const designers = [
      ...new Set(
        (designersByProjet.get(projet.id) ?? [])
          .map((d) => DESIGNER_MAP[d.name])
          .filter(Boolean)
      ),
    ];

    const media = (assetsByProjet.get(projet.id) ?? []).map((asset) => {
      const video = asset.asset_content_type === "video/mp4";
      const dims = dimensions(asset.asset_dimensions);
      const ratio = dims.width && dims.height ? dims.width / dims.height : 1.5;
      report.assets++;
      if (video) report.videos++;
      return {
        src: s3Url(
          "projet_assets",
          asset.asset_file_name,
          video ? "original" : "xlarge"
        ),
        poster:
          video && asset.poster_file_name
            ? s3Url("projet_assets", asset.poster_file_name, "original")
            : undefined,
        ...dims,
        caption: asset.description_fr?.trim() || undefined,
        caption_en: asset.description_en?.trim() || undefined,
        layout: ratio < 1.2 ? "half" : "full",
      };
    });
    const cover = media.find((m) => !/\.mp4$/i.test(m.src))?.src;
    if (!cover) warn(`projet ${projet.slug} has no image asset for a cover`);

    const related = (relatedByProjet.get(projet.id) ?? [])
      .map((r) => projetById.get(r.related_id)?.slug)
      .filter((slug): slug is string => Boolean(slug));

    await emit(
      path.join(OUT.projets, `${projet.slug}.md`),
      frontmatter(
        {
          title: projet.title_fr,
          title_en: projet.title_en || undefined,
          client: client.slug,
          categories,
          year: projet.created_year
            ? new Date(projet.created_year).getFullYear()
            : undefined,
          nouveau: Boolean(projet.nouveau),
          designers: designers.length ? designers : undefined,
          cover: cover ?? `${S3_BASE}/MISSING-COVER`,
          media,
          related: related.length ? related : undefined,
          body_en: projet.description_en?.trim()
            ? toMarkdown(projet.dateinfo_en, projet.description_en)
            : undefined,
        },
        toMarkdown(projet.dateinfo_fr, projet.description_fr)
      )
    );
    report.projets++;

    for (const oldCat of oldCategories) {
      redirects[`/fr/projets/${oldCat}/${projet.slug}`] =
        `/projets/${projet.slug}/`;
      redirects[`/en/projets/${oldCat}/${projet.slug}`] =
        `/en/projets/${projet.slug}/`;
    }
  }
  await emit(OUT.redirects, JSON.stringify(redirects, null, 2) + "\n");
}

// ---------- home ----------
if (only.has("home")) {
  const slides = homes
    .map((home) => {
      const projet = projetById.get(home.projet_id);
      if (!projet) {
        warn(`home slide ${home.id} points at a missing projet`);
        return null;
      }
      report.slides++;
      return {
        image: s3Url("home_images", home.image_file_name, "original"),
        projet: projet.slug,
        navColor: home.white_arrow ? "white" : "black",
      };
    })
    .filter(Boolean);
  await emit(OUT.home, YAML.stringify({ slides }));
}

// ---------- report ----------
console.log(
  `${dryRun ? "[dry run] " : ""}projets: ${report.projets}, clients: ${report.clients}, slides: ${report.slides}, assets: ${report.assets} (videos: ${report.videos})`
);
if (report.warnings.length) {
  console.log(`\n${report.warnings.length} warning(s):`);
  for (const message of report.warnings) console.log(` - ${message}`);
}
await sql.close();
