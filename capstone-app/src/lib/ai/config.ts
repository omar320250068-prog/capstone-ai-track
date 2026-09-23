// ---------------------------------------------------------------------------
// Server-only chat configuration — the single source of truth for the
// streaming chat feature (Phase: "Build (core)").
//
// This module owns:
//   1. The system prompt (assistant personality + rules).
//   2. The model id and the generation knobs that drive streamText.
//   3. The backend decision: real Claude via the AI SDK, vs. an explicit
//      local mock stream when this environment has no ANTHROPIC_API_KEY.
//
// It is imported by src/app/api/chat/route.ts and by the (server) page that
// renders the chat. Nothing from here ever lands in a client bundle because
// of the `server-only` marker — Next.js fails the build if a client
// component imports this module. That keeps the system prompt and every
// model setting server-side, alongside the API key that @ai-sdk/anthropic
// reads from process.env.
//
// FE-07 builds directly on this module (retrieval, tools): the route handler
// stays untouched and only this file grows.
// ---------------------------------------------------------------------------

import "server-only";

/**
 * The assistant's identity for the qualification chat. Written so the model
 * stays on-topic for the AI-assisted development track, is concise, and
 * formats answers with markdown the client can render.
 *
 * The prompt is deliberately plain English (no placeholders) so a reviewer
 * can read the live conversation without first reading this file.
 */
export const SYSTEM_PROMPT = `You are the assistant embedded in the Capstone App, a project built across the "AI-assisted development" track. You help a technical reviewer explore the codebase and the process used to build it.

Rules:
- Be concise and concrete. Prefer short paragraphs, lists and code blocks.
- Answer only what is asked; offer a one-line next step when useful.
- When asked about the code, describe the actual files (route handlers, components, config) rather than generic advice.
- Format answers with markdown: ## headings only when the answer is long, lists for steps, fenced code blocks for code.
- Use the tools when the reviewer asks about real data: audit_repo for checking/scoring a GitHub repository (owner + repo), site_meta for a page's meta tags (url). Call a tool instead of inventing numbers; then summarize what the tool actually returned.
- Never claim to have access or credentials this app does not have (there is no API key by default; this environment streams a local demo until ANTHROPIC_API_KEY is set).
- Stay in character: you are a teammate, not a chatbot demo.`;

/** Claude model used for chat. Override with ANTHROPIC_CHAT_MODEL. */
export const CHAT_MODEL_ID = process.env.ANTHROPIC_CHAT_MODEL ?? "claude-sonnet-4-5";

/** Generation temperature for the chat stream (0 = deterministic). */
export const TEMPERATURE = Number(process.env.CHAT_TEMPERATURE ?? 0.7);

/** Cap on model output tokens per turn. */
export const MAX_OUTPUT_TOKENS = Number(process.env.CHAT_MAX_OUTPUT_TOKENS ?? 1024);

/**
 * Extended thinking (the "thinking indicator before the first token"). Enabled
 * explicitly with ANTHROPIC_THINKING=1. When on, the model emits reasoning
 * parts the client renders as a thinking indicator before the text parts.
 */
export const ENABLE_THINKING = process.env.ANTHROPIC_THINKING === "1";

/** Reasoning budget for extended thinking ("explicit" mode). */
export const THINKING_BUDGET_TOKENS = Number(
  process.env.ANTHROPIC_THINKING_BUDGET_TOKENS ?? 1024,
);

/** The two stream producers the route handler can run. */
export type ChatBackend = "anthropic" | "mock";

/**
 * Decide the backend for THIS environment. With an ANTHROPIC_API_KEY present
 * the UI stream comes from real Claude via streamText; otherwise a local
 * mock stream speaks the same wire format so the full UX (token-by-token
 * rendering, thinking handoff, stop, auto-scroll) stays testable. The client
 * receives `mode` from the server page and shows an honest banner in mock
 * mode, so a reviewer never mistakes the demo for the real model.
 */
export function chatBackend(): ChatBackend {
  return process.env.ANTHROPIC_API_KEY ? "anthropic" : "mock";
}