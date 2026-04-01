import { useState, useRef, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { GroupTopBar } from './GroupTopBar'
import { GroupMessages } from './GroupMessages'
import type { GroupMessagesRef } from './GroupMessages'
import { GroupMessageInput } from './GroupMessageInput'
import { GroupMembersPanel } from './GroupMembersPanel'
import { AddMemberModal } from './AddMemberModal'
import { useGroupInfo } from '../../hooks/useGroupInfo'
import { useGroupMessages } from '../../hooks/useGroupMessages'
import { useSendGroupMessage } from '../../hooks/useSendGroupMessage'
import { useGroupRealtime } from '../../hooks/useGroupRealtime'
import { useGroupMembers } from '../../hooks/useGroupMembers'
import { useAuth } from '../../hooks/useAuth'
import { usePinMessage } from '../../hooks/usePinMessage'
import { usePinnedMessage } from '../../hooks/usePinnedMessage'
import { useGroupReadReceipts } from '../../hooks/useGroupReadReceipts'
import { useTypingIndicator } from '../../hooks/useTypingIndicator'

export function GroupMessageView() {
  const { groupId } = useParams<{ groupId: string }>()
  const [showMembers, setShowMembers] = useState(false)
  const [showAddMember, setShowAddMember] = useState(false)
  const messagesRef = useRef<GroupMessagesRef>(null)

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
  const { mutate: pinMessage } = usePinMessage(groupId ?? '', user?.id ?? '')
  const { data: pinnedMessage } = usePinnedMessage(groupId ?? '')

  useGroupRealtime(groupId ?? '')

  const currentUser = user ? { id: user.id, username: user.username ?? user.fullname ?? 'Someone' } : null
  const { markRead, buildReadSet } = useGroupReadReceipts(groupId ?? '', user?.id ?? '')
  const { typingUsers, startTyping } = useTypingIndicator(
    groupId ? `group-${groupId}` : '',
    currentUser
  )

  const messages = data?.pages.flat() ?? []
  const readSet = buildReadSet(messages)

  const isCurrentUserAdmin = members.some(
    (m) => m.user_id === user?.id && m.role === 'admin'
  )

  const handlePin = useCallback((messageId: string, pin: boolean) => {
    pinMessage({ messageId, pin })
  }, [pinMessage])

  const handlePinnedBannerTap = useCallback(() => {
    if (pinnedMessage) {
      messagesRef.current?.scrollToMessage(pinnedMessage.id)
    }
  }, [pinnedMessage])

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

      {pinnedMessage && (
        <button
          onClick={handlePinnedBannerTap}
          className="flex items-center gap-2.5 px-4 py-2 bg-[#1e293b] border-b border-slate-700/50 text-left hover:bg-slate-700/40 transition-colors"
        >
          <PinIcon className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-amber-400 font-medium leading-none mb-0.5">Pinned message</p>
            <p className="text-xs text-slate-300 truncate">{pinnedMessage.content}</p>
          </div>
        </button>
      )}

      <GroupMessages
        ref={messagesRef}
        data={data}
        isLoading={messagesLoading}
        isFetchingNextPage={isFetchingNextPage}
        hasNextPage={!!hasNextPage}
        fetchNextPage={fetchNextPage}
        currentUserId={user?.id ?? ''}
        isCurrentUserAdmin={isCurrentUserAdmin}
        onPin={handlePin}
        readSet={readSet}
        onMarkRead={markRead}
        typingUsers={typingUsers}
      />

      <GroupMessageInput
        onSend={sendMessage}
        onTyping={startTyping}
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

function PinIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z" />
    </svg>
  )
}
