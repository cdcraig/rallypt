import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { GroupTopBar } from './GroupTopBar'
import { GroupMessages } from './GroupMessages'
import { GroupMessageInput } from './GroupMessageInput'
import { GroupMembersPanel } from './GroupMembersPanel'
import { AddMemberModal } from './AddMemberModal'
import { useGroupInfo } from '../../hooks/useGroupInfo'
import { useGroupMessages } from '../../hooks/useGroupMessages'
import { useSendGroupMessage } from '../../hooks/useSendGroupMessage'
import { useGroupRealtime } from '../../hooks/useGroupRealtime'
import { useGroupMembers } from '../../hooks/useGroupMembers'
import { useAuth } from '../../hooks/useAuth'

export function GroupMessageView() {
  const { groupId } = useParams<{ groupId: string }>()
  const [showMembers, setShowMembers] = useState(false)
  const [showAddMember, setShowAddMember] = useState(false)

  const { user } = useAuth()
  const { data: group, isLoading: groupLoading } = useGroupInfo(groupId ?? '')
  const { data: members = [] } = useGroupMembers(groupId ?? '')
  const {
    data,
    isLoading: messagesLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useGroupMessages(groupId ?? '')
  const { mutate: sendMessage, isPending: sending } = useSendGroupMessage(groupId ?? '', user)

  useGroupRealtime(groupId ?? '')

  const isCurrentUserAdmin = members.some(
    (m) => m.user_id === user?.id && m.role === 'admin'
  )

  if (!groupId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0a1628] text-slate-500">
        Group not found
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-[#0a1628]">
      <GroupTopBar
        group={group}
        isLoading={groupLoading}
        onOpenMembers={() => setShowMembers(true)}
      />

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

      {showMembers && (
        <GroupMembersPanel
          groupId={groupId}
          members={members}
          currentUser={user}
          isCurrentUserAdmin={isCurrentUserAdmin}
          onClose={() => setShowMembers(false)}
          onOpenAddMember={() => setShowAddMember(true)}
        />
      )}

      {showAddMember && (
        <AddMemberModal
          groupId={groupId}
          existingMembers={members}
          onClose={() => setShowAddMember(false)}
        />
      )}
    </div>
  )
}
