import express, { Request, Response } from "express";
import { execFile } from "child_process";
import { mkdtemp, rm } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

const PORT = parseInt(process.env.PORT || "3001", 10);
const GITLEAKS_BIN = process.env.GITLEAKS_BIN || "/usr/local/bin/gitleaks";
const CLONE_TIMEOUT = 60_000;
const SCAN_TIMEOUT = 120_000;

interface Finding {
  RuleID: string;
  Description: string;
  File: string;
  StartLine: number;
  EndLine: number;
  StartColumn: number;
  EndColumn: number;
  Match: string;
  Secret: string;
  Commit: string;
  Author: string;
  Email: string;
  Date: string;
  Message: string;
  Tags: string[];
  Fingerprint: string;
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
  res.json({ status: "ok", tool: "gitleaks" });
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

    tmpDir = await mkdtemp(join(tmpdir(), "gitleaks-scan-"));

    const cloneUrl = buildCloneUrl(repoUrl, token);
    await execFileAsync("git", ["clone", "--depth", "1", cloneUrl, tmpDir], {
      timeout: CLONE_TIMEOUT,
    });

    let stdout: string;
    try {
      const result = await execFileAsync(
        GITLEAKS_BIN,
        [
          "git",
          "--report-format", "json",
          "--report-path", "-",
          "--no-banner",
          "--exit-code", "0",
          tmpDir,
        ],
        { timeout: SCAN_TIMEOUT, maxBuffer: 50 * 1024 * 1024 }
      );
      stdout = result.stdout;
    } catch (err: unknown) {
      const execErr = err as { stdout?: string; stderr?: string; code?: number };
      if (execErr.stdout) {
        stdout = execErr.stdout;
      } else {
        throw err;
      }
    }

    let findings: Finding[] = [];
    const trimmed = stdout.trim();
    if (trimmed.length > 0) {
      findings = JSON.parse(trimmed);
    }

    res.json({
      findings,
      summary: {
        total: findings.length,
        repo: repoUrl,
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
  console.log(`gitleaks-scanner listening on port ${PORT}`);
});
