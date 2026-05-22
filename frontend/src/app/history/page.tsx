'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { ScanHistoryEntry, ScanStatus, RepoHistoryGroup } from '@/types'

function formatDuration(ms?: number) {
  if (!ms) return '—'
  const s = Math.floor(ms / 1000)
  if (s < 60) return `${s}s`
  return `${Math.floor(s / 60)}m ${s % 60}s`
}

function statusStyle(status: ScanStatus) {
  switch (status) {
    case 'complete':
      return { color: 'var(--green)', bg: 'var(--green-dim)', borderColor: 'rgba(45,217,143,0.2)' }
    case 'failed':
      return { color: 'var(--red)', bg: 'var(--red-dim)', borderColor: 'rgba(242,92,92,0.2)' }
    case 'running':
      return { color: 'var(--accent)', bg: 'var(--accent-dim)', borderColor: 'rgba(123,110,246,0.25)' }
    default:
      return { color: 'var(--text-muted)', bg: 'var(--bg2)', borderColor: 'var(--border)' }
  }
}

function formatDate(iso?: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function HistoryPage() {
  const [filter, setFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [repoGroups, setRepoGroups] = useState<RepoHistoryGroup[]>([])
  const [scansUsed, setScansUsed] = useState(0)
  const [scansLimit, setScansLimit] = useState(3)
  const [expandedRepos, setExpandedRepos] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetch('/api/history')
      .then((res) => res.json())
      .then((data) => {
        if (data.repos && Array.isArray(data.repos)) {
          setRepoGroups(data.repos)
          setScansUsed(data.scansUsed ?? 0)
          setScansLimit(data.scansLimit ?? 3)
        } else if (data.history && Array.isArray(data.history)) {
          // Fallback: group manually
          const map = new Map<string, RepoHistoryGroup>()
          for (const scan of data.history as ScanHistoryEntry[]) {
            const key = scan.repoId || scan.repoName
            if (!map.has(key)) {
              map.set(key, { repoId: scan.repoId, repoName: scan.repoName, scans: [] })
            }
            const group = map.get(key)!
            if (group.scans.length < 3) {
              group.scans.push(scan)
            }
          }
          setRepoGroups(Array.from(map.values()))
          setScansUsed(data.scansUsed ?? data.history.length)
          setScansLimit(data.scansLimit ?? 3)
        }
      })
      .catch((err) => console.error('Failed to load history:', err))
      .finally(() => setLoading(false))
  }, [])

  const filtered = repoGroups.filter((g) =>
    g.repoName.toLowerCase().includes(filter.toLowerCase())
  )

  const scansRemaining = Math.max(0, scansLimit - scansUsed)

  const toggleRepo = (repoId: string) => {
    setExpandedRepos((prev) => {
      const next = new Set(prev)
      if (next.has(repoId)) next.delete(repoId)
      else next.add(repoId)
      return next
    })
  }

  return (
    <div className="px-4 md:px-12 py-6 md:py-10">
      <div className="mb-6 flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold tracking-tight mb-1.5" style={{ color: 'var(--text-primary)' }}>
            Scan history
          </h1>
          <p className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
            // past security scans grouped by repository
          </p>
        </div>
        {!loading && (
          <div
            className="flex items-center gap-3 px-4 py-2.5 rounded-lg font-mono text-xs"
            style={{ background: 'var(--bg2)', border: '1px solid var(--border)' }}
          >
            <span style={{ color: 'var(--text-muted)' }}>Scans used</span>
            <span
              className="font-semibold"
              style={{ color: scansRemaining === 0 ? 'var(--red)' : 'var(--accent)' }}
            >
              {scansUsed}/{scansLimit}
            </span>
            {scansRemaining === 0 && (
              <span className="px-2 py-0.5 rounded text-[10px]" style={{ background: 'var(--red-dim)', color: 'var(--red)' }}>
                limit reached
              </span>
            )}
          </div>
        )}
      </div>

      <div className="mb-6 flex items-center gap-4 flex-wrap">
        <div
          className="flex items-center gap-2.5 px-4 py-2.5 rounded-lg font-mono text-xs w-60 transition-all"
          style={{ background: 'var(--bg2)', border: '1px solid var(--border)' }}
        >
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
            <circle cx="7" cy="7" r="5" stroke="var(--text-muted)" strokeWidth="1.5" />
            <path d="M11 11l3 3" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter by repository..."
            className="bg-transparent border-none outline-none text-xs font-mono w-full placeholder:text-[#6B6B7B]"
            style={{ color: 'var(--text-primary)' }}
          />
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex flex-col gap-4">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="rounded-xl p-5 animate-pulse" style={{ background: 'var(--bg1)', border: '1px solid var(--border)' }}>
              <div className="h-4 w-1/3 rounded mb-3" style={{ background: 'var(--bg2)' }} />
              <div className="h-3 w-1/5 rounded mb-4" style={{ background: 'var(--bg2)' }} />
              <div className="space-y-2">
                {Array.from({ length: 2 }).map((__, sIdx) => (
                  <div key={sIdx} className="h-10 rounded-lg" style={{ background: 'var(--bg2)' }} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Grouped repository cards */}
      {!loading && (
        <div className="flex flex-col gap-4">
          {filtered.map((group) => {
            const key = group.repoId || group.repoName
            const isExpanded = expandedRepos.has(key)
            const latestScan = group.scans[0]
            const latestStatus = latestScan ? statusStyle(latestScan.status) : null
            const totalFindings = group.scans.reduce((sum, s) => sum + s.findingCount, 0)

            return (
              <div
                key={key}
                className="rounded-xl overflow-hidden transition-all duration-200"
                style={{ background: 'var(--bg1)', border: '1px solid var(--border)' }}
              >
                {/* Repo header — clickable to expand */}
                <button
                  onClick={() => toggleRepo(key)}
                  className="w-full flex items-center justify-between px-5 py-4 transition-all text-left"
                  style={{ background: isExpanded ? 'var(--bg2)' : 'transparent' }}
                  onMouseEnter={(e) => { if (!isExpanded) (e.currentTarget as HTMLElement).style.background = 'var(--bg2)' }}
                  onMouseLeave={(e) => { if (!isExpanded) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: 'var(--bg2)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold tracking-tight truncate" style={{ color: 'var(--text-primary)' }}>
                        {group.repoName}
                      </h3>
                      <div className="flex items-center gap-2 font-mono text-[11px]" style={{ color: 'var(--text-muted)' }}>
                        <span>{group.scans.length} scan{group.scans.length !== 1 ? 's' : ''}</span>
                        <span>·</span>
                        <span>{totalFindings} total finding{totalFindings !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    {latestStatus && (
                      <span
                        className="px-2.5 py-1 rounded-md font-mono text-[10px] capitalize tracking-wide"
                        style={{ background: latestStatus.bg, color: latestStatus.color, border: `1px solid ${latestStatus.borderColor}` }}
                      >
                        {latestScan.status}
                      </span>
                    )}
                    <svg
                      width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round"
                      className="transition-transform duration-200"
                      style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </div>
                </button>

                {/* Expanded scan list */}
                {isExpanded && (
                  <div className="px-5 pb-4 pt-1 flex flex-col gap-2">
                    {group.scans.map((scan, idx) => {
                      const st = statusStyle(scan.status)
                      return (
                        <div
                          key={scan.id}
                          className="flex items-center justify-between px-4 py-3 rounded-lg transition-all"
                          style={{ background: 'var(--bg2)', border: '1px solid var(--border)' }}
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <span
                              className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] flex-shrink-0 font-mono font-bold"
                              style={{ background: st.bg, color: st.color, border: `1px solid ${st.borderColor}` }}
                            >
                              {idx === 0 ? '●' : idx + 1}
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span
                                  className="px-2 py-0.5 rounded text-[10px] font-mono capitalize"
                                  style={{ background: st.bg, color: st.color }}
                                >
                                  {scan.status}
                                </span>
                                <span className="font-mono text-[11px]" style={{ color: 'var(--text-muted)' }}>
                                  {scan.branch}
                                </span>
                                <span className="font-mono text-[11px]" style={{ color: 'var(--text-muted)' }}>·</span>
                                <span className="font-mono text-[11px]" style={{ color: 'var(--text-primary)' }}>
                                  {scan.findingCount} finding{scan.findingCount !== 1 ? 's' : ''}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 mt-1 font-mono text-[10px]" style={{ color: 'var(--text-muted)' }}>
                                <span>{formatDate(scan.completedAt || scan.startedAt)}</span>
                                {scan.durationMs && (
                                  <>
                                    <span>·</span>
                                    <span>{formatDuration(scan.durationMs)}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          <Link
                            href={`/result/${scan.id}`}
                            className="text-[11px] font-medium ml-3 flex-shrink-0 transition-all"
                            style={{ color: 'var(--accent)' }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = '0.7' }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = '1' }}
                          >
                            View report →
                          </Link>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="py-20 text-center font-mono text-sm" style={{ color: 'var(--text-muted)' }}>
          No repositories match your filter.
        </div>
      )}
    </div>
  )
}
