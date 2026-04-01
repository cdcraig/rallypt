import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import supabase from '../lib/supabase'
import type { GroupWithMeta } from '../types'
import { useAuth } from './useAuth'
import { useChatStore } from '../stores/chatStore'

async function fetchGroups(userId: string): Promise<GroupWithMeta[]> {
  const { data, error } = await supabase
    .from('groups')
    .select(`
      id, name, icon_url, created_by, department_id, created_at,
      group_members!inner(user_id)
    `)
    .eq('group_members.user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error

  return (data ?? []).map((g: Record<string, unknown>) => ({
    id: g.id as string,
    name: g.name as string,
    icon: g.icon_url as string | null,
    created_by: g.created_by as string,
    department_id: g.department_id as string | null,
    created_at: g.created_at as string,
    member_count: Array.isArray(g.group_members) ? g.group_members.length : 0,
  }))
}

export function useGroups() {
  const { user } = useAuth()
  const setGroups = useChatStore((s) => s.setGroups)

  const query = useQuery({
    queryKey: ['groups', user?.id],
    queryFn: () => fetchGroups(user!.id),
    enabled: !!user,
    staleTime: 30_000,
  })

  useEffect(() => {
    if (query.data) setGroups(query.data)
  }, [query.data, setGroups])

  return query
}
