'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { Repo, ScanResponse } from '@/types'

type StepStatus = 'pending' | 'running' | 'done' | 'failed'
type ScanStep = { id: number; label: string; status: StepStatus }

const INITIAL_STEPS: Omit<ScanStep, 'status'>[] = [
  { id: 0, label: 'Cloning repository' },
  { id: 1, label: 'Running Gitleaks — secret detection' },
  { id: 2, label: 'Running Trivy — vulnerability scan' },
  { id: 3, label: 'Aggregating findings' },
]

type Props = { repo: Repo | null; onClose: () => void }

export default function ScanModal({ repo, onClose }: Props) {
  const router = useRouter()
  const [steps, setSteps] = useState<ScanStep[]>([])
  const [progress, setProgress] = useState(0)
  const [done, setDone] = useState(false)
  const [scanError, setScanError] = useState<string | null>(null)
  const [scanResult, setScanResult] = useState<(ScanResponse & { scanId?: string }) | null>(null)

  const isOpen = !!repo

  useEffect(() => {
    if (!repo) return

    setSteps(
      INITIAL_STEPS.map((s) => ({
        ...s,
        status: s.id === 0 ? 'running' : 'pending',
      })),
    )
    setProgress(15)
    setDone(false)
    setScanError(null)
    setScanResult(null)

    const run = async () => {
      try {
        // Simulate clone finishing quickly
        setTimeout(() => {
          setSteps((prev) =>
            prev.map((step) =>
              step.id === 0 ? { ...step, status: 'done' } : step,
            ),
          )
          setProgress(30)
        }, 400)

        // Animate scanner steps while waiting
        setTimeout(() => {
          setSteps((prev) =>
            prev.map((step) =>
              step.id === 1 || step.id === 2 ? { ...step, status: 'running' } : step,
            ),
          )
          setProgress(50)
        }, 600)

        const res = await fetch('/api/scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            owner: repo.owner,
            repo: repo.name,
            repoId: Number(repo.id) || 0,
            repoFullName: repo.full_name,
            defaultBranch: repo.defaultBranch,
            isPrivate: repo.visibility === 'private',
            language: repo.language,
          }),
        })

        const data = (await res.json()) as ScanResponse & { scanId?: string }

        // Update gitleaks step
        setSteps((prev) =>
          prev.map((step) =>
            step.id === 1
              ? { ...step, status: data.errors.gitleaks ? 'failed' : 'done' }
              : step,
          ),
        )

        // Update trivy step
        setSteps((prev) =>
          prev.map((step) =>
            step.id === 2
              ? { ...step, status: data.errors.trivy ? 'failed' : 'done' }
              : step,
          ),
        )

        setScanResult(data)

        // Aggregating
        setSteps((prev) =>
          prev.map((step) =>
            step.id === 3 ? { ...step, status: 'done' } : step,
          ),
        )
        setProgress(100)
        setDone(true)
      } catch (e) {
        setScanError(e instanceof Error ? e.message : 'Scan failed')
        setSteps((prev) =>
          prev.map((step) =>
            step.status === 'running' ? { ...step, status: 'failed' } : step,
          ),
        )
      }
    }

    void run()
  }, [repo])

  const handleViewReport = () => {
    if (!scanResult || !repo) return
    if (scanResult.scanId) {
      router.push(`/result/${scanResult.scanId}`)
    } else {
      // Fallback: store in sessionStorage if DB persistence failed
      const scanId = `scan-${Date.now()}`
      sessionStorage.setItem(scanId, JSON.stringify({ ...scanResult, repoName: repo.full_name }))
      router.push(`/result/${scanId}`)
    }
  }

  if (!isOpen) return null

  const totalFindings = scanResult
    ? (scanResult.gitleaks?.summary.total ?? 0) + (scanResult.trivy?.summary.total ?? 0)
    : 0

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="animate-scale-in w-full max-w-lg mx-4 rounded-2xl p-10 relative"
        style={{ background: 'var(--bg1)', border: '1px solid var(--border)', boxShadow: '0 24px 48px rgba(0,0,0,0.12)' }}>

        <button onClick={onClose}
          className="absolute top-5 right-5 w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-all"
          style={{ background: 'var(--bg2)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '' }}>
          ✕
        </button>

        <p className="font-mono text-[11px] tracking-widest uppercase mb-1.5" style={{ color: 'var(--text-muted)' }}>// initiating scan</p>
        <h2 className="text-2xl font-extrabold tracking-tight mb-6" style={{ color: 'var(--text-primary)' }}>{repo.name}</h2>

        <div className="grid grid-cols-2 gap-3 mb-7">
          {[
            { label: 'Branch', value: repo.defaultBranch },
            { label: 'Language', value: repo.language || '—' },
            { label: 'Last commit', value: repo.updatedAt },
            { label: 'Visibility', value: repo.visibility },
          ].map(({ label, value }) => (
            <div key={label} className="px-3.5 py-3 rounded-lg" style={{ background: 'var(--bg2)', border: '1px solid var(--border)' }}>
              <p className="font-mono text-[10px] tracking-widest uppercase mb-1" style={{ color: 'var(--text-muted)' }}>{label}</p>
              <p className="font-mono text-sm" style={{ color: 'var(--text-primary)' }}>{value}</p>
            </div>
          ))}
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2.5">
            <span className="font-mono text-[11px]" style={{ color: 'var(--text-muted)' }}>Overall progress</span>
            <span className="font-mono text-[11px] font-medium" style={{ color: 'var(--accent)' }}>{progress}%</span>
          </div>
          <div className="h-[3px] rounded-full overflow-hidden" style={{ background: 'var(--bg3)' }}>
            <div className="h-full rounded-full relative overflow-hidden transition-all duration-500 ease-out"
              style={{ width: `${progress}%`, background: scanError ? '#ef4444' : 'var(--accent)' }}>
              {!scanError && (
                <span className="animate-shimmer absolute inset-y-0 w-1/2"
                  style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)' }} />
              )}
            </div>
          </div>
        </div>

        {/* Steps */}
        <div className="flex flex-col gap-2 mb-6">
          {steps.map((step) => (
            <div key={step.id}
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg font-mono text-xs transition-all duration-300"
              style={
                step.status === 'done'
                  ? { background: 'var(--green-dim)', border: '1px solid rgba(45,217,143,0.2)', color: 'var(--green)' }
                  : step.status === 'running'
                  ? { background: 'var(--accent-dim)', border: '1px solid rgba(123,110,246,0.25)', color: 'var(--text-primary)' }
                  : step.status === 'failed'
                  ? { background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444' }
                  : { background: 'var(--bg2)', border: '1px solid var(--border)', color: 'var(--text-muted)' }
              }>
              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] flex-shrink-0 ${step.status === 'running' ? 'animate-spin-step' : ''}`}
                style={
                  step.status === 'done'
                    ? { background: 'var(--green)', color: '#fff' }
                    : step.status === 'running'
                    ? { background: 'var(--accent)', color: '#fff' }
                    : step.status === 'failed'
                    ? { background: '#ef4444', color: '#fff' }
                    : { background: 'var(--bg3)', border: '1px solid var(--border)' }
                }>
                {step.status === 'done' ? '✓' : step.status === 'running' ? '↻' : step.status === 'failed' ? '✕' : ''}
              </span>
              {step.label}
            </div>
          ))}
        </div>

        {scanError && (
          <p className="font-mono text-xs text-center mb-4" style={{ color: '#ef4444' }}>
            ✕ {scanError}
          </p>
        )}

        {done && (
          <>
            <p className="font-mono text-xs text-center mb-4" style={{ color: 'var(--green)' }}>
              ✓ scan complete — {totalFindings} finding{totalFindings !== 1 ? 's' : ''} detected
            </p>
            <button
              onClick={handleViewReport}
              className="w-full py-3.5 text-sm font-semibold tracking-wide text-white rounded-lg transition-all hover:-translate-y-px"
              style={{ background: 'var(--accent)' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 20px rgba(123,110,246,0.35)' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}>
              View full report →
            </button>
          </>
        )}
      </div>
    </div>
  )
}
