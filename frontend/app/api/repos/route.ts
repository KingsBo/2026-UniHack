import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  const cookieStore = await cookies();
  const githubToken = cookieStore.get("github_token")?.value;

  if (!githubToken) {
    return NextResponse.json(
      { error: "Not authenticated. Please log in with GitHub." },
      { status: 401 }
    );
  }

  try {
    // Fetch user's repositories from GitHub API
    const reposResponse = await fetch("https://api.github.com/user/repos?per_page=100&sort=updated", {
      headers: {
        Authorization: `token ${githubToken}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (!reposResponse.ok) {
      if (reposResponse.status === 401) {
        return NextResponse.json(
          { error: "Authentication failed. Please log in again." },
          { status: 401 }
        );
      }
      throw new Error(`GitHub API error: ${reposResponse.status}`);
    }

    const repos = await reposResponse.json();

    // Format repos for frontend
    const formattedRepos = repos.map((repo: any) => ({
      id: repo.id,
      name: repo.name,
      fullName: repo.full_name,
      url: repo.html_url,
      cloneUrl: repo.clone_url,
      private: repo.private,
      description: repo.description,
      updatedAt: repo.updated_at,
    }));

    return NextResponse.json({ repos: formattedRepos });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Failed to fetch repos:", message);
    return NextResponse.json(
      { error: `Failed to fetch repositories: ${message}` },
      { status: 500 }
    );
  }
}

