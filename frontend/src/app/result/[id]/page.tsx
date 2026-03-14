'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import ScanSummaryBar from '@/components/results/ScanSummaryBar'
import FindingCard from '@/components/results/FindingCard'
import type { ScanTool, ScanResult, Finding, ScanResponse, GitleaksFinding, TrivyVulnerability } from '@/types'

const TOOLS: { key: 'all' | ScanTool; label: string }[] = [
  { key: 'all',        label: 'All tools' },
  { key: 'gitleaks',   label: 'Gitleaks' },
  { key: 'trivy',      label: 'Trivy' },
]

function mapGitleaksFindings(findings: GitleaksFinding[]): Finding[] {
  return findings.map((f, i) => ({
    id: `gl-${i}`,
    tool: 'gitleaks' as ScanTool,
    severity: 'critical',
    title: f.Description || f.RuleID,
    description: `Secret detected: ${f.RuleID}. Found in commit ${f.Commit?.slice(0, 7) || 'unknown'} by ${f.Author || 'unknown'}.`,
    file: f.File,
    line: f.StartLine,
    rule: f.RuleID,
    snippet: f.Match || f.Secret,
    commit: f.Commit,
    author: f.Author,
  }))
}

function mapSeverity(trivySev: string): Finding['severity'] {
  switch (trivySev.toUpperCase()) {
    case 'CRITICAL': return 'critical'
    case 'HIGH': return 'high'
    case 'MEDIUM': return 'medium'
    case 'LOW': return 'low'
    default: return 'info'
  }
}

function mapTrivyFindings(vulns: TrivyVulnerability[]): Finding[] {
  return vulns.map((v, i) => ({
    id: `tv-${i}`,
    tool: 'trivy' as ScanTool,
    severity: mapSeverity(v.Severity),
    title: v.Title || v.VulnerabilityID,
    description: v.Description || `${v.VulnerabilityID} in ${v.PkgName} ${v.InstalledVersion}`,
    file: v.PkgPath || v.PkgName,
    line: 0,
    rule: v.VulnerabilityID,
    pkgName: v.PkgName,
    installedVersion: v.InstalledVersion,
    fixedVersion: v.FixedVersion,
    cveId: v.VulnerabilityID,
    primaryUrl: v.PrimaryURL,
    snippet: v.FixedVersion ? `${v.PkgName} ${v.InstalledVersion} → ${v.FixedVersion}` : undefined,
  }))
}

function buildScanResult(scanId: string, data: ScanResponse & { repoName?: string }): ScanResult {
  const findings: Finding[] = [
    ...(data.gitleaks ? mapGitleaksFindings(data.gitleaks.findings) : []),
    ...(data.trivy ? mapTrivyFindings(data.trivy.vulnerabilities) : []),
  ]

  return {
    id: scanId,
    repoId: data.repo,
    repoName: data.repoName || data.repo.split('/').pop() || 'unknown',
    status: 'complete',
    branch: 'main',
    commitSha: '—',
    startedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    durationMs: 0,
    fileCount: 0,
    findings,
  }
}

export default function ResultPage() {
  const params = useParams()
  const scanId = params.id as string
  const [scan, setScan] = useState<ScanResult | null>(null)
  const [activeTool, setActiveTool] = useState<'all' | ScanTool>('all')
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    const raw = sessionStorage.getItem(scanId)
    if (!raw) {
      setLoadError('Scan result not found. Please run a new scan from the dashboard.')
      return
    }
    try {
      const data = JSON.parse(raw) as ScanResponse & { repoName?: string }
      setScan(buildScanResult(scanId, data))
    } catch {
      setLoadError('Failed to parse scan data.')
    }
  }, [scanId])

  if (loadError) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg0)' }}>
        <Header variant="app" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="font-mono text-sm mb-4" style={{ color: 'var(--text-muted)' }}>{loadError}</p>
            <Link href="/dashboard" className="font-mono text-sm transition-colors hover:underline" style={{ color: 'var(--accent)' }}>
              ← back to dashboard
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!scan) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg0)' }}>
        <Header variant="app" />
        <div className="flex-1 flex items-center justify-center">
          <p className="font-mono text-sm" style={{ color: 'var(--text-muted)' }}>Loading...</p>
        </div>
      </div>
    )
  }

  const filtered =
    activeTool === 'all'
      ? scan.findings
      : scan.findings.filter((f) => f.tool === activeTool)

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg0)' }}>
      <Header variant="app" />

      <div className="flex-1 w-full max-w-5xl mx-auto px-8 py-10">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 font-mono text-xs mb-8 transition-colors hover:opacity-80"
          style={{ color: 'var(--text-muted)' }}
        >
          ← back to dashboard
        </Link>

        <ScanSummaryBar scan={scan} />

        {/* Tool filter tabs */}
        <div
          className="flex items-center gap-2 mb-6 pb-5 flex-wrap"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          {TOOLS.map(({ key, label }) => {
            const count = key === 'all'
              ? scan.findings.length
              : scan.findings.filter((f) => f.tool === key).length
            return (
              <button
                key={key}
                onClick={() => setActiveTool(key)}
                className="flex items-center gap-2 px-4 py-2 font-mono text-[11px] tracking-widest uppercase rounded-lg transition-all"
                style={
                  activeTool === key
                    ? { background: 'var(--accent-dim)', color: 'var(--accent)', border: '1px solid rgba(123,110,246,0.25)' }
                    : { background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border)' }
                }
              >
                {label}
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded"
                  style={
                    activeTool === key
                      ? { background: 'rgba(123,110,246,0.2)', color: 'var(--accent)' }
                      : { background: 'var(--bg2)', color: 'var(--text-muted)' }
                  }
                >
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Findings list */}
        <div className="flex flex-col gap-3">
          {filtered.map((finding) => (
            <FindingCard key={finding.id} finding={finding} />
          ))}
          {filtered.length === 0 && (
            <div className="py-16 text-center font-mono text-sm" style={{ color: 'var(--text-muted)' }}>
              No findings for this tool.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
