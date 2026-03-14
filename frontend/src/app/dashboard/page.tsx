'use client'

import { useState } from 'react'
import RepoCard from '@/components/dashboard/RepoCard'
import ScanModal from '@/components/dashboard/ScanModal'
import { useGitHubRepos } from '@/hooks/useGitHubRepos'
import type { Repo } from '@/types'

export default function DashboardPage() {
  const { repos, loading, error, needsGitHub } = useGitHubRepos()
  const [scanningRepo, setScanningRepo] = useState<Repo | null>(null)
  const [filter, setFilter] = useState('')
  const [visFilter, setVisFilter] = useState<'all' | 'public' | 'private'>('all')

  const filtered = repos.filter((r) => {
    const matchName = r.name.toLowerCase().includes(filter.toLowerCase())
    const matchVis = visFilter === 'all' || r.visibility === visFilter
    return matchName && matchVis
  })

  if (needsGitHub) {
    return (
      <div className="px-12 py-10">
        <div className="max-w-lg mx-auto text-center py-20">
          <svg width="48" height="48" viewBox="0 0 16 16" fill="var(--text-muted)" className="mx-auto mb-6">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
          </svg>
          <h2 className="text-xl font-extrabold tracking-tight mb-2" style={{ color: 'var(--text-primary)' }}>
            Connect your GitHub account
          </h2>
          <p className="font-mono text-xs mb-6" style={{ color: 'var(--text-muted)' }}>
            Link your GitHub account to scan your repositories for vulnerabilities.
          </p>
          <a
            href="/api/auth/login"
            className="inline-flex items-center gap-2.5 px-6 py-3 text-sm font-semibold text-white rounded-xl transition-all hover:-translate-y-px no-underline"
            style={{ background: '#7B6EF6' }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
            </svg>
            Connect GitHub
          </a>
        </div>
      </div>
    )
  }

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

        {loading && (
          <div className="py-20 text-center font-mono text-sm" style={{ color: 'var(--text-muted)' }}>
            Loading repositories...
          </div>
        )}

        {error && (
          <div className="py-20 text-center font-mono text-sm" style={{ color: '#ef4444' }}>
            {error}
          </div>
        )}

        {!loading && !error && (
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
        )}
      </div>

      <ScanModal repo={scanningRepo} onClose={() => setScanningRepo(null)} />
    </>
  )
}
