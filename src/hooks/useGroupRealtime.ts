import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import supabase from '../lib/supabase'
import type { AppUser, Message } from '../types'

export function useGroupRealtime(groupId: string) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!groupId) return

    const channel = supabase
      .channel(`group-messages-${groupId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `group_id=eq.${groupId}`,
        },
        async (payload) => {
          const rawMsg = payload.new as Message

          // Fetch sender info for the new message
          const { data: sender } = await supabase
            .from('users')
            .select('id, fullname, username, avatar_url')
            .eq('id', rawMsg.sender_id)
            .single()

          const msg: Message = { ...rawMsg, sender: (sender as AppUser) ?? undefined }

          queryClient.setQueryData(
            ['groupMessages', groupId],
            (old: any) => {
              if (!old) return old

              // Skip if it's already in cache (optimistic update)
              const allMsgs: Message[] = old.pages.flat()
              const alreadyExists = allMsgs.some(
                (m) => m.id === msg.id || m.content === msg.content && m.sender_id === msg.sender_id
              )
              if (alreadyExists) return old

              const pages = [...old.pages]
              pages[pages.length - 1] = [...(pages[pages.length - 1] ?? []), msg]
              return { ...old, pages }
            }
          )
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [groupId, queryClient])
}
