import { useMutation, useQueryClient } from '@tanstack/react-query'
import { addGroupMember, removeGroupMember } from '../lib/queries/groups'

export function useAddGroupMember(groupId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role?: 'admin' | 'member' }) =>
      addGroupMember({ groupId, userId, role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groupMembers', groupId] })
      queryClient.invalidateQueries({ queryKey: ['groupInfo', groupId] })
    },
  })
}

export function useRemoveGroupMember(groupId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (userId: string) => removeGroupMember({ groupId, userId }),
    onSuccess: (_data, userId) => {
      queryClient.invalidateQueries({ queryKey: ['groupMembers', groupId] })
      queryClient.invalidateQueries({ queryKey: ['groupInfo', groupId] })
      // If user removed themselves, invalidate their group list
      queryClient.invalidateQueries({ queryKey: ['userGroups', userId] })
    },
  })
}
