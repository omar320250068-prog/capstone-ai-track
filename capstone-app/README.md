# Capstone App

The preview application for the **AI-Assisted Development** capstone track. It
hosts the streaming chat that a technical reviewer uses to explore the project,
including server-side tools whose results render as real UI components.

```bash
npm run dev       # development (http://localhost:3000)
npm run build     # production build (turbopack + strict TS)
npm start         # serve the production build
```

Requires Node ≥ 20.

## Streaming chat

`/chat` is a streaming chat built on the [AI SDK v7](https://ai-sdk.dev):

- **Server** — `src/app/api/chat/route.ts` runs `streamText` (Anthropic path)
  or an explicit local demo stream through the *same* UI-message-stream
  pipeline (`createUIMessageStreamResponse`).
- **Client** — `src/components/chat/*` render token-by-token text, a thinking
  indicator with a 180 ms fade handoff, a stop button that preserves state,
  user-intent-pinned auto-scroll with "Jump to latest", and localStorage
  persistence. Streamed markdown is buffered raw (never half-parsed) and
  rendered with React Markdown only when complete.

**Backend honesty.** Without `ANTHROPIC_API_KEY` the server streams a clearly
labelled *mock* model ("demo stream · server has no API key"). The fallback
illustrates every wire behaviour the brief cares about on identical AEI
machinery, but the **tools always execute for real** — set the key and Claude
drives the same `TOOLS` record.

## Tools

Two read-only, server-side tools. Definition file:
`src/lib/ai/tools.ts`. Schemas are Zod; `execute` functions do real network
work (live GitHub API / real pages).

| Tool       | Purpose                                        | Input schema                                   | Return shape                                                                                         |
| ---------- | ---------------------------------------------- | ---------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `audit_repo` | Score a public GitHub repo's health (0–100)  | `{ owner: string, repo: string }`              | `{ repo, score, grade, summary, metrics, findings[], fetchedInMs }` (see below)                       |
| `site_meta`  | Fetch a page and read its meta tags / status | `{ url: string }` (http/https)                 | `{ url, finalUrl, status, ok, title?, description?, ogTitle?, ogImage?, favicon?, lang?, fetchedInMs }` |

**Contract detail — `audit_repo`:**

- Input: `owner` (GitHub user/org), `repo` (no `.git`), both `^[\w.-]{1,100}$`.
- Execute: `GET https://api.github.com/repos/{owner}/{repo}` + a best-effort
  probe of `.github/workflows` (CI). Timeout 10 s per call.
- Return (JSON-serializable): score 0–100 from weighted checks (license,
  archived, recent push, CI, stars, open issues, description, topics);
  `grade` A ≥ 85 / B ≥ 70 / C ≥ 50 / D; `metrics` (stars, openIssues,
  lastPush, sizeKB, license, defaultBranch, archived, `hasCI: boolean|null`,
  description, topics); `findings[]` of `{ level: info|warn|bad, label,
  detail }` — only the items needing attention. Every `null` is an explicit
  "missing / unverified" rendering.

**Contract detail — `site_meta`:**

- Input: one absolute http(s) URL (max 2048 chars).
- Execute: fetches the page (redirects followed, 10 s timeout, 512 KB read
  cap), parses `<title>`, `name=description`, `og:title`, `og:image`, site
  icon, `<html lang>`.
- Return: `status`, `ok`, `finalUrl`, the extracted tags (individually
  `string | null` — null renders as a **missing** badge in the table), and
  `fetchedInMs`. Non-HTML content types and non-200 statuses reject with a
  designed error message.

**Error contract.** All `execute` failures throw `ToolExecutionError` with a
user-safe, actionable message (404 repo, rate-limit, timeout, non-HTML page,
…). The AI SDK surfaces these as `tool-error` parts; the client renders a
designed error panel with the specific retry command. The route's `onError`
passes `ToolExecutionError` messages through verbatim and only wraps unknown
transport errors.

**Lifecycle rendering.** Each tool part travels
`input-streaming → input-available → output-available | output-error`
(`src/components/chat/tool-ui.tsx`) with a distinct layout per state and a
200 ms crossfade between them — input JSON assembling with a caret, a chip
grid of captured values, real components (`AuditCard` score ring + metric
grid + findings; `MetaTable` present/missing rows), and a calm rose error
panel. No state ever renders as a JSON dump; the unknown-tool fallback is a
designed key:value list.

**Choosing.** In mock mode the fallback detects intent (`audit owner/repo`,
`check <url>`) and explains the choice in its reasoning preamble; with an API
key the Anthropic model makes the same choice from the tool descriptions.

## Configuration (`src/lib/ai/config.ts`, server-only)

| Env var                          | Meaning                            | Default             |
| -------------------------------- | ---------------------------------- | ------------------- |
| `ANTHROPIC_API_KEY`              | enables the real Claude backend    | (unset → mock)      |
| `ANTHROPIC_CHAT_MODEL`           | model id                           | `claude-sonnet-4-5` |
| `ANTHROPIC_THINKING` (`=1`)      | extended thinking indicator        | off                 |
| `CHAT_TEMPERATURE` / `CHAT_MAX_OUTPUT_TOKENS` / `ANTHROPIC_THINKING_BUDGET_TOKENS` | knobs | `0.7` / `1024` / `1024` |