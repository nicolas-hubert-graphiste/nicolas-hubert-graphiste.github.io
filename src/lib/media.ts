/**
 * Responsive images from the S3 bucket. Every image can have three JPEG
 * variants beside it, in the old Paperclip naming:
 *   <base>.medium.jpg (800px), <base>.large.jpg (1280px), <base>.xlarge.jpg (2560px)
 * Old Paperclip images already have them; CMS uploads (cms/) get them from the
 * image-variants Lambda (infra/image-variants).
 *
 * At build time we check which variants really exist and only list those in
 * srcset, so a missing variant falls back to `src` instead of a broken image.
 * Positive checks are cached in .cache/image-variants.json between builds.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

const S3_HOST = "nicolashubert-graphiste-production.s3.amazonaws.com";
const VARIANTS = [
  ["medium", 800],
  ["large", 1280],
  ["xlarge", 2560],
] as const;
const STYLE_RE =
  /\.(original|thumbnail|small|medium|large|xlarge)\.[a-z0-9]+$/i;
const VIDEO_RE = /\.(mp4|webm|mov)$/i;

const CACHE_DIR = ".cache";
const CACHE_FILE = `${CACHE_DIR}/image-variants.json`;
const known: Set<string> = new Set(
  existsSync(CACHE_FILE)
    ? (JSON.parse(readFileSync(CACHE_FILE, "utf8")) as string[])
    : []
);
const pending = new Map<string, Promise<boolean>>();
let dirty = false;

function flush() {
  if (!dirty) return;
  mkdirSync(CACHE_DIR, { recursive: true });
  writeFileSync(CACHE_FILE, JSON.stringify([...known].sort()));
  dirty = false;
}
process.once("beforeExit", flush);

// Keep the number of simultaneous HEAD requests polite.
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

function exists(url: string): Promise<boolean> {
  if (known.has(url)) return Promise.resolve(true);
  let check = pending.get(url);
  if (!check) {
    check = limited(async () => {
      try {
        const response = await fetch(url, { method: "HEAD" });
        if (response.ok) {
          known.add(url);
          dirty = true;
        }
        return response.ok;
      } catch {
        return false; // offline or S3 hiccup: just skip the variant
      }
    });
    pending.set(url, check);
  }
  return check;
}

/** Bucket URL without its style/extension, or undefined if this isn't a resizable bucket image. */
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

/**
 * srcset for an image, listing only variants that exist. `width` is the
 * image's own width when known, so we never claim a variant is wider than
 * the source it was made from.
 */
export async function srcsetFor(
  src: string,
  width?: number
): Promise<string | undefined> {
  const base = variantBase(src);
  if (!base) return undefined;
  const entries = await Promise.all(
    VARIANTS.map(async ([style, w]) => {
      const url = `${base}.${style}.jpg`;
      return (await exists(url))
        ? `${url} ${Math.min(w, width ?? w)}w`
        : undefined;
    })
  );
  const list = [...new Set(entries.filter(Boolean))];
  if (list.length) flushSoon();
  return list.length ? list.join(", ") : undefined;
}

let timer: ReturnType<typeof setTimeout> | undefined;
function flushSoon() {
  if (!dirty || timer) return;
  timer = setTimeout(() => {
    timer = undefined;
    flush();
  }, 500);
  timer.unref?.();
}

/** `sizes` for the layouts on this site (page padding 10px / 30px, desktop from 1200px). */
export const SIZES = {
  grid: "(min-width: 1200px) calc((100vw - 110px) / 3), (min-width: 768px) calc((100vw - 45px) / 2), calc(100vw - 20px)",
  mediaFull: "(min-width: 1200px) calc(75vw - 40px), calc(100vw - 20px)",
  mediaHalf: "(min-width: 1200px) calc(37.5vw - 22px), calc(50vw - 12px)",
  homeStack: "calc(100vw - 20px)",
  homeStage: "100vw",
} as const;
