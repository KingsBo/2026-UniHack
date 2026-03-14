import { NextRequest, NextResponse } from "next/server";
import { callScanner, GITLEAKS_SERVICE_URL } from "../shared";

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("github_token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const { owner, repo } = body as { owner?: string; repo?: string };

    if (!owner || !repo) {
      return NextResponse.json(
        { error: "Missing owner or repo" },
        { status: 400 }
      );
    }

    const repoUrl = `https://github.com/${owner}/${repo}`;
    const scannerPayload = { repoUrl, token };
    const result = await callScanner(GITLEAKS_SERVICE_URL, scannerPayload);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Gitleaks scan error:", message);
    return NextResponse.json(
      { error: `Gitleaks scan failed: ${message}` },
      { status: 500 }
    );
  }
}

