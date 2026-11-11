# CMS login helper (AWS Lambda)

Sveltia CMS signs in with GitHub through an OAuth helper, so the GitHub
client secret never reaches the browser. This is the official
[sveltia-cms-auth](https://github.com/sveltia/sveltia-cms-auth) worker
(`worker.mjs`, copied unchanged, MIT – see `LICENSE-sveltia-cms-auth.txt`)
running on AWS Lambda behind a thin adapter (`index.mjs`).

| Piece            | Value                                                                                                                    |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Function         | `nh-cms-auth` (us-east-1, Node 22, arm64) with a public Function URL                                                     |
| URL              | `https://o7kdduyzppot2sildsrdczwscy0fgtmj.lambda-url.us-east-1.on.aws` (`backend.base_url` in `public/admin/config.yml`) |
| Role             | `/projects/nicolas-hubert/nh-cms-auth` – logs + read the one secret parameter                                            |
| GitHub OAuth app | "NH & AB graphistes – CMS", owned by the `nicolas-hubert-graphiste` org; callback `<URL>/callback`; non-expiring tokens  |
| Client ID        | `Ov23likl80m5EQCTkjOb` (function environment, not secret)                                                                |
| Client secret    | SSM SecureString `/projects/nicolas-hubert/cms-auth/github-client-secret` (only in AWS)                                  |
| Allowed sites    | the domain, `www.`, the github.io address, `localhost`                                                                   |
| Token scope      | `public_repo` (set by `auth_scope` in the CMS config)                                                                    |

## Update or redeploy

```bash
GITHUB_CLIENT_ID=Ov23likl80m5EQCTkjOb infra/cms-auth/deploy.sh
```

To take a newer upstream version, replace `worker.mjs` with its `src/index.js`
and redeploy.

## Rotate the client secret

Generate a new secret on the GitHub OAuth app, copy it, then in a terminal:

```bash
aws ssm put-parameter --name /projects/nicolas-hubert/cms-auth/github-client-secret --type SecureString --overwrite --value "$(pbpaste)"
pbcopy < /dev/null
```

The function picks it up on its next cold start (within minutes, or redeploy).

## After the domain switch

Change the OAuth app's homepage URL to the real domain. Nothing else changes:
the callback is the Lambda URL, and the domain is already allowed.
