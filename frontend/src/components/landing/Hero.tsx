'use client'

import Link from 'next/link'

export default function Hero() {
  return (
    <section className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-28 items-center max-w-6xl mx-auto w-full px-5 md:px-10 py-10 md:py-0 min-h-[calc(100vh-120px)]">

      {/* Left */}
      <div className="relative">
        {/* Grid background */}
        <div className="grid-bg absolute inset-[-100px] opacity-[0.06] pointer-events-none" />


        {/* Headline */}
        <h1 className="text-2xl md:text-4xl font-extrabold leading-[1.08] tracking-tight mb-4 md:mb-6" style={{ color: 'var(--text-primary)' }}>
          Find vulnerabilities<br />
          before they<br />
          <span style={{ color: 'var(--accent)' }}>find you.</span>
        </h1>

        {/* Subheading */}
        <p className="font-mono font-light text-sm md:text-base leading-relaxed mb-7 md:mb-10 max-w-md" style={{ color: 'var(--text-secondary)' }}>
          Link your GitHub repositories and run deep security scans powered by Gitleaks and Trivy — all in one place.
        </p>

        {/* Tool chips */}
        <div className="flex flex-wrap gap-2 mb-10">
          {['gitleaks', 'trivy'].map((tool) => (
            <span key={tool} className="px-2.5 py-1 font-mono text-[11px] rounded transition-all cursor-default"
              style={{ background: 'var(--bg2)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
              {tool}
            </span>
          ))}
        </div>

        {/* CTAs */}
        <div className="flex items-center gap-2 md:gap-3 flex-wrap">
          <a href="/api/auth/login"
            className="relative overflow-hidden px-4 md:px-6 py-2.5 md:py-3 text-[11px] md:text-xs font-semibold tracking-widest uppercase text-white rounded-lg transition-all hover:-translate-y-px inline-block"
            style={{ background: 'var(--accent)' }}>
            <span className="relative z-10">Start scanning →</span>
            <span className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.15), transparent)' }} />
          </a>
          <Link href="/result/demo"
            className="px-4 md:px-6 py-2.5 md:py-3 text-[11px] md:text-xs font-medium tracking-widest uppercase rounded-lg transition-all hover:bg-black/5"
            style={{ color: 'var(--text-secondary)', border: '1px solid var(--border-hover)' }}>
            View sample report
          </Link>
        </div>
      </div>

      {/* Right — GitHub OAuth sign in */}
      <div id="auth-form" className="relative overflow-hidden rounded-2xl px-6 md:px-10 py-10 md:py-14 scroll-mt-24 flex flex-col justify-center transition-all duration-300 ease-in-out"
        style={{ background: 'var(--bg1)', border: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>

        <h2 className="text-lg md:text-xl font-extrabold tracking-tight mb-1" style={{ color: 'var(--text-primary)' }}>
          Get started
        </h2>
        <p className="font-mono text-[11px] mb-8" style={{ color: 'var(--text-muted)' }}>
          Sign in with GitHub to start scanning your repositories.
        </p>

        {/* GitHub OAuth */}
        <a href="/api/auth/login"
          className="w-full flex items-center justify-center gap-2.5 py-3.5 text-sm font-medium rounded-xl transition-all no-underline hover:-translate-y-px"
          style={{ background: 'var(--bg2)', border: '1px solid var(--border-hover)', color: 'var(--text-primary)' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '' }}>
          <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
          </svg>
          Continue with GitHub
        </a>

        <p className="mt-6 text-center font-mono text-[11px]" style={{ color: 'var(--text-muted)' }}>
          We only request read access to your repositories.
        </p>

        {/* Feature highlights */}
        <div className="mt-10 space-y-4">
          {[
            'Scan for secrets with Gitleaks',
            'Detect CVEs with Trivy',
            'AI-powered security summaries',
          ].map((text, idx) => (
            <div key={idx} className="flex items-center gap-3 font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>
              <span className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: 'var(--accent)' }} />
              {text}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
