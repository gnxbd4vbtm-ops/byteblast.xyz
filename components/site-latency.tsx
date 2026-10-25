"use client";

import { useEffect, useState } from "react";

export default function SiteLatency({ className = "" }: { className?: string }) {
  const [latency, setLatency] = useState<number | null | undefined>(undefined);

  useEffect(() => {
    let active = true;
    let requestInFlight = false;

    async function measureLatency() {
      if (requestInFlight) return;
      requestInFlight = true;

      try {
        const response = await fetch("/api/latency", {
          cache: "no-store",
        });
        if (!response.ok) throw new Error("ICMP latency probe failed");
        const result: { latencyMs: number } = await response.json();

        if (active) {
          setLatency(result.latencyMs);
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