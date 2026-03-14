import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getAuthenticatedUser } from "@/lib/get-user";

export async function POST() {
  if (process.env.TEST_MODE !== "true") {
    return NextResponse.json({ error: "Not available" }, { status: 403 });
  }

  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  await resetUserData(user.id);

  return NextResponse.json({ ok: true, message: "Test data cleared" });
}

export async function resetUserData(userId: string) {
  // 1. Delete scan_results for this user's scans
  const { data: scans } = await supabase
    .from("scans")
    .select("id")
    .eq("user_id", userId);

  if (scans && scans.length > 0) {
    const scanIds = scans.map((s: { id: string }) => s.id);
    await supabase.from("scan_results").delete().in("scan_id", scanIds);
  }

  // 2. Delete scans
  await supabase.from("scans").delete().eq("user_id", userId);

  // 3. Delete repositories
  await supabase.from("repositories").delete().eq("user_id", userId);
}

