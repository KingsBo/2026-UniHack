'use client'

import { useState } from 'react'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import ScanSummaryBar from '@/components/results/ScanSummaryBar'
import FindingCard from '@/components/results/FindingCard'
import { MOCK_SCAN_RESULT } from '@/lib/mock-data'
import type { ScanTool } from '@/types'

const TOOLS: { key: 'all' | ScanTool; label: string }[] = [
  { key: 'all',        label: 'All tools' },
  { key: 'semgrep',    label: 'Semgrep' },
  { key: 'gitleaks',   label: 'Gitleaks' },
  { key: 'trivy', label: 'Trivy' },
]

export default function ResultPage() {
  const scan = MOCK_SCAN_RESULT
  const [activeTool, setActiveTool] = useState<'all' | ScanTool>('all')

  const filtered =
    activeTool === 'all'
      ? scan.findings
      : scan.findings.filter((f) => f.tool === activeTool)

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg0)' }}>
      <Header variant="app" />

      <div className="flex-1 w-full max-w-5xl mx-auto px-8 py-10">
        {/* Back */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 font-mono text-xs mb-8 transition-colors hover:opacity-80"
          style={{ color: 'var(--text-muted)' }}
        >
          ← back to dashboard
        </Link>

        {/* Summary */}
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
