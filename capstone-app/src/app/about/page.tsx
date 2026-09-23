import PageHeader from "@/components/page-header";

const STACK = [
  { name: "Next.js 16", detail: "App Router + TypeScript + Turbopack" },
  { name: "React 19", detail: "Server Components by default" },
  { name: "Tailwind CSS 4", detail: "CSS-first design tokens via @theme" },
  { name: "Node.js 24", detail: "Runtime for build, dev and preview" },
];

export default function About() {
  return (
    <>
      <PageHeader
        eyebrow="About"
        title="A small app that proves the whole deploy path."
        description="The capstone track is about using AI as a daily engineering partner. This project is that workflow made deployable: every page is a Server Component, secrets never ship to the browser, and the health page fetches real data from the server."
      />
      <div className="grid gap-4 sm:grid-cols-2">
        {STACK.map(({ name, detail }) => (
          <div
            key={name}
            className="rounded-xl border border-ink-300/40 bg-surface-1 p-5"
          >
            <h2 className="font-semibold text-ink-900">{name}</h2>
            <p className="mt-1 text-sm text-ink-500">{detail}</p>
          </div>
        ))}
      </div>
      <p className="mt-6 text-sm text-ink-500">
        Author: Omar Hindawy ·{" "}
        <a
          href="https://github.com/omar320250068-prog/capstone-ai-track"
          className="underline underline-offset-2 hover:text-ink-700"
        >
          capstone-ai-track
        </a>
      </p>
    </>
  );
}