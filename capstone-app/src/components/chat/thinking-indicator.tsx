"use client";

// Thinking indicator rendered while the model produces reasoning parts
// (or while the client waits for the first token). It shares a container
// slot with the message text, so the handoff indicator -> tokens is a
// single cross-fade and never a flicker gap.

type ThinkingIndicatorProps = {
  label?: string;
};

export default function ThinkingIndicator({ label = "Thinking" }: ThinkingIndicatorProps) {
  return (
    <span
      role="status"
      aria-live="polite"
      aria-label={`${label}…`}
      className="inline-flex items-center gap-2"
    >
      <span className="flex items-center gap-1">
        {[0, 1, 2].map((dot) => (
          <span
            key={dot}
            aria-hidden="true"
            className="animate-chat-think size-1.5 rounded-full bg-brand-500"
            style={{ animationDelay: `${dot * 140}ms` }}
          />
        ))}
      </span>
      <span className="text-xs font-medium text-ink-500">{label}…</span>
    </span>
  );
}