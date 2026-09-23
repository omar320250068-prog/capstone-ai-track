import PageHeader from "@/components/page-header";

const PHASES = [
  {
    phase: "Setup",
    prompt: "Create the repo, CLAUDE.md and README; commit with conventional messages.",
    outcome: "Public GitHub repo with 4 commits and a reviewed README.",
  },
  {
    phase: "Foundations · drill",
    prompt: "Build a settings form twice — once from a vague prompt, once from a precise one.",
    outcome: "WORKFLOW.md comparing both runs + project rules learned.",
  },
  {
    phase: "Foundations · assignment",
    prompt: "Build a similar React app independently, documenting AI use.",
    outcome: "A testable React app with prompts, explanations and manual fixes.",
  },
  {
    phase: "Foundations · deployment",
    prompt: "Scaffold a Next.js app with routes, layout, health check and a live preview.",
    outcome: "This site — built from a spec in SPEC.md and deployed.",
  },
] as const;

export default function Workflow() {
  return (
    <>
      <PageHeader
        eyebrow="Workflow"
        title="How the project is being built."
        description="Every phase follows the same loop: write a precise prompt from SPEC.md, run it, verify with a build or tests, then commit with a conventional message."
      />
      <ol className="space-y-4">
        {PHASES.map(({ phase, prompt, outcome }, index) => (
          <li
            key={phase}
            className="rounded-xl border border-ink-300/40 bg-surface-1 p-5"
          >
            <div className="flex items-baseline gap-3">
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-brand-500 text-xs font-bold text-white">
                {index + 1}
              </span>
              <h2 className="font-semibold text-ink-900">{phase}</h2>
            </div>
            <p className="mt-3 text-sm text-ink-500">
              <span className="font-medium text-ink-700">Prompt:</span> {prompt}
            </p>
            <p className="mt-1 text-sm text-ink-500">
              <span className="font-medium text-ink-700">Outcome:</span> {outcome}
            </p>
          </li>
        ))}
      </ol>
      <p className="mt-4 text-sm text-ink-500">
        The full comparison lives in <code className="font-mono text-ink-700">WORKFLOW.md</code> at
        the repo root.
      </p>
    </>
  );
}