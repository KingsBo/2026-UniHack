import { NextResponse } from "next/server";
import { randomBytes } from "crypto";

export async function GET() {
  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: "GITHUB_CLIENT_ID not configured" }, { status: 500 });
  }

  const state = randomBytes(16).toString("hex");

  const params = new URLSearchParams({
    client_id: clientId,
    scope: "repo",
    state,
    redirect_uri: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/auth/callback`,
  });

  const response = NextResponse.redirect(
    `https://github.com/login/oauth/authorize?${params.toString()}`
  );

  response.cookies.set("oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });

  return response;
}
