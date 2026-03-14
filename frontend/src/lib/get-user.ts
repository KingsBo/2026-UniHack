import { cookies } from 'next/headers'
import { getUserByGithubId, getSupabase } from './supabase'

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

  return null
}
