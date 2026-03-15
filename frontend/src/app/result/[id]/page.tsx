'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import ScanSummaryBar from '@/components/results/ScanSummaryBar'
import FindingCard from '@/components/results/FindingCard'
import DashboardShell from '@/components/layout/DashboardShell'
import type { ScanTool, ScanResult, Finding, Severity } from '@/types'

const TOOLS: { key: 'all' | ScanTool; label: string }[] = [
  { key: 'all', label: 'All tools' },
  { key: 'gitleaks', label: 'Gitleaks' },
  { key: 'trivy', label: 'Trivy' },
]

export default function ResultPage() {
  const params = useParams()
  const scanId = params.id as string
  const [scan, setScan] = useState<ScanResult | null>(null)
  const [activeTool, setActiveTool] = useState<'all' | ScanTool>('all')
  const [activeSev, setActiveSev] = useState<Severity | 'all'>('all')
  const [loadError, setLoadError] = useState<string | null>(null)

  // --- Layout & Resizing State ---
  const [isMobile, setIsMobile] = useState(false)
  const [sidebarWidth, setSidebarWidth] = useState(450)
  const [sidebarHeight, setSidebarHeight] = useState(400) 
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  const [aiStatus, setAiStatus] = useState<'idle' | 'loading' | 'done'>('idle')

  useEffect(() => {
    fetch(`/api/scan/${scanId}`)
      .then((res) => {
        if (!res.ok) throw new Error('Scan not found')
        return res.json()
      })
      .then((data) => setScan(data as ScanResult))
      .catch(() => {
        setLoadError('Scan result not found. Please run a new scan from the dashboard.')
      })
  }, [scanId])

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    if (typeof window !== 'undefined') {
      handleResize()
      window.addEventListener('resize', handleResize)
    }
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Handle Dragging / Resizing Logic
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return

      if (isMobile) {
        const newHeight = window.innerHeight - e.clientY
        if (newHeight < 75) {
          setIsCollapsed(true)
          setIsDragging(false)
        } else {
          const maxH = window.innerHeight - 150
          setSidebarHeight(Math.min(newHeight, maxH))
          setIsCollapsed(false)
        }
      } else {
        const newWidth = window.innerWidth - e.clientX
        
        if (newWidth < 250) {
          setIsCollapsed(true)
          setIsDragging(false)
        } else {
          const maxW = window.innerWidth - 650
          setSidebarWidth(Math.min(newWidth, maxW))
          setIsCollapsed(false)
        }
      }
    }

    const handleMouseUp = () => setIsDragging(false)

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = isMobile ? 'row-resize' : 'col-resize'
      document.body.style.userSelect = 'none'
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [isDragging, isMobile])

  const handleGenerateSummary = () => {
    setAiStatus('loading')
    setTimeout(() => setAiStatus('done'), 2000)
  }

  if (loadError) return <DashboardShell><div className="p-12 text-center font-mono">{loadError}</div></DashboardShell>
  if (!scan) return <DashboardShell><div className="p-12 text-center font-mono">Loading...</div></DashboardShell>

  const filtered = scan.findings
    .filter((f) => activeTool === 'all' || f.tool === activeTool)
    .filter((f) => activeSev === 'all' || f.severity === activeSev)

  return (
    <DashboardShell>
      <div className="flex flex-col md:flex-row w-full h-[calc(100vh-64px)] overflow-hidden relative">
        
        {/* --- MAIN CONTENT --- */}
        <div className="flex-1 min-w-0 overflow-y-auto px-4 md:px-8 py-6 md:py-10">
          <div className="max-w-[1000px] mx-auto w-full pb-20">
            <Link href="/dashboard" className="inline-flex items-center gap-1.5 font-mono text-xs mb-8 text-[var(--text-muted)] hover:opacity-80">
              ← back to dashboard
            </Link>
            <ScanSummaryBar scan={scan} activeSev={activeSev} onSevChange={setActiveSev} />
            
            {/* Tool Filter Tabs */}
            <div className="flex items-center gap-2 mb-6 pb-5 border-b border-[var(--border)]">
              {TOOLS.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setActiveTool(key)}
                  className="px-4 py-2 font-mono text-[11px] uppercase rounded-lg transition-all border"
                  style={activeTool === key 
                    ? { background: 'var(--accent-dim)', color: 'var(--accent)', borderColor: 'rgba(123,110,246,0.25)' }
                    : { background: 'transparent', color: 'var(--text-muted)', borderColor: 'var(--border)' }
                  }
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-3">
              {filtered.map((f) => <FindingCard key={f.id} finding={f} />)}
            </div>
          </div>
        </div>

        {/* --- RESIZER --- */}
        {!isCollapsed && (
          <div
            className={`flex-shrink-0 relative group z-10 transition-colors ${
              isMobile ? 'h-1.5 w-full cursor-row-resize' : 'w-1.5 h-full cursor-col-resize'
            } ${isDragging ? 'bg-[var(--accent)]' : 'bg-[var(--border)] hover:bg-[var(--accent)]'}`}
            onMouseDown={(e) => { e.preventDefault(); setIsDragging(true); }}
          />
        )}

        {/* --- AI SIDEBAR / DRAWER --- */}
        {!isCollapsed ? (
          <div
            style={isMobile ? { height: sidebarHeight } : { width: sidebarWidth }}
            className="flex-shrink-0 flex flex-col bg-[var(--bg1)] border-[var(--border)] shadow-xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 md:p-6 border-b border-[var(--border)]">
              <h3 className="font-bold text-sm text-[var(--text-primary)]">AI Security Analysis</h3>
              <button onClick={() => setIsCollapsed(true)} className="p-1 hover:bg-[var(--bg2)] rounded text-[var(--text-muted)]">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            {/* Scrollable Content Container */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-[var(--bg1)]">
              <div className="w-full h-full min-h-[300px] flex flex-col items-center justify-center border border-dashed border-[var(--border)] rounded-xl bg-[var(--bg2)] p-8 text-center">
                {aiStatus === 'idle' && (
                  <div className="max-w-[280px]">
                    <h4 className="text-sm font-bold mb-2">Ready for Analysis</h4>
                    <p className="text-xs text-[var(--text-secondary)] mb-6">Analyze {scan.findings.length} findings for instant fixes.</p>
                    <button onClick={handleGenerateSummary} className="w-full py-2.5 text-xs font-bold uppercase rounded-lg bg-[var(--accent)] text-white">
                      Generate AI Summary
                    </button>
                  </div>
                )}
                {aiStatus === 'loading' && <p className="animate-pulse text-xs font-mono">Analyzing codebase...</p>}
                {aiStatus === 'done' && <p className="text-sm italic text-[var(--text-muted)]">[AI results will appear here]</p>}
              </div>
            </div>
          </div>
        ) : (
          /* --- OPEN TRIGGER --- */
          <div className={`absolute z-20 ${isMobile ? 'bottom-0 left-1/2 -translate-x-1/2' : 'top-1/2 right-0 -translate-y-1/2'}`}>
            <button
              onClick={() => setIsCollapsed(false)}
              className={`flex items-center justify-center bg-[var(--bg1)] border-[var(--border)] shadow-md ${
                isMobile ? 'w-20 h-8 rounded-t-xl border-t' : 'w-8 h-20 rounded-l-xl border-l'
              }`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {isMobile ? <polyline points="18 15 12 9 6 15" /> : <polyline points="15 18 9 12 15 6" />}
              </svg>
            </button>
          </div>
        )}
      </div>
    </DashboardShell>
  )
}