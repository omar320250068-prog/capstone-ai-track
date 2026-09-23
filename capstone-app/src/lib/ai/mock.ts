// ---------------------------------------------------------------------------
// Local demo stream — used only when the config module reports "mock".
//
// Why this exists: the capstone preview must let a reviewer hold a *streaming*
// conversation, and this machine has no ANTHROPIC_API_KEY. Rather than fake
// it in the client, this module emits the exact TextStreamPart chunks that a
// real streamText(...) produces, and the route handler feeds that stream
// through the SAME toUIMessageStream / createUIMessageStreamResponse pipeline
// the real Claude path uses — so every behaviour the brief cares about
// (visible token streaming, thinking indicator, markdown buffering, stop,
// auto-scroll AND the four tool states) is exercised on identical machinery.
//
// Tool honesty: when the reviewer asks for something a tool exists for, the
// "mock model" DECIDES to call it (the choosing moment is explained in the
// reasoning preamble), then the REAL execute function runs — audit_repo hits
// the live GitHub API, site_meta fetches the real page. Only the model's
// decision and the follow-up narration are canned; the tool itself is never
// simulated. Point ANTHROPIC_API_KEY at the server and Claude makes the same
// calls over the same TOOLS record.
// ---------------------------------------------------------------------------

import { generateId } from "ai";
import type { TextStreamPart, UIMessage } from "ai";
import {
  executeAuditRepo,
  executeSiteMeta,
  type AuditResult,
  type ChatTools,
  type SiteMetaResult,
} from "@/lib/ai/tools";

const WORD_DELAY_MS = 22;
const INPUT_DELTA_MS = 18;
/** Hold on input-available so the "what input?" state reads before output. */
const INPUT_AVAILABLE_HOLD_MS = 160;

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** Last user-visible text across the conversation, used by the mock reply. */
export function lastUserText(messages: UIMessage[]): string {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const message = messages[i];
    if (message.role !== "user") continue;
    const text = message.parts
      .filter((part): part is Extract<UIMessage["parts"][number], { type: "text" }> => part.type === "text")
      .map((part) => part.text)
      .join(" ")
      .trim();
    if (text) return text;
  }
  return "this project";
}

// ===========================================================================
// Tool intent detection ("the mock model choosing a tool")
// ===========================================================================

/**
 * The mock reproduces what a real model does before calling a tool: inspect
 * the last user message and decide. Two commands trigger tools:
 *   "audit <owner>/<repo>" (or score/check/review/how healthy is) -> audit_repo
 *   "check <url>" (or meta/peek/inspect/seo)                      -> site_meta
 * Everything else falls through to the conversational reply, which mentions
 * the commands so a reviewer discovers them.
 */
function detectToolIntent(text: string): { name: "audit_repo"; input: { owner: string; repo: string } } | {
  name: "site_meta";
  input: { url: string };
} | null {
  const audit = text.match(/(?:audit|score|assess|review|rate|how healthy is|analyse?)\s+(?:the\s+)?(?:repo(?:sitory)?\s+)?([\w.-]+)\/([\w.-]+)/i);
  if (audit) {
    return {
      name: "audit_repo",
      input: { owner: audit[1], repo: audit[2] },
    };
  }

  const meta = text.match(/(?:meta|peek|inspect|check|fetch tags|check tags|seo)\s+(https?:\/\/\S+)/i);
  if (meta) {
    return {
      name: "site_meta",
      input: { url: meta[1] },
    };
  }

  return null;
}

/** The reasoning preamble for a tool turn — the "why this tool?" message. */
function toolReasoning(intent: NonNullable<ReturnType<typeof detectToolIntent>>): string {
  const { name, input } = intent;
  if (name === "audit_repo") {
    return `The reviewer wants to check a real repository, so I'll call audit_repo with owner="${input.owner}" and repo="${input.repo}", let the tool hit the live GitHub API, and render the health score as a card.`;
  }
  return `The reviewer wants a page's meta tags, so I'll call site_meta with url="${input.url}", fetch the real page, and render the tags as a findings table.`;
}

