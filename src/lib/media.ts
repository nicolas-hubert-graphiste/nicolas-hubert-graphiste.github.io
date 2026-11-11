/**
 * Responsive images from the S3 bucket.
 *
 * Every image has JPEG variants beside it, in the old Paperclip naming:
 *   <base>.medium.jpg (800px), <base>.large.jpg (1280px), <base>.xlarge.jpg (2560px)
 * Migrated Paperclip images already have them; CMS uploads (cms/<name>.original.<ext>)
 * get them from the image-variants Lambda (infra/image-variants), which also
 * stores each variant's pixel size as S3 metadata (x-amz-meta-width/height).
 *
 * At build time we HEAD each variant once: it tells us whether it exists and,
 * for Lambda-made variants, its exact size. Pages then:
 *   - never serve the uploaded original (src is a variant),
 *   - list only existing variants in srcset, with their real widths,
 *   - always get width/height (frontmatter, else variant metadata, else the
 *     first bytes of the image), so the layout doesn't jump while loading.
 * Results are cached in .cache/image-variants.json between builds and CI runs.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { inferRemoteSize } from "astro:assets";

const S3_HOST = "nicolashubert-graphiste-production.s3.amazonaws.com";
const VARIANTS = [
  ["medium", 800],
  ["large", 1280],
  ["xlarge", 2560],
] as const;
type Style = (typeof VARIANTS)[number][0];
const STYLE_RE =
  /\.(original|thumbnail|small|medium|large|xlarge)\.[a-z0-9]+$/i;
const VIDEO_RE = /\.(mp4|webm|mov)$/i;

type Probe = { width?: number; height?: number };
type Size = { width: number; height: number };

// ---------- cache: url -> probe result (only for objects that exist) ----------
const CACHE_DIR = ".cache";
const CACHE_FILE = `${CACHE_DIR}/image-variants.json`;
const known = new Map<string, Probe>();
if (existsSync(CACHE_FILE)) {
  const raw = JSON.parse(readFileSync(CACHE_FILE, "utf8")) as unknown;
  // Older cache format was a plain list of URLs that exist.
  if (Array.isArray(raw)) for (const url of raw as string[]) known.set(url, {});
  else
    for (const [url, probe] of Object.entries(raw as Record<string, Probe>))
      known.set(url, probe);
}
const sizes = new Map<string, Size | undefined>();
let dirty = false;
let timer: ReturnType<typeof setTimeout> | undefined;

function flush() {
  if (!dirty) return;
  mkdirSync(CACHE_DIR, { recursive: true });
  const entries = [...known.entries()].sort(([a], [b]) => a.localeCompare(b));
  writeFileSync(CACHE_FILE, JSON.stringify(Object.fromEntries(entries)));
  dirty = false;
}
function flushSoon() {
  if (!dirty || timer) return;
  timer = setTimeout(() => {
    timer = undefined;
    flush();
  }, 500);
  timer.unref?.();
}
process.once("beforeExit", flush);

// ---------- polite, de-duplicated HEAD requests ----------
let active = 0;
const queue: Array<() => void> = [];
async function limited<T>(task: () => Promise<T>): Promise<T> {
  if (active >= 24) await new Promise<void>((resolve) => queue.push(resolve));
  active++;
  try {
    return await task();
  } finally {
    active--;
    queue.shift()?.();
  }
}

const pending = new Map<string, Promise<Probe | undefined>>();
function probe(url: string): Promise<Probe | undefined> {
  const hit = known.get(url);
  if (hit) return Promise.resolve(hit);
  let check = pending.get(url);
  if (!check) {
    check = limited(async () => {
      try {
        const response = await fetch(url, { method: "HEAD" });
        if (!response.ok) return undefined;
        const width =
          Number(response.headers.get("x-amz-meta-width")) || undefined;
        const height =
          Number(response.headers.get("x-amz-meta-height")) || undefined;
        const result: Probe = width && height ? { width, height } : {};
        known.set(url, result);
        dirty = true;
        flushSoon();
        return result;
      } catch {
        return undefined; // offline or S3 hiccup: treat as missing this build
      }
    });
    pending.set(url, check);
  }
  return check;
}

/** Last resort: read just enough of the image to learn its size (cached). */
async function measure(url: string): Promise<Size | undefined> {
  const cached = known.get(url);
  if (cached?.width && cached.height)
    return { width: cached.width, height: cached.height };
  if (sizes.has(url)) return sizes.get(url);
  let size: Size | undefined;
  try {
    const { width, height } = await limited(() => inferRemoteSize(url));
    if (width && height) {
      size = { width, height };
      known.set(url, size);
      dirty = true;
      flushSoon();
    }
  } catch {
    size = undefined;
  }
  sizes.set(url, size);
  return size;
}

