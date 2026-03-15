import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getAuthenticatedUser } from "@/lib/get-user";

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
