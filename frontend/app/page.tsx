"use client";

import { useState } from "react";
import type { Finding, ScanResponse, ScanError } from "@/lib/types";

function maskSecret(secret: string): string {
  if (secret.length <= 8) return "••••••••";
  return secret.slice(0, 4) + "••••" + secret.slice(-4);
}

function SeverityBadge({ ruleId }: { ruleId: string }) {
  return (
    <span className="inline-flex items-center rounded-md bg-red-500/10 px-2 py-1 text-xs font-medium text-red-400 ring-1 ring-red-500/20 ring-inset">
      {ruleId}
    </span>
  );
}

function FindingCard({ finding, index }: { finding: Finding; index: number }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4 transition-colors hover:border-zinc-700">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-zinc-500 text-sm font-mono">#{index + 1}</span>
            <SeverityBadge ruleId={finding.RuleID} />
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

export default function Home() {
  const [repoUrl, setRepoUrl] = useState("");
  const [findings, setFindings] = useState<Finding[]>([]);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scannedRepo, setScannedRepo] = useState<string | null>(null);

  async function handleScan(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFindings([]);
    setScannedRepo(null);
    setScanning(true);

    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoUrl }),
      });

      const data: ScanResponse | ScanError = await res.json();

      if ("error" in data) {
        setError(data.error);
        return;
      }

      setFindings(data.findings);
      setScannedRepo(data.summary.repo);
    } catch {
      setError("Failed to connect to scan service");
    } finally {
      setScanning(false);
    }
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-zinc-800 px-6 py-4">
        <div className="mx-auto max-w-4xl flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
            <svg className="h-5 w-5 text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
          </div>
          <h1 className="text-lg font-semibold text-zinc-100">GitGuard</h1>
          <span className="text-sm text-zinc-500">Secret Scanner</span>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-8">
        <form onSubmit={handleScan} className="flex gap-3">
          <input
            type="url"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            placeholder="https://github.com/owner/repo"
            required
            disabled={scanning}
            className="flex-1 rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-colors focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={scanning}
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
            <p className="text-sm">Cloning repository and running gitleaks...</p>
            <p className="text-xs text-zinc-500">This may take a minute for large repos</p>
          </div>
        )}

        {!scanning && scannedRepo && (
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-zinc-300">
                Results for <span className="font-mono text-zinc-100">{scannedRepo}</span>
              </h2>
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                findings.length === 0
                  ? "bg-emerald-500/10 text-emerald-400"
                  : "bg-red-500/10 text-red-400"
              }`}>
                {findings.length === 0
                  ? "No secrets found"
                  : `${findings.length} finding${findings.length === 1 ? "" : "s"}`}
              </span>
            </div>

            {findings.length > 0 && (
              <div className="space-y-3">
                {findings.map((finding, i) => (
                  <FindingCard key={finding.Fingerprint || i} finding={finding} index={i} />
                ))}
              </div>
            )}

            {findings.length === 0 && (
              <div className="mt-8 flex flex-col items-center gap-2 text-zinc-500">
                <svg className="h-12 w-12 text-emerald-500/50" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm">Repository scan complete. No leaked secrets detected.</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
