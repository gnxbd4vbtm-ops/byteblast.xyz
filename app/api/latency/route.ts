import { execFile } from "node:child_process";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

let probeInFlight: Promise<number> | null = null;

function pingByteblast(): Promise<number> {
  return new Promise((resolve, reject) => {
    execFile(
      "ping",
      ["-n", "-c", "1", "-W", "2", "byteblast.xyz"],
      { timeout: 3_000 },
      (error, stdout, stderr) => {
        if (error) {
          console.error("ICMP latency probe failed:", stderr || error.message);
          reject(new Error("ICMP ping failed"));
          return;
        }

        const match = stdout.match(/time[=<]([\d.]+)\s*ms/);
        if (!match) {
          console.error("ICMP latency probe returned no RTT:", stdout);
          reject(new Error("ICMP ping returned no RTT"));
          return;
        }

        resolve(Number(match[1]));
      },
    );
  });
}

function getLatency(): Promise<number> {
  if (!probeInFlight) {
    probeInFlight = pingByteblast()
      .finally(() => {
        probeInFlight = null;
      });
  }

  return probeInFlight;
}

export async function GET() {
  try {
    const latencyMs = await getLatency();
    return NextResponse.json(
      { ok: true, latencyMs, source: "server-icmp" },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { ok: false, error: "ICMP ping to byteblast.xyz is unavailable" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
