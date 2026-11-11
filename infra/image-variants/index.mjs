/**
 * AWS Lambda: runs when the CMS uploads a file under cms/ in the media bucket
 * and writes medium / large / xlarge JPEG variants beside it (same naming as
 * the old Paperclip images), so the site can serve a srcset for every image.
 */
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import {
  isSourceImage,
  makeVariants,
  variantKey,
  putParams,
} from "./variants.mjs";

const s3 = new S3Client({});

export async function handler(event) {
  for (const record of event.Records ?? []) {
    const bucket = record.s3.bucket.name;
    const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, " "));
    // Our own output lands in the same prefix: skip it (no loops) and non-images.
    if (!isSourceImage(key)) continue;

    const object = await s3.send(
      new GetObjectCommand({ Bucket: bucket, Key: key })
    );
    const source = Buffer.from(await object.Body.transformToByteArray());
    const variants = await makeVariants(source);

    await Promise.all(
      Object.entries(variants).map(([style, variant]) =>
        s3.send(
          new PutObjectCommand({
            Bucket: bucket,
            Key: variantKey(key, style),
            ...putParams(variant),
          })
        )
      )
    );
    console.log(
      JSON.stringify({
        key,
        variants: Object.fromEntries(
          Object.entries(variants).map(([s, v]) => [
            s,
            `${v.width}x${v.height} ${v.body.length}B`,
          ])
        ),
      })
    );
  }
}
