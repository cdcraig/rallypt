import { useInfiniteQuery } from '@tanstack/react-query'
import supabase from '../lib/supabase'
import type { Message } from '../types'

const PAGE_SIZE = 30

async function fetchDirectMessages({
  userId,
  recipientId,
  pageParam = 0,
}: {
  userId: string
  recipientId: string
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
      recipient_id,
      group_id,
      content,
      sender:users!sender_id(id, fullname, username, avatar_url)
    `)
    .is('group_id', null)
    .or(
      `and(sender_id.eq.${userId},recipient_id.eq.${recipientId}),and(sender_id.eq.${recipientId},recipient_id.eq.${userId})`
    )
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) throw error
  return ((data as unknown) as Message[]).reverse()
}

export function useDirectMessages(userId: string, recipientId: string) {
  return useInfiniteQuery({
    queryKey: ['directMessages', userId, recipientId],
    queryFn: ({ pageParam }) =>
      fetchDirectMessages({ userId, recipientId, pageParam: pageParam as number }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === PAGE_SIZE ? allPages.length : undefined,
    enabled: !!userId && !!recipientId,
    select: (data) => ({
      pages: [...data.pages].reverse(),
      pageParams: [...data.pageParams].reverse(),
    }),
  })
}
