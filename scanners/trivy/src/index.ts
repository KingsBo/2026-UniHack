import express, { Request, Response } from "express";
import { execFile } from "child_process";
import { mkdtemp, rm } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

const PORT = parseInt(process.env.PORT || "3002", 10);
const TRIVY_BIN = process.env.TRIVY_BIN || "/usr/local/bin/trivy";
const CLONE_TIMEOUT = 60_000;
const SCAN_TIMEOUT = 180_000;

interface TrivyVulnerability {
  VulnerabilityID: string;
  PkgName: string;
  PkgPath?: string;
  InstalledVersion: string;
  FixedVersion?: string;
  Severity: string;
  Title?: string;
  Description?: string;
  PrimaryURL?: string;
}

interface TrivyResult {
  Target: string;
  Class: string;
  Type: string;
  Vulnerabilities?: TrivyVulnerability[];
}

interface TrivyReport {
  Results?: TrivyResult[];
}

function buildCloneUrl(repoUrl: string, token?: string): string {
  if (!token) return repoUrl;
  const url = new URL(repoUrl);
  url.username = "x-access-token";
  url.password = token;
  return url.toString();
}

const app = express();
app.use(express.json());

app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", tool: "trivy" });
});

app.post("/scan", async (req: Request, res: Response) => {
  let tmpDir: string | null = null;

  try {
    const repoUrl: string = req.body.repoUrl?.trim();
    const token: string | undefined = req.body.token;

    if (!repoUrl) {
      res.status(400).json({ error: "Missing repoUrl" });
      return;
    }

    tmpDir = await mkdtemp(join(tmpdir(), "trivy-scan-"));

    const cloneUrl = buildCloneUrl(repoUrl, token);
    await execFileAsync("git", ["clone", "--depth", "1", cloneUrl, tmpDir], {
      timeout: CLONE_TIMEOUT,
    });

    const result = await execFileAsync(
      TRIVY_BIN,
      [
        "fs",
        "--format", "json",
        "--scanners", "vuln",
        "--exit-code", "0",
        "--skip-db-update",
        tmpDir,
      ],
      { timeout: SCAN_TIMEOUT, maxBuffer: 50 * 1024 * 1024 }
    );

    const report: TrivyReport = JSON.parse(result.stdout);

    const vulnerabilities: TrivyVulnerability[] = [];
    if (report.Results) {
      for (const r of report.Results) {
        if (r.Vulnerabilities) {
          for (const v of r.Vulnerabilities) {
            vulnerabilities.push({
              ...v,
              PkgPath: v.PkgPath || r.Target,
            });
          }
        }
      }
    }

    const severityCounts: Record<string, number> = {};
    for (const v of vulnerabilities) {
      const sev = v.Severity || "UNKNOWN";
      severityCounts[sev] = (severityCounts[sev] || 0) + 1;
    }

    res.json({
      vulnerabilities,
      summary: {
        total: vulnerabilities.length,
        repo: repoUrl,
        ...severityCounts,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const safeMessage = message.replace(/x-access-token:[^@]+@/g, "x-access-token:***@");
    console.error("Scan failed:", safeMessage);
    res.status(500).json({ error: `Scan failed: ${safeMessage}` });
  } finally {
    if (tmpDir) {
      await rm(tmpDir, { recursive: true, force: true }).catch(() => {});
    }
  }
});

app.listen(PORT, () => {
  console.log(`trivy-scanner listening on port ${PORT}`);
});
