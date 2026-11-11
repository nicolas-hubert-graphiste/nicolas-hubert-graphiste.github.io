/**
 * One-off: create the medium / large / xlarge variants that are missing for
 * existing images (home slides had no Paperclip styles; four project images
 * never got an xlarge). Existing objects are never overwritten.
 *
 *   node infra/image-variants/backfill.mjs [--dry-run] <key> [<key> ...]
 *
 * Keys are source objects, e.g. home_images/bebel_home.original.jpg
 */
import {
  S3Client,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { makeVariants, variantKey, putParams } from "./variants.mjs";

const BUCKET = process.env.BUCKET ?? "nicolashubert-graphiste-production";
const s3 = new S3Client({ region: process.env.AWS_REGION ?? "us-east-1" });
const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const keys = args.filter((a) => !a.startsWith("--"));

async function exists(key) {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
    return true;
  } catch (error) {
    if (error.$metadata?.httpStatusCode === 404) return false;
    throw error;
  }
}

for (const key of keys) {
  const missing = [];
  for (const style of ["medium", "large", "xlarge"]) {
    if (!(await exists(variantKey(key, style)))) missing.push(style);
  }
  if (missing.length === 0) {
    console.log(`ok       ${key}`);
    continue;
  }
  if (dryRun) {
    console.log(`missing  ${key}: ${missing.join(", ")}`);
    continue;
  }
  const object = await s3.send(
    new GetObjectCommand({ Bucket: BUCKET, Key: key })
  );
  const variants = await makeVariants(
    Buffer.from(await object.Body.transformToByteArray())
  );
  for (const style of missing) {
    await s3.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: variantKey(key, style),
        ...putParams(variants[style]),
      })
    );
  }
  console.log(
    `created  ${key}: ${missing.map((s) => `${s} ${variants[s].width}x${variants[s].height} ${Math.round(variants[s].body.length / 1024)}KB`).join(", ")}`
  );
}
