# CMS login helper (AWS Lambda)

Sveltia CMS signs in with GitHub through an OAuth helper, so the GitHub
client secret never reaches the browser. This is the official
[sveltia-cms-auth](https://github.com/sveltia/sveltia-cms-auth) worker
(`worker.mjs`, copied unchanged, MIT – see `LICENSE-sveltia-cms-auth.txt`)
running on AWS Lambda behind a thin adapter (`index.mjs`).

| Piece         | Value                                                                                                                                                                                                                      |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Function      | `nh-cms-auth` (us-east-1, Node 22, arm64) with a public Function URL                                                                                                                                                       |
| URL           | `https://o7kdduyzppot2sildsrdczwscy0fgtmj.lambda-url.us-east-1.on.aws` (`backend.base_url` in `public/admin/config.yml`)                                                                                                   |
| Role          | `/projects/nicolas-hubert/nh-cms-auth` – logs + read the one secret parameter                                                                                                                                              |
| GitHub App    | "NH & AB graphistes CMS", owned by the `nicolas-hubert-graphiste` org, installed only on this repository; Contents read/write, Email addresses read-only; callback `<URL>/callback`; user tokens do not expire             |
| Client ID     | `Iv23lijoYar5NGYSEenp` (function environment, not secret)                                                                                                                                                                  |
| Client secret | SSM SecureString `/projects/nicolas-hubert/cms-auth/github-client-secret` (only in AWS)                                                                                                                                    |
| Allowed sites | the domain, `www.`, the github.io address, `localhost` (plus `cms.netlify.com`, which Sveltia sends as its site ID on localhost)                                                                                           |
| Token reach   | only the repositories the GitHub App is installed on (this one), and only what the signed-in person may do there. `auth_scope: public_repo` in the CMS config is required by Sveltia but ignored by GitHub for GitHub Apps |

## Why a GitHub App, not an OAuth app

A classic OAuth app token reaches every repository the person can push to,
across all their organisations, and Sveltia always adds the `user` scope
(full profile access). A GitHub App token is limited to the repositories the
app is installed on, with the app's permissions, so signing in to this CMS
cannot affect anything else.

## Update or redeploy

```bash
GITHUB_CLIENT_ID=Iv23lijoYar5NGYSEenp infra/cms-auth/deploy.sh
```

To take a newer upstream version, replace `worker.mjs` with its `src/index.js`
and redeploy.

## Rotate the client secret

Generate a new client secret on the GitHub App, copy it, then in a terminal:

```bash
aws ssm put-parameter --name /projects/nicolas-hubert/cms-auth/github-client-secret --type SecureString --overwrite --value "$(pbpaste)"
pbcopy < /dev/null
```

The function picks it up on its next cold start (within minutes, or redeploy).

## After the domain switch

Change the GitHub App's homepage URL to the real domain. Nothing else changes:
the callback is the Lambda URL, and the domain is already allowed.
