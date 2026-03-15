import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getAuthenticatedUser } from "@/lib/get-user";
import type { Finding, Severity } from "@/types";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:streamGenerateContent?alt=sse&key=${GEMINI_API_KEY}`;

const SEVERITY_ORDER: Severity[] = ["critical", "high", "medium", "low", "info"];

function buildPrompt(findings: Finding[], repoName: string): string {
  // Group by severity and pick top 3-5 per category
  const grouped: Record<string, Finding[]> = {};
  for (const sev of SEVERITY_ORDER) {
    const matches = findings.filter((f) => f.severity === sev);
    if (matches.length > 0) {
      grouped[sev] = matches.slice(0, 5);
    }
  }

  // Build a structured summary of findings for the prompt
  let findingsSummary = "";
  for (const [sev, items] of Object.entries(grouped)) {
    findingsSummary += `\n## ${sev.toUpperCase()} (${findings.filter((f) => f.severity === sev).length} total)\n`;
    for (const f of items) {
      findingsSummary += `- **${f.title}** [${f.tool}]`;
      if (f.file) findingsSummary += ` in \`${f.file}\``;
      if (f.line > 0) findingsSummary += ` line ${f.line}`;
      findingsSummary += `\n  ${f.description}`;
      if (f.snippet) findingsSummary += `\n  Snippet: \`${f.snippet}\``;
      if (f.pkgName) findingsSummary += `\n  Package: ${f.pkgName}@${f.installedVersion || "?"}`;
      if (f.fixedVersion) findingsSummary += ` → fix: ${f.fixedVersion}`;
      if (f.cveId) findingsSummary += `\n  CVE: ${f.cveId}`;
      findingsSummary += "\n";
    }
  }

  return `Below are security scan findings for the repository "${repoName}", from Gitleaks (secrets) and Trivy (vulnerabilities), grouped by severity.

${findingsSummary}

Write a concise security analysis. Start with a single short sentence like "Here's a security analysis of the scan results for \`${repoName}\`." — do NOT roleplay as a security engineer, do NOT introduce yourself, and do NOT write a lengthy introduction.

Then structure the rest by severity level. Use EXACTLY this format for severity headings — one per severity that has findings:
## Critical
## High
## Medium
## Low

Rules:
- If there are multiple similar findings (e.g. same type of secret, same CVE pattern), group them together naturally.
- Pick the 3-5 most important findings per severity category.
- For each finding or group of related findings, seamlessly explain what the issue is, why it happens, and how to fix it — but do NOT use labels like "What:", "Why:", "How:" or numbered steps. Just write it as a flowing, natural paragraph.
- Be concise but specific. Reference actual file names, package versions, and CVE IDs where relevant.
- If a severity category has no findings, skip it entirely.
- Do NOT add a summary/conclusion section at the end.

Use markdown formatting. Use **bold** for emphasis on key terms. Use \`code\` for file names, package names, and versions. Keep it direct and concise.`;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await params; // consume params

  if (!GEMINI_API_KEY) {
    return new Response(
      JSON.stringify({ error: "Gemini API key not configured" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  const body = await request.json();
  const { findings, repoName } = body as {
    findings: Finding[];
    repoName: string;
  };

  if (!findings || findings.length === 0) {
    return new Response(
      JSON.stringify({ error: "No findings to analyze" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const prompt = buildPrompt(findings, repoName);

  const geminiRes = await fetch(GEMINI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 4096,
      },
    }),
  });

  if (!geminiRes.ok) {
    const errText = await geminiRes.text();
    console.error("Gemini API error:", errText);
    const isRateLimit = geminiRes.status === 429;
    return new Response(
      JSON.stringify({
        error: isRateLimit
          ? "AI quota exceeded — please wait a moment and try again."
          : "AI service unavailable",
      }),
      { status: isRateLimit ? 429 : 502, headers: { "Content-Type": "application/json" } },
    );
  }

  // Stream SSE from Gemini to the client as plain text stream
  const encoder = new TextEncoder();
  const reader = geminiRes.body?.getReader();
  if (!reader) {
    return new Response(
      JSON.stringify({ error: "No response stream" }),
      { status: 502, headers: { "Content-Type": "application/json" } },
    );
  }

  const stream = new ReadableStream({
    async start(controller) {
      const decoder = new TextDecoder();
      let buffer = "";

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // Parse SSE events from Gemini
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const jsonStr = line.slice(6).trim();
            if (!jsonStr || jsonStr === "[DONE]") continue;

            try {
              const parsed = JSON.parse(jsonStr);
              const text =
                parsed?.candidates?.[0]?.content?.parts?.[0]?.text || "";
              if (text) {
                controller.enqueue(encoder.encode(text));
              }
            } catch {
              // Skip malformed JSON chunks
            }
          }
        }
      } catch (err) {
        console.error("Stream error:", err);
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Transfer-Encoding": "chunked",
      "Cache-Control": "no-cache",
    },
  });
}

/** PUT /api/scan/[id]/summary — save an AI-generated summary for a scan */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: scanId } = await params;

  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json();
  const { summary } = body as { summary?: string };

  if (!summary || typeof summary !== "string") {
    return NextResponse.json(
      { error: "Missing or invalid summary" },
      { status: 400 },
    );
  }

  // Verify the scan belongs to this user
  const { data: scan, error: scanErr } = await supabase
    .from("scans")
    .select("id")
    .eq("id", scanId)
    .eq("user_id", user.id)
    .single();

  if (scanErr || !scan) {
    return NextResponse.json({ error: "Scan not found" }, { status: 404 });
  }

  // Save the AI summary
  const { error: updateErr } = await supabase
    .from("scans")
    .update({ ai_summary: summary })
    .eq("id", scanId);

  if (updateErr) {
    console.error("Failed to save AI summary:", updateErr.message);
    return NextResponse.json(
      { error: "Failed to save summary" },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}

/** GET /api/scan/[id]/summary — fetch just the AI summary for a scan */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: scanId } = await params;

  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data: scan, error: scanErr } = await supabase
    .from("scans")
    .select("ai_summary")
    .eq("id", scanId)
    .eq("user_id", user.id)
    .single();

  if (scanErr || !scan) {
    return NextResponse.json({ error: "Scan not found" }, { status: 404 });
  }

  return NextResponse.json({ aiSummary: scan.ai_summary || null });
}

