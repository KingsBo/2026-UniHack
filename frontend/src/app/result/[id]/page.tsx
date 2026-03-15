'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import ScanSummaryBar from '@/components/results/ScanSummaryBar'
import FindingCard from '@/components/results/FindingCard'
import DashboardShell from '@/components/layout/DashboardShell'
import type { ScanTool, ScanResult, Finding, Severity } from '@/types'

/* ---- Lightweight markdown renderer for AI summary ---- */
function AiMarkdown({ content }: { content: string }) {
  const lines = content.split('\n')
  const elements: React.ReactNode[] = []
  let inCode = false
  let codeLines: string[] = []
  let codeLang = ''

  const renderInline = (text: string, key: string): React.ReactNode => {
    // Handle bold, inline code, and links
    const parts: React.ReactNode[] = []
    const regex = /(\*\*(.+?)\*\*|`([^`]+)`|\[([^\]]+)\]\(([^)]+)\))/g
    let lastIdx = 0
    let match: RegExpExecArray | null

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIdx) {
        parts.push(text.slice(lastIdx, match.index))
      }
      if (match[2]) {
        parts.push(<strong key={`${key}-b-${match.index}`} className="font-semibold" style={{ color: 'var(--text-primary)' }}>{match[2]}</strong>)
      } else if (match[3]) {
        parts.push(<code key={`${key}-c-${match.index}`} className="px-1.5 py-0.5 rounded text-[11px] font-mono" style={{ background: 'var(--bg0)', color: 'var(--green)', border: '1px solid var(--border)' }}>{match[3]}</code>)
      } else if (match[4] && match[5]) {
        parts.push(<a key={`${key}-a-${match.index}`} href={match[5]} target="_blank" rel="noopener noreferrer" className="underline" style={{ color: 'var(--accent)' }}>{match[4]}</a>)
      }
      lastIdx = match.index + match[0].length
    }
    if (lastIdx < text.length) parts.push(text.slice(lastIdx))
    return parts.length > 0 ? parts : text
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Code fence
    if (line.startsWith('```')) {
      if (!inCode) {
        inCode = true
        codeLang = line.slice(3).trim()
        codeLines = []
      } else {
        elements.push(
          <div key={`code-${i}`} className="my-3 rounded-lg overflow-hidden" style={{ background: 'var(--bg0)', border: '1px solid var(--border)' }}>
            {codeLang && <div className="px-3 py-1 text-[10px] font-mono uppercase" style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>{codeLang}</div>}
            <pre className="px-4 py-3 overflow-x-auto"><code className="text-xs font-mono" style={{ color: 'var(--green)' }}>{codeLines.join('\n')}</code></pre>
          </div>
        )
        inCode = false
        codeLines = []
        codeLang = ''
      }
      continue
    }

    if (inCode) {
      codeLines.push(line)
      continue
    }

    // Headings — detect severity names in any heading level for color coding
    const sevColors: Record<string, string> = { CRITICAL: '#F25C5C', HIGH: '#F58025', MEDIUM: '#F5A623', LOW: '#2DD98F', INFO: '#7B6EF6' }
    const headingMatch = line.match(/^(#{1,3})\s+(.*)/)
    if (headingMatch) {
      const level = headingMatch[1].length
      const headingText = headingMatch[2]
      const sevKey = Object.keys(sevColors).find((s) => headingText.toUpperCase().includes(s))

      if (sevKey || level === 2) {
        // Severity heading or ## heading — styled with color dot
        elements.push(
          <h3 key={i} className="text-sm font-bold mt-6 mb-3 pb-2 flex items-center gap-2" style={{ borderBottom: '1px solid var(--border)', color: sevKey ? sevColors[sevKey] : 'var(--text-primary)' }}>
            {sevKey && <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: sevColors[sevKey] }} />}
            {renderInline(headingText, `h3-${i}`)}
          </h3>
        )
      } else if (level === 1) {
        elements.push(<h2 key={i} className="text-base font-extrabold mt-4 mb-3" style={{ color: 'var(--text-primary)' }}>{renderInline(headingText, `h2-${i}`)}</h2>)
      } else {
        elements.push(<h4 key={i} className="text-xs font-bold uppercase tracking-wide mt-5 mb-2" style={{ color: 'var(--text-secondary)' }}>{renderInline(headingText, `h4-${i}`)}</h4>)
      }
    }
    // Bullet list items
    else if (line.match(/^[-*]\s/)) {
      elements.push(
        <div key={i} className="flex gap-2 mb-1.5 ml-1">
          <span className="mt-1.5 w-1 h-1 rounded-full flex-shrink-0" style={{ background: 'var(--text-muted)' }} />
          <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{renderInline(line.slice(2), `li-${i}`)}</p>
        </div>
      )
    }
    // Empty line
    else if (line.trim() === '') {
      elements.push(<div key={i} className="h-2" />)
    }
    // Regular paragraph
    else {
      elements.push(<p key={i} className="text-xs leading-relaxed mb-2" style={{ color: 'var(--text-secondary)' }}>{renderInline(line, `p-${i}`)}</p>)
    }
  }

  return <div className="space-y-0">{elements}</div>
}

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
  const [aiSummary, setAiSummary] = useState('')

  useEffect(() => {
    fetch(`/api/scan/${scanId}`)
      .then((res) => {
        if (!res.ok) throw new Error('Scan not found')
        return res.json()
      })
      .then((data) => {
        const result = data as ScanResult
        setScan(result)
        // Auto-load saved AI summary if it exists
        if (result.aiSummary) {
          setAiSummary(result.aiSummary)
          setAiStatus('done')
        }
      })
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

  const handleGenerateSummary = async () => {
    if (!scan) return
    setAiStatus('loading')
    setAiSummary('')

    try {
      const res = await fetch(`/api/scan/${scanId}/summary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ findings: scan.findings, repoName: scan.repoName }),
      })

      if (!res.ok) {
        const err = await res.json()
        setAiSummary(err.error || 'Failed to generate summary.')
        setAiStatus('done')
        return
      }

      const reader = res.body?.getReader()
      if (!reader) { setAiStatus('done'); return }

      const decoder = new TextDecoder()
      let text = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        text += decoder.decode(value, { stream: true })
        setAiSummary(text)
      }
      setAiStatus('done')

      // Save the generated summary to the database
      if (text) {
        fetch(`/api/scan/${scanId}/summary`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ summary: text }),
        }).catch((err) => console.error('Failed to save AI summary:', err))
      }
    } catch {
      setAiSummary('An error occurred while generating the summary.')
      setAiStatus('done')
    }
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
              <div className="flex items-center gap-2.5">
                <img src="/kestix.png" alt="KestixAI" className="w-16 h-16 object-contain" />
                <h3 className="font-bold text-sm text-[var(--text-primary)]">KestixAI</h3>
              </div>
              <button onClick={() => setIsCollapsed(true)} className="p-1 hover:bg-[var(--bg2)] rounded text-[var(--text-muted)]">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            {/* Scrollable Content Container */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-[var(--bg1)]">
              {aiStatus === 'idle' && (
                <div className="w-full h-full min-h-[300px] flex flex-col items-center justify-center border border-dashed border-[var(--border)] rounded-xl bg-[var(--bg2)] p-8 text-center">
                  <div className="max-w-[280px]">
                    <img src="/kestix.png" alt="KestixAI" className="w-40 h-40 object-contain mx-auto mb-4 opacity-80" />
                    <h4 className="text-sm font-bold mb-2">Ready for Analysis</h4>
                    <p className="text-xs text-[var(--text-secondary)] mb-6">Let KestixAI analyze {scan.findings.length} findings for instant fixes.</p>
                    <button onClick={handleGenerateSummary} className="w-full py-2.5 text-xs font-bold uppercase rounded-lg bg-[var(--accent)] text-white">
                      Ask KestixAI
                    </button>
                  </div>
                </div>
              )}
              {aiStatus === 'loading' && !aiSummary && (
                <div className="w-full h-full min-h-[300px] flex flex-col items-center justify-center">
                  <div className="flex items-center gap-3">
                    <svg className="animate-spin h-4 w-4" style={{ color: 'var(--accent)' }} viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <p className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>KestixAI is analyzing...</p>
                  </div>
                </div>
              )}
              {aiSummary && (
                <div className="ai-summary-content">
                  <AiMarkdown content={aiSummary} />
                  {aiStatus === 'loading' && (
                    <span className="inline-block w-1.5 h-4 ml-0.5 animate-pulse rounded-sm" style={{ background: 'var(--accent)' }} />
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* --- OPEN TRIGGER --- */
          <div className={`absolute z-20 ${isMobile ? 'bottom-0 left-1/2 -translate-x-1/2' : 'top-1/2 right-0 -translate-y-1/2'}`}>
            <button
              onClick={() => setIsCollapsed(false)}
              className={`flex items-center justify-center bg-[var(--bg1)] border-[var(--border)] shadow-md ${
                isMobile ? 'w-20 h-8 rounded-t-xl border-t' : 'w-10 h-20 rounded-l-xl border-l'
              }`}
              title="Open KestixAI"
            >
              <img src="/kestix.png" alt="KestixAI" className="w-12 h-12 object-contain" />
            </button>
          </div>
        )}
      </div>
    </DashboardShell>
  )
}