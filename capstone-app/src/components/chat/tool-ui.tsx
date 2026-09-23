"use client";

// Tool lifecycle UI — the "generative UI" face of the tools phase.
//
// A tool part travels four states on the wire (input-streaming -> input-
// available -> output-available | output-error). Each state answers a
// different reviewer question, and each gets a genuinely different layout:
//
//   input-streaming  "what is it doing?"   amber rail + shimmer + the JSON
//                                          input assembling with a caret
//   input-available  "with what input?"    chip grid of captured values +
//                                          dashed "awaiting" status line
//   output-available "what came back?"     a real component per tool:
//                                          AuditCard (SVG ring chart + metric
//                                          grid + findings) / MetaTable
//   output-error     "what went wrong?"    pale-rose panel, friendly message
//                                          and the exact retry command
//
// The one part that never appears is "a JSON dump". Even the unknown-tool
// fallback renders a designed key:value definition list.
//
// Transitions: the wrapper is keyed by toolCallId (stable across states) and
// the inner block is keyed by state, so state changes crossfade in 200ms via
// `animate-tool-fade-in` instead of swapping (mentor's motion tip).

import type { AuditFinding, AuditResult, SiteMetaResult } from "@/lib/ai/tools";

/** Runtime snapshot of a tool part, narrowed from a UIMessage part. */
export type ToolPartSnapshot = {
  type: string;
  toolCallId: string;
  state:
    | "input-streaming"
    | "input-available"
    | "approval-requested"
    | "approval-responded"
    | "output-available"
    | "output-error"
    | "output-denied";
  input?: unknown;
  output?: unknown;
  errorText?: string;
};

const TOOL_FIELDS: Record<string, Array<{ field: string; label: string }>> = {
  audit_repo: [
    { field: "owner", label: "owner" },
    { field: "repo", label: "repo" },
  ],
  site_meta: [{ field: "url", label: "url" }],
};

const TOOL_VERB: Record<string, string> = {
  audit_repo: "audit",
  site_meta: "read the meta tags of",
};

type ToolUIProps = { part: ToolPartSnapshot };

