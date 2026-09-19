export type MonitorDefinition = {
  id: string;
  name: string;
  description: string;
  url: string;
  kind: "api" | "website" | "service";
};

export type MonitorResult = MonitorDefinition & {
  online: boolean;
  latencyMs: number | null;
  statusCode: number | null;
  checkedAt: string;
  detail: string;
};

export const monitors: MonitorDefinition[] = [
  {
    id: "byteblast-web",
    name: "byteblast.xyz",
    description: "Main website - imac-production-testing tunnel",
    url: process.env.BYTEBLAST_HEALTH_URL || "https://byteblast.xyz",
    kind: "website",
  },
  {
    id: "byteblast-status",
    name: "status.byteblast.xyz",
    description: "Status/monitoring website - imac-status-production-testing tunnel",
    url: "https://status.byteblast.xyz",
    kind: "website",
  },
  {
    id: "byteblast-git",
    name: "git.byteblast.xyz",
    description: "Forgejo web interface - forgejo-production tunnel",
    url: "https://git.byteblast.xyz",
    kind: "website",
  },
  {
    id: "byteblast-codespace",
    name: "codespace.byteblast.xyz",
    description: "code-server web development environment - codespace tunnel",
    url: "https://codespace.byteblast.xyz",
    kind: "website",
  },
];

export async function checkMonitor(monitor: MonitorDefinition): Promise<MonitorResult> {
  const startedAt = performance.now();
  const checkedAt = new Date().toISOString();

  try {
    const response = await fetch(monitor.url, {
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
      headers: {
        accept: "text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8",
      },
    });
    const latencyMs = Math.round(performance.now() - startedAt);
    const online = response.ok;

    return {
      ...monitor,
      online,
      latencyMs,
      statusCode: response.status,
      checkedAt,
      detail: online ? "HTTP response received" : `HTTP ${response.status} response`,
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
