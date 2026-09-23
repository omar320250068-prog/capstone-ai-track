export type PingResult = {
  url: string;
  status: number;
  targetLabel: string;
};

export type HealthResult = {
  status: "ok" | "degraded";
  app: string;
  environment: string;
  nodeVersion: string;
  timestamp: string;
  uptimeSeconds: number;
  ping: PingResult;
};

export async function pingUrl(url: string): Promise<PingResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch(url, { signal: controller.signal });
    return { url, status: res.status, targetLabel: describeTarget(url) };
  } catch {
    return { url, status: 0, targetLabel: describeTarget(url) };
  } finally {
    clearTimeout(timeout);
  }
}

function describeTarget(url: string): string {
  const host = url.replace(/^https?:\/\//, "").split("/")[0];
  return host === "api.github.com" ? "GitHub API" : host;
}