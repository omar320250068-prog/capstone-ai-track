# Track 3 — Phase: Foundations · Deploy on day one · Deliverables

Demo app: **capstone-app** (`capstone-app/`)

## Links

| Item | Link |
| --- | --- |
| Live preview (localtunnel) | https://capstone-ai-track.loca.lt |
| Repository | https://github.com/omar320250068-prog/capstone-ai-track |
| Branch | `feature/capstone-deploy` |
| App spec | `capstone-app/SPEC.md` |
| Vercel config | `vercel.json` (rootDirectory: `capstone-app`) |

## What was built

- Next.js 16.3.6 (App Router, TypeScript, Turbopack) scaffolded with
  create-next-app into `capstone-app/`.
- Root layout with sticky navigation + footer; 6 routes (Home, About,
  Workflow, Settings, Health, Changelog) plus a custom 404.
- All pages are **Server Components**; the single Client Component is the
  "Refresh data" button on the health page (`router.refresh()`).
- Tailwind CSS v4 **design tokens** via `@theme` in `globals.css`
  (brand / surface / ink / status palettes) — no arbitrary hex in markup.
- Server-only env handling: `HEALTH_CHECK_URL` + `EXPECTED_HEALTH_STATUS`
  live on the server and are never bundled; `NEXT_PUBLIC_*` values are for
  the browser. `.env.example` is committed, secrets never are
  (`.gitignore` keeps `.env*` ignored, `.env.example` re-allowed).

## Health check

- `GET /api/health` (dynamic Route Handler) pings
  `HEALTH_CHECK_URL` (GitHub API for this repo) and returns JSON status,
  uptime, node version, timestamp.
- `/health` page (dynamic Server Component) fetches the API on every
  request and renders a live card grid; shows a setup-guidance error card
  instead of crashing if the API is unreachable.

## Verification

| Check | Result |
| --- | --- |
| `npm run lint` | Clean |
| `npm run build` | Clean — `/health` + `/api/health` dynamic, rest static |
| Routes at 1280px and 375px | All render, no horizontal overflow |
| `/api/health` | `{ status: "ok", ping: { status: 200 } }` |
| Live preview | HTTP 200 on `/`, `/health`, `/api/health` via tunnel |

## Notes

- First visit to the loca.lt URL shows its once-per-IP interstitial; enter
  the displayed IP / click Continue to reach the app.
- Permanent Vercel deployment is ready to go (`vercel.json` with
  `rootDirectory`) but needs the account owner to run `vercel link` /
  `vercel deploy --prod` once — no credentials exist in this environment.

Saved from an opencode session running in `C:\trak nu, 3`.