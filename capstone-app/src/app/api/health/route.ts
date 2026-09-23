import { pingUrl } from "@/lib/health";

export const dynamic = "force-dynamic";

const DEFAULT_HEALTH_CHECK_URL =
  "https://api.github.com/repos/omar320250068-prog/capstone-ai-track";

export async function GET() {
  const target =
    process.env.HEALTH_CHECK_URL ?? DEFAULT_HEALTH_CHECK_URL;
  const expectedRaw = Number(process.env.EXPECTED_HEALTH_STATUS ?? 200);
  const expectedStatus =
    Number.isInteger(expectedRaw) && expectedRaw > 0 ? expectedRaw : 200;

  const ping = await pingUrl(target);
  const status =
    ping.status === 0 || ping.status !== expectedStatus ? "degraded" : "ok";

  return Response.json({
    status,
    app: process.env.NEXT_PUBLIC_APP_NAME ?? "capstone-app",
    environment: process.env.NODE_ENV,
    nodeVersion: process.version,
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.round(process.uptime()),
    ping,
  });
}