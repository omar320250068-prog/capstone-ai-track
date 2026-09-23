"use client";

// One chat bubble. Distinct treatment for user vs assistant, distinct
// treatment for "thinking" (indicator), "streaming" (raw buffered text +
// caret) and "done" (markdown). The indicator and the text share the same
// container and hand off with a 180ms fade — never a blank frame.

import type { UIMessage } from "ai";
import { MarkdownText, StreamingCaret, StreamingText } from "./message-content";
import ThinkingIndicator from "./thinking-indicator";

type MessageItemProps = {
  message: UIMessage;
  /** True only for the assistant message currently being generated. */
  isStreaming: boolean;
};

export default function MessageItem({ message, isStreaming }: MessageItemProps) {
  const isUser = message.role === "user";

  const text = message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("");

  const thinking = message.parts
    .filter((part) => part.type === "reasoning")
    .map((part) => part.text)
    .join("");

  const hasText = text.length > 0;
  const isThinking = thinking.length > 0;

  // Indicator states:
  //  - reasoning parts still streaming in (real extended thinking, or the
  //    mock's reasoning preamble), no token yet
  //  - or: fetch in flight and no part arrived yet ("thinking" while the
  //    server warms up / before the first token)
  const showIndicator = isStreaming && !hasText;
  const indicatorLabel = isThinking ? "Thinking" : "Working";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`animate-chat-fade-in max-w-[88%] rounded-2xl px-4 py-3 sm:max-w-[76%] ${
          isUser
            ? "rounded-br-sm bg-brand-600 text-white"
            : "rounded-bl-sm border border-ink-300/40 bg-surface-1"
        }`}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap text-white">{text}</p>
        ) : showIndicator ? (
          // Same container slot as the text below -> smooth handoff.
          <ThinkingIndicator label={indicatorLabel} />
        ) : isStreaming && hasText ? (
          <div className="flex items-start gap-0.5">
            <StreamingText text={text} />
            <StreamingCaret />
          </div>
        ) : (
          <MarkdownText text={text} />
        )}
      </div>
    </div>
  );
}