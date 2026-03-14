'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { Repo } from '@/types'

type ScanStep = { id: number; label: string; status: 'pending' | 'running' | 'done' }

const STEPS = [
  { id: 0, label: 'Cloning repository' },
  { id: 1, label: 'Running Semgrep — static analysis' },
  { id: 2, label: 'Running Gitleaks — secret detection' },
  { id: 3, label: 'Running Trivy — vulnerability scan' },
  { id: 4, label: 'Aggregating findings' },
]

const STEP_DELAYS = [400, 900, 1800, 2700, 3500]
const STEP_PCTS = [18, 40, 62, 80, 95]

type Props = { repo: Repo | null; onClose: () => void }

export default function ScanModal({ repo, onClose }: Props) {
  const router = useRouter()
  const [steps, setSteps] = useState<ScanStep[]>(STEPS.map((s) => ({ ...s, status: 'pending' })))
  const [progress, setProgress] = useState(0)
  const [done, setDone] = useState(false)

  const isOpen = !!repo

  useEffect(() => {
    if (!repo) return
    setSteps(STEPS.map((s) => ({ ...s, status: 'pending' })))
    setProgress(0)
    setDone(false)

    const timers: ReturnType<typeof setTimeout>[] = []

    STEPS.forEach((step, idx) => {
      timers.push(
        setTimeout(() => {
          setSteps((prev) =>
            prev.map((s) => {
              if (s.id === step.id) return { ...s, status: 'running' }
              if (s.id === step.id - 1) return { ...s, status: 'done' }
              return s
            })
          )
          setProgress(STEP_PCTS[idx])
        }, STEP_DELAYS[idx])
      )
    })

    timers.push(
      setTimeout(() => {
        setSteps((prev) => prev.map((s) => ({ ...s, status: 'done' })))
        setProgress(100)
        setDone(true)
      }, 4400)
    )

    return () => timers.forEach(clearTimeout)
  }, [repo])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="animate-scale-in w-full max-w-lg mx-4 rounded-2xl p-10 relative"
        style={{ background: 'var(--bg1)', border: '1px solid var(--border)', boxShadow: '0 24px 48px rgba(0,0,0,0.12)' }}>

        {/* Close */}
        <button onClick={onClose}
          className="absolute top-5 right-5 w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-all"
          style={{ background: 'var(--bg2)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '' }}>
          ✕
        </button>

        <p className="font-mono text-[11px] tracking-widest uppercase mb-1.5" style={{ color: 'var(--text-muted)' }}>// initiating scan</p>
        <h2 className="text-2xl font-extrabold tracking-tight mb-6" style={{ color: 'var(--text-primary)' }}>{repo.name}</h2>

        {/* Meta grid */}
        <div className="grid grid-cols-2 gap-3 mb-7">
          {[
            { label: 'Branch', value: repo.defaultBranch },
            { label: 'Language', value: repo.language },
            { label: 'Last commit', value: repo.updatedAt },
            { label: 'Files', value: repo.fileCount.toString() },
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
              style={{ width: `${progress}%`, background: 'var(--accent)' }}>
              <span className="animate-shimmer absolute inset-y-0 w-1/2"
                style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)' }} />
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
                  : { background: 'var(--bg2)', border: '1px solid var(--border)', color: 'var(--text-muted)' }
              }>
              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] flex-shrink-0 ${step.status === 'running' ? 'animate-spin-step' : ''}`}
                style={
                  step.status === 'done'
                    ? { background: 'var(--green)', color: '#fff' }
                    : step.status === 'running'
                    ? { background: 'var(--accent)', color: '#fff' }
                    : { background: 'var(--bg3)', border: '1px solid var(--border)' }
                }>
                {step.status === 'done' ? '✓' : step.status === 'running' ? '↻' : ''}
              </span>
              {step.label}
            </div>
          ))}
        </div>

        {done && (
          <>
            <p className="font-mono text-xs text-center mb-4" style={{ color: 'var(--green)' }}>
              ✓ scan complete — 7 findings detected
            </p>
            <button
              onClick={() => router.push('/result/demo')}
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
