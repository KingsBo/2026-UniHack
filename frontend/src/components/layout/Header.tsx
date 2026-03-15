'use client'

import Link from 'next/link'
import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'

const LogoMark = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="shrink-0" style={{ color: 'var(--accent)' }}>
    {/* Equal Hexagon Outline */}
    <polygon points="12,2 20.66,7 20.66,17 12,22 3.34,17 3.34,7" stroke="currentColor" strokeWidth="1.5" />
    {/* Abstract Kestrel Silhouette (Clean) */}
    <path 
      d="M12 18C12 18 13.5 14.5 18 9C15 10 13.5 11 12 12C10.5 11 9 10 6 9C10.5 14.5 12 18 12 18Z" 
      fill="currentColor" 
    />
  </svg>
)

type HeaderProps = {
  variant?: 'landing' | 'app'
  onMenuToggle?: () => void
  menuOpen?: boolean
}

export default function Header({ variant = 'landing', onMenuToggle, menuOpen }: HeaderProps) {
  const pathname = usePathname()
  const { ghUser } = useAuth()
  const [landingMenuOpen, setLandingMenuOpen] = useState(false)

  const logoHref = ghUser ? '/dashboard' : '/'

  const landingLinks = [
    { label: 'Demo', href: '/result/demo' },
    { label: 'Docs', href: '/docs' },
  ]
  const appLinks = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Docs', href: '/docs' },
  ]

  return (
    <>
      <header className="sticky top-0 z-50 grid grid-cols-2 md:grid-cols-3 items-center px-4 md:px-8 h-14"
        style={{ background: 'var(--header-bg)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--border)' }}>

        {/* Left: Logo */}
        <div className="flex justify-start">
          <Link href={logoHref} className="flex items-center gap-2.5">
            <LogoMark />
            <span className="text-sm font-bold tracking-widest uppercase" style={{ color: 'var(--text-primary)' }}>Kestrel</span>
          </Link>
        </div>

        {/* Center: Nav — hidden on mobile */}
        <div className="hidden md:flex justify-center">
          {variant === 'landing' ? (
            <nav className="flex items-center gap-1">
              {landingLinks.map(({ label, href }) => (
                <Link key={label} href={href} className="header-nav-link px-3.5 py-1.5 text-xs font-medium tracking-widest uppercase rounded-md transition-all" style={{ color: 'var(--text-secondary)' }}>{label}</Link>
              ))}
            </nav>
          ) : (
            <nav className="flex items-center gap-1">
              {appLinks.map(({ label, href }) => (
                <Link key={label} href={href} className="header-nav-link px-3.5 py-1.5 text-xs font-medium tracking-widest uppercase rounded-md transition-all"
                  style={{ color: pathname === href ? 'var(--accent)' : 'var(--text-secondary)' }}>{label}</Link>
              ))}
            </nav>
          )}
        </div>

        {/* Right: Hamburger on mobile */}
        <div className="flex justify-end col-span-1">
          <button
            className="md:hidden flex flex-col items-center justify-center w-9 h-9 gap-[5px] rounded-lg transition-all"
            style={{ color: 'var(--text-secondary)' }}
            onClick={variant === 'app' ? onMenuToggle : () => setLandingMenuOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {/* Hamburger / X icon */}
            {(variant === 'app' ? menuOpen : landingMenuOpen) ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
          </button>
        </div>
      </header>

      {/* Landing mobile dropdown menu */}
      {variant === 'landing' && landingMenuOpen && (
        <div
          className="md:hidden sticky top-14 z-40 px-4 py-3 flex flex-col gap-1"
          style={{ background: 'var(--header-bg)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--border)' }}
        >
          {landingLinks.map(({ label, href }) => (
            <Link
              key={label}
              href={href}
              onClick={() => setLandingMenuOpen(false)}
              className="px-3 py-2.5 text-xs font-medium tracking-widest uppercase rounded-lg transition-all"
              style={{ color: 'var(--text-secondary)' }}
            >
              {label}
            </Link>
          ))}
        </div>
      )}
    </>
  )
}
