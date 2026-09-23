# Track 3 — Phase: Build (core) · Tools & generative UI · Deliverables

Branch: `feature/tools` · Repo: https://github.com/omar320250068-prog/capstone-ai-track

## Deliverable

| Item | Link |
| --- | --- |
| Preview URL (demonstrate a full tool call end-to-end) | https://capstone-ai-track.loca.lt/chat |
| Tool definition file (Zod schemas + execute functions) | `capstone-app/src/lib/ai/tools.ts` |
| Generative UI (four lifecycle states, real result components) | `capstone-app/src/components/chat/tool-ui.tsx` |
| Tool part rendering in messages | `capstone-app/src/components/chat/message-item.tsx` |
| Stream wiring (`streamText` tools + error passthrough) | `capstone-app/src/app/api/chat/route.ts` |
| System prompt / tool-choice guidance | `capstone-app/src/lib/ai/config.ts` |
| Human-readable tool contract | `capstone-app/README.md` (§ Tools) |

## Tool contract (implemented)

Two read-only server-side tools. Both run against the **live** network in every
mode (mock or Claude); only *which* tool the model picks is mocked when there
is no API key.

### `audit_repo`
- **Input (Zod):** `{ owner: string, repo: string }` — `^[\w.-]{1,100}$`, no `.git` suffix.
- **Execute:** `GET https://api.github.com/repos/{owner}/{repo}` + best-effort `.github/workflows` probe; 10 s timeouts.
- **Return:** `{ repo, score, grade, summary, metrics, findings, fetchedInMs }`.
  - `score` 0–100, weighted: license 10, not-archived 15, recent push 20, CI 15, has stars 10, manageable open issues 10, description 10, topics 10.
  - `grade` A ≥ 85 · B ≥ 70 · C ≥ 50 · D.
  - `metrics`: stars, openIssues, lastPush, sizeKB, license, defaultBranch, archived, `hasCI: boolean | null` (probe unverified), description, topics.
  - `findings[]`: `{ level: info|warn|bad, label, detail }` only where attention is needed. `null` outputs render as explicit "missing/unverified" badges — every display field has a plan.
- **Errors:** 404/403/429/timeout throw `ToolExecutionError` with a user-safe, actionable message.

### `site_meta`
- **Input (Zod):** `{ url: string }` — one absolute http(s) URL, ≤ 2048 chars.
- **Execute:** real fetch (redirects, 10 s timeout, 512 KB cap) + HTML parse of `<title>`, `name=description`, `og:title`, `og:image`, site icon, `<html lang>`.
- **Return:** `{ url, finalUrl, status, ok, title?, description?, ogTitle?, ogImage?, favicon?, lang?, fetchedInMs }` — each tag `string | null`, null → **missing** badge.
- **Errors:** non-HTML content type / non-200 status reject with a designed message.

## Lifecycle state machine (typed tool parts)

AI SDK v7 emits typed tool parts per tool name (`tool-audit_repo`, `tool-site_meta`)
with a `state` discriminator. The UI renders each state distinctly
(`tool-ui.tsx`, `ToolPartSnapshot`, 200 ms crossfade between states):

| State | Visual treatment | Verified |
| --- | --- | --- |
| `input-streaming` | amber rail, shimmer skeleton, partial JSON assembling with caret (`tool-scan-dot`), tool name chip | sampler: "site_meta/audit_repo is running" |
| `input-available` | captured-value chip grid + dashed "request sent → awaiting response" | sampler: "… input received" |
| `output-available` | **real components** — `AuditCard` SVG score ring + metric grid + findings; `MetaTable` present/missing rows; generic tool → designed key:value list (never a JSON dump) | sampler: "… result"; ring "Health score 90 out of 100, grade A" |
| `output-error` | calm rose panel, `role="alert"`, pulsing error glyph, exact retry command, error message verbatim from the executed tool | 404 → "GitHub returned 404 — … does not exist (or is private)…" |

The state machine is driven entirely by the server-emitted part sequence; the
client is a pure function of the stream.

## Error-first design

The intended error path was designed *before* the success layouts:

1. `ToolExecutionError` on the server carries the human-safe, prefix-bearing
   message (never an exception stack).
2. The SDK routes tool errors through the stream `onError`; the route passes
   `ToolExecutionError` messages **through verbatim** and only wraps true
   transport errors ("The stream failed…"). A raw error part never slips
   through as a generic banner.
3. The error panel shows the exact retry command (`audit vercel/next.js` /
   `check https://example.com`) so a reviewer can recover in one paste.
4. Verified in a real browser after production build: designed panel with
   clean message; the earlier wrapped-message failure (localStorage holding a
   stale pre-fix part) found via reload persistence testing, *not* via a unit
   assertion.

## Evidence (real browser, production build)

| Criterion | Evidence |
| --- | --- |
| Real tool call end-to-end | `audit vercel/next.js` → reasoning preamble, input streaming, chip grid, **90/A** score ring, metrics, findings, narration ("…scored 90/100 (grade A)") — all from the live GitHub API |
| Tool result as a component | `site_meta` on `https://example.com` → table with HTTP 200 + real HTTP status, title "Example Domain", lang `en`, missing badges for description/og:title/og:image; footer "fetched the real page in 534 ms" |
| Failed tool execution → designed error state | `audit fakeprov48/does-not-exist-xyz` → rose alert panel, clean 404 message, retry command |
| Four states render distinctly | state sampler mounted in the browser recorded the full pass: "is running" → "input received" → "result" (and the error panel for the failure) |
| Robustness: scroll during tool turn | mid-stream scroll-up during `audit` → pin released (no viewport jump while content grew), "Jump to latest" appeared, re-pin worked |
| Robustness: reload persistence | page reload → `site_meta` table re-rendered from localStorage tool parts (parts survive serialize/hydrate) |
| Robustness: stop mid-turn | Stop during a tool turn → partial preserved, send restored, next send streamed a fresh reply |
| Keyboard-only | Tab order: nav links → "New chat" → composer; Enter sends (APG pattern honored) |
| Phone width | 393×852: no horizontal overflow (378 ≤ 393), 40 px send target fully on screen, card 227 px wide inside viewport |

## Stretch notes

- **Second tool + model choice:** `site_meta` and `audit_repo` both exist; in
  mock mode the fallback intent detector explains its choice in the reasoning
  preamble ("this calls for a live audit_repo…"), reproducing the decision a
  Claude-driven run would make with the API key set.
- **Chart:** hand-rolled SVG score ring (`audit ring`) — accessible
  (`role="img"` + `aria-label="Health score 90 out of 100, grade A"`), derived
  from `score`, animates under reduced-motion-safe conditions.

Saved from an opencode session running in `C:\trak nu, 3`.