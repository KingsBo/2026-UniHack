import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getAuthenticatedUser } from "@/lib/get-user";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id: scanId } = await params;

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

  return NextResponse.json({
    id: scan.id,
    repoId: repo?.id || "",
    repoName: (repo?.name as string) || "unknown",
    status: scan.status === "completed" ? "complete" : scan.status,
    branch: scan.branch || "main",
    commitSha: "—",
    startedAt: scan.started_at,
    completedAt: scan.completed_at,
    durationMs: scan.duration_ms,
    fileCount: 0,
    findings,
  });
}
