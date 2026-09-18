"use client";

import { useEffect, useState } from "react";
import type { MonitorResult } from "@/lib/monitors";

type StatusPayload = {
  monitors: MonitorResult[];
  onlineCount: number;
  totalCount: number;
  checkedAt: string;
};

const kindLabels = {
  api: "API",
  website: "Website",
  service: "Service",
};

function formatCheckedAt(timestamp: string | null) {
  if (!timestamp) return "Waiting for first check";
  return `Checked ${new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit", second: "2-digit" }).format(new Date(timestamp))}`;
}

export default function StatusBoard({ initialData }: { initialData: StatusPayload }) {
  const [data, setData] = useState(initialData);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<string | null>(initialData.checkedAt);

  async function refresh() {
    setIsRefreshing(true);
    try {
      const response = await fetch("/api/status", { cache: "no-store" });
      if (!response.ok) throw new Error("Status request failed");
      const nextData = (await response.json()) as StatusPayload;
      setData(nextData);
      setLastRefresh(nextData.checkedAt);
    } finally {
      setIsRefreshing(false);
    }
  }

  useEffect(() => {
    const interval = window.setInterval(() => void refresh(), 30000);
    return () => window.clearInterval(interval);
  }, []);

  const allOnline = data.onlineCount === data.totalCount && data.totalCount > 0;

  return (
    <div className="board-shell">
      <header className="board-header">
        <div>
          <div className="eyebrow"><span className="pulse-dot" /> Live service monitor</div>
          <h1>System status</h1>
          <p className="lede">A quiet view into the services keeping byteblast online.</p>
        </div>
        <button className="refresh-button" type="button" onClick={() => void refresh()} disabled={isRefreshing}>
          <span className={isRefreshing ? "refresh-icon spinning" : "refresh-icon"}>↻</span>
          {isRefreshing ? "Checking" : "Check now"}
        </button>
      </header>

      <section className={allOnline ? "overall-banner online" : "overall-banner attention"} aria-live="polite">
        <div className="overall-symbol">{allOnline ? "✓" : "!"}</div>
        <div>
          <p className="banner-kicker">{allOnline ? "All systems operational" : "Attention required"}</p>
          <p className="banner-copy">{data.onlineCount} of {data.totalCount} monitored services responding normally.</p>
        </div>
        <span className="checked-time">{formatCheckedAt(lastRefresh)}</span>
      </section>

      <div className="section-heading">
        <div>
          <p className="eyebrow muted">Monitored services</p>
          <h2>Current availability</h2>
        </div>
        <span className="auto-refresh">Auto-refresh · 30 sec</span>
      </div>

      <section className="monitor-grid" aria-label="Monitored services">
        {data.monitors.map((monitor) => (
          <article className="monitor-card" key={monitor.id}>
            <div className="card-topline">
              <span className="kind-label">{kindLabels[monitor.kind]}</span>
              <span className={monitor.online ? "status-pill online" : "status-pill offline"}>
                <span className="status-dot" /> {monitor.online ? "Operational" : "Offline"}
              </span>
            </div>
            <div className="monitor-title-row">
              <div className="service-mark">{monitor.name.slice(0, 1).toUpperCase()}</div>
              <div>
                <h3>{monitor.name}</h3>
                <p>{monitor.description}</p>
              </div>
            </div>
            <div className="metrics">
              <div><span>Response</span><strong>{monitor.latencyMs === null ? "—" : `${monitor.latencyMs} ms`}</strong></div>
              <div><span>HTTP</span><strong>{monitor.statusCode ?? "—"}</strong></div>
              <div><span>Signal</span><strong>{monitor.online ? "Good" : "Lost"}</strong></div>
            </div>
            <div className="card-footer"><span>{monitor.detail}</span><span>{formatCheckedAt(monitor.checkedAt)}</span></div>
          </article>
        ))}
      </section>

      <footer className="board-footer">
        <span>© 2026 Byte Blast</span>
        <div className="footer-links">
          <a href="https://byteblast.xyz">byteblast.xyz</a>
          <a href="mailto:contact@byteblast.xyz">contact@byteblast.xyz</a>
        </div>
      </footer>
    </div>
  );
}
