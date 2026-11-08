"use client";

import { useEffect, useState } from "react";

const sampleCount = 5;

async function requestCloudflareEdge(): Promise<number> {
  const startedAt = performance.now();
  const response = await fetch("/cdn-cgi/trace", {
    cache: "no-store",
    signal: AbortSignal.timeout(5000),
  });
  if (!response.ok) throw new Error("Cloudflare edge latency request failed");
  await response.arrayBuffer();
  return performance.now() - startedAt;
}

async function measureEdgeLatency(): Promise<number> {
  await requestCloudflareEdge();
  const samples = await Promise.all(
    Array.from({ length: sampleCount }, () => requestCloudflareEdge()),
  );
  samples.sort((a, b) => a - b);
  return samples[Math.floor(samples.length / 2)];
}

export default function SiteLatency({ className = "" }: { className?: string }) {
  const [latency, setLatency] = useState<number | null | undefined>(undefined);

  useEffect(() => {
    let active = true;
    let requestInFlight = false;

    async function measureLatency() {
      if (requestInFlight) return;
      requestInFlight = true;

      try {
        const latencyMs = await measureEdgeLatency();
        if (active) {
          setLatency(latencyMs);
        }
      } catch {
        if (active) setLatency(null);
      } finally {
        requestInFlight = false;
      }
    }

    void measureLatency();
    const interval = window.setInterval(() => void measureLatency(), 30000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  const toneClass =
    latency === null || latency === undefined
      ? ""
      : latency < 100
        ? "is-ok"
        : "is-warn";
  const classes = [className, toneClass].filter(Boolean).join(" ");

  return (
    <span className={classes}>
      {latency === undefined
        ? "—"
        : latency === null
          ? "N/A"
          : `${latency.toFixed(1)}ms`}
    </span>
  );
}