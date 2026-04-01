import { useQuery } from '@tanstack/react-query'
import supabase from '../lib/supabase'
import type { Message } from '../types'

async function fetchPinnedMessage(groupId: string): Promise<Message | null> {
  const { data, error } = await supabase
    .from('messages')
    .select(`
      id, created_at, sender_id, group_id, content, pinned_at, pinned_by,
      sender:users!sender_id(id, fullname, username, avatar_url)
    `)
    .eq('group_id', groupId)
    .not('pinned_at', 'is', null)
    .order('pinned_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return (data as unknown) as Message | null
}

export function usePinnedMessage(groupId: string) {
  return useQuery({
    queryKey: ['pinnedMessage', groupId],
    queryFn: () => fetchPinnedMessage(groupId),
    enabled: !!groupId,
  })
}
