import { useQuery } from '@tanstack/react-query'
import { fetchUserGroups } from '../lib/queries/groups'

export function useUserGroups(userId: string | undefined) {
  return useQuery({
    queryKey: ['userGroups', userId],
    queryFn: () => fetchUserGroups(userId!),
    enabled: !!userId,
    staleTime: 30_000,
  })
}
