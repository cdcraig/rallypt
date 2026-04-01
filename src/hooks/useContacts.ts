import { useQuery } from '@tanstack/react-query'
import supabase from '../lib/supabase'
import type { AppUser } from '../types'
import { useAuth } from './useAuth'

async function searchUsers(query: string, currentUserId: string): Promise<AppUser[]> {
  if (query.length < 2) return []

  const { data, error } = await supabase
    .from('users')
    .select('id, email, username, fullname, avatar_url')
    .neq('id', currentUserId)
    .or(`fullname.ilike.%${query}%,username.ilike.%${query}%`)
    .limit(20)

  if (error) throw error
  return data ?? []
}

export function useContacts(query: string) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['contacts', query],
    queryFn: () => searchUsers(query, user!.id),
    enabled: !!user && query.length >= 2,
    staleTime: 30_000,
  })
}
