# NH & AB graphistes — site web

Static site for the graphic design studio of Nicolas Hubert and Amélina Bouchez,
replacing the Rails/Heroku site. Content is edited by the studio through a web
CMS; every save is a commit that redeploys the site.

| Piece     | Choice                                                                                                            |
| --------- | ----------------------------------------------------------------------------------------------------------------- |
| Framework | [Astro](https://astro.build) (static output) + React islands, Tailwind CSS v4                                     |
| CMS       | [Sveltia CMS](https://sveltiacms.app) at `/admin/`, GitHub backend                                                |
| Media     | Existing S3 bucket `nicolashubert-graphiste-production` (uploads from the CMS, WebP ≤ 2400 px)                    |
| Hosting   | GitHub Pages via `.github/workflows/deploy.yml`, custom domain `nicolashubert-graphiste.com`                      |
| Languages | French at `/`, English at `/en/` (UI strings in `src/i18n/ui.ts`; CMS content French with optional `*_en` fields) |

## Develop

```bash
bun install
bun run dev        # http://localhost:4321
bun run build      # static output in dist/
bun run check      # astro check (types)
```

Open <http://localhost:4321/admin/> and choose “Work with Local Repository” to
edit content without the GitHub login (Chrome/Edge).

## Where things live

- `src/content/projets/*.md` — one file per project (frontmatter + French text). `src/content/clients/*.yml`, `home.yml`, `infos.yml`, `contact.yml`.
- `src/content.config.ts` — schemas. `public/admin/config.yml` — the CMS form definitions. **Keep the two in sync.**
- `src/views/*.astro` — page templates shared by the FR and EN routes in `src/pages/`.
- `src/lib/categories.ts` — the four project categories (nav, routes, schema).
- `scripts/migrate/` — one-off import from the old Rails database (see its README).

## One-time setup still required

1. **CMS login:** deploy [sveltia-cms-auth](https://github.com/sveltia/sveltia-cms-auth) to Cloudflare Workers, create a GitHub OAuth App owned by the `nicolas-hubert-graphiste` org (callback `https://<worker>/callback`), set `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `ALLOWED_DOMAINS` on the worker, then put the worker URL in `backend.base_url` of `public/admin/config.yml`.
2. **S3:** create a bucket-scoped IAM user (Get/Put/List/DeleteObject), add a public-read bucket policy and a CORS rule for `https://nicolashubert-graphiste.com` and `http://localhost:4321` (`GET, PUT, DELETE, HEAD`, all headers). Fill `region` and `access_key_id` in `config.yml`. The secret key is entered once in the CMS UI, never committed.
3. **GitHub Pages:** Settings → Pages → Source “GitHub Actions”; add the custom domain and `public/CNAME` at cutover.
