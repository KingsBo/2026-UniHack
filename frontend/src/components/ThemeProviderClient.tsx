'use client'

import { ThemeProvider } from '@/contexts/ThemeContext'
import ThemeToggle from '@/components/theme/ThemeToggle'

export default function ThemeProviderClient({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      {children}
      <ThemeToggle />
    </ThemeProvider>
  )
}
