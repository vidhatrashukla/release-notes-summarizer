# Release Notes Summarizer

A Vite + React app for generating internal release messages from ticket details, with server-side Groq requests and optional server-side GitHub version lookup.

## What Changed

- Groq requests now run through `/api/generate` so the API key stays server-side.
- Version lookup now runs through `/api/version` so repo details and GitHub tokens stay server-side.
- The previous GitHub Pages deployment flow was removed because a static-only deploy cannot safely hold the required secrets.
- Date formatting now uses local calendar dates instead of timezone-sensitive `new Date('YYYY-MM-DD')` parsing.

## Stack

- React 18
- TypeScript
- Vite
- Custom CSS
- Vercel-style serverless functions in `api/`

## Environment Variables

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Required:

```bash
GROQ_API_KEY=gsk_your_api_key_here
```

Optional, for automatic version lookup:

```bash
GITHUB_TOKEN=github_pat_your_token_here
GITHUB_REPOS=[{"owner":"FarMart-Engineering","repo":"farmartos-backend","field":"osBE"},{"owner":"FarMart-Engineering","repo":"farmartos-frontend","field":"osFE"},{"owner":"FarMart","repo":"pro-app","field":"proFE","path":"packages/web/package.json"},{"owner":"FarMart","repo":"pro-app","field":"proNative","path":"packages/native/package.json"}]
```

`GITHUB_REPOS` maps UI fields to the package files that contain version numbers.

## Local Development

Install dependencies:

```bash
npm install
```

Start the app:

```bash
npm run dev
```

`vite.config.ts` mounts local `/api/generate` and `/api/version` middleware during development, so `npm run dev` exercises the same API boundary as production.

Build the frontend:

```bash
npm run build
```

`npm run build` runs a typecheck first and then bundles the production app with `scripts/build.mjs`, producing `dist/index.html`, `dist/assets/app.js`, and `dist/assets/app.css`.

Run the automated tests:

```bash
npm test
```

Preview the static frontend bundle:

```bash
npm run preview
```

`npm run preview` only serves the built frontend. It does not emulate the serverless API routes.

## Deployment

Deploy this project to a platform that supports both:

- static Vite output
- server-side functions with secrets

The repo now includes `vercel.json`, so Vercel is the simplest deployment target.

Production secrets:

- `GROQ_API_KEY`
- `GITHUB_TOKEN` if version lookup is enabled
- `GITHUB_REPOS` if version lookup is enabled

## Usage

1. Enter version numbers manually or use the fetch buttons.
2. Choose the release date and time.
3. Paste ticket details.
4. Generate the release message.
5. Review and copy the result.

If version lookup is not configured or fails, the form still works with manual version entry.
