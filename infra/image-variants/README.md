# Image variants (AWS Lambda)

Every image in the media bucket gets three JPEG variants beside it, in the
naming the old Rails/Paperclip site used:

| Variant             | Width  | Used for                                   |
| ------------------- | ------ | ------------------------------------------ |
| `<name>.medium.jpg` | 800px  | phones, half-width images                  |
| `<name>.large.jpg`  | 1280px | grid cards, tablets, half-width on desktop |
| `<name>.xlarge.jpg` | 2560px | full-width images on desktop / retina      |

Images are never enlarged; a smaller source keeps its own width.

CMS uploads are stored as uploaded, named like the old Paperclip originals
(`cms/2026-ab12cd.original.jpg`); the variants go beside them
(`cms/2026-ab12cd.medium.jpg` …). Each variant carries its exact pixel size
as S3 metadata (`x-amz-meta-width` / `x-amz-meta-height`), which the site
build reads to give every `<img>` its width and height. The site never serves
an original, only the variants.

- `variants.mjs` – the resizing (sharp), shared by both scripts below.
- `index.mjs` – Lambda handler. Triggered by uploads under `cms/` (where the
  CMS stores media), it writes the three variants beside the upload. Files that
  are already variants, and videos, are skipped, so it never loops.
- `deploy.sh` – creates/updates the role `/projects/nicolas-hubert/nh-image-variants` (read/write on `cms/*` only), the
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
