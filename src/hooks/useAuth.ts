import { useQuery } from '@tanstack/react-query'
import supabase from '../lib/supabase'
import type { AppUser } from '../types'

async function getCurrentUser(): Promise<AppUser | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('users')
    .select('id, email, username, fullname, avatar_url')
    .eq('id', user.id)
    .single()

  return data
}

export function useAuth() {
  const { data: user, isLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: getCurrentUser,
    staleTime: Infinity,
  })

  return { user: user ?? null, isLoading }
}
