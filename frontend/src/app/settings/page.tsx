'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'

export default function SettingsPage() {
  const { ghUser, avatarUrl, loading: authLoading } = useAuth()
  const [fullName, setFullName] = useState<string | null>(null)
  const [detailLoading, setDetailLoading] = useState(true)

  // Fetch extra details (name) only once — the context already has login + avatar
  useEffect(() => {
    if (!ghUser) {
      setDetailLoading(false)
      return
    }
    fetch('/api/auth/me')
      .then((res) => res.ok ? res.json() : null)
      .then((data) => { if (data) setFullName(data.name || null) })
      .catch(() => {})
      .finally(() => setDetailLoading(false))
  }, [ghUser])

  const loading = authLoading || detailLoading

  return (
    <div className="px-4 md:px-12 py-6 md:py-10">
      <div className="mb-9">
        <h1 className="text-xl md:text-2xl font-extrabold tracking-tight mb-1.5" style={{ color: 'var(--text-primary)' }}>
          Preferences
        </h1>
        <p className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
          // manage your account
        </p>
      </div>

      <div className="flex flex-wrap gap-10">
        {/* Account details */}
        <div className="flex-1 flex flex-col min-w-[280px] max-w-lg rounded-2xl p-8" style={{ background: 'var(--bg1)', border: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <h2 className="text-sm font-semibold tracking-tight mb-5" style={{ color: 'var(--text-primary)' }}>GitHub account</h2>

          {loading ? (
            <div className="space-y-4 animate-pulse">
              <div className="h-12 w-12 rounded-full" style={{ background: 'var(--bg2)' }} />
              <div className="h-4 w-40 rounded" style={{ background: 'var(--bg2)' }} />
              <div className="h-3 w-28 rounded" style={{ background: 'var(--bg2)' }} />
            </div>
          ) : ghUser ? (
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-4">
                {avatarUrl && (
                  <img
                    src={avatarUrl}
                    alt={ghUser}
                    className="h-14 w-14 rounded-full"
                    style={{ border: '2px solid var(--border)' }}
                  />
                )}
                <div>
                  <p className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {fullName || ghUser}
                  </p>
                  <p className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
                    @{ghUser}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between px-4 py-3 rounded-lg" style={{ background: 'var(--bg2)', border: '1px solid var(--border)' }}>
                  <span className="font-mono text-[10px] tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>Provider</span>
                  <span className="flex items-center gap-1.5 font-mono text-xs" style={{ color: 'var(--text-primary)' }}>
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
                    </svg>
                    GitHub
                  </span>
                </div>
                <div className="flex items-center justify-between px-4 py-3 rounded-lg" style={{ background: 'var(--bg2)', border: '1px solid var(--border)' }}>
                  <span className="font-mono text-[10px] tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>Status</span>
                  <span className="flex items-center gap-1.5 font-mono text-xs" style={{ color: 'var(--green)' }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--green)' }} />
                    Connected
                  </span>
                </div>
              </div>

            </div>
          ) : (
            <div className="text-center py-8">
              <p className="font-mono text-xs mb-4" style={{ color: 'var(--text-muted)' }}>Not connected to GitHub.</p>
              <a
                href="/api/auth/login"
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white rounded-xl transition-all no-underline hover:-translate-y-px"
                style={{ background: 'var(--accent)' }}
              >
                Connect GitHub
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
