export type GitHubProject = {
  name: string;
  description: string | null;
  html_url: string;
  homepage: string | null;
  language: string | null;
  stargazers_count: number;
  updated_at: string;
  topics: string[];
};

function assertAllowedHost(url: URL, allowedHosts: string[]) {
  const hostname = url.hostname.toLowerCase();
  const isAllowed = allowedHosts.some((host) => hostname === host || hostname.endsWith(`.${host}`));

  if (!isAllowed) {
    throw new Error(`Host ${hostname} is not allowed for remote fetches.`);
  }
}

export async function getGitHubProjects() {
  const githubUser = process.env.GITHUB_USERNAME ?? "gnxbd4vbtm-ops";
  const url = new URL(`https://api.github.com/users/${githubUser}/repos`);
  url.searchParams.set("per_page", "6");
  url.searchParams.set("sort", "updated");

  try {
    assertAllowedHost(url, ["api.github.com", "github.com"]);

    const response = await fetch(url, {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "byteblast-portfolio",
        ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
      },
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      return [];
    }

    const repos = (await response.json()) as GitHubProject[];

    return repos
      .filter((repo) => !repo.name.startsWith("."))
      .slice(0, 3)
      .map((repo) => ({
        ...repo,
        description:
          repo.description ?? "Operational tooling and platform work built for production uptime.",
      }));
  } catch {
    return [];
  }
}
