import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import {
  getDb,
  getSiteStatus,
  getRecentErrors,
  getRecentSystemProbes,
  getSystemTelemetryMetrics,
  getSiteSummaryDb,
  logSystemProbe,
} from "@/lib/db";

export const dynamic = "force-dynamic";

function checkApiAuth(request: Request): boolean {
  const secret = process.env.ADMIN_SESSION_SECRET ?? "development-admin-secret-change-me";

  // Check Authorization Bearer header
  const authHeader = request.headers.get("authorization");
  if (authHeader) {
    const [type, token] = authHeader.split(" ");
    if (type?.toLowerCase() === "bearer" && token === secret) {
      return true;
    }
  }

  // Check custom header
  const apiKeyHeader = request.headers.get("x-admin-key") || request.headers.get("x-admin-token");
  if (apiKeyHeader === secret) {
    return true;
  }

  // Check query parameter (?token=...)
  const url = new URL(request.url);
  const tokenParam = url.searchParams.get("token") || url.searchParams.get("key");
  if (tokenParam === secret) {
    return true;
  }

  return false;
}

export async function GET(request: Request) {
  const startTime = performance.now();
  const isCookieAuth = await isAdminAuthenticated();
  const isHeaderAuth = checkApiAuth(request);

  if (!isCookieAuth && !isHeaderAuth) {
    logSystemProbe({
      probeType: "api_status_auth",
      statusCode: 401,
      latencyMs: Math.round((performance.now() - startTime) * 100) / 100,
      errorCode: "AUTH_UNAUTHORIZED",
      message: "Unauthorized access attempt to /api/v1/status",
    });

    return NextResponse.json(
      {
        ok: false,
        error: "Unauthorized",
        errorCode: "AUTH_UNAUTHORIZED",
        exitCode: 1,
        statusCode: 401,
        message: "Admin session or valid Bearer / x-admin-key secret required.",
      },
      { status: 401 }
    );
  }

  // Run live database probe
  let dbStatus: "connected" | "error" = "connected";
  let dbErrorCode: string | null = null;
  let dbLatencyMs = 0;
  const dbCheckStart = performance.now();

  try {
    const db = getDb();
    db.prepare("SELECT 1").get();
    dbLatencyMs = Math.round((performance.now() - dbCheckStart) * 100) / 100;
  } catch (err) {
    dbStatus = "error";
    dbErrorCode = "ERR_DB_CONNECT";
    dbLatencyMs = Math.round((performance.now() - dbCheckStart) * 100) / 100;
  }

  const siteStatus = getSiteStatus();
  const recentErrors = getRecentErrors(10);
  const recentProbes = getRecentSystemProbes(15);
  const telemetry = getSystemTelemetryMetrics();
  const summary = getSiteSummaryDb();
  const mem = process.memoryUsage();

  const totalLatencyMs = Math.round((performance.now() - startTime) * 100) / 100;

  // Log successful diagnostic telemetry probe
  logSystemProbe({
    probeType: "api_v1_status_probe",
    statusCode: 200,
    latencyMs: totalLatencyMs,
    errorCode: null,
    message: `Independent status probe queried (dbLatency: ${dbLatencyMs}ms)`,
  });

  return NextResponse.json({
    ok: true,
    exitCode: 0,
    service: "byteblast.xyz",
    timestamp: new Date().toISOString(),
    site: {
      state: siteStatus.state,
      headline: siteStatus.headline,
      message: siteStatus.message,
      updatedAt: siteStatus.updatedAt,
    },
    system: {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      pid: process.pid,
      uptimeSeconds: Math.floor(process.uptime()),
      memory: {
        rssMb: Math.round((mem.rss / 1024 / 1024) * 10) / 10,
        heapUsedMb: Math.round((mem.heapUsed / 1024 / 1024) * 10) / 10,
        heapTotalMb: Math.round((mem.heapTotal / 1024 / 1024) * 10) / 10,
      },
      env: process.env.NODE_ENV || "development",
    },
    diagnostics: {
      exitCode: 0,
      database: {
        status: dbStatus,
        latencyMs: dbLatencyMs,
        errorCode: dbErrorCode,
      },
      recentErrors: recentErrors.map((e) => ({
        id: e.id,
        timestamp: e.timestamp,
        probeType: e.probeType,
        statusCode: e.statusCode,
        errorCode: e.errorCode,
        message: e.message,
      })),
      recentProbes: recentProbes.map((p) => ({
        timestamp: p.timestamp,
        probeType: p.probeType,
        statusCode: p.statusCode,
        latencyMs: p.latencyMs,
        errorCode: p.errorCode,
        message: p.message,
      })),
    },
    metrics: {
      trafficEvents: summary.trafficEvents,
      uniqueVisitors: summary.uniqueVisitors,
      pageViews: summary.pageViews,
      clicks: summary.clicks,
      messages: summary.messages,
      errorRatePercent: telemetry.errorRate,
      probes24h: telemetry.totalProbes24h,
      errorProbes24h: telemetry.errorProbes24h,
      avgLatencyMs: telemetry.avgLatencyMs,
    },
  });
}
