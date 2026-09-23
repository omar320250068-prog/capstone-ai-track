import type { HealthResult } from "@/lib/health";
import PageHeader from "@/components/page-header";
import { RefreshButton } from "./refresh-button";

export const dynamic = "force-dynamic";

async function fetchHealth(): Promise<HealthResult> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(`${baseUrl}/api/health`, {
      cache: "no-store",
      signal: controller.signal,
    });
    if (!res.ok) {
      throw new Error(`GET /api/health responded ${res.status}`);
    }
    return (await res.json()) as HealthResult;
  } finally {
    clearTimeout(timeout);
  }
}

function StatCard({ label, value, tone }: { label: string; value: string; tone?: "ok" | "danger" }) {
  return (
    <div className="rounded-xl border border-ink-300/40 bg-surface-1 p-5">
      <dt className="text-sm font-medium text-ink-500">{label}</dt>
      <dd
        className={`mt-1 text-lg font-semibold ${
          tone === "ok" ? "text-ok-500" : tone === "danger" ? "text-danger-500" : "text-ink-900"
        }`}
      >
        {value}
      </dd>
    </div>
  );
}

export default async function HealthPage() {
  let health: HealthResult | null = null;
  let error: string | null = null;

  try {
    health = await fetchHealth();
  } catch (err) {
    error = err instanceof Error ? err.message : "Unknown error";
  }

  return (
    <>
      <PageHeader
        eyebrow="Health check"
        title="Is the app healthy right now?"
        description="This page is a Server Component that fetches /api/health on every request. The server then pings a public URL through HEALTH_CHECK_URL — check the env for the target."
      />
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm text-ink-500">
          <span
            className={`size-2.5 rounded-full ${
              error ? "bg-danger-500" : health?.status === "ok" ? "bg-ok-500" : "bg-warn-500"
            }`}
          />
          {error
            ? "Data unavailable"
            : health?.status === "ok"
              ? "All systems operational"
              : "Degraded"}
        </div>
        <RefreshButton />
      </div>

      {error ? (
        <div className="rounded-xl border border-danger-500/40 bg-danger-500/5 p-5 text-sm text-ink-700">
          <p className="font-semibold text-danger-500">Health page could not reach its own API.</p>
          <p className="mt-2">
            {error}. Make sure the dev server is up and{" "}
            <code className="font-mono">NEXT_PUBLIC_SITE_URL</code> points at its public origin
            (e.g. <code className="font-mono">http://localhost:3000</code> locally, or the
            deployed URL).
          </p>
        </div>
      ) : health ? (
        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard label="App" value={health.app} />
          <StatCard label="Environment" value={health.environment} />
          <StatCard label="Node" value={health.nodeVersion} />
          <StatCard label="Up time" value={`${health.uptimeSeconds}s`} />
          <StatCard label="Last ping" value={health.ping.targetLabel} />
          <StatCard
            label="Ping status"
            value={health.ping.status === 0 ? "unreachable" : `HTTP ${health.ping.status}`}
            tone={health.ping.status === 200 ? "ok" : "danger"}
          />
        </dl>
      ) : null}

      <p className="mt-6 text-sm text-ink-500">
        Payload: <code className="font-mono text-ink-700">GET /api/health</code> — timestamps
        update on each refresh.
      </p>
    </>
  );
}