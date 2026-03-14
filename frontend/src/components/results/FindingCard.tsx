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

export default function FindingCard({ finding }: { finding: Finding }) {
  const [expanded, setExpanded] = useState(false)
  const style = SEVERITY_STYLES[finding.severity] ?? SEVERITY_STYLES.info

  return (
    <div
      className="rounded-xl px-6 py-5 cursor-pointer transition-all duration-200"
      style={{ background: 'var(--bg1)', border: '1px solid var(--border)' }}
      onClick={() => setExpanded(!expanded)}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-hover)' }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '' }}>

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
          <p className="font-mono text-[11px] leading-relaxed mb-3" style={{ color: 'var(--text-muted)' }}>{finding.description}</p>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded font-mono text-[11px]"
            style={{ background: 'var(--bg2)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
            <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor"><path d="M2 2h12v2H2zm0 4h8v2H2zm0 4h10v2H2z" /></svg>
            {finding.file} · line {finding.line}
          </div>
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <span className="font-mono text-[10px] px-2 py-1 rounded uppercase tracking-wide"
              style={{ border: '1px solid var(--border)', color: 'var(--text-muted)' }}>{finding.tool}</span>
            {finding.rule && (
              <span className="font-mono text-[10px]" style={{ color: 'var(--accent)' }}>{finding.rule}</span>
            )}
          </div>
          {expanded && finding.snippet && (
            <div className="mt-4 px-4 py-3 rounded-lg overflow-x-auto"
              style={{ background: 'var(--bg0)', border: '1px solid var(--border)' }}>
              <code className="font-mono text-xs whitespace-pre" style={{ color: 'var(--green)' }}>{finding.snippet}</code>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
