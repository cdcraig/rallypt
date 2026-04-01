import { useMutation, useQueryClient } from '@tanstack/react-query'
import supabase from '../lib/supabase'

// Add a member to a group. Only group admins can do this (enforced by RLS).
export function useAddGroupMember(groupId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ userId, role = 'member' }: { userId: string; role?: 'admin' | 'member' }) => {
      const { error } = await supabase
        .from('group_members')
        .insert({ group_id: groupId, user_id: userId, role })

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groupMembers', groupId] })
      queryClient.invalidateQueries({ queryKey: ['groupInfo', groupId] })
    },
  })
}

// Promote a group member to admin. Only admins can do this (enforced by RLS).
export function usePromoteGroupMember(groupId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('group_members')
        .update({ role: 'admin' })
        .eq('group_id', groupId)
        .eq('user_id', userId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groupMembers', groupId] })
    },
  })
}

// Remove a member from a group.
// Admins can remove anyone; members can only remove themselves (enforced by RLS).
export function useRemoveGroupMember(groupId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', userId)

      if (error) throw error
    },
    onSuccess: (_data, _userId) => {
      queryClient.invalidateQueries({ queryKey: ['groupMembers', groupId] })
      queryClient.invalidateQueries({ queryKey: ['groupInfo', groupId] })
      // If the removed user was the current user, also invalidate their group list
      queryClient.invalidateQueries({ queryKey: ['userGroups'] })
    },
  })
}
