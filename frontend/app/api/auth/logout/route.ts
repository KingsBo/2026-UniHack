import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  const cookieStore = await cookies();
  const response = NextResponse.json({ success: true });
  
  // Clear GitHub token
  response.cookies.delete("github_token");
  
  return response;
}

