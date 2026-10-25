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
  latencyMethod: "edge-http" | null;
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
    id: "mc-panel",
    name: "mc-panel.byteblast.xyz",
    description: "Minecraft server management panel",
    url: "https://mc-panel.byteblast.xyz/",
    kind: "website",
  },
  {
    id: "byteblast-downloader",
    name: "download.byteblast.xyz",
    description: "Media download service - downloader production tunnel",
    url: process.env.BYTEBLAST_DOWNLOADER_HEALTH_URL || "https://download.byteblast.xyz/api/health",
    kind: "service",
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

export async function checkMonitors(definitions: MonitorDefinition[]): Promise<MonitorResult[]> {
  const checkedAt = new Date().toISOString();
  const httpResults = await Promise.all(
    definitions.map(async (monitor) => {
      try {
        const response = await fetch(monitor.url, {
          cache: "no-store",
          signal: AbortSignal.timeout(8000),
          headers: {
            accept: "text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8",
          },
        });

        return {
          online: response.ok,
          statusCode: response.status,
          detail: response.ok ? "HTTP response received" : `HTTP ${response.status} response`,
        };
      } catch {
        return {
          online: false,
          statusCode: null,
          detail: "No response from endpoint",
        };
      }
    }),
  );

  return definitions.map((monitor, index) => {
    const httpResult = httpResults[index];

    return {
      ...monitor,
      ...httpResult,
      latencyMs: null,
      latencyMethod: null,
      checkedAt,
    };
  });
}
