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
    description: "Personal site and public API",
    url: process.env.BYTEBLAST_HEALTH_URL || "https://byteblast.xyz/api/health",
    kind: "website",
  },
];
