import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getAuthenticatedUser } from "@/lib/get-user";

const DEFAULT_SCAN_LIMIT = 3;

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.toLowerCase();

  // Read per-user scan limit
  const { data: userRow } = await supabase
    .from("users")
    .select("scan_limit")
    .eq("id", user.id)
    .single();

  const scanLimit = userRow?.scan_limit ?? DEFAULT_SCAN_LIMIT;

  const query = supabase
    .from("scans")
    .select("id, status, branch, finding_count, started_at, completed_at, duration_ms, repository:repositories(id, name, full_name)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const { data, error } = await query;

  if (error) {
    console.error("Failed to fetch scan history:", error.message);
    return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
  }

  const history = (data || [])
    .map((scan: Record<string, unknown>) => {
      const repo = scan.repository as Record<string, unknown> | null;
      return {
        id: scan.id,
        repoId: repo?.id || "",
        repoName: (repo?.full_name as string) || (repo?.name as string) || "unknown",
        branch: scan.branch || "main",
        status: scan.status === "completed" ? "complete" : scan.status,
        startedAt: scan.started_at,
        completedAt: scan.completed_at,
        durationMs: scan.duration_ms,
        findingCount: scan.finding_count || 0,
      };
    })
    .filter((entry: Record<string, unknown>) =>
      q ? (entry.repoName as string).toLowerCase().includes(q) : true,
    );

  return NextResponse.json({
    history,
    scansUsed: history.length,
    scansLimit: scanLimit,
    scansRemaining: Math.max(0, scanLimit - history.length),
  });
}
