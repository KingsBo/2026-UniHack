'use client'

import { useState, useEffect } from 'react'
import { MOCK_REPOS } from '@/lib/mock-data'
import type { Repo } from '@/types'

/**
 * Returns the user's GitHub repos.
 * Currently returns mock data — swap the comment blocks when the backend is ready.
 */
export function useGitHubRepos() {
  const [repos, setRepos] = useState<Repo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        // --- Real implementation (uncomment when backend ready) ---
        // const data = await api.get<Repo[]>('/repos')
        // setRepos(data)

        // --- Mock ---
        await new Promise((r) => setTimeout(r, 400))
        setRepos(MOCK_REPOS)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load repos')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return { repos, loading, error }
}
