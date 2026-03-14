import { NextRequest, NextResponse } from "next/server";

const GITLEAKS_SERVICE_URL =
  process.env.GITLEAKS_SERVICE_URL || "http://localhost:3001";
const TRIVY_SERVICE_URL =
  process.env.TRIVY_SERVICE_URL || "http://localhost:3002";

async function callScanner(serviceUrl: string, body: unknown) {
  const res = await fetch(`${serviceUrl}/scan`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Scanner returned ${res.status}`);
  }
  return res.json();
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("github_token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const { owner, repo } = body;

    if (!owner || !repo) {
      return NextResponse.json(
        { error: "Missing owner or repo" },
        { status: 400 }
      );
    }

    const repoUrl = `https://github.com/${owner}/${repo}`;
    const scannerPayload = { repoUrl, token };

    const [gitleaksResult, trivyResult] = await Promise.allSettled([
      callScanner(GITLEAKS_SERVICE_URL, scannerPayload),
      callScanner(TRIVY_SERVICE_URL, scannerPayload),
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
            ? gitleaksResult.reason?.message
            : null,
        trivy:
          trivyResult.status === "rejected"
            ? trivyResult.reason?.message
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
