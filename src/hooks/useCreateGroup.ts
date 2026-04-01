import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createGroup, addGroupMember } from '../lib/queries/groups'
import { useAuth } from './useAuth'

export function useCreateGroup() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async ({
      name,
      departmentId,
      iconUrl,
      memberIds = [],
    }: {
      name: string
      departmentId?: string | null
      iconUrl?: string | null
      memberIds?: string[]
    }) => {
      if (!user?.id) throw new Error('Not authenticated')
      const group = await createGroup({ name, createdBy: user.id, departmentId, iconUrl })

      // Add additional members (creator is already added by DB trigger)
      await Promise.all(
        memberIds
          .filter((id) => id !== user.id)
          .map((userId) => addGroupMember({ groupId: group.id, userId })),
      )

      return group
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userGroups', user?.id] })
      queryClient.invalidateQueries({ queryKey: ['chatList', user?.id] })
    },
  })
}
