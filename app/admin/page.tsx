import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getRecentContactMessages, getRecentEvents, getSiteSummary } from "@/lib/monitoring";

const adminSections = [
  { title: "Access control", detail: "Managed through secure server-side auth and role assertions." },
  { title: "Operational metrics", detail: "Monitor traffic patterns, health checks, and service uptime signals." },
  { title: "Content updates", detail: "Review and publish portfolio edits with minimal operational risk." },
  { title: "Deployment state", detail: "Track production updates while retaining a clean audit trail." },
];

const quickActions = [
  "Verify system integrity",
  "Review service health",
  "Update status notices",
  "Inspect recent deployments",
];

export default async function AdminPage() {
  const authenticated = await isAdminAuthenticated();

  if (!authenticated) {
    redirect("/admin/login");
  }

  const [summary, recentEvents, contactMessages] = await Promise.all([
    getSiteSummary(),
    getRecentEvents(8),
    getRecentContactMessages(6),
  ]);
  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8 lg:px-10">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">Private admin</p>
          <h1 className="mt-2 text-3xl font-black text-white sm:text-4xl">Operations control</h1>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-slate-500 hover:text-white"
          >
            Public site
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

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 sm:p-8">
          <div className="inline-flex rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">
            Restricted access
          </div>

          <h2 className="mt-5 text-2xl font-bold text-white">Operations dashboard</h2>
          <p className="mt-3 max-w-xl text-sm leading-7 text-slate-300">
            This administrative interface is reserved for authorized operators and now includes a live view of recent site activity, audience signals, and inbound contact messages.
          </p>

          <div className="mt-6 space-y-3">
            {quickActions.map((action) => (
              <div key={action} className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-3">
                <span className="h-2.5 w-2.5 rounded-full bg-cyan-400" />
                <span className="text-sm text-slate-200">{action}</span>
              </div>
            ))}
          </div>
        </div>

        <aside className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
          <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Security model</p>
          <h2 className="mt-2 text-2xl font-bold text-white">Protected by default</h2>
          <ul className="mt-5 space-y-4 text-sm leading-6 text-slate-300">
            <li>• Server-side authorization checks enforced before business actions.</li>
            <li>• No private admin state rendered to anonymous visitors.</li>
            <li>• Operational data isolated from public page rendering layers.</li>
            <li>• Audit-friendly action paths for future deployment operations.</li>
          </ul>
        </aside>
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {adminSections.map((section) => (
          <article key={section.title} className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
            <h3 className="text-lg font-semibold text-white">{section.title}</h3>
            <p className="mt-3 text-sm leading-6 text-slate-300">{section.detail}</p>
          </article>
        ))}
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
          <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Audience stats</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
              <p className="text-sm text-slate-400">Traffic events</p>
              <p className="mt-2 text-3xl font-bold text-white">{summary.trafficEvents}</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
              <p className="text-sm text-slate-400">Unique visitors</p>
              <p className="mt-2 text-3xl font-bold text-white">{summary.uniqueVisitors}</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
              <p className="text-sm text-slate-400">Page views</p>
              <p className="mt-2 text-3xl font-bold text-white">{summary.pageViews}</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
              <p className="text-sm text-slate-400">Clicks</p>
              <p className="mt-2 text-3xl font-bold text-white">{summary.clicks}</p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
          <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Recent activity</p>
          <div className="mt-5 space-y-3">
            {recentEvents.length === 0 ? (
              <p className="text-sm text-slate-400">No recent activity recorded yet.</p>
            ) : (
              recentEvents.map((event) => (
                <div key={event.id} className="rounded-2xl border border-slate-800 bg-slate-950/80 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium text-white">{event.event === "view" ? "Page view" : "Click"}</span>
                    <span className="text-[11px] uppercase tracking-[0.18em] text-slate-500">{new Date(event.timestamp).toLocaleString()}</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-300">{event.label} · {event.path}</p>
                  <p className="mt-1 text-xs text-slate-500">Visitor: {event.visitorId} · Referrer: {event.referrer || "direct"}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="mt-8 rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
        <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Inbound contact</p>
        <div className="mt-5 space-y-3">
          {contactMessages.length === 0 ? (
            <p className="text-sm text-slate-400">No contact messages recorded yet.</p>
          ) : (
            contactMessages.map((message) => (
              <div key={message.id} className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="font-medium text-white">{message.name} · {message.email}</p>
                  <span className="text-[11px] uppercase tracking-[0.18em] text-slate-500">{new Date(message.timestamp).toLocaleString()}</span>
                </div>
                <p className="mt-2 text-sm font-medium text-cyan-300">{message.subject}</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">{message.message}</p>
              </div>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
