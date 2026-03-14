import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const token = request.cookies.get("github_token")?.value;

  if (!token) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const repos = [];
  let page = 1;

  while (page <= 5) {
    const res = await fetch(
      `https://api.github.com/user/repos?per_page=100&sort=updated&page=${page}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
        },
      }
    );

    if (!res.ok) {
      return NextResponse.json({ error: "Failed to fetch repos" }, { status: res.status });
    }

    const batch = await res.json();
    if (batch.length === 0) break;

    for (const r of batch) {
      if (r.permissions?.admin || r.permissions?.push) {
        repos.push({
          id: r.id,
          name: r.name,
          full_name: r.full_name,
          owner: r.owner.login,
          private: r.private,
          html_url: r.html_url,
          description: r.description,
          language: r.language,
          default_branch: r.default_branch,
          updated_at: r.updated_at,
        });
      }
    }

    if (batch.length < 100) break;
    page++;
  }

  return NextResponse.json({ repos });
}
