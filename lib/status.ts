import {
  getSiteStatus,
  getSiteContent,
  getRecentSystemProbes,
  getSystemTelemetryMetrics,
  getSiteSummaryDb,
  logSystemProbe,
  getDb,
  type SiteStatus,
  type SystemProbe,
} from "./db";

export type Tone = "ok" | "warn" | "info" | "danger";

export type LiveSiteStatus = {
  service: string;
  state: SiteStatus["state"];
  headline: string;
  message: string;
  tone: Tone;
  lastChecked: string;
  dbLatencyMs: number;
  dbStatus: "connected" | "degraded";
  uptimePercent: number;
  totalEvents24h: number;
  pageViews24h: number;
  statusNotes: string;
  recentProbes: SystemProbe[];
};

export function getToneFromState(state: SiteStatus["state"]): Tone {
  switch (state) {
    case "operational":
      return "ok";
    case "degraded":
      return "warn";
    case "maintenance":
      return "info";
    case "outage":
      return "danger";
    default:
      return "ok";
  }
}

export async function getLiveSiteStatus(): Promise<LiveSiteStatus> {
  const start = performance.now();
  let dbStatus: "connected" | "degraded" = "connected";
  let dbLatencyMs = 0;

  try {
    const db = getDb();
    db.prepare("SELECT 1").get();
    dbLatencyMs = Math.round((performance.now() - start) * 100) / 100;
  } catch (err) {
    dbStatus = "degraded";
    dbLatencyMs = Math.round((performance.now() - start) * 100) / 100;
    logSystemProbe({
      probeType: "db_ping",
      statusCode: 500,
      latencyMs: dbLatencyMs,
      errorCode: "DB_PING_FAILED",
      message: err instanceof Error ? err.message : "Database ping failed",
    });
  }

  const siteStatus = getSiteStatus();
  const content = getSiteContent();
  const metrics = getSystemTelemetryMetrics();
  const summary = getSiteSummaryDb();
  const recentProbes = getRecentSystemProbes(6);

  // Compute live tone based on site status and db health
  let tone = getToneFromState(siteStatus.state);
  if (dbStatus === "degraded" && siteStatus.state === "operational") {
    tone = "warn";
  }

  // Calculate live uptime percent based on error rates
  const uptimePercent = Math.max(0, Math.min(100, Math.round((100 - metrics.errorRate) * 10) / 10));

  return {
    service: "byteblast.xyz",
    state: siteStatus.state,
    headline: siteStatus.headline,
    message: siteStatus.message,
    tone,
    lastChecked: new Date().toISOString(),
    dbLatencyMs,
    dbStatus,
    uptimePercent: Number.isFinite(uptimePercent) ? uptimePercent : 100,
    totalEvents24h: summary.trafficEvents,
    pageViews24h: summary.pageViews,
    statusNotes: content.status_notes,
    recentProbes,
  };
}
