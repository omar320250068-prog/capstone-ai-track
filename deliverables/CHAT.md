# Track 3 — Phase: Build (core) · Streaming chat · Deliverables

Branch: `feature/chat` · Repo: https://github.com/omar320250068-prog/capstone-ai-track

## Deliverable

| Item | Link |
| --- | --- |
| Preview URL (hold a live streaming conversation) | https://capstone-ai-track.loca.lt/chat |
| Route handler (AI SDK `streamText` → UI message stream) | `capstone-app/src/app/api/chat/route.ts` |
| Chat component (`useChat`, parts rendering, auto-scroll, stop) | `capstone-app/src/components/chat/chat.tsx` |
| Model config module (system prompt + backend switch, well-commented) | `capstone-app/src/lib/ai/config.ts` |
| Thinking indicator / handoff | `capstone-app/src/components/chat/{thinking-indicator,message-item}.tsx` |
| Auto-scroll pin + jump to latest | `capstone-app/src/components/chat/chat-view.tsx` |
| Streaming markdown buffering (raw until complete) | `capstone-app/src/components/chat/message-content.tsx` |

## Evaluation criteria — evidence

| Criterion | Status | Evidence |
| --- | --- | --- |
| Responses visibly stream token by token | Done | Wire: `text/event-stream`, `x-vercel-ai-ui-message-stream: v1`, `text-delta` chunks. UI: reading grew 5 → 118 chars over 600 ms while the view was unpinned |
| Generation can be stopped mid-stream without breaking state | Done | Streamed 134 chars → Stop → 130 chars of partial persisted, input re-enabled, next send streamed a fresh reply |
| Conversation state survives multiple turns | Done | 6 user messages across turns; after full page reload 4→4 messages restored from localStorage (no data loss) |
| API key lives server-side only | Done | Key read only by `@ai-sdk/anthropic` on the server; `src/lib/ai/config.ts` is `server-only`; no key-dependent value reaches the client |
| Usable at phone width | Done | 393×852: no horizontal overflow, composer + send fully on screen, 40 px Stop/Send tap targets, bubbles ≤ 66% of viewport |

## Mentor-tip robustness checks (the quiet failure mode)

1. **Auto-scroll pin** — pin is *user intent*: it holds through layout growth while tokens stream, and releases on a real scroll-up (`chat-view.tsx`). Verified mid-stream: scrolled to top while tokens grew content 484 → 528 px; the view did not jump; "Jump to latest" appeared and re-pinned to 0 px remaining. This is the scenario (test while streaming) most submissions miss.
2. **Stop → send again** — verified in sequence with real input, not a replay.
3. **Thinking → first token handoff** — reasoning parts render a "Thinking…" indicator in the same container slot the text later fades into (180 ms fade, off under `prefers-reduced-motion`). No flicker gap. The mock streams `reasoning-delta` chunks first so this path is exercised even without a key.
4. **Streaming markdown** — in-flight text renders as raw escaped text; only a *completed* (or stopped) message is parsed with React Markdown. Half-finished fences/asterisks never render.

## Backend note (honesty)

This machine has **no `ANTHROPIC_API_KEY`**. The route handler therefore runs an explicit **mock stream** (`src/lib/ai/mock.ts`) that emits the exact `TextStreamPart` chunks a real `streamText(...)` would, piped through the identical `toUIMessageStream`/`createUIMessageStreamResponse` machinery. The UI honestly labels this "demo stream · server has no API key". Set `ANTHROPIC_API_KEY` (optionally `ANTHROPIC_THINKING=1` for real extended thinking) and the same client streams live Claude — the config module is the only file that changes.

Verified no leakage: the mock banner is driven by a server-rendered boolean; `src/lib/ai/config.ts` is `server-only`.

Saved from an opencode session running in `C:\trak nu, 3`.