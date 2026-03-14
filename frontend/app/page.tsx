"use client";

import { useState, useEffect, useCallback } from "react";
import type {
  GitleaksFinding,
  TrivyVulnerability,
  GitleaksResult,
  TrivyResult,
  ScanError,
  GitHubUser,
  GitHubRepo,
} from "@/lib/types";

function maskSecret(secret: string): string {
  if (secret.length <= 8) return "••••••••";
  return secret.slice(0, 4) + "••••" + secret.slice(-4);
}

const SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: "bg-rose-500/10 text-rose-400 ring-rose-500/20",
  HIGH: "bg-orange-500/10 text-orange-400 ring-orange-500/20",
  MEDIUM: "bg-yellow-500/10 text-yellow-400 ring-yellow-500/20",
  LOW: "bg-blue-500/10 text-blue-400 ring-blue-500/20",
  UNKNOWN: "bg-zinc-500/10 text-zinc-400 ring-zinc-500/20",
};

function SeverityBadge({ severity }: { severity: string }) {
  const colors = SEVERITY_COLORS[severity] || SEVERITY_COLORS.UNKNOWN;
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${colors}`}>
      {severity}
    </span>
  );
}

function SecretFindingCard({ finding, index }: { finding: GitleaksFinding; index: number }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4 transition-colors hover:border-zinc-700">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-zinc-500 text-sm font-mono">#{index + 1}</span>
            <span className="inline-flex items-center rounded-md bg-red-500/10 px-2 py-1 text-xs font-medium text-red-400 ring-1 ring-red-500/20 ring-inset">
              {finding.RuleID}
            </span>
            {finding.Description && (
              <span className="text-sm text-zinc-400">{finding.Description}</span>
            )}
          </div>
          <p className="mt-2 font-mono text-sm text-zinc-300 truncate">
            {finding.File}
            <span className="text-zinc-500">:{finding.StartLine}</span>
          </p>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="shrink-0 rounded-md px-2 py-1 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
        >
          {expanded ? "Hide" : "Details"}
        </button>
      </div>

      {expanded && (
        <div className="mt-3 space-y-2 border-t border-zinc-800 pt-3">
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            <span className="text-zinc-500">Secret</span>
            <span className="font-mono text-amber-400">{maskSecret(finding.Secret)}</span>
            <span className="text-zinc-500">Match</span>
            <span className="font-mono text-zinc-300 truncate">{finding.Match}</span>
            <span className="text-zinc-500">Commit</span>
            <span className="font-mono text-zinc-300">{finding.Commit?.slice(0, 8) || "N/A"}</span>
            <span className="text-zinc-500">Author</span>
            <span className="text-zinc-300">{finding.Author || "N/A"}</span>
            <span className="text-zinc-500">Date</span>
            <span className="text-zinc-300">{finding.Date || "N/A"}</span>
            <span className="text-zinc-500">Message</span>
            <span className="text-zinc-300 truncate">{finding.Message || "N/A"}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function VulnCard({ vuln, index }: { vuln: TrivyVulnerability; index: number }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4 transition-colors hover:border-zinc-700">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-zinc-500 text-sm font-mono">#{index + 1}</span>
            <SeverityBadge severity={vuln.Severity} />
            <span className="font-mono text-sm text-zinc-300">{vuln.VulnerabilityID}</span>
          </div>
          <p className="mt-2 text-sm text-zinc-300">
            <span className="font-mono text-zinc-100">{vuln.PkgName}</span>
            <span className="text-zinc-500 ml-2">{vuln.InstalledVersion}</span>
            {vuln.FixedVersion && (
              <span className="text-emerald-400 ml-2">→ {vuln.FixedVersion}</span>
            )}
          </p>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="shrink-0 rounded-md px-2 py-1 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
        >
          {expanded ? "Hide" : "Details"}
        </button>
      </div>

      {expanded && (
        <div className="mt-3 space-y-2 border-t border-zinc-800 pt-3">
          {vuln.Title && <p className="text-sm text-zinc-300">{vuln.Title}</p>}
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            <span className="text-zinc-500">Package Path</span>
            <span className="font-mono text-zinc-300 truncate">{vuln.PkgPath || "N/A"}</span>
            <span className="text-zinc-500">Installed</span>
            <span className="font-mono text-zinc-300">{vuln.InstalledVersion}</span>
            <span className="text-zinc-500">Fixed In</span>
            <span className="font-mono text-emerald-400">{vuln.FixedVersion || "No fix available"}</span>
          </div>
          {vuln.PrimaryURL && (
            <a
              href={vuln.PrimaryURL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-1 text-xs text-blue-400 hover:text-blue-300 underline"
            >
              View Advisory
            </a>
          )}
        </div>
      )}
    </div>
  );
}

interface ScanData {
  gitleaks: GitleaksResult | null;
  trivy: TrivyResult | null;
  repo: string;
  errors?: { gitleaks?: string | null; trivy?: string | null };
}

export default function Home() {
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [reposLoading, setReposLoading] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState("");
  const [scanData, setScanData] = useState<ScanData | null>(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setUser(data))
      .catch(() => setUser(null))
      .finally(() => setAuthLoading(false));
  }, []);

  const fetchRepos = useCallback(async () => {
    setReposLoading(true);
    try {
      const res = await fetch("/api/auth/repos");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setRepos(data.repos);
    } catch {
      setError("Failed to load repositories");
    } finally {
      setReposLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) fetchRepos();
  }, [user, fetchRepos]);

  async function handleScan(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedRepo) return;

    setError(null);
    setScanData(null);
    setScanning(true);

    const repo = repos.find((r) => r.full_name === selectedRepo);
    if (!repo) return;

    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ owner: repo.owner, repo: repo.name }),
      });

      const data: ScanData | ScanError = await res.json();

      if ("error" in data && !("repo" in data)) {
        setError(data.error);
        return;
      }

      setScanData(data as ScanData);
    } catch {
      setError("Failed to connect to scan service");
    } finally {
      setScanning(false);
    }
  }

  async function handleSignOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setRepos([]);
    setScanData(null);
    setSelectedRepo("");
    window.location.href = "/";
  }

  const secretCount = scanData?.gitleaks?.summary?.total ?? 0;
  const vulnCount = scanData?.trivy?.summary?.total ?? 0;

  return (
    <div className="min-h-screen">
      <header className="border-b border-zinc-800 px-6 py-4">
        <div className="mx-auto max-w-4xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
              <svg className="h-5 w-5 text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
            </div>
            <h1 className="text-lg font-semibold text-zinc-100">Security Scanner</h1>
          </div>

          {user && (
            <div className="flex items-center gap-3">
              <img
                src={user.avatar_url}
                alt={user.login}
                className="h-8 w-8 rounded-full ring-1 ring-zinc-700"
              />
              <span className="text-sm text-zinc-300">{user.name || user.login}</span>
              <button
                onClick={handleSignOut}
                className="rounded-md px-3 py-1.5 text-xs text-zinc-400 ring-1 ring-zinc-700 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-8">
        {authLoading && (
          <div className="flex justify-center py-12">
            <svg className="h-8 w-8 animate-spin text-zinc-500" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        )}

        {!authLoading && !user && (
          <div className="flex flex-col items-center gap-6 py-16">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-800">
              <svg className="h-8 w-8 text-zinc-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
            </div>
            <div className="text-center">
              <h2 className="text-xl font-semibold text-zinc-100">Sign in to scan your repositories</h2>
              <p className="mt-2 text-sm text-zinc-400">
                Connect your GitHub account to scan repositories you have push or admin access to.
              </p>
            </div>
            <a
              href="/api/auth/login"
              className="inline-flex items-center gap-2 rounded-lg bg-zinc-100 px-5 py-2.5 text-sm font-medium text-zinc-900 transition-colors hover:bg-white"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              Sign in with GitHub
            </a>
          </div>
        )}

        {!authLoading && user && (
          <>
            <form onSubmit={handleScan} className="flex gap-3">
              <div className="relative flex-1">
                <select
                  value={selectedRepo}
                  onChange={(e) => setSelectedRepo(e.target.value)}
                  disabled={scanning || reposLoading}
                  className="w-full appearance-none rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2.5 pr-10 text-sm text-zinc-100 outline-none transition-colors focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 disabled:opacity-50"
                >
                  <option value="">
                    {reposLoading ? "Loading repositories..." : "Select a repository"}
                  </option>
                  {repos.map((r) => (
                    <option key={r.full_name} value={r.full_name}>
                      {r.full_name} {r.private ? "(private)" : ""}
                    </option>
                  ))}
                </select>
                <svg
                  className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </div>
              <button
                type="submit"
                disabled={scanning || !selectedRepo}
                className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {scanning ? (
                  <span className="flex items-center gap-2">
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Scanning...
                  </span>
                ) : (
                  "Scan"
                )}
              </button>
            </form>

            {error && (
              <div className="mt-6 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            {scanning && (
              <div className="mt-12 flex flex-col items-center gap-3 text-zinc-400">
                <svg className="h-8 w-8 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <p className="text-sm">Running security scans in parallel...</p>
                <p className="text-xs text-zinc-500">Checking for leaked secrets and dependency vulnerabilities</p>
              </div>
            )}

            {!scanning && scanData && (
              <div className="mt-6 space-y-8">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-medium text-zinc-300">
                    Results for <span className="font-mono text-zinc-100">{scanData.repo}</span>
                  </h2>
                  <div className="flex gap-2">
                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                      secretCount === 0 ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                    }`}>
                      {secretCount} secret{secretCount !== 1 ? "s" : ""}
                    </span>
                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                      vulnCount === 0 ? "bg-emerald-500/10 text-emerald-400" : "bg-orange-500/10 text-orange-400"
                    }`}>
                      {vulnCount} vulnerabilit{vulnCount !== 1 ? "ies" : "y"}
                    </span>
                  </div>
                </div>

                <section>
                  <h3 className="text-sm font-medium text-zinc-400 mb-3 flex items-center gap-2">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
                    </svg>
                    Leaked Secrets (Gitleaks)
                    {scanData.errors?.gitleaks && (
                      <span className="text-xs text-red-400 font-normal">— scan failed</span>
                    )}
                  </h3>
                  {scanData.gitleaks && scanData.gitleaks.findings.length > 0 ? (
                    <div className="space-y-3">
                      {scanData.gitleaks.findings.map((f, i) => (
                        <SecretFindingCard key={f.Fingerprint || i} finding={f} index={i} />
                      ))}
                    </div>
                  ) : scanData.gitleaks ? (
                    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 flex items-center gap-3 text-zinc-500">
                      <svg className="h-5 w-5 text-emerald-500/50 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm">No leaked secrets detected</span>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-red-500/10 bg-zinc-900/50 p-4 text-sm text-red-400">
                      Gitleaks scan unavailable: {scanData.errors?.gitleaks || "unknown error"}
                    </div>
                  )}
                </section>

                <section>
                  <h3 className="text-sm font-medium text-zinc-400 mb-3 flex items-center gap-2">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                    </svg>
                    Dependency Vulnerabilities (Trivy)
                    {scanData.errors?.trivy && (
                      <span className="text-xs text-red-400 font-normal">— scan failed</span>
                    )}
                  </h3>

                  {scanData.trivy && scanData.trivy.summary.total > 0 && (
                    <div className="flex gap-2 mb-3">
                      {(["CRITICAL", "HIGH", "MEDIUM", "LOW"] as const).map((sev) => {
                        const count = scanData.trivy?.summary?.[sev] ?? 0;
                        if (count === 0) return null;
                        return (
                          <span key={sev} className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${SEVERITY_COLORS[sev]}`}>
                            {count} {sev.toLowerCase()}
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {scanData.trivy && scanData.trivy.vulnerabilities.length > 0 ? (
                    <div className="space-y-3">
                      {scanData.trivy.vulnerabilities.map((v, i) => (
                        <VulnCard key={`${v.VulnerabilityID}-${v.PkgName}-${i}`} vuln={v} index={i} />
                      ))}
                    </div>
                  ) : scanData.trivy ? (
                    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 flex items-center gap-3 text-zinc-500">
                      <svg className="h-5 w-5 text-emerald-500/50 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm">No dependency vulnerabilities found</span>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-red-500/10 bg-zinc-900/50 p-4 text-sm text-red-400">
                      Trivy scan unavailable: {scanData.errors?.trivy || "unknown error"}
                    </div>
                  )}
                </section>

                {secretCount === 0 && vulnCount === 0 && scanData.gitleaks && scanData.trivy && (
                  <div className="flex flex-col items-center gap-2 text-zinc-500 py-4">
                    <svg className="h-12 w-12 text-emerald-500/50" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm">All scans passed. No issues detected.</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
