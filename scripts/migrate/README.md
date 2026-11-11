# Migration from the Rails/Heroku site

One-off script that turns the old Postgres database into content files for
this repo. Media are **not** copied: the script points at the objects that
already exist in the S3 bucket (`projet_assets/<basename>.xlarge.jpg`,
`home_images/<basename>.original.<ext>`).

## Inputs (never committed; `scripts/migrate/input/` is gitignored)

1. Restore the Heroku dump into a local Postgres:
   ```bash
   heroku pg:backups:capture -a <app>
   heroku pg:backups:download -a <app> -o scripts/migrate/input/latest.dump
   createdb nh_old && pg_restore --no-owner -d nh_old scripts/migrate/input/latest.dump
   ```
2. List the bucket so every URL can be verified:
   ```bash
   aws s3api list-objects-v2 --bucket nicolashubert-graphiste-production --query "Contents[].Key" --output json | bun -e "for (const k of await Bun.stdin.json()) console.log(k)" > scripts/migrate/input/s3-keys.txt
   ```

## Run

```bash
DATABASE_URL=postgres://localhost/nh_old \
S3_BASE=https://nicolashubert-graphiste-production.s3.amazonaws.com \
bun run migrate
```

Flags: `--dry-run` prints the report without writing; `--only=projets|clients|home|infos` limits output.

The script wipes and regenerates `src/content/projets/*.md`, `src/content/clients/*.yml`
and `src/content/home.yml`, writes `scripts/migrate/redirects.json` (old → new URLs, read by
`astro.config.mjs`) and prints a report: counts, unmapped rows, missing S3 objects.
`infos.yml` / `contact.yml` are hand-maintained from the new design copy and are not touched.
