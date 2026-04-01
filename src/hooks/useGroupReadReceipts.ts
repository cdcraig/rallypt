import { useCallback, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import supabase from '../lib/supabase'
import type { Message } from '../types'

export interface ReadReceipt {
  user_id: string
  last_read_message_id: string | null
  read_at: string
}

export function useGroupReadReceipts(groupId: string, currentUserId: string) {
  const queryClient = useQueryClient()

  const { data: receipts = [] } = useQuery({
    queryKey: ['readReceipts', 'group', groupId],
    queryFn: async () => {
      const { data } = await supabase
        .from('read_receipts')
        .select('user_id, last_read_message_id, read_at')
        .eq('group_id', groupId)
      return (data ?? []) as ReadReceipt[]
    },
    enabled: !!groupId && !!currentUserId,
  })

  // Subscribe to realtime receipt updates for this group
  useEffect(() => {
    if (!groupId) return

    const channel = supabase
      .channel(`read-receipts-group-${groupId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'read_receipts', filter: `group_id=eq.${groupId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ['readReceipts', 'group', groupId] })
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [groupId, queryClient])

  // Upsert own receipt when the user has read up to a given message
  const markRead = useCallback(
    async (messageId: string) => {
      if (!messageId || !currentUserId || !groupId) return
      await supabase.from('read_receipts').upsert(
        {
          user_id: currentUserId,
          group_id: groupId,
          conversation_id: null,
          last_read_message_id: messageId,
          read_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,group_id' }
      )
    },
    [groupId, currentUserId]
  )

  /**
   * Given the flat ordered message list, returns a Set of message IDs that have
   * been read by at least one OTHER group member. Only used for own messages to
   * show the double-check indicator.
   */
  const buildReadSet = useCallback(
    (messages: Message[]): Set<string> => {
      const readSet = new Set<string>()
      const otherReceipts = receipts.filter((r) => r.user_id !== currentUserId)
      if (!otherReceipts.length) return readSet

      // Build a position map: messageId -> index
      const positionOf = new Map(messages.map((m, i) => [m.id, i]))

      // For each other user's receipt, all messages up to their last_read position are read
      for (const receipt of otherReceipts) {
        if (!receipt.last_read_message_id) continue
        const readPos = positionOf.get(receipt.last_read_message_id)
        if (readPos === undefined) continue
        // Mark all own messages up to readPos as read
        for (let i = 0; i <= readPos; i++) {
          const msg = messages[i]
          if (msg && msg.sender_id === currentUserId) {
            readSet.add(msg.id)
          }
        }
      }

      return readSet
    },
    [receipts, currentUserId]
  )

  return { receipts, markRead, buildReadSet }
}
