import Header from '@/components/layout/Header'
import Sidebar from '@/components/layout/Sidebar'

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg0)' }}>
      <Header variant="app" />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
