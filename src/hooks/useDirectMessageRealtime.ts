import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import supabase from '../lib/supabase'
import type { AppUser, Message } from '../types'

// Subscribes to incoming messages from recipientId to userId.
// Outgoing messages are handled optimistically by useSendDirectMessage.
export function useDirectMessageRealtime(userId: string, recipientId: string) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!userId || !recipientId) return

    const channel = supabase
      .channel(`direct-messages-${userId}-${recipientId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `recipient_id=eq.${userId}`,
        },
        async (payload) => {
          const rawMsg = payload.new as Message

          // Only process messages from the active conversation partner
          if (rawMsg.sender_id !== recipientId) return

          const { data: sender } = await supabase
            .from('users')
            .select('id, fullname, username, avatar_url')
            .eq('id', rawMsg.sender_id)
            .single()

          const msg: Message = { ...rawMsg, sender: (sender as AppUser) ?? undefined }
          const queryKey = ['directMessages', userId, recipientId]

          queryClient.setQueryData(queryKey, (old: any) => {
            if (!old) return old
            const allMsgs: Message[] = old.pages.flat()
            if (allMsgs.some((m) => m.id === msg.id)) return old
            const pages = [...old.pages]
            pages[pages.length - 1] = [...(pages[pages.length - 1] ?? []), msg]
            return { ...old, pages }
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, recipientId, queryClient])
}
