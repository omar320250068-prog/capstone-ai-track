"use client";

// Chat input: an auto-growing textarea plus a single action control that
// toggles Send / Stop based on stream status. The Stop button is treated as
// state, not skin: when it fires, the partial message already rendered stays
// in the list, the textarea keeps focus, and the next send works — nothing
// else in this component assumes "stopped" is special.
//
// Keyboard: Enter sends, Shift+Enter inserts a newline (standard chat UX).

import { useRef } from "react";

type ComposerProps = {
  input: string;
  setInput: (value: string) => void;
  isBusy: boolean;
  onSubmit: () => void;
  onStop: () => void;
};

export default function Composer({ input, setInput, isBusy, onSubmit, onStop }: ComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const canSend = input.trim().length > 0 && !isBusy;

  const autogrow = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 176)}px`;
  };

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (canSend) onSubmit();
      }}
      className="border-t border-ink-300/40 bg-surface-0 p-3 sm:p-4"
    >
      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={input}
          rows={1}
          aria-label="Message"
          placeholder="Ask about the capstone…"
          className="max-h-44 min-h-10 flex-1 resize-none rounded-xl border border-ink-300/40 bg-surface-1 px-3 py-2.5 text-[15px] text-ink-900 outline-none placeholder:text-ink-500 focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
          onChange={(event) => {
            setInput(event.target.value);
            autogrow();
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              if (canSend) onSubmit();
            }
          }}
        />
        {isBusy ? (
          <button
            type="button"
            onClick={onStop}
            aria-label="Stop generating"
            className="grid size-10 shrink-0 place-items-center rounded-xl bg-ink-900 text-white transition-colors hover:bg-danger-500"
          >
            <span aria-hidden="true" className="block size-3 rounded-[2px] bg-current" />
          </button>
        ) : (
          <button
            type="submit"
            disabled={!canSend}
            aria-label="Send message"
            className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-600 text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-40 enabled:hover:bg-brand-700"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="size-4 fill-current"
              role="presentation"
            >
              <path d="M3.4 20.4 22 12 3.4 3.6l-.01 6.53L15 12 3.39 13.87z" />
            </svg>
          </button>
        )}
      </div>
      <p className="mt-2 text-right text-xs text-ink-500">
        Enter to send · Shift + Enter for a new line
      </p>
    </form>
  );
}