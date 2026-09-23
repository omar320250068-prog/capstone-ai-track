import Link from "next/link";
import PageHeader from "@/components/page-header";

const SECTIONS = [
  {
    href: "/chat",
    title: "Streaming chat",
    description: "The capstone's central AI interaction — live token-by-token streaming with Stop and auto-scroll.",
  },
  {
    href: "/workflow",
    title: "Workflow",
    description: "How this app was built — prompt, scaffold, test, deploy.",
  },
  {
    href: "/health",
    title: "Health check",
    description: "Live status page that pings a public API on the server.",
  },
  {
    href: "/settings",
    title: "Settings",
    description: "Placeholder for the server-rendered settings surface.",
  },
  {
    href: "/changelog",
    title: "Changelog",
    description: "Version history tracking each phase of the project.",
  },
] as const;

export default function Home() {
  return (
    <>
      <PageHeader
        eyebrow="AI-assisted deployment"
        title="Ship a Next.js app on day one."
        description="Routes, a shared layout with navigation, Tailwind design tokens, a server-only health check, a streaming chat, and a live preview — scaffolded and deployed on day one of the capstone."
      />
      <div className="grid gap-4 sm:grid-cols-2">
        {SECTIONS.map(({ href, title, description }) => (
          <Link
            key={href}
            href={href}
            className="group rounded-xl border border-ink-300/40 bg-surface-1 p-5 transition-colors hover:border-brand-300 hover:bg-brand-50"
          >
            <h2 className="flex items-center gap-2 font-semibold text-ink-900">
              {title}
              <span className="text-brand-500 transition-transform group-hover:translate-x-0.5">
                →
              </span>
            </h2>
            <p className="mt-1 text-sm text-ink-500">{description}</p>
          </Link>
        ))}
      </div>
    </>
  );
}