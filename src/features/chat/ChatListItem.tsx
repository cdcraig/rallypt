import { useNavigate } from 'react-router-dom'
import type { ChatEntry } from '../../types'

interface Props {
  entry: ChatEntry
}

const AVATAR_COLORS = [
  'bg-violet-600', 'bg-emerald-600', 'bg-orange-600',
  'bg-rose-600', 'bg-cyan-600', 'bg-amber-600',
]

function avatarColor(id: string): string {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

function getInitials(name: string): string {
  const parts = name.trim().split(' ')
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

function formatTimestamp(iso: string): string {
  const date = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / 86_400_000)

  if (diffDays === 0) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) {
    return date.toLocaleDateString([], { weekday: 'short' })
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

export function ChatListItem({ entry }: Props) {
  const navigate = useNavigate()

  function handleTap() {
    if (entry.type === 'group') {
      navigate(`/chat/group/${entry.id}`)
    } else {
      navigate(`/chat/dm/${entry.id}`)
    }
  }

  return (
    <button
      type="button"
      onClick={handleTap}
      className="flex items-center gap-3 w-full px-4 py-3 hover:bg-[#1e293b]/60 active:bg-[#1e293b] transition-colors text-left"
    >
      {/* Avatar */}
      {entry.avatarUrl ? (
        <img
          src={entry.avatarUrl}
          alt={entry.name}
          className="w-12 h-12 rounded-full object-cover shrink-0"
        />
      ) : (
        <div
          className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-semibold text-white shrink-0 ${avatarColor(entry.id)}`}
        >
          {entry.type === 'group' ? (
            // Group icon
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
            </svg>
          ) : (
            getInitials(entry.name)
          )}
        </div>
      )}

      {/* Name + last message */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-sm font-medium text-slate-100 truncate">
            {entry.name}
          </span>
          {entry.lastMessageAt && (
            <span className="text-xs text-slate-500 shrink-0">
              {formatTimestamp(entry.lastMessageAt)}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <p className="text-xs text-slate-400 truncate">
            {entry.lastMessage ?? 'No messages yet'}
          </p>
          {entry.unreadCount > 0 && (
            <span className="bg-[#1d4ed8] text-white text-xs font-semibold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5 shrink-0">
              {entry.unreadCount > 99 ? '99+' : entry.unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  )
}
