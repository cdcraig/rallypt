import { useCallback, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import supabase from '../lib/supabase'

export interface ReadReceipt {
  user_id: string
  last_read_message_id: string | null
  read_at: string
}

export function useConvReadReceipts(conversationId: string, currentUserId: string) {
  const queryClient = useQueryClient()

  const { data: receipts = [] } = useQuery({
    queryKey: ['readReceipts', 'conv', conversationId],
    queryFn: async () => {
      const { data } = await supabase
        .from('read_receipts')
        .select('user_id, last_read_message_id, read_at')
        .eq('conversation_id', conversationId)
      return (data ?? []) as ReadReceipt[]
    },
    enabled: !!conversationId && !!currentUserId,
  })

  // Subscribe to realtime updates
  useEffect(() => {
    if (!conversationId) return

    const channel = supabase
      .channel(`read-receipts-conv-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'read_receipts',
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['readReceipts', 'conv', conversationId] })
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [conversationId, queryClient])

  // Upsert own receipt
  const markRead = useCallback(
    async (messageId: string) => {
      if (!messageId || !currentUserId || !conversationId) return
      await supabase.from('read_receipts').upsert(
        {
          user_id: currentUserId,
          conversation_id: conversationId,
          group_id: null,
          last_read_message_id: messageId,
          read_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,conversation_id' }
      )
    },
    [conversationId, currentUserId]
  )

  // Returns true if the OTHER user has read past the given message's created_at
  const isReadByOther = useCallback(
    (messageCreatedAt: string): boolean => {
      const otherReceipt = receipts.find((r) => r.user_id !== currentUserId)
      if (!otherReceipt?.read_at) return false
      return otherReceipt.read_at >= messageCreatedAt
    },
    [receipts, currentUserId]
  )

  return { receipts, markRead, isReadByOther }
}
