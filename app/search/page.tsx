import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSearchShortcut } from "@/lib/search-easter-eggs";

export const metadata: Metadata = {
  title: "Search",
  description: "Search public pages and sections on byteblast.xyz.",
};

const searchEntries = [
  {
    title: "Home",
    href: "/",
    description:
      "Developer portfolio for software projects, product delivery, and self-hosted infrastructure.",
    keywords: "byteblast developer portfolio software engineering",
  },
  {
    title: "Platform engineering",
    href: "/#work",
    description:
      "Resilient systems, secure infrastructure, deployment automation, and observability.",
    keywords: "platform infrastructure deployment automation observability",
  },
  {
    title: "Product delivery",
    href: "/#work",
    description:
      "Focused user workflows, measurable outcomes, and pragmatic software architecture.",
    keywords: "product software workflow architecture",
  },
  {
    title: "DevOps and security",
    href: "/#work",
    description:
      "Production-ready systems with operational clarity, traceability, and hardening.",
    keywords: "devops security production operations",
  },
  {
    title: "Shared tools and access",
    href: "/#services",
    description:
      "Download utility, Forgejo repositories, and private code-server access.",
    keywords: "download media forgejo git repositories code-server codespace tools",
  },
  {
    title: "Infrastructure snapshot",
    href: "/#systems",
    description:
      "Public endpoint health, deployment model, monitoring, uptime, Linux, and private tunnel routing.",
    keywords: "infrastructure status endpoint uptime monitoring linux tunnel",
  },
  {
    title: "About",
    href: "/about",
    description:
      "Learn about Byte's approach to reliable software, secure systems, product engineering, and operations.",
    keywords: "about engineering reliable secure self-hosted observability resilience",
  },
  {
    title: "Contact",
    href: "/contact",
    description:
      "Get in touch by email or send a project, access, or collaboration request.",
    keywords: "contact email project access collaboration",
  },
  {
    title: "Site status",
    href: "/status",
    description:
      "Live site health, uptime, latency, storage health, monitoring, and recent probe checks.",
    keywords: "status health uptime latency storage probes monitoring",
  },
  {
    title: "Privacy notice",
    href: "/privacy",
    description:
      "Information about contact requests, privacy, monitoring, and public site data.",
    keywords: "privacy data contact monitoring",
  },
  {
    title: "Terms of use",
    href: "/terms",
    description:
      "Terms for using this portfolio, public status pages, project references, and external links.",
    keywords: "terms use portfolio status projects links",
  },
];

type SearchPageProps = {
  searchParams: Promise<{ q?: string | string[] }>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q.trim() : "";
  const shortcutPath = getSearchShortcut(query);
  if (shortcutPath) {
    redirect(shortcutPath);
  }

  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  const results = searchEntries
    .map((entry) => {
      const searchableText =
        `${entry.title} ${entry.description} ${entry.keywords}`.toLowerCase();
      const score = terms.reduce((total, term) => {
        if (entry.title.toLowerCase().includes(term)) {
          return total + 3;
        }

        return total + (searchableText.includes(term) ? 1 : 0);
      }, 0);

      return { ...entry, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);

  return (
    <main className="site-shell search-page">
      <div className="search-page-heading">
        <p className="section-label">Site search</p>
        <h1>Search byteblast.xyz</h1>
        <p>Find public pages and sections across the site.</p>
      </div>

      <form
        action="/search"
        method="get"
        role="search"
        className="site-search-form search-page-form"
      >
        <input
          type="search"
          name="q"
          aria-label="Search public pages"
          placeholder="Try “status” or “infrastructure”"
          defaultValue={query}
          className="site-search-input"
        />
        <button type="submit" aria-label="Submit search" className="site-search-submit">
          <svg aria-hidden="true" viewBox="0 0 20 20" fill="none">
            <circle cx="8.75" cy="8.75" r="5.75" />
            <path d="m13 13 4 4" />
          </svg>
        </button>
      </form>

      {query ? (
        results.length > 0 ? (
          <>
            <p className="search-result-count" aria-live="polite">
              {results.length} {results.length === 1 ? "result" : "results"} for “{query}”
            </p>
            <div className="search-results">
              {results.map((result) => (
                <Link
                  key={`${result.title}-${result.href}`}
                  href={result.href}
                  className="search-result"
                >
                  <h2>{result.title}</h2>
                  <p>{result.description}</p>
                </Link>
              ))}
            </div>
          </>
        ) : (
          <p className="search-empty" aria-live="polite">
            No results found for “{query}”. Try a different search.
          </p>
        )
      ) : (
        <p className="search-empty">Enter a search term to find public site content.</p>
      )}

      <Link href="/" className="search-home-link">
        Back to home
      </Link>
    </main>
  );
}
