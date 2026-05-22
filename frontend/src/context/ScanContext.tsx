'use client'

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

type ScanContextType = {
  isScanning: boolean
  scanningRepo: string | null
  startScan: (repoName: string) => void
  endScan: () => void
}

const ScanContext = createContext<ScanContextType>({
  isScanning: false,
  scanningRepo: null,
  startScan: () => {},
  endScan: () => {},
})

export function ScanProvider({ children }: { children: ReactNode }) {
  const [scanningRepo, setScanningRepo] = useState<string | null>(null)

  // Rehydrate from sessionStorage on mount
  useEffect(() => {
    const stored = sessionStorage.getItem('kestrel-scanning-repo')
    if (stored) setScanningRepo(stored)
  }, [])

  const startScan = (repoName: string) => {
    setScanningRepo(repoName)
    sessionStorage.setItem('kestrel-scanning-repo', repoName)
  }

  const endScan = () => {
    setScanningRepo(null)
    sessionStorage.removeItem('kestrel-scanning-repo')
  }

  return (
    <ScanContext.Provider value={{ isScanning: !!scanningRepo, scanningRepo, startScan, endScan }}>
      {children}
    </ScanContext.Provider>
  )
}

export function useScan() {
  return useContext(ScanContext)
}
