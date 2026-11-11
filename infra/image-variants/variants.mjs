/**
 * Responsive variants in the old Paperclip layout:
 *   <base>.medium.jpg  800px wide
 *   <base>.large.jpg   1280px wide
 *   <base>.xlarge.jpg  2560px wide
 * Shared by the S3-triggered Lambda (index.mjs) and the one-off backfill.
 */
import sharp from "sharp";

export const STYLES = { medium: 800, large: 1280, xlarge: 2560 };

const VARIANT_RE = /\.(thumbnail|small|medium|large|xlarge)\.jpe?g$/i;
const IMAGE_RE = /\.(jpe?g|png|webp|gif|tiff?|avif|heic)$/i;

/** True for source images we should resize (not videos, not our own output). */
export function isSourceImage(key) {
  return IMAGE_RE.test(key) && !VARIANT_RE.test(key);
}

/** "cms/2026-ab12.webp" -> "cms/2026-ab12"; "home_images/x.original.jpg" -> "home_images/x" */
export function variantBase(key) {
  return key.replace(/\.original(?=\.[^.]+$)/i, "").replace(/\.[^./]+$/, "");
}

export function variantKey(key, style) {
  return `${variantBase(key)}.${style}.jpg`;
}

/** Resize to each width (never enlarging), auto-rotate, sRGB, strip metadata. */
export async function makeVariants(buffer) {
  const out = {};
  for (const [style, width] of Object.entries(STYLES)) {
    out[style] = await sharp(buffer, { failOn: "none" })
      .rotate()
      .resize({ width, withoutEnlargement: true })
      .toColorspace("srgb")
      .jpeg({ quality: 82, progressive: true, mozjpeg: true })
      .toBuffer();
  }
  return out;
}

export const PUT_OPTIONS = {
  ContentType: "image/jpeg",
  ACL: "public-read",
  CacheControl: "public, max-age=31536000, immutable",
};
