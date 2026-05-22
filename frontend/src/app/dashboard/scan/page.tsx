'use client'

import { useState, useEffect, useCallback, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useScan } from '@/context/ScanContext'
import type { ScanResponse } from '@/types'

type StepStatus = 'pending' | 'running' | 'done' | 'failed'
type ScanStep = { id: number; label: string; status: StepStatus }

const INITIAL_STEPS: Omit<ScanStep, 'status'>[] = [
  { id: 0, label: 'Cloning repository' },
  { id: 1, label: 'Running Gitleaks — secret detection' },
  { id: 2, label: 'Running Trivy — vulnerability scan' },
  { id: 3, label: 'Aggregating findings' },
]

export default function ScanPage() {
  return (
    <Suspense fallback={
      <div className="px-4 md:px-12 py-6 md:py-10 max-w-2xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-4 w-32 rounded" style={{ background: 'var(--bg2)' }} />
          <div className="h-8 w-64 rounded" style={{ background: 'var(--bg2)' }} />
          <div className="h-3 w-48 rounded" style={{ background: 'var(--bg2)' }} />
        </div>
      </div>
    }>
      <ScanPageContent />
    </Suspense>
  )
}

function ScanPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isScanning, startScan, endScan } = useScan()
  const hasStarted = useRef(false)

  const repoName = searchParams.get('repo') || ''
  const owner = searchParams.get('owner') || ''
  const branch = searchParams.get('branch') || 'main'
  const language = searchParams.get('language') || ''
  const visibility = searchParams.get('visibility') || 'public'
  const repoId = searchParams.get('repoId') || ''
  const fullName = searchParams.get('fullName') || `${owner}/${repoName}`

  const [steps, setSteps] = useState<ScanStep[]>(
    INITIAL_STEPS.map((s) => ({ ...s, status: 'pending' })),
  )
  const [progress, setProgress] = useState(0)
  const [done, setDone] = useState(false)
  const [scanError, setScanError] = useState<string | null>(null)
  const [scanId, setScanId] = useState<string | null>(null)
  const [totalFindings, setTotalFindings] = useState(0)

  const updateStep = useCallback((stepId: number, status: StepStatus) => {
    setSteps((prev) =>
      prev.map((step) => (step.id === stepId ? { ...step, status } : step)),
    )
  }, [])

  useEffect(() => {
    if (!repoName || !owner || hasStarted.current) return
    hasStarted.current = true

    startScan(fullName)

    // Start: cloning
    updateStep(0, 'running')
    setProgress(10)

    const run = async () => {
      try {
        // Simulate clone step
        await new Promise((r) => setTimeout(r, 400))
        updateStep(0, 'done')
        setProgress(20)

        // Step 1: Gitleaks
        updateStep(1, 'running')
        setProgress(30)

        let gitleaksData = null
        let gitleaksError: string | null = null
        try {
          const glRes = await fetch('/api/scan/gitleaks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ owner, repo: repoName }),
          })
          if (glRes.ok) {
            gitleaksData = await glRes.json()
            updateStep(1, 'done')
          } else {
            const errData = await glRes.json().catch(() => ({ error: 'Gitleaks failed' }))
            gitleaksError = errData.error || 'Gitleaks failed'
            updateStep(1, 'failed')
          }
        } catch (e) {
          gitleaksError = e instanceof Error ? e.message : 'Gitleaks failed'
          updateStep(1, 'failed')
        }
        setProgress(55)

        // Step 2: Trivy
        updateStep(2, 'running')
        setProgress(60)

        let trivyData = null
        let trivyError: string | null = null
        try {
          const trRes = await fetch('/api/scan/trivy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ owner, repo: repoName }),
          })
          if (trRes.ok) {
            trivyData = await trRes.json()
            updateStep(2, 'done')
          } else {
            const errData = await trRes.json().catch(() => ({ error: 'Trivy failed' }))
            trivyError = errData.error || 'Trivy failed'
            updateStep(2, 'failed')
          }
        } catch (e) {
          trivyError = e instanceof Error ? e.message : 'Trivy failed'
          updateStep(2, 'failed')
        }
        setProgress(80)

        // Both failed → overall error
        if (gitleaksError && trivyError) {
          throw new Error('All scanners failed')
        }

        // Step 3: Aggregating — persist to DB via main scan route
        updateStep(3, 'running')
        setProgress(85)

        const persistRes = await fetch('/api/scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            owner,
            repo: repoName,
            repoId: repoId ? Number(repoId) : 0,
            repoFullName: fullName,
            defaultBranch: branch,
            isPrivate: visibility === 'private',
            language,
          }),
        })

        if (!persistRes.ok) {
          const errData = await persistRes.json().catch(() => ({ error: 'Scan failed' }))
          if (persistRes.status === 429) {
            throw new Error(errData.error || 'Scan limit reached')
          }
          throw new Error(errData.error || 'Scan failed')
        }

        const data = (await persistRes.json()) as ScanResponse & { scanId?: string }
        updateStep(3, 'done')
        setProgress(100)

        const findings =
          (gitleaksData?.summary?.total ?? data.gitleaks?.summary?.total ?? 0) +
          (trivyData?.summary?.total ?? data.trivy?.summary?.total ?? 0)
        setTotalFindings(findings)

        if (data.scanId) {
          setScanId(data.scanId)
        }

        setDone(true)
        endScan()
      } catch (e) {
        setScanError(e instanceof Error ? e.message : 'Scan failed')
        setSteps((prev) =>
          prev.map((step) =>
            step.status === 'running' ? { ...step, status: 'failed' } : step,
          ),
        )
        endScan()
      }
    }

    void run()
  }, [repoName, owner, branch, language, visibility, repoId, fullName, startScan, endScan, updateStep])

  const handleViewReport = () => {
    if (scanId) {
      router.push(`/result/${scanId}`)
    }
  }

  const handleBack = () => {
    if (!done && !scanError) {
      // Scan still running — confirm
      if (!confirm('A scan is still in progress. Are you sure you want to leave?')) return
      endScan()
    }
    router.push('/dashboard')
  }

  return (
    <div className="px-4 md:px-12 py-6 md:py-10 max-w-2xl mx-auto animate-fade-in-up">
      {/* Back */}
      <button
        onClick={handleBack}
        className="flex items-center gap-2 font-mono text-xs mb-8 transition-all"
        style={{ color: 'var(--text-muted)' }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)' }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)' }}
      >
        ← Back to repositories
      </button>

      {/* Header */}
      <div className="mb-8">
        <p className="font-mono text-[11px] tracking-widest uppercase mb-1.5" style={{ color: 'var(--text-muted)' }}>// security scan</p>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-2" style={{ color: 'var(--text-primary)' }}>
          {repoName || 'Scanning...'}
        </h1>
        <p className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
          {fullName}
        </p>
      </div>

      {/* Repo metadata */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[
          { label: 'Branch', value: branch },
          { label: 'Language', value: language || '—' },
          { label: 'Visibility', value: visibility },
          { label: 'Status', value: done ? 'Complete' : scanError ? 'Error' : 'Running' },
        ].map(({ label, value }) => (
          <div key={label} className="px-3.5 py-3 rounded-lg" style={{ background: 'var(--bg2)', border: '1px solid var(--border)' }}>
            <p className="font-mono text-[10px] tracking-widest uppercase mb-1" style={{ color: 'var(--text-muted)' }}>{label}</p>
            <p className="font-mono text-sm" style={{ color: 'var(--text-primary)' }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2.5">
          <span className="font-mono text-[11px]" style={{ color: 'var(--text-muted)' }}>Overall progress</span>
          <span className="font-mono text-[11px] font-medium" style={{ color: 'var(--accent)' }}>{progress}%</span>
        </div>
        <div className="h-[3px] rounded-full overflow-hidden" style={{ background: 'var(--bg3)' }}>
          <div
            className="h-full rounded-full relative overflow-hidden transition-all duration-700 ease-out"
            style={{ width: `${progress}%`, background: scanError ? '#ef4444' : 'var(--accent)' }}
          >
            {!scanError && !done && (
              <span
                className="animate-shimmer absolute inset-y-0 w-1/2"
                style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)' }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Steps */}
      <div className="flex flex-col gap-2.5 mb-8">
        {steps.map((step) => (
          <div
            key={step.id}
            className="flex items-center gap-3 px-4 py-3.5 rounded-xl font-mono text-xs transition-all duration-300"
            style={
              step.status === 'done'
                ? { background: 'var(--green-dim)', border: '1px solid rgba(45,217,143,0.2)', color: 'var(--green)' }
                : step.status === 'running'
                ? { background: 'var(--accent-dim)', border: '1px solid rgba(123,110,246,0.25)', color: 'var(--text-primary)' }
                : step.status === 'failed'
                ? { background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444' }
                : { background: 'var(--bg2)', border: '1px solid var(--border)', color: 'var(--text-muted)' }
            }
          >
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] flex-shrink-0 ${step.status === 'running' ? 'animate-spin-step' : ''}`}
              style={
                step.status === 'done'
                  ? { background: 'var(--green)', color: '#fff' }
                  : step.status === 'running'
                  ? { background: 'var(--accent)', color: '#fff' }
                  : step.status === 'failed'
                  ? { background: '#ef4444', color: '#fff' }
                  : { background: 'var(--bg3)', border: '1px solid var(--border)' }
              }
            >
              {step.status === 'done' ? '✓' : step.status === 'running' ? '↻' : step.status === 'failed' ? '✕' : ''}
            </span>
            <span className="font-medium">{step.label}</span>
          </div>
        ))}
      </div>

      {/* Error */}
      {scanError && (
        <div className="rounded-xl px-5 py-4 mb-6 font-mono text-xs" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444' }}>
          ✕ {scanError}
        </div>
      )}

      {/* Complete */}
      {done && (
        <div className="space-y-4">
          <div className="rounded-xl px-5 py-4 font-mono text-xs text-center" style={{ background: 'var(--green-dim)', border: '1px solid rgba(45,217,143,0.2)', color: 'var(--green)' }}>
            ✓ Scan complete — {totalFindings} finding{totalFindings !== 1 ? 's' : ''} detected
          </div>
          {scanId && (
            <button
              onClick={handleViewReport}
              className="w-full py-4 text-sm font-semibold tracking-wide text-white rounded-xl transition-all hover:-translate-y-px"
              style={{ background: 'var(--accent)' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 20px rgba(123,110,246,0.35)' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}
            >
              View full report →
            </button>
          )}
        </div>
      )}
    </div>
  )
}
