---
name: GitHub Pages Deployment Setup
overview: Configure Next.js for static export and GitHub Pages deployment with easy transition from subdirectory (nicolas-hubert-graphiste.github.io/website) to custom domain (nicolas-hubert-graphiste.com).
todos:
  - id: install-gh-pages
    content: Install gh-pages as dev dependency using Bun
    status: completed
  - id: update-next-config
    content: Update next.config.ts with conditional basePath config
    status: completed
  - id: create-env-file
    content: Create .env.local with NEXT_PUBLIC_BASE_PATH=/website
    status: completed
  - id: add-deploy-scripts
    content: Add deploy and deploy:custom scripts to package.json
    status: completed
  - id: fix-basepath-issue
    content: Fix basePath to use BASE_PATH env var at build time
    status: completed
  - id: update-deploy-scripts-with-env
    content: Update deploy scripts to pass BASE_PATH during build
    status: completed
  - id: remove-env-local
    content: Remove .env.local file as it's no longer needed
    status: completed
---

# GitHub Pages Deployment Setup

## Overview

Set up GitHub Pages deployment with a configuration that allows easy switching between subdirectory deployment and custom domain deployment.

## Changes Required

### 1. Install gh-pages Dependency

Add `gh-pages` as a dev dependency using Bun:

```bash
bun add -d gh-pages
```

### 2. Update Next.js Configuration

Modify [`next.config.ts`](next.config.ts) to enable static export with conditional basePath:

- Set `output: 'export'` for static HTML generation
- Set `basePath: process.env.BASE_PATH || ''` to allow build-time control
- Set `images: { unoptimized: true }` as required for static export

**Important:** `basePath` must be known at build time (not runtime), so we use `BASE_PATH` instead of `NEXT_PUBLIC_BASE_PATH`. The value is passed directly in the deploy command.

### 3. Add Deploy Scripts

Update [`package.json`](package.json) scripts section:

**Current deployment (subdirectory):**

```json
"deploy": "BASE_PATH=/website next build && touch out/.nojekyll && gh-pages -d out"
```

**Future deployment (custom domain):**

```json
"deploy:custom": "BASE_PATH= next build && echo 'nicolas-hubert-graphiste.com' > out/CNAME && touch out/.nojekyll && gh-pages -d out"
```

The `BASE_PATH` environment variable is set inline before the build command, ensuring Next.js picks it up at build time. The `.nojekyll` file prevents Jekyll processing, and CNAME tells GitHub Pages to use your custom domain.

## Deployment Workflow

### Current (Subdirectory)

```bash
bun run deploy
```

Site deploys to: `nicolas-hubert-graphiste.github.io/website`

The deploy script sets `BASE_PATH=/website` before building, ensuring all assets are generated with the correct path prefix.

### Future (Custom Domain)

1. Configure DNS: point `nicolas-hubert-graphiste.com` to GitHub Pages
2. Deploy using: `bun run deploy:custom`
3. In GitHub Settings → Pages: set custom domain to `nicolas-hubert-graphiste.com`

Site will then be at: `nicolas-hubert-graphiste.com`

The `deploy:custom` script sets `BASE_PATH=` (empty) before building, generating assets for root-level deployment.

## Notes

- Internal links and assets automatically adjust based on basePath
- Switching between deployments is done via different deploy scripts (no env file needed)
- `.gitignore` already properly configured - `/out/` is excluded
- Both deploy scripts included for convenience
- The `gh-pages` library automatically creates and manages a separate `gh-pages` branch for deployment
- `BASE_PATH` must be set at build time (not runtime) for Next.js to generate correct asset paths