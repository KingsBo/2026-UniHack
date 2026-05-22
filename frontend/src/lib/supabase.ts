import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY || ''

let _supabase: SupabaseClient | null = null

export function getSupabase(): SupabaseClient | null {
  if (!supabaseUrl || !supabaseSecretKey) return null
  if (!_supabase) {
    _supabase = createClient(supabaseUrl, supabaseSecretKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  }
  return _supabase
}

export const supabase = {
  from: (table: string) => {
    const client = getSupabase()
    if (!client) throw new Error('Supabase not configured')
    return client.from(table)
  },
}

export async function getOrCreateUser(
  githubId: number,
  githubUsername: string,
  email?: string | null,
  avatarUrl?: string | null,
) {
  const { data, error } = await supabase
    .from('users')
    .upsert(
      {
        github_id: githubId,
        github_username: githubUsername,
        email: email || null,
        avatar_url: avatarUrl || null,
      },
      { onConflict: 'github_id' },
    )
    .select()
    .single()

  if (error) throw new Error(`Failed to upsert user: ${error.message}`)
  return data
}

export async function getUserByGithubId(githubId: number) {
  const { data, error } = await supabase
    .from('users')
    .select()
    .eq('github_id', githubId)
    .single()

  if (error) return null
  return data
}

export async function getOrCreateRepo(
  userId: string,
  repo: {
    github_repo_id: number
    name: string
    full_name: string
    url: string
    default_branch: string
    is_private: boolean
    language?: string | null
  },
) {
  const { data, error } = await supabase
    .from('repositories')
    .upsert(
      { user_id: userId, ...repo },
      { onConflict: 'user_id,github_repo_id' },
    )
    .select()
    .single()

  if (error) throw new Error(`Failed to upsert repo: ${error.message}`)
  return data
}
