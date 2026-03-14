import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const savedState = request.cookies.get("oauth_state")?.value;

  if (!code || !state || state !== savedState) {
    return NextResponse.redirect(new URL("/?error=auth_failed", request.url));
  }

  const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
    }),
  });

  const tokenData = await tokenRes.json();

  if (tokenData.error || !tokenData.access_token) {
    console.error("OAuth token exchange failed:", tokenData.error);
    return NextResponse.redirect(new URL("/?error=token_failed", request.url));
  }

  const response = NextResponse.redirect(new URL("/dashboard", request.url));

  response.cookies.set("github_token", tokenData.access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });

  response.cookies.delete("oauth_state");

  return response;
}
