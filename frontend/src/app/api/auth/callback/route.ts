import { NextRequest, NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/supabase";
import { resetUserData } from "@/app/api/dev/reset/route";

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

  // Fetch GitHub user info and upsert into DB before creating the app session.
  let githubUserId: number;
  try {
    const userRes = await fetch("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    if (!userRes.ok) {
      throw new Error(`GitHub user lookup failed with ${userRes.status}`);
    }

    const ghUser = await userRes.json();
    const dbUser = await getOrCreateUser(
      ghUser.id,
      ghUser.login,
      ghUser.email,
      ghUser.avatar_url,
    );
    githubUserId = ghUser.id;

    // In test mode, auto-clear scan data on each login
    if (process.env.TEST_MODE === "true") {
      await resetUserData(dbUser.id);
      console.log("[TEST_MODE] Cleared scan data for user:", ghUser.login);
    }
  } catch (err) {
    console.error("Failed to create app user session:", err);
    return NextResponse.redirect(new URL("/?error=profile_failed", request.url));
  }

  const response = NextResponse.redirect(new URL("/dashboard", request.url));

  response.cookies.set("github_token", tokenData.access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });

  response.cookies.set("github_user_id", String(githubUserId), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });

  response.cookies.delete("oauth_state");

  return response;
}
