'use client'

import { useState } from 'react'
import type { Finding } from '@/types'

const SEVERITY_STYLES: Record<string, { dot: string; badge: string }> = {
  critical: { dot: '#F25C5C', badge: 'rgba(242,92,92,0.1)' },
  high:     { dot: '#F58025', badge: 'rgba(245,128,37,0.1)' },
  medium:   { dot: '#F5A623', badge: 'rgba(245,166,35,0.1)' },
  low:      { dot: '#2DD98F', badge: 'rgba(45,217,143,0.1)' },
  info:     { dot: '#7B6EF6', badge: 'rgba(123,110,246,0.1)' },
}

function truncate(text: string, max: number) {
  if (text.length <= max) return text
  return text.slice(0, max - 3).replace(/\s+\S*$/, '') + '...'
}

export default function FindingCard({ finding }: { finding: Finding }) {
  const [expanded, setExpanded] = useState(false)
  const style = SEVERITY_STYLES[finding.severity] ?? SEVERITY_STYLES.info
  const shortDesc = truncate(finding.description, 200)

  return (
    <div
      className="group rounded-xl px-6 py-5 cursor-pointer transition-all duration-200"
      style={{ background: 'var(--bg1)', border: '1px solid var(--border)' }}
      onClick={() => setExpanded(!expanded)}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(150, 150, 160, 0.4)' }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)' }}>

      <div className="flex items-start gap-4">
        <span className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5" style={{ background: style.dot }} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4 mb-1.5">
            <h3 className="text-sm font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>{finding.title}</h3>
            <span className="font-mono text-[10px] px-2 py-0.5 rounded capitalize flex-shrink-0"
              style={{ background: style.badge, color: style.dot }}>
              {finding.severity}
            </span>
          </div>
          <p className="font-mono text-[11px] leading-relaxed mb-3" style={{ color: 'var(--text-muted)' }}>
            {expanded ? finding.description : shortDesc}
          </p>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded font-mono text-[11px]"
            style={{ background: 'var(--bg2)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
            <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor"><path d="M2 2h12v2H2zm0 4h8v2H2zm0 4h10v2H2z" /></svg>
            {finding.file}{finding.line > 0 ? ` · line ${finding.line}` : ''}
          </div>
          <div className="flex items-end justify-between gap-4 mt-3 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-[10px] px-2 py-1 rounded uppercase tracking-wide"
                style={{ border: '1px solid var(--border)', color: 'var(--text-muted)' }}>{finding.tool}</span>
              {finding.rule && (
                <span className="font-mono text-[10px]" style={{ color: 'var(--accent)' }}>{finding.rule}</span>
              )}
            </div>

            {/* Toggle Icon */}
            <div className="flex-shrink-0 transition-transform duration-200" style={{ transform: expanded ? 'rotate(180deg)' : 'none', color: 'var(--text-muted)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </div>
          </div>
          {expanded && (
            <>
              {/* Trivy package metadata */}
              {finding.tool === 'trivy' && (finding.pkgName || finding.cveId) && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {finding.cveId && (
                    <a href={finding.primaryUrl || `https://nvd.nist.gov/vuln/detail/${finding.cveId}`} target="_blank" rel="noopener noreferrer"
                      className="font-mono text-[10px] px-2 py-1 rounded no-underline transition-opacity hover:opacity-80"
                      style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}>
                      {finding.cveId} ↗
                    </a>
                  )}
                  {finding.pkgName && (
                    <span className="font-mono text-[10px] px-2 py-1 rounded" style={{ background: 'var(--bg2)', color: 'var(--text-secondary)' }}>
                      {finding.pkgName}{finding.installedVersion ? ` @ ${finding.installedVersion}` : ''}
                    </span>
                  )}
                  {finding.fixedVersion && (
                    <span className="font-mono text-[10px] px-2 py-1 rounded" style={{ background: 'var(--green-dim)', color: 'var(--green)' }}>
                      fix → {finding.fixedVersion}
                    </span>
                  )}
                </div>
              )}
              {finding.snippet && (
                <div className="mt-4 px-4 py-3 rounded-lg overflow-x-auto"
                  style={{ background: 'var(--bg0)', border: '1px solid var(--border)' }}>
                  <code className="font-mono text-xs whitespace-pre" style={{ color: 'var(--green)' }}>{finding.snippet}</code>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
