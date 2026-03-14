import { NextRequest, NextResponse } from "next/server";

const GITLEAKS_SERVICE_URL =
  process.env.GITLEAKS_SERVICE_URL || "http://localhost:3001";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const scanRes = await fetch(`${GITLEAKS_SERVICE_URL}/scan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await scanRes.json();

    return NextResponse.json(data, { status: scanRes.status });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Scanner proxy error:", message);
    return NextResponse.json(
      { error: `Scanner service unavailable: ${message}` },
      { status: 502 }
    );
  }
}
