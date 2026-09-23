"use client";

import { useRouter } from "next/navigation";

export function RefreshButton() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.refresh()}
      className="rounded-lg border border-ink-300/40 bg-surface-0 px-4 py-2 text-sm font-medium text-ink-700 transition-colors hover:border-brand-300 hover:text-ink-900"
    >
      Refresh data
    </button>
  );
}