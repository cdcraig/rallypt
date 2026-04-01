import { useNavigate } from 'react-router-dom'
import { useGroups } from '../../hooks/useGroups'
import { useChatStore } from '../../stores/chatStore'

export function ChatList() {
  const navigate = useNavigate()
  const { isLoading } = useGroups()
  const groups = useChatStore((s) => s.groups)

  return (
    <div className="flex flex-col h-full bg-[#0a1628]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#0f172a] border-b border-[#1e3a5f] shrink-0">
        <h1 className="text-white font-semibold text-lg">Chats</h1>
        <button
          onClick={() => navigate('/chat/new-group')}
          className="px-3 py-1.5 rounded-lg bg-[#1d4ed8] text-white text-sm font-medium hover:bg-[#2563eb] transition-colors"
        >
          New Group
        </button>
      </div>

      {/* Group list */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="space-y-1 p-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-3 rounded-lg">
                <div className="w-11 h-11 rounded-full bg-[#1e293b] animate-pulse shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 w-32 bg-[#1e293b] rounded animate-pulse" />
                  <div className="h-2.5 w-20 bg-[#1e293b] rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : groups.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-600 mb-3">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <p className="text-slate-400 text-sm">No group chats yet</p>
            <p className="text-slate-500 text-xs mt-1">Tap "New Group" to get started</p>
          </div>
        ) : (
          <div className="p-2 space-y-0.5">
            {groups.map((group) => (
              <button
                key={group.id}
                onClick={() => navigate(`/chat/group/${group.id}`)}
                className="flex items-center gap-3 w-full px-3 py-3 rounded-lg hover:bg-[#1e293b] transition-colors text-left"
              >
                <div className="w-11 h-11 rounded-full bg-[#1d4ed8] flex items-center justify-center shrink-0">
                  {group.icon ? (
                    <img src={group.icon} alt={group.name} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <span className="text-white text-sm font-semibold">
                      {group.name.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium text-sm truncate">{group.name}</p>
                  <p className="text-slate-400 text-xs">
                    {group.member_count} member{group.member_count !== 1 ? 's' : ''}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
