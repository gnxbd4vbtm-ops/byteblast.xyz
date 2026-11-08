"use client";

import { useEffect, useState } from "react";

type FeaturedProject = {
  name: string;
  detail: string;
  stack: string[];
  href: string;
};

type ApiProject = {
  name: string;
  description: string | null;
  language: string | null;
  topics: string[];
  href: string;
};

const fallbackProjects: FeaturedProject[] = [
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

export default function RecentProjects() {
  const [projects, setProjects] = useState(fallbackProjects);

  useEffect(() => {
    const controller = new AbortController();

    async function loadProjects() {
      try {
        const response = await fetch("/api/projects", {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error(`Projects request failed with status ${response.status}`);
        }

        const repos = (await response.json()) as ApiProject[];
        if (!Array.isArray(repos)) {
          throw new Error("Projects response was not a list");
        }

        if (repos.length > 0) {
          setProjects(
            repos.map((repo) => ({
              name: repo.name,
              detail:
                repo.description ??
                "Platform and product work shipped with a security-first mindset.",
              stack: [repo.language ?? "Code", ...(repo.topics ?? []).slice(0, 2)],
              href: repo.href,
            })),
          );
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error("Unable to load recent projects:", error);
        }
      }
    }

    void loadProjects();
    return () => controller.abort();
  }, []);

  return (
    <div className="project-list">
      {projects.map((project) => (
        <a
          key={project.name}
          href={project.href}
          target="_blank"
          rel="noreferrer"
          className="project-item"
        >
          <div className="project-topline">
            <div>
              <h3>{project.name}</h3>
              <p className="body-copy">{project.detail}</p>
            </div>
            <span className="project-state">active</span>
          </div>

          <div className="tag-list">
            {project.stack.map((stack) => (
              <span key={stack} className="project-tag">
                {stack}
              </span>
            ))}
          </div>
        </a>
      ))}
    </div>
  );
}
