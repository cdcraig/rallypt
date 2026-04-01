import { useMutation, useQueryClient } from '@tanstack/react-query'
import { v4 as uuidv4 } from 'uuid'
import supabase from '../lib/supabase'
import type { Message, AppUser } from '../types'

async function sendDirectMessage({
  senderId,
  recipientId,
  content,
}: {
  senderId: string
  recipientId: string
  content: string
}): Promise<Message> {
  const { data, error } = await supabase
    .from('messages')
    .insert({ sender_id: senderId, recipient_id: recipientId, content })
    .select(`
      id, created_at, sender_id, recipient_id, group_id, content,
      sender:users!sender_id(id, fullname, username, avatar_url)
    `)
    .single()

  if (error) throw error
  return (data as unknown) as Message
}

export function useSendDirectMessage(recipientId: string, currentUser: AppUser | null) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (content: string) => {
      if (!currentUser) throw new Error('Not authenticated')
      return sendDirectMessage({ senderId: currentUser.id, recipientId, content })
    },

    onMutate: async (content) => {
      const queryKey = ['directMessages', currentUser?.id ?? '', recipientId]
      await queryClient.cancelQueries({ queryKey })

      const optimisticMsg: Message = {
        id: `optimistic-${uuidv4()}`,
        created_at: new Date().toISOString(),
        sender_id: currentUser?.id ?? '',
        recipient_id: recipientId,
        group_id: null,
        content,
        message_type: 'user' as const,
        sender: currentUser ?? undefined,
      }

      queryClient.setQueryData(queryKey, (old: any) => {
        if (!old) return old
        const pages = [...old.pages]
        pages[pages.length - 1] = [...(pages[pages.length - 1] ?? []), optimisticMsg]
        return { ...old, pages }
      })

      return { optimisticMsg }
    },

    onError: (_err, _content, context) => {
      if (!context || !currentUser) return
      const queryKey = ['directMessages', currentUser.id, recipientId]
      queryClient.setQueryData(queryKey, (old: any) => {
        if (!old) return old
        const pages = old.pages.map((page: Message[]) =>
          page.filter((m) => m.id !== context.optimisticMsg.id)
        )
        return { ...old, pages }
      })
    },

    onSuccess: (newMsg, _content, context) => {
      if (!currentUser) return
      const queryKey = ['directMessages', currentUser.id, recipientId]
      queryClient.setQueryData(queryKey, (old: any) => {
        if (!old) return old
        const pages = old.pages.map((page: Message[]) =>
          page.map((m) => (m.id === context?.optimisticMsg.id ? newMsg : m))
        )
        return { ...old, pages }
      })
    },
  })
}
