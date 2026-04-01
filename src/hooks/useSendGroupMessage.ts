import { useMutation, useQueryClient } from '@tanstack/react-query'
import { v4 as uuidv4 } from 'uuid'
import supabase from '../lib/supabase'
import type { Message, AppUser } from '../types'

async function sendMessage({
  groupId,
  content,
  senderId,
}: {
  groupId: string
  content: string
  senderId: string
}): Promise<Message> {
  const { data, error } = await supabase
    .from('messages')
    .insert({ group_id: groupId, content, sender_id: senderId })
    .select(`
      id, created_at, sender_id, group_id, content,
      sender:users!sender_id(id, fullname, username, avatar_url)
    `)
    .single()

  if (error) throw error
  return (data as unknown) as Message
}

export function useSendGroupMessage(groupId: string, currentUser: AppUser | null) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (content: string) => {
      if (!currentUser) throw new Error('Not authenticated')
      return sendMessage({ groupId, content, senderId: currentUser.id })
    },

    onMutate: async (content) => {
      await queryClient.cancelQueries({ queryKey: ['groupMessages', groupId] })

      const optimisticMsg: Message = {
        id: `optimistic-${uuidv4()}`,
        created_at: new Date().toISOString(),
        sender_id: currentUser?.id ?? '',
        group_id: groupId,
        content,
        sender: currentUser ?? undefined,
      }

      queryClient.setQueryData<{ pages: Message[][]; pageParams: unknown[] }>(
        ['groupMessages', groupId],
        (old) => {
          if (!old) return old
          const pages = [...old.pages]
          pages[pages.length - 1] = [...(pages[pages.length - 1] ?? []), optimisticMsg]
          return { ...old, pages }
        }
      )

      return { optimisticMsg }
    },

    onError: (_err, _content, context) => {
      if (!context) return
      queryClient.setQueryData<{ pages: Message[][]; pageParams: unknown[] }>(
        ['groupMessages', groupId],
        (old) => {
          if (!old) return old
          const pages = old.pages.map((page) =>
            page.filter((m) => m.id !== context.optimisticMsg.id)
          )
          return { ...old, pages }
        }
      )
    },

    onSuccess: (newMsg, _content, context) => {
      queryClient.setQueryData<{ pages: Message[][]; pageParams: unknown[] }>(
        ['groupMessages', groupId],
        (old) => {
          if (!old) return old
          const pages = old.pages.map((page) =>
            page.map((m) => (m.id === context?.optimisticMsg.id ? newMsg : m))
          )
          return { ...old, pages }
        }
      )
    },
  })
}