/** Bucket URL without its style/extension, or undefined if not a resizable bucket image. */
export function variantBase(src: string): string | undefined {
  let url: URL;
  try {
    url = new URL(src);
  } catch {
    return undefined;
  }
  if (url.hostname !== S3_HOST || VIDEO_RE.test(url.pathname)) return undefined;
  if (STYLE_RE.test(url.pathname))
    return url.origin + url.pathname.replace(STYLE_RE, "");
  if (url.pathname.startsWith("/cms/"))
    return url.origin + url.pathname.replace(/\.[^./]+$/, "");
  return undefined;
}

export type ResponsiveImage = {
  src: string;
  srcset?: string;
  width?: number;
  height?: number;
};

/**
 * Everything an <img> needs for a bucket image.
 * `prefer` is the variant used as `src` (the fallback for browsers that ignore
 * srcset): "large" for grid cards, "xlarge" for full-width images.
 * `width`/`height` are the known source dimensions (frontmatter), if any.
 * `measureIfUnknown: false` skips the last-resort measurement (e.g. grid cards,
 * whose 4:3 crop already reserves their space).
 */
export async function responsiveImage(
  src: string,
  {
    width,
    height,
    prefer = "xlarge",
    measureIfUnknown = true,
  }: {
    width?: number;
    height?: number;
    prefer?: Style;
    measureIfUnknown?: boolean;
  } = {}
): Promise<ResponsiveImage> {
  const base = variantBase(src);
  const found: Array<{
    style: Style;
    url: string;
    width: number;
    height?: number;
  }> = [];
  if (base) {
    const probes = await Promise.all(
      VARIANTS.map(async ([style, nominal]) => {
        const url = `${base}.${style}.jpg`;
        const result = await probe(url);
        if (!result) return undefined;
        // Exact width from metadata; else the nominal width, never wider than the source.
        const w = result.width ?? Math.min(nominal, width ?? nominal);
        return { style, url, width: w, height: result.height };
      })
    );
    for (const p of probes) if (p) found.push(p);
  }

  // Dimensions: frontmatter first, then the largest variant's metadata (same
  // aspect ratio as the source), then measure the file itself.
  let dims: Size | undefined = width && height ? { width, height } : undefined;
  if (!dims) {
    const withMeta = [...found].reverse().find((v) => v.height);
    if (withMeta?.height)
      dims = { width: withMeta.width, height: withMeta.height };
  }
  if (!dims && measureIfUnknown) dims = await measure(found.at(-1)?.url ?? src);

  if (found.length === 0) return { src, ...dims };

  const chosen = found.find((v) => v.style === prefer) ?? found.at(-1)!;
  const srcset = [
    ...new Map(found.map((v) => [v.width, `${v.url} ${v.width}w`])).values(),
  ].join(", ");
  return { src: chosen.url, srcset, ...dims };
}

/** `sizes` for the layouts on this site (page padding 10px / 30px, desktop from 1200px). */
export const SIZES = {
  grid: "(min-width: 1200px) calc((100vw - 110px) / 3), (min-width: 768px) calc((100vw - 45px) / 2), calc(100vw - 20px)",
  mediaFull: "(min-width: 1200px) calc(75vw - 40px), calc(100vw - 20px)",
  mediaHalf: "(min-width: 1200px) calc(37.5vw - 22px), calc(50vw - 12px)",
  homeStack: "calc(100vw - 20px)",
  homeStage: "100vw",
} as const;
