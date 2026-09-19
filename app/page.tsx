import Link from "next/link";
import SiteHeader from "@/components/site-header";
import { getGitHubProjects } from "@/lib/github";
import { getSiteContent } from "@/lib/db";
import { getLiveSiteStatus } from "@/lib/status";

const capabilityGroups = [
  {
    title: "Platform engineering",
    description:
      "Build resilient systems with secure infrastructure, deployment automation, and observability hooks that keep operations transparent.",
  },
  {
    title: "Product delivery",
    description:
      "Ship fast without sacrificing maintainability through focused user workflows, measurable outcomes, and pragmatic architecture.",
  },
  {
    title: "DevOps and security",
    description:
      "Design systems that are safe, traceable, and production-ready with a bias toward operational clarity and hardening.",
  },
];

const accessServices = [
  {
    name: "git.byteblast.xyz",
    description: "Forgejo for shared repositories, code review, and project coordination.",
    href: "https://git.byteblast.xyz",
    cta: "Open Forgejo",
    external: true,
  },
  {
    name: "codespace.byteblast.xyz",
    description: "Private code-server environment for trusted collaborators. Access is by request.",
    href: "/contact",
    cta: "Request access",
    external: false,
    email: "mailto:contact@byteblast.xyz?subject=Access%20request%20for%20codespace.byteblast.xyz",
  },
];

