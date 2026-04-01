import type { Message } from '../../types'

interface Props {
  message: Message
  isOwn: boolean
  showSender: boolean
  readCount?: number
  memberCount?: number
}

function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function getInitials(user: Message['sender']): string {
  if (!user) return '?'
  const name = user.fullname || user.username || '?'
  const parts = name.trim().split(' ')
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

const AVATAR_COLORS = [
  'bg-violet-600', 'bg-emerald-600', 'bg-orange-600',
  'bg-rose-600', 'bg-cyan-600', 'bg-amber-600',
]

function avatarColor(userId: string): string {
  let hash = 0
  for (let i = 0; i < userId.length; i++) hash = (hash * 31 + userId.charCodeAt(i)) | 0
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

function ReadIndicator({ readCount, memberCount }: { readCount: number; memberCount: number }) {
  // memberCount includes the sender, so "everyone read" means readCount >= memberCount - 1
  const allRead = readCount >= memberCount - 1
  const anyRead = readCount > 0
  const color = allRead ? 'text-blue-400' : 'text-slate-500'

  if (!anyRead) {
    // Single check — delivered, nobody has read it yet
    return (
      <svg className="text-slate-500 shrink-0" width="12" height="12" viewBox="0 0 12 12" fill="none">
        <path d="M1.5 6.5L4.5 9.5L10.5 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    )
  }

  // Double check — at least one read (blue = all, gray = some)
  return (
    <svg className={`${color} shrink-0`} width="16" height="12" viewBox="0 0 16 12" fill="none">
      <path d="M1 6.5L4 9.5L10 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M5 6.5L8 9.5L14 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

export function GroupMessageItem({ message, isOwn, showSender, readCount, memberCount }: Props) {
  const sender = message.sender

  return (
    <div className={`flex gap-2.5 ${isOwn ? 'flex-row-reverse' : 'flex-row'} items-end`}>
      {/* Avatar — always reserve space so bubbles stay aligned */}
      <div className="w-7 h-7 shrink-0">
        {!isOwn && showSender && (
          sender?.avatar_url ? (
            <img
              src={sender.avatar_url}
              alt={sender.fullname}
              className="w-7 h-7 rounded-full object-cover"
            />
          ) : (
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold text-white ${avatarColor(message.sender_id)}`}>
              {getInitials(sender)}
            </div>
          )
        )}
      </div>

      <div className={`flex flex-col max-w-[70%] ${isOwn ? 'items-end' : 'items-start'}`}>
        {/* Sender name — only for other people, only on first message in a run */}
        {!isOwn && showSender && (
          <span className="text-xs text-slate-400 mb-1 ml-1">
            {sender?.fullname || sender?.username || 'Unknown'}
          </span>
        )}

        <div
          className={`px-3.5 py-2 rounded-2xl text-sm leading-relaxed break-words ${
            isOwn
              ? 'bg-[#1d4ed8] text-white rounded-br-sm'
              : 'bg-[#1e293b] text-slate-100 rounded-bl-sm'
          }`}
        >
          {message.content}
        </div>

        <div className="flex items-center gap-1 mt-1 px-1">
          <span className="text-xs text-slate-500">
            {formatTime(message.created_at)}
          </span>
          {isOwn && readCount !== undefined && memberCount !== undefined && memberCount > 1 && (
            <ReadIndicator readCount={readCount} memberCount={memberCount} />
          )}
        </div>
      </div>
    </div>
  )
}
