import { NextRequest, NextResponse } from "next/server";
import {
  GITLEAKS_SERVICE_URL,
  TRIVY_SERVICE_URL,
  callScanner,
} from "./shared";

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
    const payload = { repoUrl, token };

    const [gitleaksResult, trivyResult] = await Promise.allSettled([
      callScanner(GITLEAKS_SERVICE_URL, payload),
      callScanner(TRIVY_SERVICE_URL, payload),
    ]);

    return NextResponse.json({
      gitleaks:
        gitleaksResult.status === "fulfilled" ? gitleaksResult.value : null,
      trivy:
        trivyResult.status === "fulfilled" ? trivyResult.value : null,
      repo: repoUrl,
      errors: {
        gitleaks:
          gitleaksResult.status === "rejected"
            ? (gitleaksResult.reason as Error)?.message ?? "Gitleaks failed"
            : null,
        trivy:
          trivyResult.status === "rejected"
            ? (trivyResult.reason as Error)?.message ?? "Trivy failed"
            : null,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Scan proxy error:", message);
    return NextResponse.json(
      { error: `Scan failed: ${message}` },
      { status: 500 }
    );
  }
}


