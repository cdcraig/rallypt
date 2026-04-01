import { useQuery } from '@tanstack/react-query'
import supabase from '../lib/supabase'
import type { GroupWithMeta } from '../types'

async function fetchGroupInfo(groupId: string): Promise<GroupWithMeta> {
  const { data: group, error } = await supabase
    .from('groups')
    .select('id, name, icon:icon_url, created_by, department_id, created_at')
    .eq('id', groupId)
    .single()

  if (error) throw error

  const { count } = await supabase
    .from('group_members')
    .select('*', { count: 'exact', head: true })
    .eq('group_id', groupId)

  return { ...group, member_count: count ?? 0 }
}

export function useGroupInfo(groupId: string) {
  return useQuery({
    queryKey: ['groupInfo', groupId],
    queryFn: () => fetchGroupInfo(groupId),
    enabled: !!groupId,
    staleTime: 60_000,
  })
}
