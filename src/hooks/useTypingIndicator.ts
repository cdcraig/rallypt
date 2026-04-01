import { useCallback, useEffect, useRef, useState } from 'react'
import supabase from '../lib/supabase'

interface TypingUser {
  userId: string
  username: string
}

interface PresenceState {
  username: string
}

/**
 * Supabase Presence-based typing indicator.
 *
 * channelKey  — unique per context, e.g. "group-<groupId>" or "conv-<conversationId>"
 * currentUser — the authenticated user broadcasting presence
 *
 * Call startTyping() on every input change. Auto-clears after 3s of inactivity.
 * typingUsers contains all OTHER users currently typing.
 */
export function useTypingIndicator(
  channelKey: string,
  currentUser: { id: string; username: string } | null
) {
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([])
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isTracking = useRef(false)

  useEffect(() => {
    if (!channelKey || !currentUser) return

    const channel = supabase.channel(`typing-${channelKey}`, {
      config: { presence: { key: currentUser.id } },
    })

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState<PresenceState>()
        const others: TypingUser[] = Object.entries(state)
          .filter(([key]) => key !== currentUser.id)
          .map(([userId, presences]) => ({
            userId,
            username: presences[0]?.username ?? 'Someone',
          }))
        setTypingUsers(others)
      })
      .on('presence', { event: 'leave' }, () => {
        const state = channel.presenceState<PresenceState>()
        const others: TypingUser[] = Object.entries(state)
          .filter(([key]) => key !== currentUser.id)
          .map(([userId, presences]) => ({
            userId,
            username: presences[0]?.username ?? 'Someone',
          }))
        setTypingUsers(others)
      })
      .subscribe()

    channelRef.current = channel
    isTracking.current = false

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      supabase.removeChannel(channel)
    }
  }, [channelKey, currentUser?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const startTyping = useCallback(() => {
    if (!channelRef.current || !currentUser) return

    // Track (or re-track) presence
    channelRef.current.track({ username: currentUser.username })
    isTracking.current = true

    // Reset the 3s auto-clear timer
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      channelRef.current?.untrack()
      isTracking.current = false
    }, 3000)
  }, [currentUser])

  const stopTyping = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    channelRef.current?.untrack()
    isTracking.current = false
  }, [])

  return { typingUsers, startTyping, stopTyping }
}
