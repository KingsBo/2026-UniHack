import DashboardShell from '@/components/layout/DashboardShell'

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell withSidebar={false}>
      {children}
    </DashboardShell>
  )
}
