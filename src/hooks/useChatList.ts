import { useQuery } from '@tanstack/react-query'
import supabase from '../lib/supabase'
import { useAuth } from './useAuth'
import type { ChatEntry } from '../types'

async function fetchChatList(userId: string): Promise<ChatEntry[]> {
  const entries: ChatEntry[] = []

  // ── Group conversations ───────────────────────────────────────────
  // Get groups the user belongs to, with group metadata
  const { data: groups } = await supabase
    .from('group_members')
    .select('group_id, groups!inner(id, name, icon_url)')
    .eq('user_id', userId)

  if (groups) {
    // For each group, fetch the latest message
    const groupEntries = await Promise.all(
      groups.map(async (row: any) => {
        const g = row.groups
        const { data: lastMsg } = await supabase
          .from('messages')
          .select('content, created_at')
          .eq('group_id', g.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        // Unread count: messages after last_read (placeholder: show 0 for now)
        return {
          id: g.id,
          type: 'group' as const,
          name: g.name,
          avatarUrl: g.icon_url ?? null,
          lastMessage: lastMsg?.content ?? null,
          lastMessageAt: lastMsg?.created_at ?? g.created_at ?? null,
          unreadCount: 0,
        }
      }),
    )
    entries.push(...groupEntries)
  }

  // ── 1:1 conversations ────────────────────────────────────────────
  // Get distinct users the current user has exchanged DMs with
  const { data: dmMessages } = await supabase
    .from('messages')
    .select('id, sender_id, recipient_id, content, created_at')
    .is('group_id', null)
    .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
    .order('created_at', { ascending: false })

  if (dmMessages && dmMessages.length > 0) {
    // Group by the "other" user, keep latest message per partner
    const partnerMap = new Map<
      string,
      { content: string; created_at: string }
    >()
    for (const msg of dmMessages) {
      const partnerId =
        msg.sender_id === userId ? msg.recipient_id : msg.sender_id
      if (!partnerId || partnerMap.has(partnerId)) continue
      partnerMap.set(partnerId, {
        content: msg.content,
        created_at: msg.created_at,
      })
    }

    // Fetch partner user details
    const partnerIds = Array.from(partnerMap.keys())
    const { data: partners } = await supabase
      .from('users')
      .select('id, fullname, username, avatar_url')
      .in('id', partnerIds)

    const partnerLookup = new Map(
      (partners ?? []).map((p: any) => [p.id, p]),
    )

    for (const [partnerId, lastMsg] of partnerMap) {
      const partner = partnerLookup.get(partnerId)
      entries.push({
        id: partnerId,
        type: 'dm',
        name: partner?.fullname || partner?.username || 'Unknown',
        avatarUrl: partner?.avatar_url ?? null,
        lastMessage: lastMsg.content,
        lastMessageAt: lastMsg.created_at,
        unreadCount: 0,
      })
    }
  }

  // Sort by most recent message (nulls last)
  entries.sort((a, b) => {
    if (!a.lastMessageAt && !b.lastMessageAt) return 0
    if (!a.lastMessageAt) return 1
    if (!b.lastMessageAt) return -1
    return (
      new Date(b.lastMessageAt).getTime() -
      new Date(a.lastMessageAt).getTime()
    )
  })

  return entries
}

export function useChatList() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['chatList', user?.id],
    queryFn: () => fetchChatList(user!.id),
    enabled: !!user?.id,
    staleTime: 30_000,
  })
}
