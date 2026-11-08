import Link from "next/link";
import SiteHeader from "@/components/site-header";
import SiteLatency from "@/components/site-latency";
import RecentProjects from "@/components/recent-projects";
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
    name: "download.byteblast.xyz",
    description: "Self-hosted utility for downloading supported public media as video or audio.",
    href: "https://download.byteblast.xyz",
    cta: "Open downloader",
    external: true,
  },
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
  const siteStatus = await getLiveSiteStatus();
  const content = getSiteContent();

  const siteHealth = [
    { label: "Ping", value: null, state: "ok" },
    { label: "System uptime", value: `${siteStatus.uptimePercent}%`, state: siteStatus.uptimePercent >= 99 ? "ok" : "warn" },
  ];

  return (
    <main className="site-shell">
      <SiteHeader />

      <section className="intro-layout">
        <div className="intro-main">
          <div className="availability">
            <span className="availability-mark" />
            {content.availability}
          </div>

          <div className="intro-copy">
            <h1>{content.hero_headline}</h1>
            <p className="intro-description">{content.hero_description}</p>
          </div>

          <div className="intro-actions">
            <Link href="#work" className="button-primary">
              View work
            </Link>
            <Link href="/status" className="button-secondary">
              Review status
            </Link>
          </div>
        </div>

        <aside className="focus-panel">
          <div>
            <p className="section-label">Current focus</p>
            <p className="focus-name">{content.current_focus}</p>
          </div>

          <div className="health-list">
            {siteHealth.map((item) => (
              <div key={item.label} className="health-row">
                <span>{item.label}</span>
                {item.label === "Ping" ? (
                  <SiteLatency className="health-value" />
                ) : (
                  <span className={`health-value ${item.state === "ok" ? "is-ok" : "is-warn"}`}>
                    {item.value}
                  </span>
                )}
              </div>
            ))}
          </div>
        </aside>
      </section>

      <section id="work" className="capability-grid">
        {capabilityGroups.map((capability, index) => (
          <article key={capability.title} className="capability-item">
            <p className="section-label">0{index + 1} / Things I work on</p>
            <h2>{capability.title}</h2>
            <p className="body-copy">
              {capability.description}
            </p>
          </article>
        ))}
      </section>

      <section id="services" className="content-section">
        <div className="section-heading">
          <div>
            <p className="section-label">Access points</p>
            <h2>Shared tools and private environments</h2>
          </div>
          <p className="section-note">Request access to the code-server environment via the contact form or email.</p>
        </div>

        <div className="access-grid">
          {accessServices.map((service) => (
            <div key={service.name} className="access-item">
              <div className="access-topline">
                <div>
                  <p className="section-label">Service</p>
                  <h3>{service.name}</h3>
                </div>
                {service.name === "codespace.byteblast.xyz" && (
                  <span className="request-label">
                    Request
                  </span>
                )}
              </div>

              <p className="body-copy">{service.description}</p>

              <div className="service-actions">
                <a
                  href={service.href}
                  target={service.external ? "_blank" : undefined}
                  rel={service.external ? "noreferrer" : undefined}
                  className="button-primary"
                >
                  {service.cta}
                </a>
                {service.email && (
                  <a
                    href={service.email}
                    className="button-secondary"
                  >
                    Email access request
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="work-layout">
        <div className="content-section project-section">
          <div className="section-heading">
            <div>
              <p className="section-label">Selected projects</p>
              <h2>Recent build work</h2>
            </div>
            <Link href="/admin" className="text-link">
              View admin overview
            </Link>
          </div>

          <RecentProjects />
        </div>

        <aside id="systems" className="content-section systems-section">
          <p className="section-label">Operational view</p>
          <h2>Infrastructure snapshot</h2>

          <div className="system-list">
            <div className="system-item">
              <div className="system-row">
                <span>Public endpoint</span>
                <span className="system-metric">
                  99.98%
                </span>
              </div>
              <p className="system-value">Stable</p>
            </div>

            <div className="system-item">
              <p className="system-label">Deployment model</p>
              <p className="system-detail">Next.js on Linux + private tunnel routing</p>
            </div>

            <div className="system-item">
              <p className="system-label">Monitoring</p>
              <p className="system-detail">Service health, uptime checks, and admin alerts</p>
            </div>
          </div>
        </aside>
      </section>

      <footer className="site-footer">
        <div>
          <p>Available for product, platform, and operations work.</p>
          <p className="footer-note">© 2026 Byte Blast</p>
        </div>
        <div className="footer-links">
          <a href="mailto:contact@byteblast.xyz">
            contact@byteblast.xyz
          </a>
          <a href="mailto:admin@byteblast.xyz">
            admin@byteblast.xyz
          </a>
        </div>
      </footer>
    </main>
  );
}
