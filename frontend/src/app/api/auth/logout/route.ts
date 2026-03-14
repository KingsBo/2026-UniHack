import { NextResponse } from "next/server";

function clearTokenAndRedirect() {
  const response = NextResponse.redirect(
    new URL("/", process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"),
  );

  response.cookies.set("github_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}

// Support both GET (for <a> links) and POST (for fetch calls)
export async function GET() {
  return clearTokenAndRedirect();
}

export async function POST() {
  return clearTokenAndRedirect();
}
