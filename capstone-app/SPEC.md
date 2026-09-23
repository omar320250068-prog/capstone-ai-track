# Capstone App — Product Spec

> This spec was written by the AI assistant to make the deployment task
> concrete, since the track brief defines *what* to demonstrate (docs,
> routes, layout, nav, placeholders, Tailwind, env-only secrets, health
> page, live preview) but not the specific product. Every choice here maps
> back to a requirement in the brief so it can be reviewed and tested.

## 1. Purpose

A small, deploy-ready Next.js (App Router) application that shows how an
AI-assisted workflow is run end-to-end on day one of a project: routes,
root layout with navigation, placeholder pages, Tailwind design tokens,
server-only environment variables, a live health-check page, and a
one-command deploy.

## 2. Tech stack

- Next.js 16.3.6 (App Router, TypeScript, Turbopack)
- React 19.2.8
- Tailwind CSS v4 (CSS-first configuration via `@theme`)
- Node.js 24 runtime

## 3. Routes

| Route             | Page                         | Kind                  |
| ----------------- | ---------------------------- | --------------------- |
| `/`               | Home                         | Server Component      |
| `/about`          | About                        | Server Component      |
| `/workflow`       | Workflow                     | Server Component      |
| `/settings`       | Settings (placeholder)       | Server Component      |
| `/health`         | Health check (live fetch)    | Server Component (+1 Client refresh button) |
| `/changelog`      | Changelog                    | Server Component      |
| `*`               | Custom 404 (`not-found.tsx`) | Server Component      |

- All pages are Server Components by default. The only Client Component is
  the "Refresh data" button on the health page (it needs interactivity;
  `router.refresh()` re-runs the server render to re-fetch).
- `/- API: `/api/health` route handler (GET) pings a configurable public
  URL through `HEALTH_CHECK_URL` and returns JSON. Route handlers are not
  cached by default; the health page opts into dynamic rendering.

## 4. Root layout & navigation

- One root layout (`src/app/layout.tsx`) with `layout.tsx` host metadata
  (`title` template `%s · Capstone App`) and Geist font variables.
- `<SiteNav />` renders a sticky top bar with the six nav links; it uses
  `<Link>` from `next/link` (CSR-friendly, prefetching).
- `<SiteFooter />` shows repo link + "Built following the day-one
  deployment workflow" line.
- `<main>` stretches to fill so the footer sits at the bottom.

## 5. Tailwind design tokens

CSS-first tokens in `src/app/globals.css` under `@theme`:

- `--color-brand-*` primary/interactive colors
- `--color-surface-*` page/card surfaces
- `--color-ink-*` text shades
- Existing `--font-sans` / `--font-mono` from Geist stay.

Pages use these tokens only (no arbitrary hex), so a future theme change
is one edit in `globals.css`.

## 6. Health check (env-only secrets)

Server-only config lives in the server environment (never bundled):

- `HEALTH_CHECK_URL` — public URL the server pings (default: GitHub API repo
  metadata for this capstone repo).
- `EXPECTED_HEALTH_STATUS` (default `200`).

Public/browser-safe values use the `NEXT_PUBLIC_` prefix, exposed at build
time only:

- `NEXT_PUBLIC_SITE_URL` — absolute base URL the health server component
  uses to fetch `/api/health` (avoids relative-URL issues off Dev).
- `NEXT_PUBLIC_APP_NAME` / `NEXT_PUBLIC_APP_VERSION` for the UI footer.

`.env.example` documents every variable with a comment describing it.
`.gitignore` keeps `.env*` ignored but re-allows committing `.env.example`
(no secret values are ever committed).

## 7. Health page behaviour

`GET /api/health` returns JSON:

```json
{
  "status": "ok",
  "app": "capstone-app",
  "environment": "development",
  "nodeVersion": "v24.16.0",
  "timestamp": "2026-09-23T...Z",
  "uptimeSeconds": 12,
  "ping": { "url": "...", "status": 200, "targetLabel": "github/api" }
}
```

The `/health` page (Server Component, `force-dynamic`) fetches
`{NEXT_PUBLIC_SITE_URL}/api/health` with `no-store`, then renders a card
grid: App info / Environment / Up time / Ping result. On fetch failure it
renders an error card with setup guidance instead of crashing the page.

## 8. Deployment

- `vercel.json` at the repo root sets `rootDirectory` to `capstone-app`
  so Vercel/Netlify detect the app inside the monorepo.
- `.env.example` is committed; `.env.local` never is.
- Live preview via `npx localtunnel` for review; permanent deploy is
  linked to the user's Vercel account (credentials are not present in the
  environment).

## 9. Acceptance checklist

- [ ] `npm run build`, `npm run lint` pass clean
- [ ] All routes render at desktop (1280px) and mobile (375px)
- [ ] `/api/health` returns JSON; `/health` renders live data
- [ ] No secret values committed; `.env.example` committed
- [ ] Live preview URL + repo URL recorded in the submission section