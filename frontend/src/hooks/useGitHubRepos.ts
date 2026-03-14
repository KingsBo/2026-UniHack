'use client'

import { useState, useEffect } from 'react'
import type { Repo, GitHubRepo } from '@/types'

const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: '#3178C6',
  JavaScript: '#F7DF1E',
  Python: '#3572A5',
  Go: '#00ADD8',
  Rust: '#DEA584',
  Java: '#B07219',
  Ruby: '#701516',
  C: '#555555',
  'C++': '#F34B7D',
  'C#': '#178600',
  PHP: '#4F5D95',
  Swift: '#F05138',
  Kotlin: '#A97BFF',
  HCL: '#844FBA',
  Shell: '#89E051',
}

function mapToRepo(gh: GitHubRepo): Repo {
  return {
    id: gh.full_name,
    name: gh.name,
    full_name: gh.full_name,
    owner: gh.owner,
    description: gh.description ?? '',
    language: gh.language ?? '',
    languageColor: LANGUAGE_COLORS[gh.language ?? ''] ?? '#6B6B7B',
    visibility: gh.private ? 'private' : 'public',
    updatedAt: formatRelativeDate(gh.updated_at),
    defaultBranch: gh.default_branch,
    fileCount: 0,
  }
}

function formatRelativeDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return `${Math.floor(days / 30)}mo ago`
}

export function useGitHubRepos() {
  const [repos, setRepos] = useState<Repo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [needsGitHub, setNeedsGitHub] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/auth/repos')

        if (res.status === 401) {
          setNeedsGitHub(true)
          return
        }

        if (!res.ok) {
          throw new Error('Failed to load repositories')
        }

        const data = await res.json()
        setRepos((data.repos as GitHubRepo[]).map(mapToRepo))
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load repos')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return { repos, loading, error, needsGitHub }
}
