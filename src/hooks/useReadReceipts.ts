import { useEffect, useRef, useCallback, useState } from 'react'
import supabase from '../lib/supabase'

// messageId -> count of OTHER members who have read it
type ReadCounts = Record<string, number>

export function useReadReceipts(
  groupId: string,
  currentUserId: string,
  messageIds: string[],
) {
  const [readCounts, setReadCounts] = useState<ReadCounts>({})
  const observerRef = useRef<IntersectionObserver | null>(null)
  const markedRef = useRef<Set<string>>(new Set())
  const fetchedIdsRef = useRef<Set<string>>(new Set())

  // Mark a message as read — fires once per message per session
  const markRead = useCallback(
    async (messageId: string) => {
      if (!currentUserId || markedRef.current.has(messageId)) return
      markedRef.current.add(messageId)
      await supabase
        .from('message_reads')
        .upsert(
          { message_id: messageId, user_id: currentUserId },
          { onConflict: 'message_id,user_id' },
        )
    },
    [currentUserId],
  )

  // Create the IntersectionObserver once; recreate if markRead identity changes
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const msgId = (entry.target as HTMLElement).dataset.msgId
            if (msgId) markRead(msgId)
          }
        }
      },
      { threshold: 0.5 },
    )
    observerRef.current = observer
    return () => {
      observer.disconnect()
      observerRef.current = null
    }
  }, [markRead])

  // Fetch read counts for message IDs we haven't fetched yet
  const messageIdsKey = messageIds.join(',')
  useEffect(() => {
    if (!messageIds.length) return
    const newIds = messageIds.filter((id) => !fetchedIdsRef.current.has(id))
    if (!newIds.length) return
    newIds.forEach((id) => fetchedIdsRef.current.add(id))

    supabase
      .from('message_reads')
      .select('message_id, user_id')
      .in('message_id', newIds)
      .then(({ data }) => {
        if (!data) return
        // Build a count per message, excluding the current user's own reads
        const counts: ReadCounts = {}
        for (const row of data) {
          if (row.user_id === currentUserId) continue
          counts[row.message_id] = (counts[row.message_id] ?? 0) + 1
        }
        setReadCounts((prev) => ({ ...prev, ...counts }))
      })
  // messageIdsKey captures changes to the array contents without unstable identity
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messageIdsKey, currentUserId])

  // Realtime: increment count when any OTHER member reads a message
  useEffect(() => {
    if (!groupId) return

    const channel = supabase
      .channel(`reads-${groupId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'message_reads' },
        (payload) => {
          const row = payload.new as { message_id: string; user_id: string }
          if (row.user_id === currentUserId) return
          setReadCounts((prev) => ({
            ...prev,
            [row.message_id]: (prev[row.message_id] ?? 0) + 1,
          }))
        },
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [groupId, currentUserId])

  // Ref callback to register a message element with the observer.
  // Pass this to non-own message elements. React 19 supports cleanup return.
  const observeMessageEl = useCallback(
    (el: HTMLElement | null, messageId: string): (() => void) | void => {
      if (!el) return
      el.dataset.msgId = messageId
      observerRef.current?.observe(el)
      return () => { observerRef.current?.unobserve(el) }
    },
    [],
  )

  return { readCounts, observeMessageEl }
}
