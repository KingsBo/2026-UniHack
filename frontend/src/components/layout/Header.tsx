'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'

const LogoMark = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="shrink-0" style={{ color: 'var(--accent)' }}>
    <polygon points="12,2 22,8 22,16 12,22 2,16 2,8" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <polygon points="12,6 18,9.5 18,14.5 12,18 6,14.5 6,9.5" fill="var(--accent-dim)" stroke="currentColor" strokeWidth="0.5" />
    <circle cx="12" cy="12" r="2" fill="currentColor" />
  </svg>
)

type HeaderProps = { variant?: 'landing' | 'app' }

export default function Header({ variant = 'landing' }: HeaderProps) {
  const pathname = usePathname()
  const { ghUser } = useAuth()

  const logoHref = ghUser ? '/dashboard' : '/'
  return (
    <header className="sticky top-0 z-50 grid grid-cols-3 items-center px-8 h-14"
      style={{ background: 'var(--header-bg)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--border)' }}>
      {/* Left: Logo */}
      <div className="flex justify-start">
        <Link href={logoHref} className="flex items-center gap-2.5">
          <LogoMark />
          <span className="text-sm font-bold tracking-widest uppercase" style={{ color: 'var(--text-primary)' }}>Kestrel</span>
        </Link>
      </div>

      {/* Center: Navigation */}
      <div className="flex justify-center">
        {variant === 'landing' ? (
          <nav className="flex items-center gap-1">
            <Link href="/result/demo" className="header-nav-link px-3.5 py-1.5 text-xs font-medium tracking-widest uppercase rounded-md transition-all" style={{ color: 'var(--text-secondary)' }}>Demo</Link>
            <Link href="/docs" className="header-nav-link px-3.5 py-1.5 text-xs font-medium tracking-widest uppercase rounded-md transition-all" style={{ color: 'var(--text-secondary)' }}>Docs</Link>
          </nav>
        ) : (
          <nav className="flex items-center gap-1">
            {[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Docs', href: '/docs' }].map((item) => (
              <Link key={item.label} href={item.href}
                className="header-nav-link px-3.5 py-1.5 text-xs font-medium tracking-widest uppercase rounded-md transition-all"
                style={{ color: pathname === item.href ? 'var(--accent)' : 'var(--text-secondary)' }}>
                {item.label}
              </Link>
            ))}
          </nav>
        )}
      </div>

      {/* Right: CTA */}
      <div className="flex justify-end">
      </div>
    </header>
  )
}
