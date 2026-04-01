import { useQuery } from '@tanstack/react-query'
import { fetchGroupInfo } from '../lib/queries/groups'

export function useGroupInfo(groupId: string) {
  return useQuery({
    queryKey: ['groupInfo', groupId],
    queryFn: () => fetchGroupInfo(groupId),
    enabled: !!groupId,
    staleTime: 60_000,
  })
}