export default function ToolUI({ part }: ToolUIProps) {
  const toolName = part.type.replace(/^tool-/, "");
  const { state } = part;

  const regionLabel =
    state === "input-streaming"
      ? `${toolName} is running`
      : state === "input-available"
        ? `${toolName} input received`
        : state === "output-available"
          ? `${toolName} result`
          : state === "output-error"
            ? `${toolName} failed`
            : `tool ${toolName} pending`;

  // Stable container across states (toolCallId), 200ms crossfade on state.
  return (
    <section
      aria-label={regionLabel}
      className="animate-tool-fade-in overflow-hidden"
    >
      <div key={state} className="animate-tool-fade-in">
        {state === "input-streaming" ? (
          <ToolInputStreaming toolName={toolName} input={part.input} />
        ) : state === "input-available" ? (
          <ToolInputAvailable toolName={toolName} input={part.input} />
        ) : state === "output-available" ? (
          <ToolOutput toolName={toolName} output={part.output} />
        ) : state === "output-error" ? (
          <ToolError toolName={toolName} verb={TOOL_VERB[toolName] ?? toolName} errorText={part.errorText} />
        ) : (
          <ToolPending toolName={toolName} />
        )}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// State 1 — input-streaming
// ---------------------------------------------------------------------------

function ToolInputStreaming({ toolName, input }: { toolName: string; input?: unknown }) {
  const partial = renderPartialInput(input);
  return (
    <div className="border-l-4 border-amber-400 bg-amber-400/5 px-3 py-2.5">
      <div className="flex items-center gap-2">
        <ScanningDots />
        <span className="font-mono text-xs font-semibold text-amber-700">
          {toolName}
        </span>
        <span className="text-xs font-medium text-ink-500">
          assembling request
        </span>
      </div>
      {partial ? (
        <pre className="mt-2 overflow-hidden text-ellipsis whitespace-pre font-mono text-[0.8rem] leading-relaxed text-ink-700">
          {partial}
          <span aria-hidden="true" className="animate-chat-caret text-amber-600" role="presentation">
            ▍
          </span>
        </pre>
      ) : (
        <div className="mt-2 space-y-1.5" aria-hidden="true">
          <div className="tool-shimmer h-3 w-11/12 rounded" />
          <div className="tool-shimmer h-3 w-7/12 rounded" />
        </div>
      )}
    </div>
  );
}

/** Compact pretty JSON of whatever the model has produced so far. */
function renderPartialInput(input: unknown): string | null {
  if (input === undefined || input === null) return null;
  if (typeof input === "object") {
    const json = JSON.stringify(input);
    return json && json !== "{}" ? json : null;
  }
  return String(input);
}

function ScanningDots() {
  return (
    <span aria-hidden="true" className="inline-flex gap-0.5" role="presentation">
      <span className="tool-scan-dot" />
      <span className="tool-scan-dot" style={{ animationDelay: "160ms" }} />
      <span className="tool-scan-dot" style={{ animationDelay: "320ms" }} />
    </span>
  );
}

// ---------------------------------------------------------------------------
// State 2 — input-available
// ---------------------------------------------------------------------------

function ToolInputAvailable({ toolName, input }: { toolName: string; input?: unknown }) {
  const fields = TOOL_FIELDS[toolName] ?? [];
  const record = toRecord(input);
  return (
    <div className="border-l-4 border-indigo-300 bg-surface-0 px-3 py-2.5">
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-xs font-semibold text-brand-600">{toolName}</span>
        <span className="text-[0.7rem] font-medium uppercase tracking-wide text-ink-400">
          input captured
        </span>
      </div>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {fields.length > 0 ? (
          fields.map(({ field, label }) => {
            const value = record?.[field];
            return (
              <span
                key={field}
                className="inline-flex items-center gap-1.5 rounded-lg border border-ink-300/40 bg-surface-1 px-2 py-1 font-mono text-xs text-ink-800"
              >
                <span className="text-ink-400">{label}:</span>
                <span className="font-medium">{value === undefined ? "…" : String(value)}</span>
              </span>
            );
          })
        ) : (
          <span className="rounded-lg border border-ink-300/40 bg-surface-1 px-2 py-1 font-mono text-xs text-ink-700">
            {jsonPreview(input)}
          </span>
        )}
      </div>
      <div className="mt-2 border-t border-dashed border-ink-300/60 pt-1.5 text-[0.7rem] font-medium text-ink-400">
        request sent → awaiting response
      </div>
    </div>
  );
}

function toRecord(input: unknown): Record<string, unknown> | null {
  return typeof input === "object" && input !== null ? (input as Record<string, unknown>) : null;
}

function jsonPreview(value: unknown): string {
  try {
    const json = JSON.stringify(value);
    return json && json.length > 48 ? `${json.slice(0, 48)}…` : (json ?? "—");
  } catch {
    return String(value);
  }
}

// ---------------------------------------------------------------------------
// State 3 — output-available (the real components)
// ---------------------------------------------------------------------------

function ToolOutput({ toolName, output }: { toolName: string; output?: unknown }) {
  if (isAuditResult(output)) return <AuditCard result={output} />;
  if (isSiteMetaResult(output)) return <MetaTable result={output} />;
  return <GenericResult toolName={toolName} output={output} />;
}

function isAuditResult(output: unknown): output is AuditResult {
  return (
    typeof output === "object" &&
    output !== null &&
    "grade" in output &&
    "score" in output &&
    typeof (output as AuditResult).score === "number"
  );
}

function isSiteMetaResult(output: unknown): output is SiteMetaResult {
  return (
    typeof output === "object" &&
    output !== null &&
    "finalUrl" in output &&
    "ok" in output &&
    typeof (output as SiteMetaResult).status === "number"
  );
}

const compact = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" });
}

function gradeColor(grade: AuditResult["grade"]): string {
  if (grade === "A") return "bg-ok-500/15 text-ok-600";
  if (grade === "B") return "bg-brand-500/15 text-brand-700";
  if (grade === "C") return "bg-amber-400/20 text-amber-700";
  return "bg-danger-500/15 text-danger-600";
}

/** audit_repo result — score card with hand-rolled SVG ring chart. */
function AuditCard({ result }: { result: AuditResult }) {
  const { score, grade, metrics, findings } = result;
  const badgeColor = gradeColor(grade);

  const ringRadius = 26;
  const ringLength = 2 * Math.PI * ringRadius;
  const dash = (score / 100) * ringLength;

  return (
    <article className="border border-ink-200 bg-surface-0 p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-semibold text-brand-600">audit_repo</span>
            <span className="rounded-md bg-ink-100 px-1.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-ink-500">
              result
            </span>
          </div>
          <h4 className="truncate font-mono text-sm font-semibold text-ink-900">{result.repo}</h4>
        </div>
        <div
          className="relative grid size-16 shrink-0 place-items-center"
          role="img"
          aria-label={`Health score ${score} out of 100, grade ${grade}`}
        >
          <svg viewBox="0 0 60 60" className="size-16 -rotate-90" aria-hidden="true">
            <circle cx="30" cy="30" r={ringRadius} fill="none" strokeWidth="6" className="stroke-ink-200" />
            <circle
              cx="30"
              cy="30"
              r={ringRadius}
              fill="none"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${dash} ${ringLength - dash}`}
              className={grade === "A" ? "stroke-ok-500" : grade === "B" ? "stroke-brand-500" : grade === "C" ? "stroke-amber-400" : "stroke-danger-500"}
            />
          </svg>
          <div className="absolute inset-0 grid place-items-center">
            <span className="text-base font-bold text-ink-900">{score}</span>
          </div>
        </div>
      </div>

      <div className="mt-2 flex items-start gap-2">
        <span className={`mt-0.5 rounded-md px-1.5 py-0.5 text-xs font-bold ${badgeColor}`}>
          grade {grade}
        </span>
        <p className="text-xs leading-relaxed text-ink-700">{result.summary}</p>
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 sm:grid-cols-3">
        <Metric label="Stars" value={compact.format(metrics.stars)} />
        <Metric label="Open issues" value={String(metrics.openIssues)} />
        <Metric label="Last push" value={formatDate(metrics.lastPush)} />
        <Metric label="License" value={metrics.license ? metrics.license.toUpperCase() : "missing"} absent={!metrics.license} />
        <Metric label="CI (Actions)" value={metrics.hasCI === null ? "unverified" : metrics.hasCI ? "present" : "missing"} absent={metrics.hasCI === false} />
        <Metric label="Archived" value={metrics.archived ? "yes" : "no"} />
      </dl>

      {findings.length > 0 ? (
        <ul className="mt-3 space-y-1.5 border-t border-ink-200 pt-2.5">
          {findings.map((finding, index) => (
            <FindingRow key={`${finding.label}-${index}`} finding={finding} />
          ))}
        </ul>
      ) : null}

      <p className="mt-3 text-[0.65rem] font-medium text-ink-400">
        fetched from the live GitHub API in {result.fetchedInMs} ms
      </p>
    </article>
  );
}

function Metric({ label, value, absent }: { label: string; value: string; absent?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="text-[0.65rem] font-semibold uppercase tracking-wide text-ink-400">{label}</dt>
      <dd className={`truncate text-sm font-medium ${absent ? "text-danger-600" : "text-ink-800"}`}>{value}</dd>
    </div>
  );
}

function FindingRow({ finding }: { finding: AuditFinding }) {
  const tone =
    finding.level === "bad"
      ? "text-danger-600"
      : finding.level === "warn"
        ? "text-amber-700"
        : "text-ink-600";
  const dot =
    finding.level === "bad"
      ? "bg-danger-500"
      : finding.level === "warn"
        ? "bg-amber-400"
        : "bg-ink-400";
  return (
    <li className="flex items-start gap-2 text-xs leading-relaxed">
      <span aria-hidden="true" className={`mt-1 size-1.5 shrink-0 rounded-full ${dot}`} />
      <span className={tone}>
        <span className="font-semibold">{finding.label}</span>
        {finding.detail ? <span className="text-ink-500"> — {finding.detail}</span> : null}
      </span>
    </li>
  );
}

/** site_meta result — findings table with present / missing badges. */
function MetaTable({ result }: { result: SiteMetaResult }) {
  const rows: Array<{ label: string; value: string | null; kind?: "url" }> = [
    { label: "title", value: result.title },
    { label: "description", value: result.description },
    { label: "og:title", value: result.ogTitle },
    { label: "og:image", value: result.ogImage, kind: "url" },
    { label: "favicon", value: result.favicon, kind: "url" },
    { label: "lang", value: result.lang },
  ];

  return (
    <article className="border border-ink-200 bg-surface-0 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-semibold text-brand-600">site_meta</span>
          <span className="rounded-md bg-ink-100 px-1.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-ink-500">
            result
          </span>
        </div>
        <span
          className={`rounded-md px-2 py-0.5 text-[0.7rem] font-bold ${
            result.ok ? "bg-ok-500/15 text-ok-600" : "bg-warn-500/15 text-warn-600"
          }`}
        >
          HTTP {result.status}
        </span>
      </div>

      <p className="mt-1.5 truncate font-mono text-xs text-ink-600">{result.finalUrl}</p>

      <dl className="mt-3 divide-y divide-ink-200 border-y border-ink-200">
        {rows.map(({ label, value, kind }) => (
          <div key={label} className="flex items-center justify-between gap-3 py-1.5">
            <dt className="shrink-0 font-mono text-xs text-ink-500">{label}</dt>
            <dd className="min-w-0 text-right text-xs">
              {value ? (
                <span
                  className={`${kind === "url" ? "block truncate text-ink-600" : "font-medium text-ink-800"}`}
                >
                  {value}
                </span>
              ) : (
                <span className="rounded bg-ink-100 px-1.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-ink-400">
                  missing
                </span>
              )}
            </dd>
          </div>
        ))}
      </dl>

      <p className="mt-2 text-[0.65rem] font-medium text-ink-400">
        fetched the real page in {result.fetchedInMs} ms
      </p>
    </article>
  );
}

/** Safety fallback for an unknown tool: a designed key:value list, not JSON. */
function GenericResult({ toolName, output }: { toolName: string; output?: unknown }) {
  const record = toRecord(output);
  const entries = record
    ? Object.entries(record).filter((entry): entry is [string, string | number | boolean] =>
        ["string", "number", "boolean"].includes(typeof entry[1]),
      )
    : [];
  return (
    <article className="border border-ink-200 bg-surface-0 p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-xs font-semibold text-brand-600">{toolName}</span>
        <span className="rounded-md bg-ink-100 px-1.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-ink-500">
          result
        </span>
      </div>
      <dl className="mt-2 divide-y divide-ink-200 border-y border-ink-200">
        {entries.length > 0 ? (
          entries.map(([key, value]) => (
            <div key={key} className="flex items-center justify-between gap-3 py-1.5">
              <dt className="shrink-0 font-mono text-xs text-ink-500">{key}</dt>
              <dd className="truncate font-mono text-xs text-ink-800">{String(value)}</dd>
            </div>
          ))
        ) : (
          <p className="py-1.5 text-xs text-ink-500">The tool returned a structured value of type {typeof output}.</p>
        )}
      </dl>
    </article>
  );
}

// ---------------------------------------------------------------------------
// State 4 — output-error (designed first, per the mentor tips)
// ---------------------------------------------------------------------------

function ToolError({ toolName, verb, errorText }: { toolName: string; verb: string; errorText?: string }) {
  const hint =
    typeof errorText === "string" ? errorText : "The tool failed without a message to show.";
  const retry =
    toolName === "audit_repo"
      ? "audit vercel/next.js"
      : toolName === "site_meta"
        ? "check https://example.com"
        : null;

  return (
    <div
      role="alert"
      className="rounded-br-none border-l-4 border-danger-500 bg-danger-500/5 px-3 py-2.5"
    >
      <div className="flex items-center gap-2">
        <span aria-hidden="true" className="tool-error-pulse grid size-5 place-items-center rounded-full bg-danger-500 text-[0.7rem] font-bold text-white">
          !
        </span>
        <span className="font-mono text-xs font-semibold text-danger-700">{toolName}</span>
        <span className="text-xs font-medium text-danger-600">
          couldn&apos;t {verb}
        </span>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-danger-700">{hint}</p>
      {retry ? (
        <p className="mt-2 text-xs font-medium text-ink-600">
          See the success path with{" "}
          <code className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[0.8rem] text-ink-900">
            {retry}
          </code>
        </p>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Any other state (approval-*, unlikely in this app)
// ---------------------------------------------------------------------------

function ToolPending({ toolName }: { toolName: string }) {
  return (
    <div className="border-l-4 border-ink-300 bg-surface-1 px-3 py-2.5">
      <div className="flex items-center gap-2">
        <ScanningDots />
        <span className="font-mono text-xs font-semibold text-ink-600">{toolName}</span>
        <span className="text-xs font-medium text-ink-400">waiting…</span>
      </div>
    </div>
  );
}