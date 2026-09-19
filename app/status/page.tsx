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
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-8 lg:px-10">
      <header className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-cyan-400 animate-pulse" />
            <p className="text-[10px] uppercase tracking-[0.3em] text-cyan-300 sm:text-xs">Live system status</p>
          </div>
          <h1 className="mt-2 text-2xl font-black text-white sm:text-4xl">byteblast.xyz site status</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Link
            href="/"
            className="inline-flex items-center rounded-full border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-medium text-slate-200 transition hover:border-slate-500 hover:text-white sm:px-4 sm:py-2 sm:text-sm"
          >
            Back to home
          </Link>
          <Link
            href="/api/health"
            target="_blank"
            className="inline-flex items-center rounded-full border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-medium text-slate-400 transition hover:border-slate-500 hover:text-slate-200 sm:px-4 sm:py-2 sm:text-sm"
          >
            Raw health API
          </Link>
        </div>
      </header>

      {/* Main Site Status Banner */}
      <section className={`relative overflow-hidden rounded-3xl border bg-gradient-to-br ${toneClasses.glow} ${toneClasses.border} bg-slate-900/90 p-4 sm:p-8`}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <span className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] sm:px-3.5 sm:py-1.5 sm:text-xs ${toneClasses.badge}`}>
              <span className={`h-2 w-2 rounded-full sm:h-2.5 sm:w-2.5 ${toneClasses.dot}`} />
              {status.state}
            </span>
            <span className="text-[10px] font-mono text-slate-400 sm:text-xs">service: {status.service}</span>
          </div>
          <span className="text-[10px] font-mono text-slate-400 sm:text-xs">Verified: {formattedTime}</span>
        </div>

        <h2 className="mt-4 text-xl font-bold text-white sm:mt-5 sm:text-3xl">{status.headline}</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300 sm:mt-3 sm:text-base sm:leading-7">{status.message}</p>
      </section>

      {/* Real-time Dynamic Metrics */}
      <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <article className="rounded-3xl border border-slate-800 bg-slate-900/80 p-4 sm:p-5">
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-slate-500 sm:text-xs">Live site latency</p>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-white sm:text-3xl">{status.dbLatencyMs}</span>
            <span className="text-xs font-mono text-slate-400 sm:text-sm">ms</span>
          </div>
          <p className="mt-2 text-[11px] text-slate-400 sm:text-xs">Live storage roundtrip & response</p>
        </article>

        <article className="rounded-3xl border border-slate-800 bg-slate-900/80 p-4 sm:p-5">
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-slate-500 sm:text-xs">Calculated uptime</p>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-400 sm:text-3xl">{status.uptimePercent}%</span>
          </div>
          <p className="mt-2 text-[11px] text-slate-400 sm:text-xs">Measured across recorded probes</p>
        </article>

        <article className="rounded-3xl border border-slate-800 bg-slate-900/80 p-4 sm:p-5">
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-slate-500 sm:text-xs">24h Traffic handled</p>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-white sm:text-3xl">{status.totalEvents24h}</span>
            <span className="text-xs font-mono text-slate-400 sm:text-sm">events</span>
          </div>
          <p className="mt-2 text-[11px] text-slate-400 sm:text-xs">{status.pageViews24h} dynamic page impressions</p>
        </article>

        <article className="rounded-3xl border border-slate-800 bg-slate-900/80 p-4 sm:p-5">
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-slate-500 sm:text-xs">Storage health</p>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black capitalize text-cyan-300 sm:text-3xl">{status.dbStatus}</span>
          </div>
          <p className="mt-2 text-[11px] text-slate-400 sm:text-xs">SQLite WAL journal persistence</p>
        </article>
      </section>

      {/* Operational Posture & Live Probes */}
      <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_1fr]">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-4 sm:p-8">
          <p className="text-[10px] uppercase tracking-[0.28em] text-slate-500 sm:text-xs">Operational posture</p>
          <h2 className="mt-2 text-xl font-bold text-white sm:text-2xl">Production hosting profile</h2>

          <div className="mt-4 space-y-4 text-sm leading-6 text-slate-300 sm:mt-6 sm:text-sm sm:leading-7">
            <p>{status.statusNotes}</p>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3 space-y-2 sm:p-4">
              <div className="flex items-center justify-between gap-2 text-[10px] sm:text-xs">
                <span className="text-slate-500">Target host</span>
                <span className="font-mono text-slate-300">Linux bare-metal / systemd</span>
              </div>
              <div className="flex items-center justify-between gap-2 text-[10px] sm:text-xs">
                <span className="text-slate-500">Ingress tunnel</span>
                <span className="font-mono text-cyan-300">Cloudflare Zero Trust Tunnel</span>
              </div>
              <div className="flex items-center justify-between gap-2 text-[10px] sm:text-xs">
                <span className="text-slate-500">State store</span>
                <span className="font-mono text-slate-300">SQLite WAL mode</span>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-4 sm:p-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.28em] text-slate-500 sm:text-xs">Recent probe checks</p>
              <h2 className="mt-2 text-xl font-bold text-white sm:text-2xl">Live site telemetry</h2>
            </div>
          </div>

          <div className="mt-4 space-y-3 sm:mt-6">
            {status.recentProbes.length === 0 ? (
              <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3 text-xs text-slate-400 sm:p-4 sm:text-sm">
                Initial operational check completed. Probes are actively logging.
              </div>
            ) : (
              status.recentProbes.map((probe) => (
                <div
                  key={probe.id}
                  className="flex items-center justify-between gap-2 rounded-2xl border border-slate-800 bg-slate-950/60 p-2.5 sm:p-3.5"
                >
                  <div className="flex items-center gap-2 sm:gap-3">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        probe.statusCode < 400 ? "bg-emerald-400" : "bg-rose-400"
                      }`}
                    />
                    <div>
                      <p className="text-[10px] font-medium text-slate-200 sm:text-xs">{probe.probeType}</p>
                      <p className="text-[9px] font-mono text-slate-500 sm:text-[11px]">
                        {probe.message || `HTTP ${probe.statusCode}`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-[10px] text-cyan-300 sm:text-xs">{probe.latencyMs}ms</span>
                    <p className="text-[9px] text-slate-500 sm:text-[10px]">
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
