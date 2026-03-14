'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import ScanSummaryBar from '@/components/results/ScanSummaryBar'
import FindingCard from '@/components/results/FindingCard'
import type { ScanTool, ScanResult } from '@/types'

const TOOLS: { key: 'all' | ScanTool; label: string }[] = [
  { key: 'all',        label: 'All tools' },
  { key: 'gitleaks',   label: 'Gitleaks' },
  { key: 'trivy',      label: 'Trivy' },
]

export default function ResultPage() {
  const params = useParams()
  const scanId = params.id as string
  const [scan, setScan] = useState<ScanResult | null>(null)
  const [activeTool, setActiveTool] = useState<'all' | ScanTool>('all')
  const [showAiSummary, setShowAiSummary] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/scan/${scanId}`)
      .then((res) => {
        if (!res.ok) throw new Error('Scan not found')
        return res.json()
      })
      .then((data) => setScan(data as ScanResult))
      .catch(() => {
        setLoadError('Scan result not found. Please run a new scan from the dashboard.')
      })
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

      <div className="flex mx-auto w-fit max-w-full">
        {/* Main Content Column */}
        <div className="w-[min(100vw,1024px)] px-8 py-10 flex-shrink-0 transition-transform duration-500 ease-in-out">
        {/* Back */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 font-mono text-xs mb-8 transition-colors hover:opacity-80"
          style={{ color: 'var(--text-muted)' }}
        >
          ← back to dashboard
        </Link>

        <ScanSummaryBar scan={scan} />

        {/* Tool filter tabs and Actions */}
        <div
          className="flex items-center justify-between gap-4 mb-6 pb-5 flex-wrap"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <div className="flex items-center gap-2 flex-wrap">
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

          {/* AI Toggle */}
          <button
            onClick={() => setShowAiSummary(!showAiSummary)}
            className="flex items-center gap-2 px-4 py-2 text-[11px] font-semibold tracking-widest uppercase rounded-lg transition-all"
            style={
              showAiSummary
                ? { background: 'var(--accent)', color: '#fff', border: '1px solid var(--accent)' }
                : { background: 'var(--accent-dim)', color: 'var(--accent)', border: '1px solid rgba(123,110,246,0.25)' }
            }
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={showAiSummary ? "text-white" : ""}>
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
            </svg>
            {showAiSummary ? 'Hide AI Summary' : 'Ask AI for Summary'}
          </button>
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

        {/* AI Summary Sidebar Wrapper */}
        <div 
          className="transition-all duration-500 ease-in-out overflow-hidden flex-shrink-0"
          style={{ width: showAiSummary ? '400px' : '0px', opacity: showAiSummary ? 1 : 0 }}
        >
          {/* Inner Fixed Width Wrapper to prevent internal reflow during transition */}
          <div className="w-[400px] h-full flex items-start">
            <div className="w-px self-stretch bg-[var(--border)] my-14 opacity-50 hidden lg:block" />
            <div 
              className="flex-1 w-[360px] pl-10 py-10 sticky top-24 rounded-xl flex flex-col gap-4 animate-fade-in-up"
            >
              <div className="p-6 rounded-xl flex flex-col gap-4" style={{ background: 'var(--bg1)', border: '1px solid var(--border)', boxShadow: '0 4px 24px rgba(0,0,0,0.04)' }}>
                <div className="flex items-center gap-3 mb-1">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full" style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
                    </svg>
                  </span>
                  <h3 className="font-bold tracking-tight text-sm" style={{ color: 'var(--text-primary)' }}>AI Security Analysis</h3>
                </div>
                
                <div className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  <p className="mb-3">
                    I've analyzed the <strong style={{ color: 'var(--text-primary)' }}>{scan.findings.length} findings</strong> across your codebase.
                  </p>
                  <p className="mb-3">
                    The most critical issue is the hardcoded AWS secret in <code className="font-mono text-[11px] px-1 py-0.5 rounded" style={{ background: 'var(--bg2)', color: 'var(--text-primary)' }}>src/config/aws.ts</code>, which exposes your infrastructure credentials. This should be revoked and moved to environment variables immediately.
                  </p>
                  <p>
                    Additionally, there are 2 SQL Injection vulnerabilities detected by semgrep. You should implement parameterized queries for the database calls in <code className="font-mono text-[11px] px-1 py-0.5 rounded" style={{ background: 'var(--bg2)', color: 'var(--text-primary)' }}>user.ts</code>.
                  </p>
                </div>

                <div className="mt-2 pt-4 flex gap-2" style={{ borderTop: '1px dashed var(--border)' }}>
                  <span className="font-mono text-[10px] px-2 py-1 rounded" style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}>Gemini Pro 1.5</span>
                  <span className="font-mono text-[10px] px-2 py-1 rounded" style={{ background: 'var(--bg2)', color: 'var(--text-muted)' }}>Context: 124kb</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
