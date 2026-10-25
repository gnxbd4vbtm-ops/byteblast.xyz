import { execFile } from "node:child_process";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const allowedHosts = new Set([
  "byteblast.xyz",
  "mc-panel.byteblast.xyz",
  "download.byteblast.xyz",
  "git.byteblast.xyz",
  "codespace.byteblast.xyz",
]);

const probesInFlight = new Map<string, Promise<number | null>>();

function isPingBlockedByPolicy(output: string) {
  return /(administratively prohibited|operation not permitted|destination unreachable|no route to host|network is unreachable|permission denied|icmp.*prohibited)/i.test(output);
}

function pingHost(hostname: string): Promise<number | null> {
  return new Promise((resolve, reject) => {
    execFile(
      "ping",
      ["-n", "-c", "1", "-W", "2", hostname],
      { timeout: 3_000 },
      (error, stdout, stderr) => {
        const combinedOutput = `${stdout}\n${stderr}`;
        const blockedByPolicy = isPingBlockedByPolicy(combinedOutput);

        if (error) {
          if (blockedByPolicy || /0 packets received|100% packet loss/i.test(combinedOutput)) {
            resolve(null);
            return;
          }

          console.warn(`ICMP latency probe failed for ${hostname}:`, stderr || stdout || error.message);
          reject(new Error("ICMP ping failed"));
          return;
        }

        if (blockedByPolicy || /0 packets received|100% packet loss/i.test(combinedOutput)) {
          resolve(null);
          return;
        }

        const match = stdout.match(/time[=<]([\d.]+)\s*ms/);
        if (!match) {
          console.warn(`ICMP latency probe returned no RTT for ${hostname}:`, stdout || stderr);
          reject(new Error("ICMP ping returned no RTT"));
          return;
        }

        resolve(Number(match[1]));
      },
    );
  });
}

function getLatency(hostname: string): Promise<number | null> {
  const existingProbe = probesInFlight.get(hostname);
  if (existingProbe) return existingProbe;

  const probe = pingHost(hostname).finally(() => {
    probesInFlight.delete(hostname);
  });
  probesInFlight.set(hostname, probe);
  return probe;
}

async function probeHost(hostname: string) {
  try {
    const latencyMs = await getLatency(hostname);
    if (latencyMs === null) {
      return {
        host: hostname,
        ok: false,
        error: `ICMP ping to ${hostname} is unavailable from this host`,
      };
    }

    return { host: hostname, ok: true, latencyMs, source: "server-icmp" };
  } catch {
    return { host: hostname, ok: false, error: `ICMP ping to ${hostname} is unavailable` };
  }
}

export async function GET(request: Request) {
  const hostname = new URL(request.url).searchParams.get("host") ?? "byteblast.xyz";
  if (!allowedHosts.has(hostname)) {
    return NextResponse.json(
      { ok: false, error: "Unsupported latency probe host" },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const result = await probeHost(hostname);
  return NextResponse.json(result, {
    status: result.ok ? 200 : 503,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST(request: Request) {
  let body: { hosts?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Request body must be valid JSON" },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  if (
    !Array.isArray(body.hosts) ||
    body.hosts.length === 0 ||
    body.hosts.length > allowedHosts.size ||
    body.hosts.some((host) => typeof host !== "string" || !allowedHosts.has(host))
  ) {
    return NextResponse.json(
      { ok: false, error: "One or more latency probe hosts are unsupported" },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const results = await Promise.all(body.hosts.map((host) => probeHost(host)));
  return NextResponse.json(
    { results },
    { headers: { "Cache-Control": "no-store" } },
  );
}
