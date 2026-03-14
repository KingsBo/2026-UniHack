'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AuthCard() {
  const [tab, setTab] = useState<'signin' | 'register'>('signin')
  const router = useRouter()

  return (
    <div className="w-full max-w-sm mx-auto px-4">
      {/* Logo */}
      <div className="flex items-center gap-2.5 mb-8">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
          <polygon points="12,2 22,8 22,16 12,22 2,16 2,8" stroke="#7B6EF6" strokeWidth="1.5" fill="none" />
          <polygon points="12,6 18,9.5 18,14.5 12,18 6,14.5 6,9.5" fill="rgba(123,110,246,0.12)" stroke="#7B6EF6" strokeWidth="0.5" />
          <circle cx="12" cy="12" r="2" fill="#7B6EF6" />
        </svg>
        <span className="text-sm font-bold tracking-widest uppercase" style={{ color: 'var(--text-primary)' }}>Kestrel</span>
      </div>

      <h1 className="text-2xl font-extrabold tracking-tight mb-1" style={{ color: 'var(--text-primary)' }}>
        {tab === 'signin' ? 'Welcome back' : 'Create account'}
      </h1>
      <p className="font-mono text-xs mb-7" style={{ color: 'var(--text-muted)' }}>
        // secure your codebase at scale
      </p>

      {/* Tabs */}
      <div className="flex mb-6" style={{ borderBottom: '1px solid var(--border)' }}>
        {(['signin', 'register'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className="px-5 py-2.5 text-xs font-semibold tracking-widest uppercase transition-all"
            style={{
              color: tab === t ? 'var(--accent)' : 'var(--text-muted)',
              borderBottom: tab === t ? '2px solid var(--accent)' : '2px solid transparent',
              marginBottom: '-1px',
            }}>
            {t === 'signin' ? 'Sign in' : 'Register'}
          </button>
        ))}
      </div>

      {/* Card */}
      <div className="rounded-2xl p-7" style={{ background: 'var(--bg1)', border: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        {/* GitHub OAuth */}
        <a href="/api/auth/login"
          className="w-full flex items-center justify-center gap-2.5 py-3 text-sm font-medium rounded-xl mb-5 transition-all no-underline"
          style={{ background: 'var(--bg2)', border: '1px solid var(--border-hover)', color: 'var(--text-primary)' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-hover)' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '' }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
          </svg>
          Continue with GitHub
        </a>

        {/* Divider */}
        <div className="relative mb-5">
          <div className="h-px" style={{ background: 'var(--border)' }} />
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 px-3 font-mono text-[11px]"
            style={{ background: 'var(--bg1)', color: 'var(--text-muted)' }}>or</span>
        </div>

        {/* Fields */}
        <div className="space-y-4">
          {tab === 'register' && (
            <div>
              <label className="block font-mono text-[10px] tracking-widest uppercase mb-2" style={{ color: 'var(--text-muted)' }}>Full name</label>
              <input type="text" placeholder="Jane Smith"
                className="w-full px-4 py-3 text-sm font-mono rounded-xl outline-none transition-all"
                style={{ background: 'var(--bg2)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                onFocus={(e) => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px var(--accent-dim)' }}
                onBlur={(e) => { e.target.style.borderColor = ''; e.target.style.boxShadow = 'none' }} />
            </div>
          )}
          <div>
            <label className="block font-mono text-[10px] tracking-widest uppercase mb-2" style={{ color: 'var(--text-muted)' }}>Email</label>
            <input type="email" placeholder="you@company.com"
              className="w-full px-4 py-3 text-sm font-mono rounded-xl outline-none transition-all placeholder:text-text-secondary"
              style={{ background: 'var(--bg2)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              onFocus={(e) => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px var(--accent-dim)' }}
              onBlur={(e) => { e.target.style.borderColor = ''; e.target.style.boxShadow = 'none' }} />
          </div>
          <div>
            <label className="block font-mono text-[10px] tracking-widest uppercase mb-2" style={{ color: 'var(--text-muted)' }}>Password</label>
            <input type="password" placeholder="••••••••••"
              className="w-full px-4 py-3 text-sm font-mono rounded-xl outline-none transition-all placeholder:text-text-secondary"
              style={{ background: 'var(--bg2)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              onFocus={(e) => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px var(--accent-dim)' }}
              onBlur={(e) => { e.target.style.borderColor = ''; e.target.style.boxShadow = 'none' }} />
          </div>
        </div>

        <button onClick={() => router.push('/dashboard')}
          className="relative overflow-hidden w-full mt-4 py-3.5 text-sm font-semibold tracking-wide text-white rounded-xl transition-all hover:-translate-y-px"
          style={{ background: '#7B6EF6' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(123,110,246,0.35)' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}>
          <span className="relative z-10">{tab === 'signin' ? 'Sign in →' : 'Create account →'}</span>
          <span className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.12), transparent)' }} />
        </button>
      </div>

      <p className="mt-5 text-center font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
        {tab === 'signin' ? "Don't have an account? " : 'Already have an account? '}
        <button onClick={() => setTab(tab === 'signin' ? 'register' : 'signin')}
          className="transition-colors hover:underline" style={{ color: 'var(--accent)' }}>
          {tab === 'signin' ? 'Register' : 'Sign in'}
        </button>
      </p>
    </div>
  )
}
