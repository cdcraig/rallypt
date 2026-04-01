import { useInfiniteQuery } from '@tanstack/react-query'
import supabase from '../lib/supabase'
import type { Message } from '../types'

const PAGE_SIZE = 30

async function fetchMessages({
  groupId,
  pageParam = 0,
}: {
  groupId: string
  pageParam: number
}): Promise<Message[]> {
  const from = pageParam * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const { data, error } = await supabase
    .from('messages')
    .select(`
      id,
      created_at,
      sender_id,
      group_id,
      content,
      sender:users!sender_id(id, fullname, username, avatar_url)
    `)
    .eq('group_id', groupId)
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) throw error

  // Supabase join returns sender as object; cast through unknown to satisfy types
  return ((data as unknown) as Message[]).reverse()
}

export function useGroupMessages(groupId: string) {
  return useInfiniteQuery({
    queryKey: ['groupMessages', groupId],
    queryFn: ({ pageParam }) => fetchMessages({ groupId, pageParam: pageParam as number }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === PAGE_SIZE ? allPages.length : undefined,
    enabled: !!groupId,
    select: (data) => ({
      pages: [...data.pages].reverse(),
      pageParams: [...data.pageParams].reverse(),
    }),
  })
}
