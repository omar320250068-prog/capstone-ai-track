import PageHeader from "@/components/page-header";

const ENTRIES = [
  {
    version: "0.1.0",
    date: "2026-09-23",
    title: "Day-one deployment scaffold",
    notes: [
      "Next.js 16 app with App Router, TypeScript and Turbopack",
      "Root layout with sticky navigation and footer",
      "Design tokens via Tailwind v4 @theme",
      "/api/health route + /health page fetching live data",
      "vercel.json rootDirectory for monorepo deploy",
    ],
  },
  {
    version: "0.0.1",
    date: "2026-09-22",
    title: "Repo bootstrap",
    notes: [
      "Public capstone-ai-track repository created",
      "CLAUDE.md project rules + reviewed README",
    ],
  },
] as const;

export default function Changelog() {
  return (
    <>
      <PageHeader
        eyebrow="Changelog"
        title="What shipped, and when."
        description="Kept by hand for the capstone; every entry maps to a conventional commit in the repository."
      />
      <ol className="space-y-4">
        {ENTRIES.map(({ version, date, title, notes }) => (
          <li key={version} className="rounded-xl border border-ink-300/40 bg-surface-1 p-5">
            <div className="flex flex-wrap items-baseline gap-2">
              <h2 className="font-semibold text-ink-900">{title}</h2>
              <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-medium text-brand-700">
                v{version}
              </span>
              <time className="text-xs text-ink-500">{date}</time>
            </div>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-ink-500">
              {notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </>
  );
}