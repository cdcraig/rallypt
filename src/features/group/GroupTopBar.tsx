import { useNavigate } from 'react-router-dom'
import type { GroupWithMeta } from '../../types'

interface Props {
  group: GroupWithMeta | undefined
  isLoading: boolean
  onMembersPress?: () => void
}

export function GroupTopBar({ group, isLoading, onMembersPress }: Props) {
  const navigate = useNavigate()

  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-[#0f172a] border-b border-[#1e3a5f] shrink-0">
      <button
        onClick={() => navigate(-1)}
        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1e293b] transition-colors"
        aria-label="Back"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>

      {/* Group icon / initials */}
      <div className="w-9 h-9 rounded-full bg-[#1d4ed8] flex items-center justify-center shrink-0">
        {group?.icon ? (
          <img src={group.icon} alt={group.name} className="w-full h-full rounded-full object-cover" />
        ) : (
          <span className="text-white text-sm font-semibold">
            {group?.name?.slice(0, 2).toUpperCase() ?? '??'}
          </span>
        )}
      </div>

      <button
        className="flex-1 min-w-0 text-left"
        onClick={onMembersPress}
        disabled={!onMembersPress}
      >
        {isLoading ? (
          <div className="space-y-1.5">
            <div className="h-3.5 w-32 bg-[#1e293b] rounded animate-pulse" />
            <div className="h-2.5 w-20 bg-[#1e293b] rounded animate-pulse" />
          </div>
        ) : (
          <>
            <p className="text-white font-semibold text-sm truncate leading-tight">{group?.name}</p>
            <p className="text-slate-400 text-xs leading-tight">
              {group?.member_count ?? 0} member{(group?.member_count ?? 0) !== 1 ? 's' : ''}
            </p>
          </>
        )}
      </button>
    </div>
  )
}