export default async function Home() {
  const [repos, siteStatus] = await Promise.all([
    getGitHubProjects(),
    getLiveSiteStatus(),
  ]);
  const content = getSiteContent();

  const siteHealth = [
    { label: "Site status", value: siteStatus.state.toUpperCase(), state: siteStatus.tone },
    { label: "Site latency", value: `${siteStatus.dbLatencyMs} ms`, state: siteStatus.dbLatencyMs < 100 ? "ok" : "warn" },
    { label: "Storage check", value: siteStatus.dbStatus === "connected" ? "Connected" : "Degraded", state: siteStatus.dbStatus === "connected" ? "ok" : "warn" },
    { label: "System uptime", value: `${siteStatus.uptimePercent}%`, state: siteStatus.uptimePercent >= 99 ? "ok" : "warn" },
  ];

  const featuredProjects = repos.length
    ? repos.map((repo) => ({
        name: repo.name,
        detail: repo.description ?? "Platform and product work shipped with a security-first mindset.",
        stack: [repo.language ?? "Code", ...(repo.topics ?? []).slice(0, 2)],
        href: repo.html_url,
      }))
    : [
        {
          name: "Orbit Control",
          detail: "Private internal ops dashboard for service provisioning, environment health, and release visibility.",
          stack: ["Next.js", "SQLite", "Linux", "Auth"],
          href: "https://github.com/gnxbd4vbtm-ops",
        },
        {
          name: "Bluepeak Relay",
          detail: "High-availability event pipeline powering monitoring, alerting, and service state tracking across self-hosted systems.",
          stack: ["Go", "gRPC", "Kafka", "SRE"],
          href: "https://github.com/gnxbd4vbtm-ops",
        },
        {
          name: "Signal Forge",
          detail: "Automation toolkit that normalizes deployment checks, health indicators, and escalation logic for developer operations.",
          stack: ["TypeScript", "CI/CD", "Docker", "Monitoring"],
          href: "https://github.com/gnxbd4vbtm-ops",
        },
      ];
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-5 py-6 sm:px-8 lg:px-10">
      <SiteHeader />

      <section className="panel grid gap-8 overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-6 sm:p-8 lg:grid-cols-[1.4fr_0.8fr] lg:p-12">
        <div className="space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            {content.availability}
          </div>

          <div className="space-y-5">
            <p className="text-sm uppercase tracking-[0.32em] text-slate-400">
              Developer • builder • operator
            </p>
            <h1 className="max-w-xl text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
              {content.hero_headline}
            </h1>
            <p className="max-w-xl text-base leading-7 text-slate-300 sm:text-lg">
              {content.hero_description}
            </p>
          </div>

          <div className="flex flex-wrap gap-4">
            <Link
              href="#work"
              className="inline-flex rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
            >
              View work
            </Link>
            <Link
              href="/status"
              className="inline-flex rounded-full border border-slate-700 bg-slate-900/80 px-5 py-3 text-sm font-semibold text-slate-100 transition hover:border-slate-500 hover:bg-slate-800"
            >
              Review status
            </Link>
          </div>
        </div>

        <aside className="flex flex-col justify-between gap-5 rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-slate-500">
              Current focus
            </p>
            <p className="mt-3 text-2xl font-semibold text-cyan-200">
              {content.current_focus}
            </p>
          </div>

          <div className="grid gap-3">
            {siteHealth.map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2"
              >
                <span className="text-sm text-slate-300">{item.label}</span>
                <span
                  className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-medium ${
                    item.state === "ok"
                      ? "bg-emerald-500/15 text-emerald-300"
                      : "bg-amber-500/15 text-amber-300"
                  }`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${
                      item.state === "ok" ? "bg-emerald-400" : "bg-amber-400"
                    }`}
                  />
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </aside>
      </section>

      <section id="work" className="grid gap-6 lg:grid-cols-3">
        {capabilityGroups.map((capability) => (
          <article key={capability.title} className="panel rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
            <div className="mb-4 h-10 w-10 rounded-xl bg-cyan-500/10 ring-1 ring-cyan-400/20" />
            <h2 className="text-xl font-semibold text-white">{capability.title}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              {capability.description}
            </p>
          </article>
        ))}
      </section>

      <section className="panel rounded-3xl border border-slate-800 bg-slate-900/80 p-4 sm:p-8">
        <div className="mb-4 flex flex-col gap-2 sm:mb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.28em] text-slate-500 sm:text-xs">Access points</p>
            <h2 className="mt-2 text-xl font-bold text-white sm:text-2xl">Shared tools and private environments</h2>
          </div>
          <p className="text-xs text-slate-300 sm:text-sm">Request access to the code-server environment via the contact form or email.</p>
        </div>

        <div className="grid gap-3 md:grid-cols-2 md:gap-4">
          {accessServices.map((service) => (
            <div key={service.name} className="rounded-2xl border border-slate-800 bg-slate-950/80 p-3 sm:p-5">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-cyan-300 sm:text-xs">Service</p>
                  <h3 className="mt-1 text-base font-semibold text-white sm:mt-2 sm:text-xl">{service.name}</h3>
                </div>
                {service.name === "codespace.byteblast.xyz" && (
                  <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[9px] uppercase tracking-[0.18em] text-amber-200 sm:px-2.5 sm:py-1 sm:text-[10px]">
                    Request
                  </span>
                )}
              </div>

              <p className="mt-3 text-xs leading-5 text-slate-300 sm:mt-4 sm:text-sm sm:leading-6">{service.description}</p>

              <div className="mt-4 flex flex-wrap gap-2 sm:mt-5 sm:gap-3">
                <a
                  href={service.href}
                  target={service.external ? "_blank" : undefined}
                  rel={service.external ? "noreferrer" : undefined}
                  className="inline-flex rounded-full bg-cyan-400 px-3 py-2 text-[11px] font-semibold text-slate-950 transition hover:bg-cyan-300 sm:px-4 sm:py-2 sm:text-sm"
                >
                  {service.cta}
                </a>
                {service.email && (
                  <a
                    href={service.email}
                    className="inline-flex rounded-full border border-slate-700 bg-slate-900 px-3 py-2 text-[11px] font-semibold text-slate-100 transition hover:border-slate-500 hover:bg-slate-800 sm:px-4 sm:py-2 sm:text-sm"
                  >
                    Email access request
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="panel rounded-3xl border border-slate-800 bg-slate-900/80 p-6 sm:p-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-slate-500">
                Selected projects
              </p>
              <h2 className="mt-2 text-2xl font-bold text-white">Recent build work</h2>
            </div>
            <Link href="/admin" className="text-sm text-cyan-300 hover:text-cyan-200">
              View admin overview
            </Link>
          </div>

          <div className="space-y-4">
            {featuredProjects.map((project) => (
              <a
                key={project.name}
                href={project.href}
                target="_blank"
                rel="noreferrer"
                className="block rounded-2xl border border-slate-800 bg-slate-950/80 p-4 transition hover:border-cyan-500/30 hover:bg-slate-950"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{project.name}</h3>
                    <p className="mt-1 max-w-xl text-sm leading-6 text-slate-300">
                      {project.detail}
                    </p>
                  </div>
                  <span className="inline-flex rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs uppercase tracking-[0.16em] text-slate-300">
                    active
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {project.stack.map((stack) => (
                    <span
                      key={stack}
                      className="rounded-full border border-cyan-500/20 bg-cyan-500/5 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.14em] text-cyan-200"
                    >
                      {stack}
                    </span>
                  ))}
                </div>
              </a>
            ))}
          </div>
        </div>

        <aside id="systems" className="panel rounded-3xl border border-slate-800 bg-slate-900/80 p-6 sm:p-8">
          <p className="text-xs uppercase tracking-[0.28em] text-slate-500">
            Operational view
          </p>
          <h2 className="mt-2 text-2xl font-bold text-white">Infrastructure snapshot</h2>

          <div className="mt-6 space-y-4">
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-300">Public endpoint</span>
                <span className="rounded-full bg-emerald-500/15 px-2 py-1 text-xs font-medium text-emerald-300">
                  99.98%
                </span>
              </div>
              <p className="mt-3 text-3xl font-bold text-emerald-200">Stable</p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
              <p className="text-sm text-slate-400">Deployment model</p>
              <p className="mt-2 text-lg font-medium text-white">Next.js on Linux + private tunnel routing</p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
              <p className="text-sm text-slate-400">Monitoring</p>
              <p className="mt-2 text-lg font-medium text-white">Service health, uptime checks, and admin alerts</p>
            </div>
          </div>
        </aside>
      </section>

      <footer className="panel mb-8 flex flex-col gap-4 rounded-3xl border border-slate-800 bg-slate-900/80 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-slate-300">Available for product, platform, and operations work.</p>
          <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-500">© 2026 Byte Blast</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <a href="mailto:contact@byteblast.xyz" className="text-sm font-medium text-cyan-300 hover:text-cyan-200">
            contact@byteblast.xyz
          </a>
          <a href="mailto:admin@byteblast.xyz" className="text-sm font-medium text-slate-300 hover:text-white">
            admin@byteblast.xyz
          </a>
        </div>
      </footer>
    </main>
  );
}
