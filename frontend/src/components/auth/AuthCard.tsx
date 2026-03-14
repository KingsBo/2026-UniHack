'use client'

export default function AuthCard() {
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
        Welcome
      </h1>
      <p className="font-mono text-xs mb-7" style={{ color: 'var(--text-muted)' }}>
        // sign in to scan your repositories
      </p>

      {/* Card */}
      <div className="rounded-2xl p-7" style={{ background: 'var(--bg1)', border: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        {/* GitHub OAuth */}
        <a href="/api/auth/login"
          className="w-full flex items-center justify-center gap-2.5 py-3 text-sm font-medium rounded-xl transition-all no-underline hover:-translate-y-px"
          style={{ background: 'var(--bg2)', border: '1px solid var(--border-hover)', color: 'var(--text-primary)' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '' }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
          </svg>
          Continue with GitHub
        </a>

        <p className="mt-4 text-center font-mono text-[10px]" style={{ color: 'var(--text-muted)' }}>
          We only request read access to your repositories.
        </p>
      </div>
    </div>
  )
}
