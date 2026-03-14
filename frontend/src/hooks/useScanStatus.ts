'use client'

import { useState, useEffect, useRef } from 'react'
import type { ScanResult } from '@/types'

type PollOptions = {
  scanId: string | null
  intervalMs?: number
  onComplete?: (result: ScanResult) => void
}

/**
 * Polls the scan status endpoint until the scan is complete or failed.
 * Currently a stub — swap the comment blocks when the backend is ready.
 */
export function useScanStatus({ scanId, intervalMs = 2000, onComplete }: PollOptions) {
  const [status, setStatus] = useState<ScanResult['status'] | null>(null)
  const [result, setResult] = useState<ScanResult | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!scanId) return

    const poll = async () => {
      try {
        // --- Real implementation ---
        // const data = await api.get<ScanResult>(`/scans/${scanId}`)
        // setStatus(data.status)
        // if (data.status === 'complete' || data.status === 'failed') {
        //   setResult(data)
        //   onComplete?.(data)
        //   if (intervalRef.current) clearInterval(intervalRef.current)
        // }
      } catch (e) {
        console.error('Poll error:', e)
      }
    }

    poll()
    intervalRef.current = setInterval(poll, intervalMs)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [scanId, intervalMs, onComplete])

  return { status, result }
}
