'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function Hero() {
  const [tab, setTab] = useState<'signin' | 'register'>('signin')
  const router = useRouter()

  return (
    <section className="flex-1 grid grid-cols-2 gap-28 items-center max-w-6xl mx-auto w-full px-10 py-20 min-h-[calc(100vh-56px)]">

      {/* Left */}
      <div className="relative">
        {/* Grid background */}
        <div className="grid-bg absolute inset-[-100px] opacity-[0.06] pointer-events-none" />

        {/* Eyebrow */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-7 font-mono text-[11px] tracking-widest"
          style={{ border: '1px solid var(--border)', color: 'var(--green)' }}>
          <span className="w-1.5 h-1.5 rounded-full animate-blink" style={{ background: 'var(--green)' }} />
          Static analysis · Active scanning
        </div>

        {/* Headline */}
        <h1 className="text-4xl font-extrabold leading-[1.08] tracking-tight mb-6" style={{ color: 'var(--text-primary)' }}>
          Find vulnerabilities<br />
          before they<br />
          <span style={{ color: 'var(--accent)' }}>find you.</span>
        </h1>

        {/* Subheading */}
        <p className="font-mono font-light text-base leading-relaxed mb-10 max-w-md" style={{ color: 'var(--text-secondary)' }}>
          Link your GitHub repositories and run deep security scans powered by Semgrep, Gitleaks, and Trivy — all in one place.
        </p>

        {/* Tool chips */}
        <div className="flex flex-wrap gap-2 mb-10">
          {['semgrep', 'gitleaks', 'trivy'].map((tool) => (
            <span key={tool} className="px-2.5 py-1 font-mono text-[11px] rounded transition-all cursor-default"
              style={{ background: 'var(--bg2)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
              {tool}
            </span>
          ))}
        </div>

        {/* CTAs */}
        <div className="flex items-center gap-3">
          <Link href="/dashboard"
            className="relative overflow-hidden px-6 py-3 text-xs font-semibold tracking-widest uppercase text-white rounded-lg transition-all hover:-translate-y-px inline-block"
            style={{ background: 'var(--accent)' }}>
            <span className="relative z-10">Start scanning →</span>
            <span className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.15), transparent)' }} />
          </Link>
          <Link href="/result/demo"
            className="px-6 py-3 text-xs font-medium tracking-widest uppercase rounded-lg transition-all hover:bg-black/5"
            style={{ color: 'var(--text-secondary)', border: '1px solid var(--border-hover)' }}>
            View sample report
          </Link>
        </div>
      </div>

      {/* Right — Sign in / Register card (auth form) */}
      <div id="auth-form" className="relative overflow-hidden rounded-2xl px-10 py-14 scroll-mt-24 flex flex-col justify-center min-h-[420px]"
        style={{ background: 'var(--bg1)', border: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        {/* Glow */}
        <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(123,110,246,0.12), transparent 70%)' }} />

        <h2 className="text-xl font-extrabold tracking-tight mb-1" style={{ color: 'var(--text-primary)' }}>
          {tab === 'signin' ? 'Welcome back' : 'Create account'}
        </h2>
        <p className="font-mono text-[11px] mb-6" style={{ color: 'var(--text-muted)' }}>
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

        {/* Fields — fixed height so Sign in and Register don't shift the page; Sign in content vertically centered */}
        <div className={`h-[218px] ${tab === 'signin' ? 'flex flex-col' : ''}`}>
          {tab === 'signin' ? (
            <>
              <div className="flex flex-1 flex-col justify-center space-y-4 min-h-0">
                <div>
                  <label className="block font-mono text-[10px] tracking-widest uppercase mb-2" style={{ color: 'var(--text-muted)' }}>Email</label>
                  <input type="email" placeholder="you@company.com"
                    className="w-full px-4 py-3 text-sm font-mono rounded-xl outline-none transition-all placeholder:opacity-60"
                    style={{ background: 'var(--bg2)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                    onFocus={(e) => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px var(--accent-dim)' }}
                    onBlur={(e) => { e.target.style.borderColor = ''; e.target.style.boxShadow = 'none' }} />
                </div>
                <div>
                  <label className="block font-mono text-[10px] tracking-widest uppercase mb-2" style={{ color: 'var(--text-muted)' }}>Password</label>
                  <input type="password" placeholder="••••••••••"
                    className="w-full px-4 py-3 text-sm font-mono rounded-xl outline-none transition-all placeholder:opacity-60"
                    style={{ background: 'var(--bg2)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                    onFocus={(e) => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px var(--accent-dim)' }}
                    onBlur={(e) => { e.target.style.borderColor = ''; e.target.style.boxShadow = 'none' }} />
                </div>
              </div>
              <div className="h-[62px] w-full shrink-0 invisible pointer-events-none select-none" aria-hidden="true" />
            </>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block font-mono text-[10px] tracking-widest uppercase mb-2" style={{ color: 'var(--text-muted)' }}>Full name</label>
                <input type="text" placeholder="Jane Smith"
                  className="w-full px-4 py-3 text-sm font-mono rounded-xl outline-none transition-all"
                  style={{ background: 'var(--bg2)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                  onFocus={(e) => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px var(--accent-dim)' }}
                  onBlur={(e) => { e.target.style.borderColor = ''; e.target.style.boxShadow = 'none' }} />
              </div>
              <div>
                <label className="block font-mono text-[10px] tracking-widest uppercase mb-2" style={{ color: 'var(--text-muted)' }}>Email</label>
                <input type="email" placeholder="you@company.com"
                  className="w-full px-4 py-3 text-sm font-mono rounded-xl outline-none transition-all placeholder:opacity-60"
                  style={{ background: 'var(--bg2)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                  onFocus={(e) => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px var(--accent-dim)' }}
                  onBlur={(e) => { e.target.style.borderColor = ''; e.target.style.boxShadow = 'none' }} />
              </div>
              <div>
                <label className="block font-mono text-[10px] tracking-widest uppercase mb-2" style={{ color: 'var(--text-muted)' }}>Password</label>
                <input type="password" placeholder="••••••••••"
                  className="w-full px-4 py-3 text-sm font-mono rounded-xl outline-none transition-all placeholder:opacity-60"
                  style={{ background: 'var(--bg2)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                  onFocus={(e) => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px var(--accent-dim)' }}
                  onBlur={(e) => { e.target.style.borderColor = ''; e.target.style.boxShadow = 'none' }} />
              </div>
            </div>
          )}
        </div>

        <button onClick={() => router.push('/dashboard')}
          className="relative overflow-hidden w-full mt-10 py-3.5 text-sm font-semibold tracking-wide text-white rounded-xl transition-all hover:-translate-y-px"
          style={{ background: 'var(--accent)' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(123,110,246,0.35)' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}>
          <span className="relative z-10">{tab === 'signin' ? 'Sign in →' : 'Create account →'}</span>
          <span className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.12), transparent)' }} />
        </button>

        <p className="mt-5 text-center font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
          {tab === 'signin' ? "Don't have an account? " : 'Already have an account? '}
          <button type="button" onClick={() => setTab(tab === 'signin' ? 'register' : 'signin')}
            className="transition-colors hover:underline" style={{ color: 'var(--accent)' }}>
            {tab === 'signin' ? 'Register' : 'Sign in'}
          </button>
        </p>
      </div>
    </section>
  )
}
