import { NextRequest, NextResponse } from "next/server";
import {
  GITLEAKS_SERVICE_URL,
  TRIVY_SERVICE_URL,
  callScanner,
} from "./shared";
import { supabase, getOrCreateRepo } from "@/lib/supabase";
import { getAuthenticatedUser } from "@/lib/get-user";
import type { GitleaksFinding, TrivyVulnerability } from "@/types";

const MAX_SCANS_PER_USER = 3;

function mapGitleaksSeverity(): string {
  return "critical";
}

function mapTrivySeverity(sev: string): string {
  switch (sev.toUpperCase()) {
    case "CRITICAL": return "critical";
    case "HIGH": return "high";
    case "MEDIUM": return "medium";
    case "LOW": return "low";
    default: return "info";
  }
}

/** Truncate long Trivy descriptions to a concise summary sentence. */
function summariseTrivyDescription(v: TrivyVulnerability): string {
  const pkg = v.PkgName || "unknown package";
  const installed = v.InstalledVersion ? ` (${v.InstalledVersion})` : "";
  const fix = v.FixedVersion ? ` Fix: upgrade to ${v.FixedVersion}.` : " No fix available yet.";
  const titleBit = v.Title ? `${v.Title}. ` : "";
  // Take first sentence of the raw description (if any) up to 160 chars
  const rawDesc = v.Description || "";
  const firstSentence = rawDesc.split(/\.\s/)[0];
  const shortDesc = firstSentence.length > 160 ? firstSentence.slice(0, 157) + "..." : firstSentence;
  return `${titleBit}Affects ${pkg}${installed}.${fix}${shortDesc ? ` ${shortDesc}.` : ""}`;
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("github_token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const { owner, repo, repoId, repoFullName, defaultBranch, isPrivate, language } = body as {
      owner?: string;
      repo?: string;
      repoId?: number;
      repoFullName?: string;
      defaultBranch?: string;
      isPrivate?: boolean;
      language?: string;
    };

    if (!owner || !repo) {
      return NextResponse.json(
        { error: "Missing owner or repo" },
        { status: 400 },
      );
    }

    const repoUrl = `https://github.com/${owner}/${repo}`;

    // Get authenticated user from DB
    const user = await getAuthenticatedUser();
    let scanId: string | null = null;
    let dbRepoId: string | null = null;

    if (user) {
      // Check scan rate limit
      const { count, error: countErr } = await supabase
        .from("scans")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      if (!countErr && count !== null && count >= MAX_SCANS_PER_USER) {
        return NextResponse.json(
          {
            error: `Scan limit reached. You have used all ${MAX_SCANS_PER_USER} of your available scans.`,
            errorType: "rate_limit",
            scansUsed: count,
            scansLimit: MAX_SCANS_PER_USER,
          },
          { status: 429 },
        );
      }

      // Upsert repository
      const dbRepo = await getOrCreateRepo(user.id, {
        github_repo_id: repoId || 0,
        name: repo,
        full_name: repoFullName || `${owner}/${repo}`,
        url: repoUrl,
        default_branch: defaultBranch || "main",
        is_private: isPrivate || false,
        language: language || null,
      });
      dbRepoId = dbRepo.id;

      // Create scan record
      const { data: scanRow, error: scanErr } = await supabase
        .from("scans")
        .insert({
          repository_id: dbRepo.id,
          user_id: user.id,
          status: "running",
          tools_run: ["gitleaks", "trivy"],
          branch: defaultBranch || "main",
          started_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (scanErr) {
        console.error("Failed to create scan:", scanErr.message);
      } else {
        scanId = scanRow.id;
      }
    }

    const startTime = Date.now();
    const payload = { repoUrl, token };

    const [gitleaksResult, trivyResult] = await Promise.allSettled([
      callScanner(GITLEAKS_SERVICE_URL, payload),
      callScanner(TRIVY_SERVICE_URL, payload),
    ]);

    const durationMs = Date.now() - startTime;
    const gitleaksData = gitleaksResult.status === "fulfilled" ? gitleaksResult.value : null;
    const trivyData = trivyResult.status === "fulfilled" ? trivyResult.value : null;

    // Persist results to DB
    if (scanId) {
      const resultRows: Record<string, unknown>[] = [];

      if (gitleaksData?.findings) {
        for (const f of gitleaksData.findings as GitleaksFinding[]) {
          resultRows.push({
            scan_id: scanId,
            tool_name: "gitleaks",
            severity: mapGitleaksSeverity(),
            title: f.Description || f.RuleID,
            description: `Secret detected: ${f.RuleID}. Found in commit ${f.Commit?.slice(0, 7) || "unknown"} by ${f.Author || "unknown"}.`,
            file_path: f.File,
            line_number: f.StartLine,
            rule_id: f.RuleID,
            snippet: f.Match || f.Secret,
            commit_sha: f.Commit,
            author: f.Author,
            fingerprint: f.Fingerprint,
          });
        }
      }

      if (trivyData?.vulnerabilities) {
        for (const v of trivyData.vulnerabilities as TrivyVulnerability[]) {
          resultRows.push({
            scan_id: scanId,
            tool_name: "trivy",
            severity: mapTrivySeverity(v.Severity),
            title: v.Title || v.VulnerabilityID,
            description: summariseTrivyDescription(v),
            file_path: v.PkgPath || v.PkgName,
            line_number: 0,
            rule_id: v.VulnerabilityID,
            pkg_name: v.PkgName,
            installed_version: v.InstalledVersion,
            fixed_version: v.FixedVersion || null,
            cve_id: v.VulnerabilityID,
            primary_url: v.PrimaryURL || null,
          });
        }
      }

      if (resultRows.length > 0) {
        await supabase.from("scan_results").insert(resultRows);
      }

      const hasError = gitleaksResult.status === "rejected" && trivyResult.status === "rejected";

      await supabase
        .from("scans")
        .update({
          status: hasError ? "failed" : "completed",
          completed_at: new Date().toISOString(),
          duration_ms: durationMs,
          finding_count: resultRows.length,
          error_message: hasError ? "All scanners failed" : null,
        })
        .eq("id", scanId);
    }

    return NextResponse.json({
      scanId,
      gitleaks: gitleaksData,
      trivy: trivyData,
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
      { status: 500 },
    );
  }
}
