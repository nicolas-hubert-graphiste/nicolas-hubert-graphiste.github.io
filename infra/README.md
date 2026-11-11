# AWS footprint — Nicolas Hubert site

Everything this project uses in AWS account `530534606441` (us-east-1).
List the project's identities any time with:

```bash
aws iam list-users --path-prefix /projects/nicolas-hubert/
aws iam list-roles --path-prefix /projects/nicolas-hubert/
```

## Identities

| Name                                         | Type     | Used by                                                | Can do                                      | Secret lives in                                                                                  |
| -------------------------------------------- | -------- | ------------------------------------------------------ | ------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `/projects/nicolas-hubert/nh-cms-uploader`   | IAM user | Sveltia CMS in the browser (`public/admin/config.yml`) | get / put / delete `cms/*`, list `cms/`     | Password manager. The key ID is in `config.yml`; the secret is typed once per device in the CMS. |
| `/projects/nicolas-hubert/nh-image-variants` | IAM role | Lambda `nh-image-variants`                             | get / put / put-ACL `cms/*`, write its logs | none (role)                                                                                      |

All carry the tags `project=nicolas-hubert` and `purpose=…`. Personal
admin access is the separate `/people/chris-admin` user, not part of this
project.

## Bucket `nicolashubert-graphiste-production`

| Setting            | Value                                                                                                                          |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| Public read        | Paperclip objects (`projet_assets/`, `home_images/`) via per-object ACLs; `cms/*` via the bucket policy `PublicReadCmsUploads` |
| CORS               | `cms-browser-uploads`: GET/PUT/DELETE/HEAD from the site, `www.`, the github.io address and `localhost:4321`                   |
| Event notification | uploads under `cms/` → Lambda `nh-image-variants` (writes medium/large/xlarge, see `image-variants/`)                          |
| Backup             | full copy 2026-11-11 in `~/Backups/nicolashubert-graphiste-production-2026-11-11`                                              |

## Legacy, to retire

- The old Rails app on Heroku (`nicolashubert-graphiste`) still uses the
  account's **root** access key for its uploads. It must not be restarted;
  it gets deleted after the domain switch, and then the root access key is
  deactivated and deleted.
- `small` / `thumbnail` Paperclip variants and `category_backgrounds/` are
  unused by the new site; delete after Heroku is gone.
