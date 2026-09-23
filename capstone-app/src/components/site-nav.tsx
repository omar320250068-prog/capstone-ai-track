import Link from "next/link";
import { NAV_LINKS } from "@/lib/nav";

export default function SiteNav() {
  return (
    <nav className="sticky top-0 z-10 border-b border-ink-300/40 bg-surface-0/95 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-4xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 font-semibold text-ink-900"
        >
          <span className="grid size-6 place-items-center rounded bg-brand-500 text-xs font-bold text-white">
            A
          </span>
          Capstone App
        </Link>
        <div className="flex items-center gap-1 overflow-x-auto text-sm sm:gap-2">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="rounded px-2 py-1 text-ink-500 transition-colors hover:bg-surface-2 hover:text-ink-900 sm:px-3"
            >
              {label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}