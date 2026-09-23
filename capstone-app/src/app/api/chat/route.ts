// ---------------------------------------------------------------------------
// POST /api/chat — the streaming chat route handler.
//
// Reads the conversation from the client, picks a backend from the config
// module, and returns an SSE-encoded UI message stream that `useChat`
// consumes. The response is one long stream: client renders text-delta parts
// as they arrive; "Stop" aborts the fetch, cancelling the underlying stream.
//
// The API key is read server-side only (by @ai-sdk/anthropic from
// process.env.ANTHROPIC_API_KEY). No secret is ever exposed to the browser.
// ---------------------------------------------------------------------------

import { createAnthropic } from "@ai-sdk/anthropic";
import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  streamText,
  toUIMessageStream,
  type UIMessage,
} from "ai";
import {
  CHAT_MODEL_ID,
  ENABLE_THINKING,
  MAX_OUTPUT_TOKENS,
  SYSTEM_PROMPT,
  TEMPERATURE,
  THINKING_BUDGET_TOKENS,
  chatBackend,
} from "@/lib/ai/config";
import { mockTextStream } from "@/lib/ai/mock";

/** Cap the handler at ~1 minute on platforms that enforce a timeout. */
export const maxDuration = 60;

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | { messages?: UIMessage[] }
    | null;

  const messages = Array.isArray(body?.messages) ? body.messages : [];

  const uiStream = toUIMessageStream({
    // Gate which parts the client receives: reasoning enables the thinking
    // indicator, start/finish parts let useChat reflect status accurately.
    sendStart: true,
    sendReasoning: true,
    sendSources: true,
    originalMessages: messages,
    // Never leak stack traces to the client; surface a human-readable string.
    onError: (error: unknown) => {
      const detail = error instanceof Error ? error.message : String(error);
      return `The stream failed: ${detail}. Please try again.`;
    },
    stream:
      chatBackend() === "mock"
        ? mockTextStream(messages)
        : await claudeTextStream(messages),
  });

  return createUIMessageStreamResponse({ stream: uiStream });
}

/** Real Claude path: streamText from the AI SDK, fed by the Anthropic provider. */
async function claudeTextStream(messages: UIMessage[]) {
  const anthropic = createAnthropic();

  const result = streamText({
    model: anthropic(CHAT_MODEL_ID),
    system: SYSTEM_PROMPT,
    messages: await convertToModelMessages(messages),
    temperature: TEMPERATURE,
    maxOutputTokens: MAX_OUTPUT_TOKENS,
    // Extended thinking (ANTHROPIC_THINKING=1) makes Claude emit reasoning
    // parts first — the client shows a thinking indicator before the first
    // token, then hands off into the text stream.
    providerOptions: ENABLE_THINKING
      ? {
          anthropic: {
            thinking: { type: "enabled", budgetTokens: THINKING_BUDGET_TOKENS },
          },
        }
      : {},
  });

  return result.stream;
}