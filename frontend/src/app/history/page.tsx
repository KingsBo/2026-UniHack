'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MOCK_SCAN_HISTORY } from '@/lib/mock-data'
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
  const filtered = MOCK_SCAN_HISTORY.filter((e) =>
    e.repoName.toLowerCase().includes(filter.toLowerCase())
  )

  return (
    <div className="px-12 py-10">
      <div className="mb-9">
        <h1 className="text-2xl font-extrabold tracking-tight mb-1.5" style={{ color: 'var(--text-primary)' }}>
          Scan history
        </h1>
        <p className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
          // past security scans across your repositories
        </p>
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

      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)', background: 'var(--bg1)' }}>
        <table className="w-full font-mono text-sm">
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
            {filtered.map((entry: ScanHistoryEntry) => {
              const st = statusStyle(entry.status)
              return (
                <tr key={entry.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td className="py-3 px-5 font-medium" style={{ color: 'var(--text-primary)' }}>{entry.repoName}</td>
                  <td className="py-3 px-5" style={{ color: 'var(--text-secondary)' }}>{entry.branch}</td>
                  <td className="py-3 px-5">
                    <span className="px-2 py-0.5 rounded text-xs capitalize" style={{ background: st.bg, color: st.color }}>
                      {entry.status}
                    </span>
                  </td>
                  <td className="py-3 px-5" style={{ color: 'var(--text-primary)' }}>{entry.findingCount}</td>
                  <td className="py-3 px-5" style={{ color: 'var(--text-secondary)' }}>{formatDuration(entry.durationMs)}</td>
                  <td className="py-3 px-5" style={{ color: 'var(--text-muted)' }}>
                    {entry.completedAt ? new Date(entry.completedAt).toLocaleString() : '—'}
                  </td>
                  <td className="py-3 px-5">
                    <Link
                      href={entry.id === 'scan-1' ? '/result/demo' : `/result/${entry.id}`}
                      className="text-xs font-medium"
                      style={{ color: 'var(--accent)' }}
                    >
                      View report →
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <div className="py-20 text-center font-mono text-sm" style={{ color: 'var(--text-muted)' }}>
          No scans match your filter.
        </div>
      )}
    </div>
  )
}
