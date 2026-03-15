'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'

const icons = {
  repos: (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
      <path d="M2 2h5v5H2zm7 0h5v5H9zm0 7h5v5H9zM2 9h5v5H2z" />
    </svg>
  ),
  history: (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 4v4l3 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  settings: (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.2" />
      <path d="M8 1v2M8 13v2M1 8h2M13 8h2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  ),
}

const navItems = [
  { label: 'Repositories', href: '/dashboard', icon: 'repos' as const },
  { label: 'Scan history', href: '/history', icon: 'history' as const },
]

const settingsItems = [
  { label: 'Preferences', href: '/settings', icon: 'settings' as const },
]

export default function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname()
  const { ghUser, repoCount } = useAuth()

  return (
    <aside className="w-60 flex-shrink-0 flex flex-col gap-1 px-3 py-6 sticky top-14 overflow-y-auto"
      style={{ background: 'var(--bg1)', borderRight: '1px solid var(--border)', height: 'calc(100vh - 56px)' }}>

      <span className="px-3 pb-1.5 pt-2 text-[10px] font-mono tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>
        Overview
      </span>

      {navItems.map((item) => {
        const active = pathname === item.href
        return (
          <Link key={item.href} href={item.href}
            onClick={onClose}
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all"
            style={{
              color: active ? 'var(--accent)' : 'var(--text-secondary)',
              background: active ? 'var(--accent-dim)' : 'transparent',
            }}
            onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = 'var(--bg2)' }}
            onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent' }}>
            <span style={{ opacity: active ? 1 : 0.5 }}>{icons[item.icon]}</span>
            {item.label}
          </Link>
        )
      })}

      <span className="px-3 pb-1.5 pt-4 text-[10px] font-mono tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>
        Settings
      </span>

      {settingsItems.map((item) => {
        const active = pathname === item.href
        return (
          <Link key={item.href} href={item.href}
            onClick={onClose}
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all"
            style={{ color: active ? 'var(--accent)' : 'var(--text-secondary)', background: active ? 'var(--accent-dim)' : 'transparent' }}
            onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = 'var(--bg2)' }}
            onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent' }}>
            <span style={{ opacity: active ? 1 : 0.5 }}>{icons[item.icon]}</span>
            {item.label}
          </Link>
        )
      })}

      {/* GitHub status + Sign out */}
      <div className="mt-auto mx-1 flex flex-col gap-2">
        <div className="p-4 rounded-xl" style={{ background: 'var(--bg2)', border: '1px solid var(--border)' }}>
          <p className="font-mono text-[11px] mb-2" style={{ color: 'var(--text-muted)' }}>
            {ghUser ? '// github connected' : '// not connected'}
          </p>
          <div className="flex items-center gap-2 font-mono text-[11px]" style={{ color: ghUser ? 'var(--green)' : 'var(--text-muted)' }}>
            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: ghUser ? 'var(--green)' : 'var(--text-muted)' }} />
            {ghUser
              ? `@${ghUser}${repoCount !== null ? ` · ${repoCount} repos` : ''}`
              : 'Sign in to connect'}
          </div>
        </div>
        {ghUser && (
          <a
            href="/api/auth/logout"
            className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all no-underline"
            style={{ color: 'var(--text-muted)', background: 'transparent' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--bg2)'; (e.currentTarget as HTMLElement).style.color = 'var(--red)' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Sign out
          </a>
        )}
      </div>
    </aside>
  )
}
