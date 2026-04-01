import { useState, useRef, useCallback } from 'react'
import type { Message } from '../../types'

interface Props {
  message: Message
  isOwn: boolean
  showSender: boolean
  isRead?: boolean
  canPin: boolean
  onPin: (messageId: string, pin: boolean) => void
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

export function GroupMessageItem({ message, isOwn, showSender, isRead, canPin, onPin }: Props) {
  const sender = message.sender
  const [showMenu, setShowMenu] = useState(false)
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 })
  const pressTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  if (message.message_type === 'system') {
    const name = sender?.fullname || sender?.username || 'Someone'
    return (
      <div className="flex items-center justify-center py-1">
        <span className="text-xs text-slate-500 bg-slate-800/60 px-3 py-1 rounded-full">
          {name} joined the group
        </span>
      </div>
    )
  }

  const openMenu = useCallback((x: number, y: number) => {
    setMenuPos({ x, y })
    setShowMenu(true)
  }, [])

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    if (!canPin) return
    e.preventDefault()
    openMenu(e.clientX, e.clientY)
  }, [canPin, openMenu])

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!canPin) return
    const touch = e.touches[0]
    pressTimerRef.current = setTimeout(() => {
      openMenu(touch.clientX, touch.clientY)
    }, 500)
  }, [canPin, openMenu])

  const handleTouchEnd = useCallback(() => {
    clearTimeout(pressTimerRef.current)
  }, [])

  const handlePinToggle = useCallback(() => {
    onPin(message.id, !message.pinned_at)
    setShowMenu(false)
  }, [message.id, message.pinned_at, onPin])

  const isPinned = !!message.pinned_at

  return (
    <>
      <div
        data-message-id={message.id}
        className={`flex gap-2.5 ${isOwn ? 'flex-row-reverse' : 'flex-row'} items-end`}
        onContextMenu={handleContextMenu}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchEnd}
      >
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

          <div className="relative">
            <div
              className={`px-3.5 py-2 rounded-2xl text-sm leading-relaxed break-words ${
                isOwn
                  ? 'bg-[#1d4ed8] text-white rounded-br-sm'
                  : 'bg-[#1e293b] text-slate-100 rounded-bl-sm'
              } ${isPinned ? 'ring-1 ring-amber-500/50' : ''}`}
            >
              {message.content}
            </div>
            {isPinned && (
              <div className="absolute -top-1.5 -right-1.5">
                <PinIcon className="w-3.5 h-3.5 text-amber-400" />
              </div>
            )}
          </div>

          <div className="flex items-center gap-1 mt-1 px-1">
            <span className="text-xs text-slate-500">
              {formatTime(message.created_at)}
            </span>
            {isOwn && (
              isRead
                ? <DoubleCheckIcon className="w-3.5 h-3.5 text-blue-400" />
                : <SingleCheckIcon className="w-3.5 h-3.5 text-slate-500" />
            )}
          </div>
        </div>
      </div>

      {/* Context menu */}
      {showMenu && canPin && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowMenu(false)}
          />
          {/* Menu */}
          <div
            className="fixed z-50 bg-[#1e293b] border border-slate-700 rounded-xl shadow-xl py-1 min-w-[160px]"
            style={{
              left: Math.min(menuPos.x, window.innerWidth - 180),
              top: Math.min(menuPos.y, window.innerHeight - 80),
            }}
          >
            <button
              onClick={handlePinToggle}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-200 hover:bg-slate-700/60 transition-colors"
            >
              <PinIcon className="w-4 h-4 text-amber-400" />
              {isPinned ? 'Unpin message' : 'Pin message'}
            </button>
          </div>
        </>
      )}
    </>
  )
}

function SingleCheckIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function DoubleCheckIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polyline points="17 6 6 17 1 12" />
      <polyline points="23 6 12 17 10.5 15.5" />
    </svg>
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
