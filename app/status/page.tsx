import Link from "next/link";
import { getLiveSiteStatus } from "@/lib/status";

export const dynamic = "force-dynamic";

export default async function StatusPage() {
  const status = await getLiveSiteStatus();

  const toneClasses = {
    ok: {
      badge: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
      dot: "bg-emerald-400",
      border: "border-emerald-500/20",
      glow: "from-emerald-500/10 via-transparent to-transparent",
    },
    warn: {
      badge: "bg-amber-500/15 text-amber-300 border-amber-500/30",
      dot: "bg-amber-400",
      border: "border-amber-500/20",
      glow: "from-amber-500/10 via-transparent to-transparent",
    },
    info: {
      badge: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
      dot: "bg-cyan-400",
      border: "border-cyan-500/20",
      glow: "from-cyan-500/10 via-transparent to-transparent",
    },
    danger: {
      badge: "bg-rose-500/15 text-rose-300 border-rose-500/30",
      dot: "bg-rose-400",
      border: "border-rose-500/20",
      glow: "from-rose-500/10 via-transparent to-transparent",
    },
  }[status.tone];

  const formattedTime = new Date(status.lastChecked).toUTCString();

  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8 lg:px-10">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-cyan-400 animate-pulse" />
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">Live system status</p>
          </div>
          <h1 className="mt-2 text-3xl font-black text-white sm:text-4xl">byteblast.xyz site status</h1>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-slate-500 hover:text-white"
          >
            Back to home
          </Link>
          <Link
            href="/api/health"
            target="_blank"
            className="inline-flex items-center rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-400 transition hover:border-slate-500 hover:text-slate-200"
          >
            Raw health API
          </Link>
        </div>
      </header>

      {/* Main Site Status Banner */}
      <section className={`relative overflow-hidden rounded-3xl border bg-gradient-to-br ${toneClasses.glow} ${toneClasses.border} bg-slate-900/90 p-6 sm:p-8`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] ${toneClasses.badge}`}>
              <span className={`h-2.5 w-2.5 rounded-full ${toneClasses.dot}`} />
              {status.state}
            </span>
            <span className="text-xs font-mono text-slate-400">service: {status.service}</span>
          </div>
          <span className="text-xs font-mono text-slate-400">Verified: {formattedTime}</span>
        </div>

        <h2 className="mt-5 text-2xl font-bold text-white sm:text-3xl">{status.headline}</h2>
        <p className="mt-3 max-w-3xl text-base leading-7 text-slate-300">{status.message}</p>
      </section>

      {/* Real-time Dynamic Metrics */}
      <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <article className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">Live site latency</p>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{status.dbLatencyMs}</span>
            <span className="text-sm font-mono text-slate-400">ms</span>
          </div>
          <p className="mt-2 text-xs text-slate-400">Live storage roundtrip & response</p>
        </article>

        <article className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">Calculated uptime</p>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-400">{status.uptimePercent}%</span>
          </div>
          <p className="mt-2 text-xs text-slate-400">Measured across recorded probes</p>
        </article>

        <article className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">24h Traffic handled</p>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{status.totalEvents24h}</span>
            <span className="text-sm font-mono text-slate-400">events</span>
          </div>
          <p className="mt-2 text-xs text-slate-400">{status.pageViews24h} dynamic page impressions</p>
        </article>

        <article className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">Storage health</p>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black capitalize text-cyan-300">{status.dbStatus}</span>
          </div>
          <p className="mt-2 text-xs text-slate-400">SQLite WAL journal persistence</p>
        </article>
      </section>

      {/* Operational Posture & Live Probes */}
      <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_1fr]">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 sm:p-8">
          <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Operational posture</p>
          <h2 className="mt-2 text-2xl font-bold text-white">Production hosting profile</h2>

          <div className="mt-6 space-y-4 text-sm leading-7 text-slate-300">
            <p>{status.statusNotes}</p>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Target host</span>
                <span className="font-mono text-slate-300">Linux bare-metal / systemd</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Ingress tunnel</span>
                <span className="font-mono text-cyan-300">Cloudflare Zero Trust Tunnel</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">State store</span>
                <span className="font-mono text-slate-300">SQLite WAL mode</span>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 sm:p-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Recent probe checks</p>
              <h2 className="mt-2 text-2xl font-bold text-white">Live site telemetry</h2>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {status.recentProbes.length === 0 ? (
              <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-400">
                Initial operational check completed. Probes are actively logging.
              </div>
            ) : (
              status.recentProbes.map((probe) => (
                <div
                  key={probe.id}
                  className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/60 p-3.5"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        probe.statusCode < 400 ? "bg-emerald-400" : "bg-rose-400"
                      }`}
                    />
                    <div>
                      <p className="text-xs font-medium text-slate-200">{probe.probeType}</p>
                      <p className="text-[11px] font-mono text-slate-500">
                        {probe.message || `HTTP ${probe.statusCode}`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-xs text-cyan-300">{probe.latencyMs}ms</span>
                    <p className="text-[10px] text-slate-500">
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
