import { useChatList } from '../../hooks/useChatList'
import { ChatListItem } from './ChatListItem'

export function ChatList() {
  const { data: entries, isLoading } = useChatList()

  return (
    <div className="flex flex-col h-full bg-[#0a1628]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
        <h1 className="text-lg font-semibold text-slate-100">Messages</h1>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex flex-col gap-1 py-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3">
                <div className="w-12 h-12 rounded-full bg-slate-800 animate-pulse shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 bg-slate-800 rounded animate-pulse w-1/3" />
                  <div className="h-3 bg-slate-800/60 rounded animate-pulse w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : !entries?.length ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-3 px-6">
            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
            </svg>
            <p className="text-sm text-center">No conversations yet</p>
          </div>
        ) : (
          <div className="py-1">
            {entries.map((entry) => (
              <ChatListItem key={`${entry.type}-${entry.id}`} entry={entry} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