/** Narration that streams after a successful tool result. */
function resultNarration(result: AuditResult | SiteMetaResult): string {
  if ("grade" in result) {
    const active = result.findings.filter((f) => f.level !== "info").length;
    return `${result.repo} scored **${result.score}/100** (grade **${result.grade}**). ${result.summary} ${active > 0 ? `The card flags ${active} item${active === 1 ? "" : "s"} needing attention.` : "No findings need attention."}`;
  }
  const present = [
    result.title ? "title" : null,
    result.description ? "description" : null,
    result.ogTitle ? "og:title" : null,
  ].filter(Boolean) as string[];
  return `The page loaded with HTTP ${result.status} in ${result.fetchedInMs} ms. ${present.length > 0 ? `I found a ${present.join(", ")}.` : "It exposes no standard meta tags."} Missing tags show as **missing** in the table below.`;
}

/** Narration that streams after a failed tool execution (designs the recovery move). */
function errorNarration(intent: NonNullable<ReturnType<typeof detectToolIntent>>): string {
  const { name } = intent;
  return name === "audit_repo"
    ? "The audit tool reported an error — the panel below explains what went wrong. To see the success path, try `audit vercel/next.js`."
    : "The site_meta tool could not read that page — see the panel below. To see the success path, try `check https://example.com`.";
}

/** The demo answer, deliberately markdown-heavy to prove buffered rendering. */
function demoReply(topic: string): string {
  const t = topic.length > 40 ? `${topic.slice(0, 40)}…` : topic;
  return `Good question — here's how this streaming chat is wired up, with the pieces that matter for "${t}".

**The stack**

1. The route handler calls the model with \`streamText\`.
2. The AI SDK converts the model's text stream into UI-message chunks.
3. \`useChat\` on the client renders each \`text-delta\` part as it arrives.

\`\`\`ts
const result = streamText({ model, system, messages, tools: TOOLS });
return createUIMessageStreamResponse({
  stream: toUIMessageStream({ stream: result.stream, sendReasoning: true }),
});
\`\`\`

**Tools** — say one of these to trigger a live tool call:

- \`audit omar320250068-prog/capstone-ai-track\` — GitHub health score + ring chart.
- \`audit fakeprov48/does-not-exist\` — the designed error state.
- \`check https://example.com\` — meta-tag findings table.

> Note: this reply is generated by the local demo stream because no \`ANTHROPIC_API_KEY\` is set on the server. The TOOLS themselves always run for real (live GitHub API / real pages). Deploy with the key and the same tools are chosen by Claude.

Things that were verified while building it:

- Tokens visibly arrive one chunk at a time.
- Stop mid-stream keeps the partial reply and the input stays usable.
- Scrolling up releases the auto-scroll pin; \`Jump to latest\` re-pins it.
- The thinking indicator hands off to the first token with a fade, no flicker.
- Tool states morph (input-streaming → input-available → output), never swap.`;
}

// ===========================================================================
// Stream construction
// ===========================================================================

type ToolIntent = Exclude<ReturnType<typeof detectToolIntent>, null>;

/** Build the tool-call TextStreamParts for a chosen intent. */
async function* toolFlow(
  intent: ToolIntent,
  cancelled: () => boolean,
): AsyncGenerator<TextStreamPart<ChatTools>, { output?: unknown; error?: string }, unknown> {
  const id = generateId();

  // 1. reasoning — the choosing moment ("what am I doing, and why").
  const reasoningId = generateId();
  yield { type: "reasoning-start", id: reasoningId };
  for (const chunk of wordChunks(toolReasoning(intent))) {
    if (cancelled()) return { error: "cancelled" };
    yield { type: "reasoning-delta", id: reasoningId, text: chunk };
    await sleep(12);
  }
  yield { type: "reasoning-end", id: reasoningId };

  // 2. input-streaming — the tool's JSON input assembles in front of you.
  const inputJson = JSON.stringify(intent.input);
  yield { type: "tool-input-start", id, toolName: intent.name };
  const inputDeltas: string[] = [];
  for (let i = 0; i < inputJson.length; i += 7) {
    inputDeltas.push(inputJson.slice(i, i + 7));
  }
  for (const delta of inputDeltas) {
    if (cancelled()) return { error: "cancelled" };
    yield { type: "tool-input-delta", id, delta };
    await sleep(INPUT_DELTA_MS);
  }
  yield { type: "tool-input-end", id };
  await sleep(INPUT_AVAILABLE_HOLD_MS); // hold the "with what input?" state

  // 3. input-available + real execution, branched so each emitted part type
  // matches the SDK's per-tool discriminated union exactly.
  if (intent.name === "audit_repo") {
    const input = intent.input;
    yield { type: "tool-call", toolCallId: id, toolName: "audit_repo", input };
    if (cancelled()) return { error: "cancelled" };
    try {
      const output = await executeAuditRepo(input);
      if (cancelled()) return { error: "cancelled" };
      yield { type: "tool-result", toolCallId: id, toolName: "audit_repo", input, output };
      return { output };
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : String(cause);
      yield { type: "tool-error", toolCallId: id, toolName: "audit_repo", input, error: cause instanceof Error ? cause : new Error(message) };
      return { error: message };
    }
  }

  const input = intent.input;
  yield { type: "tool-call", toolCallId: id, toolName: "site_meta", input };
  if (cancelled()) return { error: "cancelled" };
  try {
    const output = await executeSiteMeta(input);
    if (cancelled()) return { error: "cancelled" };
    yield { type: "tool-result", toolCallId: id, toolName: "site_meta", input, output };
    return { output };
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : String(cause);
    yield { type: "tool-error", toolCallId: id, toolName: "site_meta", input, error: cause instanceof Error ? cause : new Error(message) };
    return { error: message };
  }
}

