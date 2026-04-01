import { useState, useDeferredValue } from 'react'
import { useGroupMembers } from '../../hooks/useGroupMembers'
import {
  useAddGroupMember,
  useRemoveGroupMember,
  usePromoteGroupMember,
} from '../../hooks/useGroupMemberMutations'
import { useContacts } from '../../hooks/useContacts'
import type { AppUser, GroupMember } from '../../types'

interface Props {
  groupId: string
  currentUserId: string
  onClose: () => void
}

export function GroupMembersSheet({ groupId, currentUserId, onClose }: Props) {
  const [view, setView] = useState<'list' | 'add'>('list')
  const { data: members = [], isLoading } = useGroupMembers(groupId)

  const currentMember = members.find((m) => m.user_id === currentUserId)
  const isAdmin = currentMember?.role === 'admin'

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-40" onClick={onClose} />
      <div className="fixed inset-x-0 bottom-0 z-50 bg-[#0f172a] rounded-t-2xl flex flex-col max-h-[80vh]">
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-slate-600" />
        </div>

        {view === 'list' ? (
          <MemberListView
            groupId={groupId}
            currentUserId={currentUserId}
            isAdmin={isAdmin}
            members={members}
            isLoading={isLoading}
            onAddPress={() => setView('add')}
            onClose={onClose}
          />
        ) : (
          <AddMemberView
            groupId={groupId}
            existingMemberIds={members.map((m) => m.user_id)}
            onBack={() => setView('list')}
          />
        )}
      </div>
    </>
  )
}

/* ── Member list ──────────────────────────────────────────────────────── */

function MemberListView({
  groupId,
  currentUserId,
  isAdmin,
  members,
  isLoading,
  onAddPress,
  onClose,
}: {
  groupId: string
  currentUserId: string
  isAdmin: boolean
  members: GroupMember[]
  isLoading: boolean
  onAddPress: () => void
  onClose: () => void
}) {
  const { mutate: remove, isPending: removing } = useRemoveGroupMember(groupId)
  const { mutate: promote, isPending: promoting } = usePromoteGroupMember(groupId)

  return (
    <>
      <div className="flex items-center justify-between px-4 py-3 shrink-0">
        <h2 className="text-white font-semibold text-base">
          Members {!isLoading && `(${members.length})`}
        </h2>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <button
              onClick={onAddPress}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#1d4ed8] text-white text-xs font-medium hover:bg-[#2563eb] transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Add
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1e293b] transition-colors"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-6">
        {isLoading ? (
          <div className="space-y-1 p-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-2.5">
                <div className="w-9 h-9 rounded-full bg-[#1e293b] animate-pulse shrink-0" />
                <div className="h-3.5 w-32 bg-[#1e293b] rounded animate-pulse" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-0.5">
            {members.map((member) => (
              <MemberRow
                key={member.user_id}
                member={member}
                isCurrentUser={member.user_id === currentUserId}
                canManage={isAdmin && member.user_id !== currentUserId}
                onRemove={() => remove(member.user_id)}
                onPromote={() => promote(member.user_id)}
                isRemoving={removing}
                isPromoting={promoting}
              />
            ))}
          </div>
        )}
      </div>
    </>
  )
}

