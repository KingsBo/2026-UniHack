import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
const GITHUB_CALLBACK_URL = process.env.GITHUB_CALLBACK_URL || 
  `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/auth/github/callback`;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(`${APP_URL}?error=${encodeURIComponent(error)}`);
  }

  if (!code || !state) {
    return NextResponse.redirect(`${APP_URL}?error=missing_params`);
  }

  // Verify state
  const cookieStore = await cookies();
  const storedState = cookieStore.get("github_oauth_state")?.value;
  if (storedState !== state) {
    return NextResponse.redirect(`${APP_URL}?error=invalid_state`);
  }

  // Exchange code for access token
  try {
    const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: GITHUB_CALLBACK_URL,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      return NextResponse.redirect(
        `${APP_URL}?error=${encodeURIComponent(tokenData.error_description || tokenData.error)}`
      );
    }

    // Store token in httpOnly cookie
    const response = NextResponse.redirect(`${APP_URL}?auth=success`);
    response.cookies.set("github_token", tokenData.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    // Clear state cookie
    response.cookies.delete("github_oauth_state");

    return response;
  } catch (err) {
    console.error("OAuth token exchange failed:", err);
    return NextResponse.redirect(`${APP_URL}?error=token_exchange_failed`);
  }
}

