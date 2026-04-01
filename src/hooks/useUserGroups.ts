import { useQuery } from '@tanstack/react-query'
import supabase from '../lib/supabase'
import type { Group } from '../types'

// Returns groups the authenticated user belongs to.
// RLS filters automatically — no explicit user_id filter needed.
async function fetchUserGroups(): Promise<Group[]> {
  const { data, error } = await supabase
    .from('groups')
    .select('id, name, icon:icon_url, created_by, department_id, created_at')
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data as unknown) as Group[]
}

export function useUserGroups() {
  return useQuery({
    queryKey: ['userGroups'],
    queryFn: fetchUserGroups,
    staleTime: 30_000,
  })
}
