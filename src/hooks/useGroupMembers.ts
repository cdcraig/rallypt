import { useQuery } from '@tanstack/react-query'
import { fetchGroupMembers } from '../lib/queries/groups'

export function useGroupMembers(groupId: string) {
  return useQuery({
    queryKey: ['groupMembers', groupId],
    queryFn: () => fetchGroupMembers(groupId),
    enabled: !!groupId,
    staleTime: 30_000,
  })
}
