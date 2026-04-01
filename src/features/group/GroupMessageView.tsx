import { useParams } from 'react-router-dom'
import { GroupTopBar } from './GroupTopBar'
import { GroupMessages } from './GroupMessages'
import { GroupMessageInput } from './GroupMessageInput'
import { useGroupInfo } from '../../hooks/useGroupInfo'
import { useGroupMessages } from '../../hooks/useGroupMessages'
import { useSendGroupMessage } from '../../hooks/useSendGroupMessage'
import { useGroupRealtime } from '../../hooks/useGroupRealtime'
import { useAuth } from '../../hooks/useAuth'

export function GroupMessageView() {
  const { groupId } = useParams<{ groupId: string }>()

  const { user } = useAuth()
  const { data: group, isLoading: groupLoading } = useGroupInfo(groupId ?? '')
  const {
    data,
    isLoading: messagesLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useGroupMessages(groupId ?? '')
  const { mutate: sendMessage, isPending: sending } = useSendGroupMessage(groupId ?? '', user)

  useGroupRealtime(groupId ?? '')

  if (!groupId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0a1628] text-slate-500">
        Group not found
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-[#0a1628]">
      <GroupTopBar group={group} isLoading={groupLoading} />

      <GroupMessages
        data={data}
        isLoading={messagesLoading}
        isFetchingNextPage={isFetchingNextPage}
        hasNextPage={!!hasNextPage}
        fetchNextPage={fetchNextPage}
        currentUserId={user?.id ?? ''}
      />

      <GroupMessageInput
        onSend={sendMessage}
        disabled={sending || !user}
      />
    </div>
  )
}
