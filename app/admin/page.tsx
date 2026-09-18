import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import {
  getSiteStatus,
  getSiteContent,
  getRecentSystemProbes,
  getRecentErrors,
  getSiteSummaryDb,
  getRecentEventsDb,
  getRecentContactMessagesDb,
} from "@/lib/db";

export const dynamic = "force-dynamic";

type AdminPageProps = {
  searchParams: Promise<{ saved?: string; sent?: string }>;
};

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const authenticated = await isAdminAuthenticated();

  if (!authenticated) {
    redirect("/admin/login");
  }

  const { saved, sent } = await searchParams;

  const [summary, recentEvents, contactMessages, siteStatus, siteContent, recentProbes, recentErrors] =
    await Promise.all([
      getSiteSummaryDb(),
      getRecentEventsDb(8),
      getRecentContactMessagesDb(6),
      getSiteStatus(),
      getSiteContent(),
      getRecentSystemProbes(6),
      getRecentErrors(4),
    ]);

  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8 lg:px-10">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">Operations control plane</p>
          </div>
          <h1 className="mt-2 text-3xl font-black text-white sm:text-4xl">byteblast admin</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-slate-500 hover:text-white"
          >
            Public site
          </Link>
          <Link
            href="/status"
            className="inline-flex items-center rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-slate-500 hover:text-white"
          >
            Public status
          </Link>
          <form action="/api/admin/logout" method="post">
            <button
              type="submit"
              className="inline-flex items-center rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-200 transition hover:border-red-400 hover:bg-red-500/20"
            >
              Log out
            </button>
          </form>
        </div>
      </header>

      {/* Save confirmation banner */}
      {saved && (
        <div className="mb-6 flex items-center justify-between rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-emerald-200">
          <div className="flex items-center gap-3">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
            <p className="text-sm font-medium">
              {saved === "status"
                ? "Site status updated successfully. Changes are live on /status and the homepage."
                : "Site content updated successfully. All public pages have been refreshed."}
            </p>
          </div>
          <Link href="/admin" className="text-xs text-emerald-400 underline hover:text-emerald-300">
            Dismiss
          </Link>
        </div>
      )}

      {sent === "reply" && (
        <div className="mb-6 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm font-medium text-emerald-200">
          Reply sent successfully.
        </div>
      )}

      {/* Quick Metrics Grid */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Live Site Status</p>
          <div className="mt-3 flex items-center gap-2">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                siteStatus.state === "operational"
                  ? "bg-emerald-400"
                  : siteStatus.state === "degraded"
                  ? "bg-amber-400"
                  : siteStatus.state === "maintenance"
                  ? "bg-cyan-400"
                  : "bg-rose-400"
              }`}
            />
            <span className="text-xl font-bold uppercase tracking-wide text-white">{siteStatus.state}</span>
          </div>
          <p className="mt-1 text-xs text-slate-400 truncate">{siteStatus.headline}</p>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Total Traffic Events</p>
          <p className="mt-3 text-3xl font-black text-white">{summary.trafficEvents}</p>
          <p className="mt-1 text-xs text-slate-400">{summary.pageViews} views · {summary.clicks} clicks</p>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Unique Visitors</p>
          <p className="mt-3 text-3xl font-black text-white">{summary.uniqueVisitors}</p>
          <p className="mt-1 text-xs text-slate-400">Stored in SQLite</p>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Inbound Messages</p>
          <p className="mt-3 text-3xl font-black text-white">{summary.messages}</p>
          <p className="mt-1 text-xs text-slate-400">Contact submissions</p>
        </div>
      </section>

      {/* EDIT FORMS SECTION */}
      <section className="mt-8 grid gap-8 lg:grid-cols-2">
        {/* Form 1: Site Status Form */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 sm:p-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-cyan-300">Operations Control</p>
              <h2 className="mt-2 text-2xl font-bold text-white">Edit Site Status</h2>
            </div>
            <span className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-xs font-mono text-slate-400">
              Target: byteblast.xyz
            </span>
          </div>
          <p className="mt-3 text-sm text-slate-400">
            Control the live status indicator displayed on `/status` and the main site header.
          </p>

          <form action="/api/admin/update" method="post" className="mt-6 space-y-5">
            <input type="hidden" name="type" value="status" />

            <div>
              <label htmlFor="state" className="block text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">
                Site State
              </label>
              <select
                id="state"
                name="state"
                defaultValue={siteStatus.state}
                className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white focus:border-cyan-400 focus:outline-none"
              >
                <option value="operational">Operational (Normal operations)</option>
                <option value="degraded">Degraded (Performance or latency issues)</option>
                <option value="maintenance">Maintenance (Scheduled maintenance underway)</option>
                <option value="outage">Outage (Active service disruption)</option>
              </select>
            </div>

            <div>
              <label htmlFor="headline" className="block text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">
                Status Headline
              </label>
              <input
                id="headline"
                name="headline"
                type="text"
                defaultValue={siteStatus.headline}
                required
                className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white focus:border-cyan-400 focus:outline-none"
                placeholder="e.g. Site is fully operational"
              />
            </div>

            <div>
              <label htmlFor="message" className="block text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">
                Detailed Status Message / Notice
              </label>
              <textarea
                id="message"
                name="message"
                rows={3}
                defaultValue={siteStatus.message}
                required
                className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white focus:border-cyan-400 focus:outline-none"
                placeholder="Details regarding current site performance or scheduled maintenance windows..."
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] font-mono text-slate-500">
                Last updated: {new Date(siteStatus.updatedAt).toLocaleString()}
              </span>
              <button
                type="submit"
                className="rounded-full bg-cyan-400 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
              >
                Update Site Status
              </button>
            </div>
          </form>
        </div>

        {/* Form 2: Site Content Form */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 sm:p-8">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-cyan-300">Content Management</p>
            <h2 className="mt-2 text-2xl font-bold text-white">Edit Site Content</h2>
          </div>
          <p className="mt-3 text-sm text-slate-400">
            Update key copy on the portfolio homepage and status posture notes without redeploying code.
          </p>

          <form action="/api/admin/update" method="post" className="mt-6 space-y-4">
            <input type="hidden" name="type" value="content" />

            <div>
              <label htmlFor="availability" className="block text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">
                Availability Badge
              </label>
              <input
                id="availability"
                name="availability"
                type="text"
                defaultValue={siteContent.availability}
                required
                className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white focus:border-cyan-400 focus:outline-none"
                placeholder="e.g. Open for select engagements"
              />
            </div>

            <div>
              <label htmlFor="hero_headline" className="block text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">
                Hero Headline
              </label>
              <input
                id="hero_headline"
                name="hero_headline"
                type="text"
                defaultValue={siteContent.hero_headline}
                required
                className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white focus:border-cyan-400 focus:outline-none"
                placeholder="e.g. Building systems that feel clean, fast, and dependable."
              />
            </div>

            <div>
              <label htmlFor="hero_description" className="block text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">
                Hero Description
              </label>
              <textarea
                id="hero_description"
                name="hero_description"
                rows={2}
                defaultValue={siteContent.hero_description}
                required
                className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white focus:border-cyan-400 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="current_focus" className="block text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">
                Current Focus Callout
              </label>
              <input
                id="current_focus"
                name="current_focus"
                type="text"
                defaultValue={siteContent.current_focus}
                required
                className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white focus:border-cyan-400 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="status_notes" className="block text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">
                Status Page Hosting Posture Notes
              </label>
              <textarea
                id="status_notes"
                name="status_notes"
                rows={2}
                defaultValue={siteContent.status_notes}
                required
                className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white focus:border-cyan-400 focus:outline-none"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
              >
                Save Content Updates
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* INDEPENDENT STATUS API & DIAGNOSTICS */}
      <section className="mt-8 rounded-3xl border border-slate-800 bg-slate-900/80 p-6 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
              <p className="text-xs uppercase tracking-[0.28em] text-cyan-300">Independent Status Page API</p>
            </div>
            <h2 className="mt-2 text-2xl font-bold text-white">Admin-only Telemetry Endpoint</h2>
          </div>
          <Link
            href="/api/v1/status"
            target="_blank"
            className="inline-flex items-center rounded-full border border-cyan-400/30 bg-cyan-500/10 px-4 py-2 text-xs font-mono font-medium text-cyan-200 transition hover:border-cyan-400 hover:bg-cyan-500/20"
          >
            Open /api/v1/status (Browser Session) →
          </Link>
        </div>

        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
          This endpoint provides full operational telemetry (error codes, exit codes, process memory, database latency, and probe history) for building an independent external status page.
        </p>

        <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-slate-300">
          <p className="text-slate-500 mb-1"># Query with Bearer token or x-admin-key:</p>
          <p className="text-cyan-300 overflow-x-auto">
            curl -H &quot;Authorization: Bearer $ADMIN_SESSION_SECRET&quot; https://byteblast.xyz/api/v1/status
          </p>
        </div>

        {/* Recent Errors & System Probes */}
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
            <h3 className="text-sm font-semibold text-white">Recent System Probes</h3>
            <div className="mt-3 space-y-2">
              {recentProbes.length === 0 ? (
                <p className="text-xs text-slate-500">No probes recorded yet.</p>
              ) : (
                recentProbes.map((probe) => (
                  <div key={probe.id} className="flex items-center justify-between text-xs border-b border-slate-800/60 pb-2 last:border-0 last:pb-0">
                    <div>
                      <span className="font-mono text-slate-300">{probe.probeType}</span>
                      <span className="ml-2 font-mono text-slate-500">HTTP {probe.statusCode}</span>
                    </div>
                    <span className="font-mono text-cyan-300">{probe.latencyMs}ms</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
            <h3 className="text-sm font-semibold text-white">Recent Error / Disruption Codes</h3>
            <div className="mt-3 space-y-2">
              {recentErrors.length === 0 ? (
                <p className="text-xs text-emerald-400">0 errors recorded. All systems healthy.</p>
              ) : (
                recentErrors.map((err) => (
                  <div key={err.id} className="flex items-center justify-between text-xs border-b border-slate-800/60 pb-2 last:border-0 last:pb-0">
                    <div>
                      <span className="font-mono text-rose-300">{err.errorCode || `ERR_${err.statusCode}`}</span>
                      <p className="text-[11px] text-slate-400 truncate max-w-[200px]">{err.message}</p>
                    </div>
                    <span className="font-mono text-slate-500">{new Date(err.timestamp).toLocaleTimeString()}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      {/* AUDIENCE STATS & INBOUND CONTACT */}
      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
          <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Recent Activity</p>
          <div className="mt-4 space-y-3">
            {recentEvents.length === 0 ? (
              <p className="text-sm text-slate-400">No recent activity recorded yet.</p>
            ) : (
              recentEvents.map((event) => (
                <div key={event.id} className="rounded-2xl border border-slate-800 bg-slate-950/80 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium text-white">
                      {event.event === "view" ? "Page view" : "Click"}
                    </span>
                    <span className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                      {new Date(event.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-300">{event.label} · {event.path}</p>
                  <p className="mt-1 text-xs text-slate-500">Visitor: {event.visitorId} · Referrer: {event.referrer || "direct"}</p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
          <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Inbound Contact Messages</p>
          <div className="mt-4 space-y-3">
            {contactMessages.length === 0 ? (
              <p className="text-sm text-slate-400">No contact messages recorded yet.</p>
            ) : (
              contactMessages.map((message) => (
                <div key={message.id} className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <p className="font-medium text-white">{message.name} · {message.email}</p>
                    <span className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                      {new Date(message.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-medium text-cyan-300">{message.subject}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{message.message}</p>
                  <form action="/api/admin/update" method="post" className="mt-4 space-y-3 border-t border-slate-800 pt-4">
                    <input type="hidden" name="type" value="reply" />
                    <input type="hidden" name="messageId" value={message.id} />
                    <label htmlFor={`reply-${message.id}`} className="block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                      Reply to {message.email}
                    </label>
                    <textarea
                      id={`reply-${message.id}`}
                      name="reply"
                      rows={3}
                      required
                      className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
                      placeholder="Write your reply..."
                    />
                    <button
                      type="submit"
                      className="rounded-full bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
                    >
                      Send reply
                    </button>
                  </form>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
