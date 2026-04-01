import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createGroup } from '../lib/queries/groups'

export function useCreateGroup(userId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      name,
      departmentId,
      iconUrl,
    }: {
      name: string
      departmentId?: string | null
      iconUrl?: string | null
    }) => {
      if (!userId) throw new Error('Not authenticated')
      return createGroup({ name, createdBy: userId, departmentId, iconUrl })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userGroups', userId] })
    },
  })
}
