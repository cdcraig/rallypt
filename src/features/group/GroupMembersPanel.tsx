import { useState } from 'react'
import type { GroupMember, AppUser } from '../../types'
import { useRemoveGroupMember, usePromoteMember } from '../../hooks/useGroupMemberActions'

interface Props {
  groupId: string
  members: GroupMember[]
  currentUser: AppUser | null
  isCurrentUserAdmin: boolean
  onClose: () => void
  onOpenAddMember: () => void
}

export function GroupMembersPanel({
  groupId,
  members,
  currentUser,
  isCurrentUserAdmin,
  onClose,
  onOpenAddMember,
}: Props) {
  const { mutate: removeMember } = useRemoveGroupMember(groupId)
  const { mutate: promoteMember } = usePromoteMember(groupId)
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null)

  function handleRoleToggle(userId: string, currentRole: 'admin' | 'member') {
    promoteMember({ userId, role: currentRole === 'admin' ? 'member' : 'admin' })
  }

  function handleRemove(userId: string) {
    if (confirmRemove === userId) {
      removeMember(userId)
      setConfirmRemove(null)
    } else {
      setConfirmRemove(userId)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      {/* Panel */}
      <div className="relative ml-auto w-full max-w-sm h-full bg-[#0f172a] flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e3a5f]">
          <h2 className="text-white font-semibold text-base">
            Members ({members.length})
          </h2>
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

        {/* Add member button (admin only) */}
        {isCurrentUserAdmin && (
          <button
            onClick={onOpenAddMember}
            className="flex items-center gap-3 px-4 py-3 text-[#60a5fa] hover:bg-[#1e293b] transition-colors"
          >
            <div className="w-9 h-9 rounded-full bg-[#1d4ed8]/20 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4-4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" />
              </svg>
            </div>
            <span className="text-sm font-medium">Add Member</span>
          </button>
        )}

        {/* Member list */}
        <div className="flex-1 overflow-y-auto">
          {members.map((member) => {
            const user = member.user
            const isMe = user?.id === currentUser?.id
            const initials = (user?.fullname ?? user?.username ?? '??').slice(0, 2).toUpperCase()

            return (
              <div
                key={member.user_id}
                className="flex items-center gap-3 px-4 py-3 hover:bg-[#1e293b]/50 transition-colors group"
              >
                {/* Avatar */}
                <div className="w-9 h-9 rounded-full bg-[#1e293b] flex items-center justify-center shrink-0">
                  {user?.avatar_url ? (
                    <img src={user.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <span className="text-slate-300 text-xs font-semibold">{initials}</span>
                  )}
                </div>

                {/* Name + role */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-white text-sm font-medium truncate">
                      {user?.fullname ?? user?.username ?? 'Unknown'}
                    </span>
                    {isMe && (
                      <span className="text-slate-500 text-xs">You</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 text-xs">@{user?.username ?? '—'}</span>
                    {member.role === 'admin' && (
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-[#60a5fa] bg-[#1d4ed8]/20 px-1.5 py-0.5 rounded">
                        Admin
                      </span>
                    )}
                  </div>
                </div>

                {/* Admin actions */}
                {isCurrentUserAdmin && !isMe && (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {/* Promote / Demote */}
                    <button
                      onClick={() => handleRoleToggle(member.user_id, member.role)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-[#60a5fa] hover:bg-[#1e293b] transition-colors"
                      title={member.role === 'admin' ? 'Remove admin' : 'Make admin'}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        {member.role === 'admin' ? (
                          <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="M9 12l2 2 4-4" /></>
                        ) : (
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        )}
                      </svg>
                    </button>

                    {/* Remove */}
                    <button
                      onClick={() => handleRemove(member.user_id)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        confirmRemove === member.user_id
                          ? 'text-red-400 bg-red-400/10'
                          : 'text-slate-400 hover:text-red-400 hover:bg-[#1e293b]'
                      }`}
                      title={confirmRemove === member.user_id ? 'Click again to confirm' : 'Remove member'}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4-4v2" /><circle cx="9" cy="7" r="4" /><line x1="17" y1="11" x2="22" y2="11" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
