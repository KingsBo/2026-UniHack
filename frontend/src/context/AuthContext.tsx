'use client'

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'

interface AuthState {
  ghUser: string | null
  avatarUrl: string | null
  repoCount: number | null
  loading: boolean
  refresh: () => void
}

const AuthContext = createContext<AuthState>({
  ghUser: null,
  avatarUrl: null,
  repoCount: null,
  loading: true,
  refresh: () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ghUser, setGhUser] = useState<string | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [repoCount, setRepoCount] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [meRes, reposRes] = await Promise.all([
        fetch('/api/auth/me'),
        fetch('/api/auth/repos'),
      ])
      if (meRes.ok) {
        const me = await meRes.json()
        setGhUser(me.login || null)
        setAvatarUrl(me.avatar_url || null)
      } else {
        setGhUser(null)
        setAvatarUrl(null)
      }
      if (reposRes.ok) {
        const data = await reposRes.json()
        setRepoCount(data.repos?.length ?? 0)
      } else {
        setRepoCount(null)
      }
    } catch {
      setGhUser(null)
      setAvatarUrl(null)
      setRepoCount(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <AuthContext.Provider value={{ ghUser, avatarUrl, repoCount, loading, refresh: load }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}

