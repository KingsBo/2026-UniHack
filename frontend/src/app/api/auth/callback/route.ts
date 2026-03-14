import { NextRequest, NextResponse } from "next/server";
import { getOrCreateUser, getUserByGithubId } from "@/lib/supabase";
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

  // Fetch GitHub user info and upsert into DB
  let githubUserId: number | null = null;
  try {
    const userRes = await fetch("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    if (userRes.ok) {
      const ghUser = await userRes.json();
      await getOrCreateUser(
        ghUser.id,
        ghUser.login,
        ghUser.email,
        ghUser.avatar_url,
      );
      githubUserId = ghUser.id;

      // In test mode, auto-clear scan data on each login
      if (process.env.TEST_MODE === "true") {
        const dbUser = await getUserByGithubId(ghUser.id);
        if (dbUser) {
          await resetUserData(dbUser.id);
          console.log("[TEST_MODE] Cleared scan data for user:", ghUser.login);
        }
      }
    }
  } catch (err) {
    console.error("Failed to upsert user:", err);
  }

  const response = NextResponse.redirect(new URL("/dashboard", request.url));

  response.cookies.set("github_token", tokenData.access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });

  if (githubUserId) {
    response.cookies.set("github_user_id", String(githubUserId), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8,
    });
  }

  response.cookies.delete("oauth_state");

  return response;
}
