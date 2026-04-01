import { useQuery } from '@tanstack/react-query'
import supabase from '../lib/supabase'
import type { AppUser } from '../types'

async function searchUsers(query: string): Promise<AppUser[]> {
  if (query.length < 2) return []

  // Strip PostgREST filter-syntax characters to prevent filter injection
  const safe = query.replace(/[(),.'":]/g, '')
  if (safe.length < 2) return []

  const { data, error } = await supabase
    .from('users')
    .select('id, email, username, fullname, avatar_url')
    .or(`username.ilike.%${safe}%,fullname.ilike.%${safe}%`)
    .limit(20)

  if (error) throw error
  return data ?? []
}

export function useSearchUsers(query: string) {
  return useQuery({
    queryKey: ['searchUsers', query],
    queryFn: () => searchUsers(query),
    enabled: query.length >= 2,
    staleTime: 10_000,
  })
}
