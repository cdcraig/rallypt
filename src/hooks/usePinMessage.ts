import { useMutation, useQueryClient } from '@tanstack/react-query'
import supabase from '../lib/supabase'
import type { Message } from '../types'

export function usePinMessage(groupId: string, currentUserId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ messageId, pin }: { messageId: string; pin: boolean }) => {
      const { data, error } = await supabase
        .from('messages')
        .update({
          pinned_at: pin ? new Date().toISOString() : null,
          pinned_by: pin ? currentUserId : null,
        })
        .eq('id', messageId)
        .select('id, pinned_at, pinned_by')
        .single()

      if (error) throw error
      return data as { id: string; pinned_at: string | null; pinned_by: string | null }
    },

    onSuccess: ({ id, pinned_at, pinned_by }) => {
      // Update the message in the infinite query cache
      queryClient.setQueryData<{ pages: Message[][]; pageParams: unknown[] }>(
        ['groupMessages', groupId],
        (old) => {
          if (!old) return old
          const pages = old.pages.map((page) =>
            page.map((m) => (m.id === id ? { ...m, pinned_at, pinned_by } : m))
          )
          return { ...old, pages }
        }
      )
      // Invalidate the pinned message banner query
      queryClient.invalidateQueries({ queryKey: ['pinnedMessage', groupId] })
    },
  })
}
