'use client'

import type { ScanResult, Severity } from '@/types'

const SEV_CONFIG: { key: Severity; label: string; color: string; bg: string; border: string }[] = [
  { key: 'critical', label: 'Critical', color: '#F25C5C', bg: 'rgba(242,92,92,0.08)', border: 'rgba(242,92,92,0.18)' },
  { key: 'high',     label: 'High',     color: '#F58025', bg: 'rgba(245,128,37,0.08)', border: 'rgba(245,128,37,0.18)' },
  { key: 'medium',   label: 'Medium',   color: '#F5A623', bg: 'rgba(245,166,35,0.08)', border: 'rgba(245,166,35,0.18)' },
  { key: 'low',      label: 'Low',      color: '#2DD98F', bg: 'rgba(45,217,143,0.08)', border: 'rgba(45,217,143,0.18)' },
]

function countBySeverity(findings: ScanResult['findings'], sev: Severity) {
  return findings.filter((f) => f.severity === sev).length
}

function formatDuration(ms?: number) {
  if (!ms) return '—'
  const s = Math.floor(ms / 1000)
  return `${Math.floor(s / 60)}m ${s % 60}s`
}

export default function ScanSummaryBar({ scan }: { scan: ScanResult }) {
  return (
    <div className="mb-10">
      {/* Title row */}
      <div className="flex items-start justify-between gap-6 flex-wrap mb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight mb-1.5" style={{ color: 'var(--text-primary)' }}>
            {scan.repoName}
          </h1>
          <p className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
            // scan complete · {scan.branch} · {scan.fileCount} files · {formatDuration(scan.durationMs)}
          </p>
        </div>

        {/* Severity pills */}
        <div className="flex items-center gap-2 flex-wrap">
          {SEV_CONFIG.map(({ key, label, color, bg, border }) => {
            const count = countBySeverity(scan.findings, key)
            return (
              <div key={key} className="flex items-center gap-2 px-4 py-2 rounded-lg"
                style={{ background: bg, border: `1px solid ${border}` }}>
                <span className="font-mono text-[11px] font-bold tracking-widest uppercase leading-none" style={{ color }}>{label}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded font-mono" style={{ background: bg, color }}>{count}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Meta bar */}
      <div className="flex items-center gap-6 px-5 py-3 rounded-xl font-mono text-[11px] flex-wrap"
        style={{ background: 'var(--bg1)', border: '1px solid var(--border)' }}>
        {[
          { label: 'Commit', value: scan.commitSha },
          { label: 'Branch', value: scan.branch },
          { label: 'Total findings', value: String(scan.findings.length) },
          { label: 'Started', value: new Date(scan.startedAt).toLocaleTimeString() },
        ].map(({ label, value }) => (
          <div key={label} className="flex items-center gap-2">
            <span style={{ color: 'var(--text-muted)' }}>{label}</span>
            <span style={{ color: 'var(--text-secondary)' }}>{value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
