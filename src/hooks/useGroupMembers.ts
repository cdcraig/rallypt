import { useQuery } from '@tanstack/react-query'
import supabase from '../lib/supabase'
import type { GroupMember } from '../types'

async function fetchGroupMembers(groupId: string): Promise<GroupMember[]> {
  const { data, error } = await supabase
    .from('group_members')
    .select('group_id, user_id, role, joined_at, user:users(id, email, username, fullname, avatar_url)')
    .eq('group_id', groupId)
    .order('role', { ascending: true }) // admins first
    .order('joined_at', { ascending: true })

  if (error) throw error
  return (data ?? []).map((row: any) => ({
    ...row,
    user: Array.isArray(row.user) ? row.user[0] : row.user,
  }))
}

export function useGroupMembers(groupId: string) {
  return useQuery({
    queryKey: ['groupMembers', groupId],
    queryFn: () => fetchGroupMembers(groupId),
    enabled: !!groupId,
    staleTime: 30_000,
  })
}
