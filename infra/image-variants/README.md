# Image variants (AWS Lambda)

Every image in the media bucket gets three JPEG variants beside it, in the
naming the old Rails/Paperclip site used:

| Variant             | Width  | Used for                                   |
| ------------------- | ------ | ------------------------------------------ |
| `<name>.medium.jpg` | 800px  | phones, half-width images                  |
| `<name>.large.jpg`  | 1280px | grid cards, tablets, half-width on desktop |
| `<name>.xlarge.jpg` | 2560px | full-width images on desktop / retina      |

Images are never enlarged; a smaller source keeps its own width.

- `variants.mjs` – the resizing (sharp), shared by both scripts below.
- `index.mjs` – Lambda handler. Triggered by uploads under `cms/` (where the
  CMS stores media), it writes the three variants beside the upload. Files that
  are already variants, and videos, are skipped, so it never loops.
- `deploy.sh` – creates/updates the role (read/write on `cms/*` only), the
  function `nh-image-variants` (Node 22, us-east-1) and the S3 trigger. Safe to
  re-run after editing the code.
- `backfill.mjs` – one-off: creates missing variants for existing objects,
  never overwriting, e.g. the home slides:
  ```bash
  cd infra/image-variants && npm install
  node backfill.mjs --dry-run home_images/bebel_home.original.jpg
  ```

The site lists only variants that exist (`src/lib/media.ts` checks at build
time), so a missing variant falls back to the original image.

Cost: a few cents per month at most (one short invocation per upload).
