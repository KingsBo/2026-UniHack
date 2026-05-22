import { cookies } from 'next/headers'
import { getOrCreateUser, getUserByGithubId, getSupabase } from './supabase'

type GitHubUserProfile = {
  id: number
  login: string
  email?: string | null
  avatar_url?: string | null
}

async function fetchGitHubUser(token: string): Promise<GitHubUserProfile | null> {
  const res = await fetch('https://api.github.com/user', {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!res.ok) return null
  return res.json()
}

export async function getAuthenticatedUser() {
  const cookieStore = await cookies()
  const token = cookieStore.get('github_token')?.value
  const githubUserId = cookieStore.get('github_user_id')?.value

  if (!token) return null
  if (!getSupabase()) return null

  if (githubUserId) {
    const user = await getUserByGithubId(Number(githubUserId))
    if (user) return { ...user, token }
  }

  try {
    const githubUser = await fetchGitHubUser(token)
    if (!githubUser) return null

    const user = await getOrCreateUser(
      githubUser.id,
      githubUser.login,
      githubUser.email,
      githubUser.avatar_url,
    )

    return { ...user, token }
  } catch (error) {
    console.error('Failed to resolve authenticated user:', error)
  }

  return null
}