function MemberRow({
  member,
  isCurrentUser,
  canManage,
  onRemove,
  onPromote,
  isRemoving,
  isPromoting,
}: {
  member: GroupMember
  isCurrentUser: boolean
  canManage: boolean
  onRemove: () => void
  onPromote: () => void
  isRemoving: boolean
  isPromoting: boolean
}) {
  const user = member.user
  const displayName = user?.fullname || user?.username || 'Unknown'
  const initials = displayName.slice(0, 2).toUpperCase()
  const isAdmin = member.role === 'admin'

  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[#1e293b]/50">
      {/* Avatar */}
      <div className="w-9 h-9 rounded-full bg-[#1d4ed8] flex items-center justify-center shrink-0">
        {user?.avatar_url ? (
          <img src={user.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
        ) : (
          <span className="text-white text-xs font-semibold">{initials}</span>
        )}
      </div>

      {/* Name */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <p className="text-white text-sm truncate">{displayName}{isCurrentUser ? ' (you)' : ''}</p>
          {isAdmin && (
            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#1e3a5f] text-[#60a5fa] text-[10px] font-medium shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14l-5-4.87 6.91-1.01L12 2z" />
              </svg>
              Admin
            </span>
          )}
        </div>
        {user?.username && user.fullname && (
          <p className="text-slate-400 text-xs truncate">@{user.username}</p>
        )}
      </div>

      {/* Admin actions */}
      {canManage && (
        <div className="flex items-center gap-1 shrink-0">
          {!isAdmin && (
            <button
              onClick={onPromote}
              disabled={isPromoting}
              className="px-2 py-1 rounded text-[10px] font-medium text-[#60a5fa] hover:bg-[#1e3a5f] disabled:opacity-40 transition-colors"
              title="Promote to admin"
            >
              Promote
            </button>
          )}
          <button
            onClick={onRemove}
            disabled={isRemoving}
            className="px-2 py-1 rounded text-[10px] font-medium text-red-400 hover:bg-red-900/20 disabled:opacity-40 transition-colors"
          >
            Remove
          </button>
        </div>
      )}
    </div>
  )
}

/* ── Add member search ────────────────────────────────────────────────── */

function AddMemberView({
  groupId,
  existingMemberIds,
  onBack,
}: {
  groupId: string
  existingMemberIds: string[]
  onBack: () => void
}) {
  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search)
  const { data: contacts = [], isLoading } = useContacts(deferredSearch)
  const { mutate: addMember, isPending: adding, error } = useAddGroupMember(groupId)

  const available = contacts.filter((u) => !existingMemberIds.includes(u.id))

  const handleAdd = (user: AppUser) => {
    addMember({ userId: user.id }, { onSuccess: onBack })
  }

  return (
    <>
      <div className="flex items-center gap-3 px-4 py-3 shrink-0">
        <button
          onClick={onBack}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1e293b] transition-colors"
          aria-label="Back"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <h2 className="text-white font-semibold text-base">Add Member</h2>
      </div>

      <div className="px-4 pb-3 shrink-0">
        <div className="relative">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or username…"
            autoFocus
            className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-[#1e293b] border border-[#1e3a5f] text-white text-sm placeholder-slate-500 outline-none focus:border-[#1d4ed8] transition-colors"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-6">
        {search.length < 2 ? (
          <p className="text-slate-500 text-xs text-center mt-8">Type at least 2 characters to search</p>
        ) : isLoading ? (
          <div className="space-y-1 p-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-2.5">
                <div className="w-9 h-9 rounded-full bg-[#1e293b] animate-pulse shrink-0" />
                <div className="h-3.5 w-28 bg-[#1e293b] rounded animate-pulse" />
              </div>
            ))}
          </div>
        ) : available.length === 0 ? (
          <p className="text-slate-500 text-xs text-center mt-8">No users found</p>
        ) : (
          <div className="space-y-0.5">
            {available.map((user) => (
              <button
                key={user.id}
                onClick={() => handleAdd(user)}
                disabled={adding}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg hover:bg-[#1e293b]/50 disabled:opacity-60 transition-colors text-left"
              >
                <div className="w-9 h-9 rounded-full bg-[#1d4ed8] flex items-center justify-center shrink-0">
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <span className="text-white text-xs font-semibold">
                      {(user.fullname || user.username).slice(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm truncate">{user.fullname || user.username}</p>
                  {user.fullname && (
                    <p className="text-slate-400 text-xs truncate">@{user.username}</p>
                  )}
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 shrink-0">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </button>
            ))}
          </div>
        )}
        {error && (
          <p className="text-red-400 text-xs text-center mt-4">{(error as Error).message}</p>
        )}
      </div>
    </>
  )
}
