"use client";

// Auto-scroll / pin implementation — the mentor rule, taken literally:
//   * The view is pinned to the bottom only while the user is already at the
//     bottom (the pin holds through layout growth, i.e. while tokens stream).
//   * The pin releases the MOMENT the user scrolls up (detected from a real
//     scroll-up delta, not from position — growth must not release it).
//   * A "Jump to latest" affordance appears when unpinned, and re-pins on click.
//
// Pinned is therefore user INTENT, not a derived position. Position-derived
// checks (e.g. an IntersectionObserver on a bottom sentinel) quietly fail the
// streaming case: appended tokens push the sentinel out of view without any
// user action, which releases the pin exactly when it should hold.

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type ChatViewHandle = {
  /** Re-pin: jump to the bottom instantly and keep the pin held. */
  pin: () => void;
};

type ChatViewProps = {
  children: ReactNode;
  /** True once there is any content worth scrolling to. */
  hasContent: boolean;
};

const ChatView = forwardRef<ChatViewHandle, ChatViewProps>(function ChatView(
  { children, hasContent },
  ref,
) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const lastScrollTopRef = useRef(0);
  const [pinned, setPinned] = useState(true);

  // Scroll listener: only two things may change the pin.
  //   - a real scroll-UP (delta < 0) releases it
  //   - arriving back at the bottom re-engages it
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    lastScrollTopRef.current = viewport.scrollTop;

    const onScroll = () => {
      const top = viewport.scrollTop;
      const max = viewport.scrollHeight - viewport.clientHeight;
      if (top < lastScrollTopRef.current - 1) {
        setPinned(false);
      } else if (top >= max - 4) {
        setPinned(true);
      }
      lastScrollTopRef.current = top;
    };

    viewport.addEventListener("scroll", onScroll, { passive: true });
    return () => viewport.removeEventListener("scroll", onScroll);
  }, []);

  // While pinned, every content change (each streamed token) snaps to bottom.
  // When unpinned, this effect is a no-op — the user's scroll position is
  // never fought with, no matter how much the stream grows.
  useEffect(() => {
    if (!pinned) return;
    const viewport = viewportRef.current;
    if (viewport) viewport.scrollTo({ top: viewport.scrollHeight, behavior: "auto" });
  }, [children, pinned]);

  const pin = () => {
    setPinned(true);
    const viewport = viewportRef.current;
    if (viewport) viewport.scrollTo({ top: viewport.scrollHeight, behavior: "auto" });
  };

  useImperativeHandle(ref, () => ({ pin }), [pin]);

  // Re-pinning is instant on purpose: while tokens keep arriving, a smooth
  // scroll animates toward a stale target and can land above the new bottom,
  // leaving the pin disengaged. pin() always snaps to the live bottom.
  const jumpToLatest = () => pin();

  const showJump = !pinned && hasContent;

  return (
    <div className="relative min-h-0 flex-1">
      <div
        ref={viewportRef}
        className="h-full overflow-y-auto overscroll-contain px-4 sm:px-6"
      >
        <div className="space-y-4 py-4">{children}</div>
      </div>

      {showJump ? (
        <button
          type="button"
          onClick={jumpToLatest}
          data-testid="jump-to-latest"
          className="absolute -top-3 left-1/2 z-10 -translate-x-1/2 rounded-full border border-ink-300/40 bg-surface-0 px-3 py-1 text-xs font-medium text-ink-500 shadow-sm transition-colors hover:border-brand-300 hover:text-ink-900"
        >
          Jump to latest ↓
        </button>
      ) : null}
    </div>
  );
});

export default ChatView;