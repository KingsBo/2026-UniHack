'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { ScanHistoryEntry, ScanStatus } from '@/types'

function formatDuration(ms?: number) {
  if (!ms) return '—'
  const s = Math.floor(ms / 1000)
  if (s < 60) return `${s}s`
  return `${Math.floor(s / 60)}m ${s % 60}s`
}

function statusStyle(status: ScanStatus) {
  switch (status) {
    case 'complete':
      return { color: 'var(--green)', bg: 'var(--green-dim)' }
    case 'failed':
      return { color: 'var(--red)', bg: 'var(--red-dim)' }
    case 'running':
      return { color: 'var(--accent)', bg: 'var(--accent-dim)' }
    default:
      return { color: 'var(--text-muted)', bg: 'var(--bg2)' }
  }
}

export default function HistoryPage() {
  const [filter, setFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [entries, setEntries] = useState<ScanHistoryEntry[]>([])
  const [scansUsed, setScansUsed] = useState(0)
  const [scansLimit, setScansLimit] = useState(3)

  useEffect(() => {
    fetch('/api/history')
      .then((res) => res.json())
      .then((data) => {
        if (data.history && Array.isArray(data.history)) {
          setEntries(data.history)
          setScansUsed(data.scansUsed ?? data.history.length)
          setScansLimit(data.scansLimit ?? 3)
        } else if (Array.isArray(data)) {
          // Fallback for old response format
          setEntries(data)
          setScansUsed(data.length)
        }
      })
      .catch((err) => console.error('Failed to load history:', err))
      .finally(() => setLoading(false))
  }, [])

  const filtered = entries.filter((e) =>
    e.repoName.toLowerCase().includes(filter.toLowerCase())
  )

  const scansRemaining = Math.max(0, scansLimit - scansUsed)

  return (
    <div className="px-4 md:px-12 py-6 md:py-10">
      <div className="mb-6 flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold tracking-tight mb-1.5" style={{ color: 'var(--text-primary)' }}>
            Scan history
          </h1>
          <p className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
            // past security scans across your repositories
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

      {/* Mobile card layout */}
      <div className="md:hidden flex flex-col gap-3">
        {loading
          ? Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="rounded-xl p-4 animate-pulse" style={{ background: 'var(--bg1)', border: '1px solid var(--border)' }}>
                <div className="h-3 w-2/5 rounded mb-3" style={{ background: 'var(--bg2)' }} />
                <div className="h-3 w-1/4 rounded mb-4" style={{ background: 'var(--bg2)' }} />
                <div className="h-8 rounded" style={{ background: 'var(--bg2)' }} />
              </div>
            ))
            : filtered.map((entry: ScanHistoryEntry) => {
                const st = statusStyle(entry.status)
                return (
                  <div key={entry.id} className="rounded-xl p-4" style={{ background: 'var(--bg1)', border: '1px solid var(--border)' }}>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="font-mono font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{entry.repoName}</span>
                      <span className="px-2 py-0.5 rounded font-mono text-xs capitalize flex-shrink-0" style={{ background: st.bg, color: st.color }}>{entry.status}</span>
                    </div>
                    <div className="flex items-center gap-3 font-mono text-[11px] mb-3" style={{ color: 'var(--text-muted)' }}>
                      <span>{entry.branch}</span>
                      <span>·</span>
                      <span>{entry.findingCount} findings</span>
                      {entry.completedAt && <><span>·</span><span>{new Date(entry.completedAt).toLocaleDateString()}</span></>}
                    </div>
                    <Link
                      href={`/result/${entry.id}`}
                      className="text-xs font-medium"
                      style={{ color: 'var(--accent)' }}
                    >
                      View report →
                    </Link>
                  </div>
                )
              })}
      </div>

      {/* Desktop table layout */}
      <div className="hidden md:block overflow-x-auto rounded-xl" style={{ border: '1px solid var(--border)', background: 'var(--bg1)' }}>
        <table className="w-full min-w-[640px] font-mono text-sm">
          <thead>
            <tr style={{ background: 'var(--bg2)', borderBottom: '1px solid var(--border)' }}>
              <th className="text-left py-3 px-5 font-semibold" style={{ color: 'var(--text-muted)' }}>Repository</th>
              <th className="text-left py-3 px-5 font-semibold" style={{ color: 'var(--text-muted)' }}>Branch</th>
              <th className="text-left py-3 px-5 font-semibold" style={{ color: 'var(--text-muted)' }}>Status</th>
              <th className="text-left py-3 px-5 font-semibold" style={{ color: 'var(--text-muted)' }}>Findings</th>
              <th className="text-left py-3 px-5 font-semibold" style={{ color: 'var(--text-muted)' }}>Duration</th>
              <th className="text-left py-3 px-5 font-semibold" style={{ color: 'var(--text-muted)' }}>Completed</th>
              <th className="w-24" />
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 6 }).map((_, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                    {Array.from({ length: 6 }).map((__, cellIdx) => (
                      <td key={cellIdx} className="py-3 px-5">
                        <div className="h-3 rounded animate-pulse" style={{ background: 'var(--bg2)', width: cellIdx === 0 ? '40%' : cellIdx === 5 ? '60%' : '30%' }} />
                      </td>
                    ))}
                    <td className="py-3 px-5"><div className="h-3 w-16 rounded animate-pulse" style={{ background: 'var(--bg2)' }} /></td>
                  </tr>
                ))
              : filtered.map((entry: ScanHistoryEntry) => {
                  const st = statusStyle(entry.status)
                  return (
                    <tr key={entry.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td className="py-3 px-5 font-medium" style={{ color: 'var(--text-primary)' }}>{entry.repoName}</td>
                      <td className="py-3 px-5" style={{ color: 'var(--text-secondary)' }}>{entry.branch}</td>
                      <td className="py-3 px-5">
                        <span className="px-2 py-0.5 rounded text-xs capitalize" style={{ background: st.bg, color: st.color }}>{entry.status}</span>
                      </td>
                      <td className="py-3 px-5" style={{ color: 'var(--text-primary)' }}>{entry.findingCount}</td>
                      <td className="py-3 px-5" style={{ color: 'var(--text-secondary)' }}>{formatDuration(entry.durationMs)}</td>
                      <td className="py-3 px-5" style={{ color: 'var(--text-muted)' }}>
                        {entry.completedAt ? new Date(entry.completedAt).toLocaleString() : '—'}
                      </td>
                      <td className="py-3 px-5">
                        <Link href={`/result/${entry.id}`} className="text-xs font-medium" style={{ color: 'var(--accent)' }}>View report →</Link>
                      </td>
                    </tr>
                  )
                })}
          </tbody>
        </table>
      </div>

      {!loading && filtered.length === 0 && (
        <div className="py-20 text-center font-mono text-sm" style={{ color: 'var(--text-muted)' }}>
          No scans match your filter.
        </div>
      )}
    </div>
  )
}
