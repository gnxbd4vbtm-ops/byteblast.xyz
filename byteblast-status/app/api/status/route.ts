import { NextResponse } from "next/server";
import { monitors, type MonitorResult } from "@/lib/monitors";

export const dynamic = "force-dynamic";

async function checkMonitor(monitor: (typeof monitors)[number]): Promise<MonitorResult> {
  const startedAt = performance.now();
  const checkedAt = new Date().toISOString();

  try {
    const response = await fetch(monitor.url, {
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
      headers: { accept: "application/json" },
    });
    const latencyMs = Math.round(performance.now() - startedAt);
    const body = await response.json().catch(() => null);
    const healthy = response.ok && body?.status === "healthy";

    return {
      ...monitor,
      online: healthy,
      latencyMs,
      statusCode: response.status,
      checkedAt,
      detail: healthy ? "Healthy response received" : "Unexpected health response",
    };
  } catch {
    return {
      ...monitor,
      online: false,
      latencyMs: Math.round(performance.now() - startedAt),
      statusCode: null,
      checkedAt,
      detail: "No response from endpoint",
    };
  }
}

export async function GET() {
  const results = await Promise.all(monitors.map(checkMonitor));
  const onlineCount = results.filter((monitor) => monitor.online).length;

  return NextResponse.json(
    { monitors: results, onlineCount, totalCount: results.length, checkedAt: new Date().toISOString() },
    { headers: { "Cache-Control": "no-store" } },
  );
}
