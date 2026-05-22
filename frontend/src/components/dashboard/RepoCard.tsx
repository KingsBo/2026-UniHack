'use client'

import { useState } from 'react'
import type { Repo } from '@/types'

type RepoCardProps = {
  repo: Repo
  onScan: (repo: Repo) => void
  disabled?: boolean
}

export default function RepoCard({ repo, onScan, disabled }: RepoCardProps) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      className="relative flex flex-col overflow-hidden rounded-xl p-5 transition-all duration-200 h-full"
      style={{
        background: 'var(--bg1)',
        border: `1px solid ${hovered ? 'var(--border-hover)' : 'var(--border)'}`,
        transform: hovered ? 'translateY(-2px)' : 'none',
        boxShadow: hovered ? '0 8px 24px rgba(0,0,0,0.08)' : '0 1px 3px rgba(0,0,0,0.06)',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Hover gradient */}
      <div className="absolute inset-0 pointer-events-none transition-opacity duration-200"
        style={{ background: 'linear-gradient(135deg, rgba(123,110,246,0.06), transparent)', opacity: hovered ? 1 : 0 }} />

      {/* Top row */}
      <div className="relative flex items-start justify-between mb-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: 'var(--bg2)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-label="GitHub">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
          </svg>
        </div>
        <span className="font-mono text-[10px] px-2 py-1 rounded tracking-wide uppercase"
          style={repo.visibility === 'public'
            ? { background: 'var(--green-dim)', color: 'var(--green)', border: '1px solid rgba(45,217,143,0.2)' }
            : { background: 'var(--amber-dim)', color: 'var(--amber)', border: '1px solid rgba(245,166,35,0.2)' }}>
          {repo.visibility}
        </span>
      </div>

      {/* Name + desc */}
      <div className="relative mb-4">
        <h3 className="text-sm font-bold mb-1 tracking-tight" style={{ color: 'var(--text-primary)' }}>{repo.name}</h3>
        <p className="font-mono text-[11px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>{repo.description}</p>
      </div>

      {/* Meta */}
      <div className="relative flex items-center gap-4 mb-4">
        <span className="flex items-center gap-1.5 font-mono text-[11px]" style={{ color: 'var(--text-muted)' }}>
          <span className="w-2 h-2 rounded-full" style={{ background: repo.languageColor }} />
          {repo.language}
        </span>
        <span className="font-mono text-[11px]" style={{ color: 'var(--text-muted)' }}>↑ {repo.updatedAt}</span>
      </div>

      {/* CTA — pushed to bottom of card */}
      <div className="relative mt-auto">
        {repo.lastScan ? (
          <div className="flex items-center gap-2 font-mono text-[11px] px-3 py-2.5 rounded-lg"
            style={{ background: 'var(--green-dim)', border: '1px solid rgba(45,217,143,0.2)', color: 'var(--green)' }}>
            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: 'var(--green)' }} />
            Last scanned {repo.lastScan.completedAt} · {repo.lastScan.findingCount} findings
          </div>
        ) : disabled ? (
          <div className="w-full py-2.5 text-[11px] font-semibold tracking-widest uppercase rounded-lg text-center font-mono"
            style={{ background: 'var(--bg2)', border: '1px solid var(--border)', color: 'var(--text-muted)', opacity: 0.6, cursor: 'not-allowed' }}>
            Scan in progress...
          </div>
        ) : (
          <button
            onClick={(e) => { e.stopPropagation(); onScan(repo) }}
            className="w-full py-2.5 text-[11px] font-semibold tracking-widest uppercase rounded-lg transition-all"
            style={{ background: 'transparent', border: '1px solid var(--border-hover)', color: 'var(--text-secondary)' }}
            onMouseEnter={(e) => { Object.assign((e.currentTarget as HTMLElement).style, { background: 'var(--accent)', borderColor: 'var(--accent)', color: '#fff', boxShadow: '0 4px 16px rgba(123,110,246,0.3)' }) }}
            onMouseLeave={(e) => { Object.assign((e.currentTarget as HTMLElement).style, { background: 'transparent', borderColor: 'var(--border-hover)', color: 'var(--text-secondary)', boxShadow: 'none' }) }}>
            Run security scan
          </button>
        )}
      </div>
    </div>
  )
}
