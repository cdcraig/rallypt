import { useEffect, useRef, useCallback } from 'react'
import type { InfiniteData } from '@tanstack/react-query'
import { GroupMessageItem } from './GroupMessageItem'
import { useReadReceipts } from '../../hooks/useReadReceipts'
import type { Message } from '../../types'

interface Props {
  data: InfiniteData<Message[]> | undefined
  isLoading: boolean
  isFetchingNextPage: boolean
  hasNextPage: boolean
  fetchNextPage: () => void
  currentUserId: string
  groupId: string
  memberCount: number
}

export function GroupMessages({
  data,
  isLoading,
  isFetchingNextPage,
  hasNextPage,
  fetchNextPage,
  currentUserId,
  groupId,
  memberCount,
}: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const prevScrollHeight = useRef(0)

  const messages = data?.pages.flat() ?? []
  const messageIds = messages.map((m) => m.id)

  const { readCounts, observeMessageEl } = useReadReceipts(groupId, currentUserId, messageIds)

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

  const handleScroll = useCallback(() => {
    const container = containerRef.current
    if (!container) return
    if (container.scrollTop < 100 && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage])

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
        const showSender = !prev || prev.sender_id !== msg.sender_id
        const isOwn = msg.sender_id === currentUserId
        return (
          <div
            key={msg.id}
            ref={!isOwn ? (el) => observeMessageEl(el, msg.id) : undefined}
          >
            <GroupMessageItem
              message={msg}
              isOwn={isOwn}
              showSender={showSender}
              readCount={isOwn ? (readCounts[msg.id] ?? 0) : undefined}
              memberCount={memberCount}
            />
          </div>
        )
      })}

      <div ref={bottomRef} />
    </div>
  )
}
