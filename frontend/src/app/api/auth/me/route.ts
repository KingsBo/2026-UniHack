import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const token = request.cookies.get("github_token")?.value;

  if (!token) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const res = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
    },
  });

  if (!res.ok) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const user = await res.json();

  return NextResponse.json({
    login: user.login,
    name: user.name,
    avatar_url: user.avatar_url,
  });
}
