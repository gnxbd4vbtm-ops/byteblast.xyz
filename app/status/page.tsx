import Link from "next/link";
import SiteLatency from "@/components/site-latency";
import { getLiveSiteStatus } from "@/lib/status";

export const dynamic = "force-dynamic";

export default async function StatusPage() {
  const status = await getLiveSiteStatus();

  const toneClasses = {
    ok: "is-ok",
    warn: "is-warn",
    info: "is-info",
    danger: "is-danger",
  }[status.tone];

  const formattedTime = new Date(status.lastChecked).toUTCString();

  return (
    <main className="site-shell status-page">
      <header className="status-page-header">
        <div>
          <div className={`status-eyebrow ${toneClasses}`}>
            <span className="status-marker" />
            Live system status
          </div>
          <h1>byteblast.xyz site status</h1>
        </div>
        <div className="status-page-links">
          <Link href="/" className="button-secondary">
            Back to home
          </Link>
          <Link
            href="/api/health"
            target="_blank"
            className="button-secondary"
          >
            Raw health API
          </Link>
        </div>
      </header>

      <section className={`status-hero ${toneClasses}`}>
        <div className="status-hero-topline">
          <span className="status-state">{status.state}</span>
          <span>service: {status.service}</span>
          <span>Verified: {formattedTime}</span>
        </div>

        <h2>{status.headline}</h2>
        <p>{status.message}</p>
      </section>

      <section className="status-metrics">
        <article className="status-metric">
          <p>Ping</p>
          <div>
            <SiteLatency className="metric-accent" />
          </div>
          <p className="metric-note">One-packet ICMP ping from this server to byteblast.xyz</p>
        </article>

        <article className="status-metric">
          <p>Calculated uptime</p>
          <div>
            <span className="metric-accent">{status.uptimePercent}%</span>
          </div>
          <p className="metric-note">Measured across recorded probes</p>
        </article>

        <article className="status-metric">
          <p>24h traffic handled</p>
          <div>
            <span>{status.totalEvents24h}</span>
            <span>events</span>
          </div>
          <p className="metric-note">{status.pageViews24h} dynamic page impressions</p>
        </article>

        <article className="status-metric">
          <p>Storage health</p>
          <div>
            <span className="metric-accent">{status.dbStatus}</span>
          </div>
          <p className="metric-note">SQLite WAL journal persistence</p>
        </article>
      </section>

      <section className="status-detail-layout">
        <div className="status-detail-column">
          <p className="section-label">Operational posture</p>
          <h2>Production hosting profile</h2>

          <div className="status-notes">
            <p>{status.statusNotes}</p>
            <div className="infrastructure-list">
              <div className="infrastructure-row">
                <span>Target host</span>
                <span>Linux bare-metal / systemd</span>
              </div>
              <div className="infrastructure-row">
                <span>Ingress tunnel</span>
                <span>Cloudflare Zero Trust Tunnel</span>
              </div>
              <div className="infrastructure-row">
                <span>State store</span>
                <span>SQLite WAL mode</span>
              </div>
            </div>
          </div>
        </div>

        <div className="status-detail-column">
          <p className="section-label">Recent probe checks</p>
          <h2>Live site telemetry</h2>

          <div className="probe-list">
            {status.recentProbes.length === 0 ? (
              <div className="probe-empty">
                Initial operational check completed. Probes are actively logging.
              </div>
            ) : (
              status.recentProbes.map((probe) => (
                <div
                  key={probe.id}
                  className="probe-row"
                >
                  <div className="probe-description">
                    <span className={`probe-marker ${probe.statusCode < 400 ? "is-ok" : "is-danger"}`} />
                    <div>
                      <p className="probe-name">{probe.probeType}</p>
                      <p className="probe-message">
                        {probe.message || `HTTP ${probe.statusCode}`}
                      </p>
                    </div>
                  </div>
                  <div className="probe-timing">
                    <span>{probe.latencyMs}ms</span>
                    <p>
                      {new Date(probe.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
