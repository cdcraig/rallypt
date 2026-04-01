import { useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from 'react'
import type { InfiniteData } from '@tanstack/react-query'
import { GroupMessageItem } from './GroupMessageItem'
import type { Message } from '../../types'

export interface GroupMessagesRef {
  scrollToMessage: (id: string) => void
}

interface TypingUser {
  userId: string
  username: string
}

interface Props {
  data: InfiniteData<Message[]> | undefined
  isLoading: boolean
  isFetchingNextPage: boolean
  hasNextPage: boolean
  fetchNextPage: () => void
  currentUserId: string
  isCurrentUserAdmin: boolean
  onPin: (messageId: string, pin: boolean) => void
  readSet?: Set<string>
  onMarkRead?: (messageId: string) => void
  typingUsers?: TypingUser[]
}

export const GroupMessages = forwardRef<GroupMessagesRef, Props>(function GroupMessages(
  {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    currentUserId,
    isCurrentUserAdmin,
    onPin,
    readSet,
    onMarkRead,
    typingUsers = [],
  },
  ref
) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const prevScrollHeight = useRef(0)

  useImperativeHandle(ref, () => ({
    scrollToMessage: (id: string) => {
      const el = containerRef.current?.querySelector(`[data-message-id="${id}"]`)
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    },
  }))

  // Scroll to bottom on initial load and new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [data?.pages.at(-1)?.at(-1)?.id])

  // Preserve scroll position when older pages load at the top
  useEffect(() => {
    const container = containerRef.current
    if (!container || !isFetchingNextPage) return
    prevScrollHeight.current = container.scrollHeight
  }, [isFetchingNextPage])

  useEffect(() => {
    const container = containerRef.current
    if (!container || isFetchingNextPage) return
    const diff = container.scrollHeight - prevScrollHeight.current
    if (diff > 0) container.scrollTop += diff
  })

  const isAtBottom = useCallback(() => {
    const container = containerRef.current
    if (!container) return false
    return container.scrollHeight - container.scrollTop - container.clientHeight < 80
  }, [])

  // Mark read when new messages arrive and we're at the bottom
  const lastMessageId = data?.pages.at(-1)?.at(-1)?.id
  useEffect(() => {
    if (lastMessageId && isAtBottom() && onMarkRead) {
      onMarkRead(lastMessageId)
    }
  }, [lastMessageId]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleScroll = useCallback(() => {
    const container = containerRef.current
    if (!container) return
    if (container.scrollTop < 100 && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
    // Mark read when user scrolls to bottom
    if (isAtBottom() && lastMessageId && onMarkRead) {
      onMarkRead(lastMessageId)
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, isAtBottom, lastMessageId, onMarkRead])

  const messages = data?.pages.flat() ?? []

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#1d4ed8] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto px-4 py-4 space-y-3 scroll-smooth"
    >
      {isFetchingNextPage && (
        <div className="flex justify-center py-2">
          <div className="w-4 h-4 border-2 border-slate-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {messages.length === 0 && (
        <div className="flex flex-col items-center justify-center h-full gap-2 text-slate-500">
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <p className="text-sm">No messages yet. Say hello!</p>
        </div>
      )}

      {messages.map((msg, idx) => {
        const prev = messages[idx - 1]
        const showSender = !prev || prev.sender_id !== msg.sender_id || prev.message_type === 'system'
        const canPin = msg.sender_id === currentUserId || isCurrentUserAdmin
        return (
          <GroupMessageItem
            key={msg.id}
            message={msg}
            isOwn={msg.sender_id === currentUserId}
            showSender={showSender}
            isRead={readSet?.has(msg.id)}
            canPin={canPin}
            onPin={onPin}
          />
        )
      })}

      {typingUsers.length > 0 && (
        <div className="flex items-center gap-2 px-1 py-1 text-slate-400">
          <TypingDots />
          <span className="text-xs">
            {typingUsers.length === 1
              ? `${typingUsers[0].username} is typing…`
              : `${typingUsers.map((u) => u.username).join(', ')} are typing…`}
          </span>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  )
})

function TypingDots() {
  return (
    <div className="flex items-center gap-0.5">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  )
}
