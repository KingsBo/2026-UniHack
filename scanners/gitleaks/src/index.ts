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

const GITHUB_URL_RE = /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+(\.git)?$/;

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

const app = express();
app.use(express.json());

app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", tool: "gitleaks" });
});

app.post("/scan", async (req: Request, res: Response) => {
  let tmpDir: string | null = null;

  try {
    const repoUrl: string = req.body.repoUrl?.trim();
    const githubToken: string | undefined = req.body.githubToken;

    if (!repoUrl || !GITHUB_URL_RE.test(repoUrl)) {
      res.status(400).json({
        error: "Invalid GitHub repository URL. Expected: https://github.com/owner/repo",
      });
      return;
    }

    tmpDir = await mkdtemp(join(tmpdir(), "gitleaks-scan-"));

    // Clone with authentication if token is provided
    if (githubToken) {
      // Use token in URL for authenticated clone: https://token@github.com/owner/repo
      // Remove .git suffix if present, then construct authenticated URL
      const cleanUrl = repoUrl.replace(/\.git$/, "");
      const url = new URL(cleanUrl);
      const authenticatedUrl = `https://${githubToken}@${url.host}${url.pathname}${url.search}`;
      
      try {
        await execFileAsync("git", ["clone", "--depth", "1", authenticatedUrl, tmpDir], {
          timeout: CLONE_TIMEOUT,
          env: { 
            ...process.env, 
            GIT_TERMINAL_PROMPT: "0",
            GIT_ASKPASS: "echo", // Prevent git from prompting for credentials
          },
        });
      } catch (cloneErr: unknown) {
        const err = cloneErr as { stderr?: string; message?: string };
        const errorMsg = err.stderr || err.message || "";
        
        if (errorMsg.includes("Repository not found") || errorMsg.includes("404")) {
          res.status(404).json({
            error: "Repository not found. It may be private and you don't have access, or the repository doesn't exist.",
            errorType: "REPO_NOT_FOUND",
          });
          return;
        }
        if (errorMsg.includes("Authentication failed") || errorMsg.includes("401")) {
          res.status(403).json({
            error: "Authentication failed. Please log in again.",
            errorType: "AUTH_FAILED",
          });
          return;
        }
        throw cloneErr;
      }
    } else {
      // Public clone
      try {
        await execFileAsync("git", ["clone", "--depth", "1", repoUrl, tmpDir], {
          timeout: CLONE_TIMEOUT,
          env: { 
            ...process.env,
            GIT_TERMINAL_PROMPT: "0",
          },
        });
      } catch (cloneErr: unknown) {
        const err = cloneErr as { stderr?: string; message?: string };
        const errorMsg = err.stderr || err.message || "";
        
        if (errorMsg.includes("Repository not found") || errorMsg.includes("404")) {
          res.status(404).json({
            error: "Repository not found or is private. Please log in with GitHub to scan private repositories.",
            errorType: "REPO_NOT_FOUND_OR_PRIVATE",
          });
          return;
        }
        if (errorMsg.includes("could not read Username") || errorMsg.includes("Authentication")) {
          res.status(403).json({
            error: "This appears to be a private repository. Please log in with GitHub to scan private repositories.",
            errorType: "PRIVATE_REPO",
          });
          return;
        }
        throw cloneErr;
      }
    }

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
    console.error("Scan failed:", message);
    res.status(500).json({ error: `Scan failed: ${message}` });
  } finally {
    if (tmpDir) {
      await rm(tmpDir, { recursive: true, force: true }).catch(() => {});
    }
  }
});

app.listen(PORT, () => {
  console.log(`gitleaks-scanner listening on port ${PORT}`);
});
