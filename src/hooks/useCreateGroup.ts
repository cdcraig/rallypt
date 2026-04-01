import { useMutation, useQueryClient } from '@tanstack/react-query'
import supabase from '../lib/supabase'
import type { Group } from '../types'

async function createGroup({
  name,
  iconUrl,
  departmentId,
  createdBy,
}: {
  name: string
  iconUrl?: string | null
  departmentId?: string | null
  createdBy: string
}): Promise<Group> {
  const { data, error } = await supabase
    .from('groups')
    .insert({
      name,
      icon_url: iconUrl ?? null,
      department_id: departmentId ?? null,
      created_by: createdBy,
    })
    .select('id, name, icon:icon_url, created_by, department_id, created_at')
    .single()

  if (error) throw error
  return (data as unknown) as Group
}

export function useCreateGroup() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createGroup,
    onSuccess: () => {
      // The trigger automatically adds the creator as admin.
      // Invalidate both lists so they pick up the new group and its membership.
      queryClient.invalidateQueries({ queryKey: ['userGroups'] })
    },
  })
}
