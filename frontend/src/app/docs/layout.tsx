import Header from '@/components/layout/Header'

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg0)' }}>
      <Header variant="app" />
      <main>{children}</main>
    </div>
  )
}
