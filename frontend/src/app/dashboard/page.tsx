'use client'

import { useState } from 'react'
import RepoCard from '@/components/dashboard/RepoCard'
import ScanModal from '@/components/dashboard/ScanModal'
import { MOCK_REPOS } from '@/lib/mock-data'
import type { Repo } from '@/types'

export default function DashboardPage() {
  const [scanningRepo, setScanningRepo] = useState<Repo | null>(null)
  const [filter, setFilter] = useState('')
  const [visFilter, setVisFilter] = useState<'all' | 'public' | 'private'>('all')

  const filtered = MOCK_REPOS.filter((r) => {
    const matchName = r.name.toLowerCase().includes(filter.toLowerCase())
    const matchVis = visFilter === 'all' || r.visibility === visFilter
    return matchName && matchVis
  })

  return (
    <>
      <div className="px-12 py-10">
        {/* Header */}
        <div className="mb-9">
          <h1 className="text-2xl font-extrabold tracking-tight mb-1.5" style={{ color: 'var(--text-primary)' }}>
            Your repositories
          </h1>
          <p className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
            // select a repo to run a security scan
          </p>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
          {/* Search */}
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
              placeholder="Filter repositories..."
              className="bg-transparent border-none outline-none text-xs font-mono w-full placeholder:text-[#6B6B7B]"
              style={{ color: 'var(--text-primary)' }}
            />
          </div>

          {/* Visibility filter */}
          <div className="flex items-center gap-1.5">
            {(['all', 'public', 'private'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setVisFilter(v)}
                className="px-4 py-2 text-[11px] font-medium tracking-widest uppercase rounded-lg transition-all capitalize"
                style={
                  visFilter === v
                    ? { background: 'var(--accent-dim)', color: 'var(--accent)', border: '1px solid rgba(123,110,246,0.25)' }
                    : { background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border)' }
                }
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        {/* Repo grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((repo) => (
            <RepoCard key={repo.id} repo={repo} onScan={setScanningRepo} />
          ))}
          {filtered.length === 0 && (
            <div className="col-span-3 py-20 text-center font-mono text-sm" style={{ color: 'var(--text-muted)' }}>
              No repositories match your filter.
            </div>
          )}
        </div>
      </div>

      <ScanModal repo={scanningRepo} onClose={() => setScanningRepo(null)} />
    </>
  )
}
