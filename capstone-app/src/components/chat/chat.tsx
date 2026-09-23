"use client";

// Streaming chat client. Owns the useChat state machine and the small bits
// of polish around it: thinking indicator, buffered (non-markdown) streaming
// text, snapshot-pinned auto-scroll with "jump to latest", a stop button
// that preserves state, and localStorage persistence so a refresh mid-
// conversation does not lose it.
//
// The API key never appears here: this component talks to /api/chat, and the
// key (or the mock fallback) is decided server-side.

import { useChat } from "@ai-sdk/react";
import type { UIMessage } from "ai";
import { useEffect, useRef, useState } from "react";
import ChatView, { type ChatViewHandle } from "./chat-view";
import Composer from "./composer";
import MessageItem from "./message-item";

const STORAGE_KEY = "capstone.chat.messages.v1";

function loadStoredMessages(): UIMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as UIMessage[]) : [];
  } catch {
    return [];
  }
}

export type ChatMode = "mock" | "anthropic";

type ChatProps = {
  /** Decided server-side by src/lib/ai/config. */
  mode: ChatMode;
};

export default function Chat({ mode }: ChatProps) {
  const [stored, setStored] = useState<UIMessage[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Load localStorage only after mount so server render and client
  // hydration never disagree (no hydration mismatch).
  useEffect(() => {
    setStored(loadStoredMessages());
    setHydrated(true);
  }, []);

  const {
    messages,
    status,
    stop,
    error,
    clearError,
    setMessages,
    sendMessage,
  } = useChat({});

  // v7 useChat is a controlled chat: the input text is plain component state,
  // and sendMessage triggers the stream. This also keeps the input usable
  // before/during/after streaming by construction.
  const [input, setInput] = useState("");

  const viewRef = useRef<ChatViewHandle>(null);
  const persistGuard = useRef<string>("");

  // Persist every change (debounced by content equality).
  useEffect(() => {
    const serialized = JSON.stringify(messages);
    if (serialized === persistGuard.current) return;
    persistGuard.current = serialized;
    try {
      window.localStorage.setItem(STORAGE_KEY, serialized);
    } catch {
      // Storage full / private mode: the conversation stays in memory.
    }
  }, [messages]);

  // A refresh mid-conversation restores the last state (stretch goal:
  // refresh is not a data-loss event).
  useEffect(() => {
    if (hydrated && stored.length > 0 && messages.length === 0) {
      setMessages(stored);
    }
  }, [hydrated, stored, messages.length, setMessages]);

  const isBusy = status === "submitted" || status === "streaming";
  const isMock = mode === "mock";

  const handleSend = () => {
    if (!input.trim() || isBusy) return;
    void sendMessage({ text: input });
    setInput("");
    viewRef.current?.pin();
  };

  const handleNewChat = () => {
    setMessages([]);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore storage failures; reset still clears the in-memory chat.
    }
  };

  return (
    <div className="flex h-[calc(100dvh-20rem)] min-h-[24rem] flex-col overflow-hidden rounded-2xl border border-ink-300/40 bg-surface-1 shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-ink-300/40 bg-surface-0 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <span className="grid size-8 place-items-center rounded-lg bg-brand-500/10 text-brand-600">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="size-4 fill-current"
              role="presentation"
            >
              <path d="M4 4h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-6.6l-3.9 3.9a1 1 0 0 1-1.7-.7V17H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
            </svg>
          </span>
          <div className="leading-tight">
            <p className="text-sm font-semibold text-ink-900">Streaming chat</p>
            <p className={`text-xs font-medium ${isMock ? "text-warn-500" : "text-ok-500"}`}>
              {isMock
                ? "demo stream · server has no API key"
                : "Claude via the AI SDK"}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleNewChat}
          className="rounded-lg border border-ink-300/40 px-3 py-1.5 text-xs font-medium text-ink-700 transition-colors hover:border-brand-300 hover:text-ink-900"
        >
          New chat
        </button>
      </div>

      <ChatView
        ref={viewRef}
        hasContent={messages.length > 0}
      >
        {messages.length === 0 ? (
          <div className="mx-auto max-w-md space-y-2 pt-6 text-center">
            <p className="text-sm text-ink-500">
              Start a conversation about the capstone — the route handler streams
              the reply token by token, and you can stop it mid-stream.
            </p>
          </div>
        ) : null}
        {messages.map((message, index) => {
          const isLast = index === messages.length - 1;
          const isStreaming =
            isLast && message.role === "assistant" && (status === "submitted" || status === "streaming");
          return <MessageItem key={message.id} message={message} isStreaming={isStreaming} />;
        })}
      </ChatView>

      {error ? (
        <div
          role="alert"
          className="flex items-center justify-between gap-3 border-t border-ink-300/40 bg-danger-500/5 px-4 py-2 text-sm text-danger-500 sm:px-6"
        >
          <span>{error.message}</span>
          <button
            type="button"
            onClick={clearError}
            className="rounded px-2 py-0.5 text-xs font-medium underline underline-offset-2 hover:text-ink-900"
          >
            Dismiss
          </button>
        </div>
      ) : null}

      <Composer
        input={input}
        setInput={setInput}
        isBusy={isBusy}
        onSubmit={handleSend}
        onStop={() => stop()}
      />
    </div>
  );
}