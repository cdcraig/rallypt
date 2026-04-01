import { useMutation, useQueryClient } from '@tanstack/react-query'
import supabase from '../lib/supabase'
import { useAuth } from './useAuth'
import { useChatStore } from '../stores/chatStore'
import type { GroupWithMeta } from '../types'

interface CreateGroupInput {
  name: string
  memberIds: string[]
}

export function useCreateGroup() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const addGroup = useChatStore((s) => s.addGroup)

  return useMutation({
    mutationFn: async ({ name, memberIds }: CreateGroupInput) => {
      if (!user) throw new Error('Not authenticated')

      // Create the group (trigger auto-adds creator as admin)
      const { data: group, error: groupError } = await supabase
        .from('groups')
        .insert({ name, created_by: user.id })
        .select('id, name, icon_url, created_by, department_id, created_at')
        .single()

      if (groupError) throw groupError

      // Add selected members
      if (memberIds.length > 0) {
        const members = memberIds.map((uid) => ({
          group_id: group.id,
          user_id: uid,
          role: 'member' as const,
        }))

        const { error: membersError } = await supabase
          .from('group_members')
          .insert(members)

        if (membersError) throw membersError
      }

      const groupWithMeta: GroupWithMeta = {
        id: group.id,
        name: group.name,
        icon: group.icon_url,
        created_by: group.created_by,
        department_id: group.department_id,
        created_at: group.created_at,
        member_count: memberIds.length + 1, // members + creator
      }

      return groupWithMeta
    },
    onSuccess: (group) => {
      addGroup(group)
      queryClient.invalidateQueries({ queryKey: ['groups'] })
    },
  })
}
