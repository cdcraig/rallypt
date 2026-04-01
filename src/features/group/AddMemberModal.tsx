import { useState } from 'react'
import { useSearchUsers } from '../../hooks/useSearchUsers'
import { useAddGroupMember } from '../../hooks/useGroupMemberActions'
import type { GroupMember } from '../../types'

interface Props {
  groupId: string
  existingMembers: GroupMember[]
  onClose: () => void
}

export function AddMemberModal({ groupId, existingMembers, onClose }: Props) {
  const [search, setSearch] = useState('')
  const { data: results = [], isLoading } = useSearchUsers(search)
  const { mutate: addMember, isPending } = useAddGroupMember(groupId)

  const existingIds = new Set(existingMembers.map((m) => m.user_id))
  const filteredResults = results.filter((u) => !existingIds.has(u.id))

  function handleAdd(userId: string) {
    addMember(userId)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-[#0f172a] rounded-t-2xl sm:rounded-2xl max-h-[80vh] flex flex-col border border-[#1e3a5f]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e3a5f]">
          <h2 className="text-white font-semibold text-base">Add Member</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1e293b] transition-colors"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18" /><path d="M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search input */}
        <div className="px-4 py-3">
          <input
            type="text"
            placeholder="Search by name or username..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
            className="w-full px-3 py-2 rounded-lg bg-[#1e293b] border border-[#1e3a5f] text-white text-sm placeholder-slate-500 outline-none focus:border-[#1d4ed8] transition-colors"
          />
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto px-1 pb-4">
          {search.length < 2 && (
            <p className="text-slate-500 text-sm text-center py-6">
              Type at least 2 characters to search
            </p>
          )}

          {search.length >= 2 && isLoading && (
            <div className="flex flex-col gap-2 px-3 py-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 py-2">
                  <div className="w-9 h-9 rounded-full bg-[#1e293b] animate-pulse" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 w-28 bg-[#1e293b] rounded animate-pulse" />
                    <div className="h-2.5 w-20 bg-[#1e293b] rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {search.length >= 2 && !isLoading && filteredResults.length === 0 && (
            <p className="text-slate-500 text-sm text-center py-6">
              {results.length > 0 ? 'All matches are already members' : 'No users found'}
            </p>
          )}

          {filteredResults.map((user) => {
            const initials = (user.fullname ?? user.username ?? '??').slice(0, 2).toUpperCase()

            return (
              <button
                key={user.id}
                onClick={() => handleAdd(user.id)}
                disabled={isPending}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg hover:bg-[#1e293b] transition-colors text-left disabled:opacity-50"
              >
                <div className="w-9 h-9 rounded-full bg-[#1e293b] flex items-center justify-center shrink-0">
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <span className="text-slate-300 text-xs font-semibold">{initials}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{user.fullname}</p>
                  <p className="text-slate-400 text-xs truncate">@{user.username}</p>
                </div>
                <div className="text-[#60a5fa] text-xs font-medium shrink-0">Add</div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
