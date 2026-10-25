import { getSiteContent } from "@/lib/db";
import { getGitHubProjects } from "@/lib/github";
import { getLiveSiteStatus } from "@/lib/status";

export const dynamic = "force-dynamic";

function escapeMarkdown(value: string) {
  return value.replace(/([\\`*_{}\[\]<>])/g, "\\$1").replace(/\s+/g, " ").trim();
}

function link(label: string, href: string) {
  return `[${escapeMarkdown(label)}](${href})`;
}

async function renderHome() {
  const content = getSiteContent();
  const [projects, status] = await Promise.all([
    getGitHubProjects(),
    getLiveSiteStatus(),
  ]);
  const featuredProjects = projects.length
    ? projects
    : [
        {
          name: "Orbit Control",
          description: "Private internal ops dashboard for service provisioning, environment health, and release visibility.",
          html_url: "https://github.com/gnxbd4vbtm-ops",
          language: "Next.js",
          topics: ["SQLite", "Linux"],
        },
        {
          name: "Bluepeak Relay",
          description: "High-availability event pipeline powering monitoring, alerting, and service state tracking across self-hosted systems.",
          html_url: "https://github.com/gnxbd4vbtm-ops",
          language: "Go",
          topics: ["gRPC", "Kafka"],
        },
        {
          name: "Signal Forge",
          description: "Automation toolkit that normalizes deployment checks, health indicators, and escalation logic for developer operations.",
          html_url: "https://github.com/gnxbd4vbtm-ops",
          language: "TypeScript",
          topics: ["CI/CD", "Monitoring"],
        },
      ];
  const projectList = featuredProjects
    .map((project) => {
      const detail =
        project.description ??
        "Platform and product work shipped with a security-first mindset.";
      const stack = [project.language ?? "Code", ...project.topics.slice(0, 2)]
        .map(escapeMarkdown)
        .join(", ");
      return `- [${escapeMarkdown(project.name)}](${project.html_url}) — ${escapeMarkdown(detail)} (${stack})`;
    })
    .join("\n");

  return `# byteblast.xyz

${escapeMarkdown(content.availability)}

## ${escapeMarkdown(content.hero_headline)}

${escapeMarkdown(content.hero_description)}

### Current focus

${escapeMarkdown(content.current_focus)}

### Things I work on

- **Platform engineering:** Build resilient systems with secure infrastructure, deployment automation, and observability hooks that keep operations transparent.
- **Product delivery:** Ship fast without sacrificing maintainability through focused user workflows, measurable outcomes, and pragmatic architecture.
- **DevOps and security:** Design systems that are safe, traceable, and production-ready with a bias toward operational clarity and hardening.

### Shared tools and environments

- **download.byteblast.xyz:** Self-hosted utility for downloading supported public media as video or audio.
- **git.byteblast.xyz:** Forgejo for shared repositories, code review, and project coordination.
- **codespace.byteblast.xyz:** Private code-server environment for trusted collaborators. Access is by request through ${link("contact", "/contact")}.

### Selected projects

${projectList}

### Infrastructure snapshot

- Public endpoint: ${escapeMarkdown(status.state)} (${status.uptimePercent}% calculated uptime)
- Deployment: Next.js on Linux with private tunnel routing
- Monitoring: service health, uptime checks, and admin alerts

### Contact

- [Email](mailto:contact@byteblast.xyz)
- [Status page](/status)
`;
}

function renderAbout() {
  return `# About

## I build software that works in the real world.

I am a developer and operator focused on building reliable software, secure systems, and clean product experiences. My work bridges product thinking with infrastructure discipline so the result feels polished without losing operational clarity.

That means I care about the complete lifecycle: architecture decisions, shipping velocity, deployment reliability, observability, and how the system behaves once real users begin depending on it.

My projects tend to sit at the intersection of product engineering, self-hosted operations, and secure automation. I prefer systems that are understandable, measurable, and resilient under pressure.

## Core strengths

- **Engineering mindset:** Designing systems that are simple, secure, and operationally clear.
- **Product lens:** Balancing user experience with maintainability and deployment clarity.
- **Ops focus:** Treating uptime, observability, and resilience as core product quality.

${link("Contact", "/contact")}
`;
}

function renderContact() {
  return `# Contact

## Let’s build something dependable.

- **Email:** [contact@byteblast.xyz](mailto:contact@byteblast.xyz)
- **Admin:** [admin@byteblast.xyz](mailto:admin@byteblast.xyz)
- **GitHub:** [github.byteblast.xyz](https://github.byteblast.xyz)

Need access to codespace.byteblast.xyz? Email [contact@byteblast.xyz](mailto:contact@byteblast.xyz) with a short request describing the project and intended use.
`;
}

function renderPrivacy() {
  return `# Privacy notice

byteblast.xyz is designed to keep public-facing information minimal, operationally transparent, and respectful of user privacy.

Contact requests may be processed only as needed to respond to inquiries, and administrative operations remain restricted to authenticated system operators.

No sensitive operational data is exposed to anonymous visitors. Monitoring, deployment state, and private administrative surfaces are intentionally isolated behind secure access controls.
`;
}

function renderTerms() {
  return `# Terms of use

This site is provided as a portfolio and operational status surface for byteblast.xyz. The content may be updated at any time without prior notice in order to reflect active work, status changes, or service maintenance.

The private administrative interface is restricted to authorized personnel and must not be used or accessed without appropriate permissions.

Any external links, integrations, or public project references are provided for informational purposes and may change over time as projects evolve.
`;
}

async function renderStatus() {
  const status = await getLiveSiteStatus();
  const probes = status.recentProbes.length
    ? status.recentProbes.map((probe) =>
        `- **${escapeMarkdown(probe.probeType)}:** ${escapeMarkdown(probe.message || `HTTP ${probe.statusCode}`)} (${probe.latencyMs} ms)`,
      )
    : ["- Initial operational check completed. Probes are actively logging."];

  return `# byteblast.xyz site status

- **State:** ${escapeMarkdown(status.state)}
- **Service:** ${escapeMarkdown(status.service)}
- **Verified:** ${new Date(status.lastChecked).toUTCString()}
- **Headline:** ${escapeMarkdown(status.headline)}
- **Message:** ${escapeMarkdown(status.message)}

## Metrics

- Calculated uptime: ${status.uptimePercent}%
- 24-hour traffic handled: ${status.totalEvents24h} events
- Dynamic page impressions: ${status.pageViews24h}
- Storage health: ${escapeMarkdown(status.dbStatus)}
- Database latency: ${status.dbLatencyMs} ms

## Operational posture

${escapeMarkdown(status.statusNotes)}

- Target host: Linux bare-metal / systemd
- Ingress tunnel: Cloudflare Zero Trust Tunnel
- State store: SQLite WAL mode

## Recent probe checks

${probes.join("\n")}
`;
}

export async function GET(request: Request) {
  const pathname = new URL(request.url).searchParams.get("__markdown_path");
  let markdown: string;

  switch (pathname) {
    case "/":
      markdown = await renderHome();
      break;
    case "/about":
      markdown = renderAbout();
      break;
    case "/contact":
      markdown = renderContact();
      break;
    case "/privacy":
      markdown = renderPrivacy();
      break;
    case "/status":
      markdown = await renderStatus();
      break;
    case "/terms":
      markdown = renderTerms();
      break;
    default:
      return new Response("Not found\n", {
        status: 404,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          Vary: "Accept",
        },
      });
  }

  return new Response(markdown, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      Vary: "Accept",
    },
  });
}
