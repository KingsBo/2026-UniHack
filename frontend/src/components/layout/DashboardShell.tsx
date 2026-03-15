'use client'

import { useState } from 'react'
import Header from '@/components/layout/Header'
import Sidebar from '@/components/layout/Sidebar'

export default function DashboardShell({ children, withSidebar = true }: { children: React.ReactNode, withSidebar?: boolean }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg0)' }}>
      <Header
        variant="app"
        onMenuToggle={() => setSidebarOpen((v) => !v)}
        menuOpen={sidebarOpen}
      />

      {/* Mobile sidebar overlay backdrop */}
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 z-30 bg-black/50"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile sidebar drawer */}
      <div
        className={`md:hidden fixed top-14 left-0 bottom-0 z-40 w-64 transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      <div className="flex flex-1">
        {/* Desktop sidebar */}
        {withSidebar && (
          <div className="hidden md:block">
            <Sidebar />
          </div>
        )}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
