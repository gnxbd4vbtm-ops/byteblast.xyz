import { NextResponse } from "next/server";
import { getGitHubProjects } from "@/lib/github";

export async function GET() {
  const repos = await getGitHubProjects();

  return NextResponse.json(
    repos.map(({ name, description, language, topics, html_url }) => ({
      name,
      description,
      language,
      topics,
      href: html_url,
    })),
    {
      headers: {
        "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
      },
    },
  );
}
