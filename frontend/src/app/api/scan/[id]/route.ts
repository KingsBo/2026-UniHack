import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getAuthenticatedUser } from "@/lib/get-user";

const DEMO_RESULT = {
  id: "demo",
  repoId: "demo-repo",
  repoName: "acme/web-api",
  status: "complete",
  branch: "main",
  commitSha: "a3f92c1",
  startedAt: new Date(Date.now() - 154000).toISOString(),
  completedAt: new Date().toISOString(),
  durationMs: 154000,
  fileCount: 142,
  findings: [
    {
      id: "d-1",
      tool: "gitleaks",
      severity: "critical",
      title: "Hardcoded AWS credentials detected",
      description:
        "AWS access key and secret found in plaintext. These credentials provide access to production S3 buckets and should be rotated immediately and moved to environment variables or a secrets manager.",
      file: "src/config/aws.ts",
      line: 34,
      rule: "aws-access-token",
      snippet: 'AWS_SECRET_ACCESS_KEY = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"',
    },
    {
      id: "d-2",
      tool: "gitleaks",
      severity: "critical",
      title: "GitHub personal access token committed",
      description:
        "A GitHub PAT was found in source code. This token can be used to access repositories and should be revoked immediately.",
      file: "scripts/deploy.sh",
      line: 12,
      rule: "github-pat",
      snippet: 'GITHUB_TOKEN="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"',
    },
    {
      id: "d-3",
      tool: "trivy",
      severity: "high",
      title: "CVE-2024-29041 — Express.js open redirect",
      description:
        "Affects express (4.18.2). Fix: upgrade to 4.19.2. Versions of Express.js prior to 4.19.2 are vulnerable to open redirects via malformed URLs.",
      file: "express",
      line: 0,
      rule: "CVE-2024-29041",
      pkgName: "express",
      installedVersion: "4.18.2",
      fixedVersion: "4.19.2",
      cveId: "CVE-2024-29041",
      primaryUrl: "https://nvd.nist.gov/vuln/detail/CVE-2024-29041",
    },
    {
      id: "d-4",
      tool: "trivy",
      severity: "high",
      title: "CVE-2024-28849 — follow-redirects SSRF",
      description:
        "Affects follow-redirects (1.15.4). Fix: upgrade to 1.15.6. Possible SSRF via crafted redirect responses.",
      file: "follow-redirects",
      line: 0,
      rule: "CVE-2024-28849",
      pkgName: "follow-redirects",
      installedVersion: "1.15.4",
      fixedVersion: "1.15.6",
      cveId: "CVE-2024-28849",
      primaryUrl: "https://nvd.nist.gov/vuln/detail/CVE-2024-28849",
    },
    {
      id: "d-5",
      tool: "gitleaks",
      severity: "high",
      title: "Stripe secret key exposed",
      description:
        "A Stripe secret key was found in the codebase. This key can be used to manage payments and should be rotated.",
      file: "src/payments/stripe.ts",
      line: 8,
      rule: "stripe-access-token",
      snippet: 'const STRIPE_KEY = "sk_live_xxxxxxxxxxxxxxxxxxxxxxxx"',
    },
    {
      id: "d-6",
      tool: "trivy",
      severity: "medium",
      title: "CVE-2024-37890 — ws denial of service",
      description:
        "Affects ws (8.14.1). Fix: upgrade to 8.17.1. A specially crafted request can crash the WebSocket server.",
      file: "ws",
      line: 0,
      rule: "CVE-2024-37890",
      pkgName: "ws",
      installedVersion: "8.14.1",
      fixedVersion: "8.17.1",
      cveId: "CVE-2024-37890",
      primaryUrl: "https://nvd.nist.gov/vuln/detail/CVE-2024-37890",
    },
    {
      id: "d-7",
      tool: "trivy",
      severity: "low",
      title: "CVE-2024-4068 — braces ReDoS",
      description:
        "Affects braces (3.0.2). Fix: upgrade to 3.0.3. Regular expression denial of service via crafted input.",
      file: "braces",
      line: 0,
      rule: "CVE-2024-4068",
      pkgName: "braces",
      installedVersion: "3.0.2",
      fixedVersion: "3.0.3",
      cveId: "CVE-2024-4068",
      primaryUrl: "https://nvd.nist.gov/vuln/detail/CVE-2024-4068",
    },
  ],
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: scanId } = await params;

  // Return demo data without auth
  if (scanId === "demo") {
    return NextResponse.json(DEMO_RESULT);
  }

  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data: scan, error: scanErr } = await supabase
    .from("scans")
    .select("*, repository:repositories(id, name, full_name)")
    .eq("id", scanId)
    .eq("user_id", user.id)
    .single();

  if (scanErr || !scan) {
    return NextResponse.json({ error: "Scan not found" }, { status: 404 });
  }

  const { data: results, error: resultsErr } = await supabase
    .from("scan_results")
    .select("*")
    .eq("scan_id", scanId)
    .order("severity", { ascending: true });

  if (resultsErr) {
    console.error("Failed to fetch scan results:", resultsErr.message);
    return NextResponse.json({ error: "Failed to fetch results" }, { status: 500 });
  }

  const repo = scan.repository as Record<string, unknown> | null;

  const findings = (results || []).map((r: Record<string, unknown>, i: number) => ({
    id: r.id || `r-${i}`,
    tool: r.tool_name,
    severity: r.severity,
    title: r.title,
    description: r.description,
    file: r.file_path,
    line: r.line_number || 0,
    rule: r.rule_id,
    snippet: r.snippet,
    commit: r.commit_sha,
    author: r.author,
    pkgName: r.pkg_name,
    installedVersion: r.installed_version,
    fixedVersion: r.fixed_version,
    cveId: r.cve_id,
    primaryUrl: r.primary_url,
  }));

  // Derive commit SHA: try gitleaks findings first, then fetch HEAD from GitHub
  let commitSha =
    findings.find((f: Record<string, unknown>) => f.commit)?.commit as string | undefined;

  if (commitSha) {
    commitSha = commitSha.slice(0, 7);
  } else {
    // Fetch the latest commit on the scanned branch from GitHub
    const repoFullName = repo?.full_name as string | undefined;
    const branch = scan.branch || "main";
    const ghToken = (user as Record<string, unknown>).token as string | undefined;

    if (repoFullName && ghToken) {
      try {
        const ghRes = await fetch(
          `https://api.github.com/repos/${repoFullName}/commits/${branch}`,
          {
            headers: {
              Authorization: `Bearer ${ghToken}`,
              Accept: "application/vnd.github.v3+json",
            },
          },
        );
        if (ghRes.ok) {
          const ghData = await ghRes.json();
          commitSha = (ghData.sha as string)?.slice(0, 7) || undefined;
        }
      } catch {
        // Ignore GitHub fetch errors
      }
    }
  }

  // Compute unique file count from findings
  const uniqueFiles = new Set(
    findings.map((f: Record<string, unknown>) => f.file as string).filter(Boolean)
  );

  return NextResponse.json({
    id: scan.id,
    repoId: repo?.id || "",
    repoName: (repo?.name as string) || "unknown",
    status: scan.status === "completed" ? "complete" : scan.status,
    branch: scan.branch || "main",
    commitSha: commitSha || "—",
    startedAt: scan.started_at,
    completedAt: scan.completed_at,
    durationMs: scan.duration_ms,
    fileCount: uniqueFiles.size,
    findings,
    aiSummary: scan.ai_summary || null,
  });
}