/**
 * Build a TextStreamPart stream that mirrors what streamText emits.
 * Tool turns: start -> reasoning* -> tool-input-delta* -> tool-call ->
 * tool-result/tool-error -> text-delta* -> finish. Plain turns keep the
 * existing start -> reasoning* -> text-delta* -> finish shape.
 * The stream is abortable (the client's "Stop" aborts the fetch, which
 * cancels this ReadableStream).
 */
export function mockTextStream(messages: UIMessage[]): ReadableStream<TextStreamPart<ChatTools>> {
  const topic = lastUserText(messages);
  const intent = detectToolIntent(topic);

  let cancelled = false;

  return new ReadableStream<TextStreamPart<ChatTools>>({
    start: async (controller) => {
      try {
        controller.enqueue({ type: "start" });

        if (!intent) {
          const reasoning = `The reviewer is asking about "${topic}". Answering concisely with a code walkthrough and a short checklist, in markdown.`;
          const reply = demoReply(topic);

          const reasoningId = generateId();
          controller.enqueue({ type: "reasoning-start", id: reasoningId });
          for (const chunk of wordChunks(reasoning)) {
            if (cancelled) return;
            controller.enqueue({ type: "reasoning-delta", id: reasoningId, text: chunk });
            await sleep(12);
          }
          controller.enqueue({ type: "reasoning-end", id: reasoningId });

          const textId = generateId();
          controller.enqueue({ type: "text-start", id: textId });
          for (const chunk of wordChunks(reply)) {
            if (cancelled) return;
            controller.enqueue({ type: "text-delta", id: textId, text: chunk });
            await sleep(WORD_DELAY_MS);
          }
          controller.enqueue({ type: "text-end", id: textId });
        } else {
          const flow = toolFlow(intent, () => cancelled);

          let narration = "";
          let finished = false;
          while (!finished) {
            const next = await flow.next();
            finished = !!next.done;
            if (!next.done) controller.enqueue(next.value);
            else if (next.value?.output !== undefined) narration = resultNarration(next.value.output as AuditResult | SiteMetaResult);
            else if (next.value?.error && next.value.error !== "cancelled") narration = errorNarration(intent);
          }

          // Stream the narration text after the tool artifacts, word by word.
          const textId = generateId();
          controller.enqueue({ type: "text-start", id: textId });
          for (const chunk of wordChunks(narration)) {
            if (cancelled) return;
            controller.enqueue({ type: "text-delta", id: textId, text: chunk });
            await sleep(WORD_DELAY_MS);
          }
          controller.enqueue({ type: "text-end", id: textId });
        }

        controller.enqueue({
          type: "finish",
          finishReason: "stop",
          rawFinishReason: "stop",
          totalUsage: {
            inputTokens: 0,
            inputTokenDetails: { noCacheTokens: 0, cacheReadTokens: 0, cacheWriteTokens: 0 },
            outputTokens: 0,
            outputTokenDetails: { textTokens: 0, reasoningTokens: 0 },
            totalTokens: 0,
          },
        });

        controller.close();
      } catch {
        if (!cancelled) controller.error(new Error("mock stream failed"));
      }
    },
    cancel() {
      // Aborted mid-stream (Stop button / unmount): stop emitting immediately.
      cancelled = true;
    },
  });
}

/** Chunk a string into words with their trailing whitespace/newlines kept. */
function wordChunks(text: string): string[] {
  return text.match(/\S+\s*/g) ?? [text];
}
