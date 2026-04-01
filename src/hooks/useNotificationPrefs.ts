import { useState, useCallback } from 'react'

const MUTED_CHATS_KEY = 'rallypt_muted_chats'
const QUIET_HOURS_KEY = 'rallypt_quiet_hours'

interface QuietHours {
  enabled: boolean
  start: string
  end: string
}

interface NotificationPrefs {
  mutedChats: string[]
  quietHours: QuietHours
  muteChat: (groupId: string) => void
  unmuteChat: (groupId: string) => void
  isChatMuted: (groupId: string) => boolean
  setQuietHours: (prefs: QuietHours) => void
}

function loadMutedChats(): string[] {
  try {
    const raw = localStorage.getItem(MUTED_CHATS_KEY)
    return raw ? (JSON.parse(raw) as string[]) : []
  } catch {
    return []
  }
}

function loadQuietHours(): QuietHours {
  try {
    const raw = localStorage.getItem(QUIET_HOURS_KEY)
    return raw
      ? (JSON.parse(raw) as QuietHours)
      : { enabled: false, start: '22:00', end: '08:00' }
  } catch {
    return { enabled: false, start: '22:00', end: '08:00' }
  }
}

export function useNotificationPrefs(): NotificationPrefs {
  const [mutedChats, setMutedChats] = useState<string[]>(loadMutedChats)
  const [quietHours, setQuietHoursState] = useState<QuietHours>(loadQuietHours)

  const muteChat = useCallback((groupId: string) => {
    setMutedChats((prev) => {
      if (prev.includes(groupId)) return prev
      const next = [...prev, groupId]
      localStorage.setItem(MUTED_CHATS_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const unmuteChat = useCallback((groupId: string) => {
    setMutedChats((prev) => {
      const next = prev.filter((id) => id !== groupId)
      localStorage.setItem(MUTED_CHATS_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const isChatMuted = useCallback(
    (groupId: string) => mutedChats.includes(groupId),
    [mutedChats],
  )

  const setQuietHours = useCallback((prefs: QuietHours) => {
    setQuietHoursState(prefs)
    localStorage.setItem(QUIET_HOURS_KEY, JSON.stringify(prefs))
  }, [])

  return { mutedChats, quietHours, muteChat, unmuteChat, isChatMuted, setQuietHours }
}
