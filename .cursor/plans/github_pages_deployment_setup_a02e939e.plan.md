---
name: GitHub Pages Deployment Setup
overview: Configure Next.js for static export and GitHub Pages deployment at root level (nicolas-hubert-graphiste.github.io) with seamless transition to custom domain (nicolas-hubert-graphiste.com).
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

Set up GitHub Pages deployment at root level (nicolas-hubert-graphiste.github.io) with seamless transition to custom domain (nicolas-hubert-graphiste.com). Repository renamed to match organization name for root-level deployment.

## Changes Required

### 1. Install gh-pages Dependency

Add `gh-pages` as a dev dependency using Bun:

```bash
bun add -d gh-pages
```

### 2. Update Next.js Configuration

Modify [`next.config.ts`](next.config.ts) to enable static export:

- Set `output: 'export'` for static HTML generation
- Set `trailingSlash: true` for GitHub Pages compatibility
- Set `images: { unoptimized: true }` as required for static export
- **No basePath needed** - repository is named `nicolas-hubert-graphiste.github.io` for root-level deployment

### 3. Add Deploy Scripts

Update [`package.json`](package.json) scripts section:

**Current deployment (root level):**

```json
"deploy": "next build && echo '' > out/.nojekyll && gh-pages -d out -t"
```

**Future deployment (custom domain):**

```json
"deploy:custom": "next build && echo 'nicolas-hubert-graphiste.com' > out/CNAME && echo '' > out/.nojekyll && gh-pages -d out -t"
```

The `-t` flag ensures dotfiles like `.nojekyll` are included. The `.nojekyll` file prevents Jekyll processing, and CNAME tells GitHub Pages to use your custom domain.

## Deployment Workflow

### Current (Root Level)

```bash
bun run deploy
```

Site deploys to: `nicolas-hubert-graphiste.github.io`

Repository is named `nicolas-hubert-graphiste.github.io` which enables root-level deployment without any basePath configuration.

### Future (Custom Domain)

1. Configure DNS: point `nicolas-hubert-graphiste.com` to GitHub Pages
2. Deploy using: `bun run deploy:custom`
3. In GitHub Settings → Pages: set custom domain to `nicolas-hubert-graphiste.com`

Site will then be at: `nicolas-hubert-graphiste.com`

**No code changes needed** when switching to custom domain - same build configuration works for both!

## Notes

- Repository renamed to `nicolas-hubert-graphiste.github.io` for root-level deployment
- No basePath needed - works at root level on GitHub Pages and with custom domain
- All assets and fonts reference absolute paths from root (e.g., `/fonts/...`)
- `.gitignore` already properly configured - `/out/` is excluded
- Both deploy scripts included for convenience
- The `gh-pages` library automatically creates and manages a separate `gh-pages` branch for deployment
- The `-t` flag on gh-pages ensures dotfiles like `.nojekyll` are included in deployment
- Switching to custom domain requires zero code changes - just update DNS and deploy with `deploy:custom`