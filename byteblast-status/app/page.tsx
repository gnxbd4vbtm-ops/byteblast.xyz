import StatusBoard from "@/components/status-board";
import { monitors, type MonitorResult } from "@/lib/monitors";

async function getInitialStatus() {
  const results = await Promise.all(
    monitors.map(async (monitor): Promise<MonitorResult> => {
      const startedAt = performance.now();
      const checkedAt = new Date().toISOString();

      try {
        const response = await fetch(monitor.url, {
          cache: "no-store",
          signal: AbortSignal.timeout(8000),
          headers: { accept: "application/json" },
        });
        const body = await response.json().catch(() => null);
        const online = response.ok && body?.status === "healthy";
        return {
          ...monitor,
          online,
          latencyMs: Math.round(performance.now() - startedAt),
          statusCode: response.status,
          checkedAt,
          detail: online ? "Healthy response received" : "Unexpected health response",
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
    }),
  );

  return {
    monitors: results,
    onlineCount: results.filter((monitor) => monitor.online).length,
    totalCount: results.length,
    checkedAt: new Date().toISOString(),
  };
}

export const dynamic = "force-dynamic";

export default async function Home() {
  const initialData = await getInitialStatus();
  return <StatusBoard initialData={initialData} />;
}
