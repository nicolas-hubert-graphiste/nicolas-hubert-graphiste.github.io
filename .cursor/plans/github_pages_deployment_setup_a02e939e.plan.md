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
- Set `basePath: process.env.NEXT_PUBLIC_BASE_PATH || ''` to allow environment-based control
- Set `images: { unoptimized: true }` as required for static export

This approach allows you to:

- Use `/website` basePath for GitHub Pages subdirectory (default)
- Switch to root path when custom domain is added (by setting env variable to empty string)

### 3. Add Environment Variable

Create a `.env.local` file (git-ignored) with:

```javascript
NEXT_PUBLIC_BASE_PATH=/website
```

For custom domain deployment, simply change to:

```javascript
NEXT_PUBLIC_BASE_PATH=
```

### 4. Add Deploy Scripts

Update [`package.json`](package.json) scripts section:**Current deployment (subdirectory):**

```json
"deploy": "next build && touch out/.nojekyll && gh-pages -d out"
```

**Future deployment (custom domain) - add as comment:**

```json
"deploy:custom": "next build && echo 'nicolas-hubert-graphiste.com' > out/CNAME && touch out/.nojekyll && gh-pages -d out"
```

The `.nojekyll` file prevents Jekyll processing, and CNAME tells GitHub Pages to use your custom domain.

## Deployment Workflow

### Current (Subdirectory)

```bash
bun run deploy
```

Site deploys to: `nicolas-hubert-graphiste.github.io/website`

### Future (Custom Domain)

1. Update `.env.local`: set `NEXT_PUBLIC_BASE_PATH=`
2. Configure DNS: point `nicolas-hubert-graphiste.com` to GitHub Pages
3. Use: `bun run deploy:custom`
4. In GitHub Settings → Pages: set custom domain to `nicolas-hubert-graphiste.com`

Site will then be at: `nicolas-hubert-graphiste.com`

## Notes

- Internal links and assets automatically adjust based on basePath
- Switching between deployments only requires changing the env variable
- `.gitignore` already properly configured - `/out/` and `.env*` are already excluded

- Both deploy scripts included for convenience
- The `gh-pages` library automatically creates and manages a separate `gh-pages` branch for deployment