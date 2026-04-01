import { useState, useDeferredValue } from 'react'
import { useNavigate } from 'react-router-dom'
import { useContacts } from '../../hooks/useContacts'
import { useCreateGroup } from '../../hooks/useCreateGroup'
import type { AppUser } from '../../types'

type Step = 'name' | 'members'

export function CreateGroupFlow() {
  const navigate = useNavigate()
  const createGroup = useCreateGroup()

  const [step, setStep] = useState<Step>('name')
  const [groupName, setGroupName] = useState('')
  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search)
  const [selectedMembers, setSelectedMembers] = useState<AppUser[]>([])

  const { data: contacts, isLoading: searchLoading } = useContacts(deferredSearch)

  const toggleMember = (user: AppUser) => {
    setSelectedMembers((prev) =>
      prev.some((m) => m.id === user.id)
        ? prev.filter((m) => m.id !== user.id)
        : [...prev, user],
    )
  }

  const handleCreate = async () => {
    const result = await createGroup.mutateAsync({
      name: groupName.trim(),
      memberIds: selectedMembers.map((m) => m.id),
    })
    navigate(`/chat/group/${result.id}`, { replace: true })
  }

  return (
    <div className="flex flex-col h-full bg-[#0a1628]">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-3 bg-[#0f172a] border-b border-[#1e3a5f] shrink-0">
        <button
          onClick={() => (step === 'members' ? setStep('name') : navigate(-1))}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1e293b] transition-colors"
          aria-label="Back"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <h1 className="text-white font-semibold text-base">
          {step === 'name' ? 'New Group' : 'Add Members'}
        </h1>
      </div>

      {step === 'name' ? (
        <NameStep
          groupName={groupName}
          setGroupName={setGroupName}
          onNext={() => setStep('members')}
        />
      ) : (
        <MembersStep
          search={search}
          setSearch={setSearch}
          contacts={contacts ?? []}
          searchLoading={searchLoading}
          selectedMembers={selectedMembers}
          toggleMember={toggleMember}
          onCreate={handleCreate}
          isCreating={createGroup.isPending}
          error={createGroup.error?.message}
        />
      )}
    </div>
  )
}

/* ── Step 1: Group Name ─────────────────────────────────────────────── */

function NameStep({
  groupName,
  setGroupName,
  onNext,
}: {
  groupName: string
  setGroupName: (v: string) => void
  onNext: () => void
}) {
  return (
    <div className="flex-1 flex flex-col px-4 pt-6">
      <label htmlFor="group-name" className="text-slate-400 text-xs font-medium mb-2">
        GROUP NAME
      </label>
      <input
        id="group-name"
        type="text"
        value={groupName}
        onChange={(e) => setGroupName(e.target.value)}
        placeholder="e.g. Alpha Unit, Night Shift"
        autoFocus
        maxLength={100}
        className="w-full px-3 py-2.5 rounded-lg bg-[#1e293b] border border-[#1e3a5f] text-white text-sm placeholder-slate-500 outline-none focus:border-[#1d4ed8] transition-colors"
        onKeyDown={(e) => {
          if (e.key === 'Enter' && groupName.trim()) onNext()
        }}
      />
      <p className="text-slate-500 text-xs mt-2">
        Choose a name that your team will recognize.
      </p>

      <div className="mt-auto pb-6">
        <button
          onClick={onNext}
          disabled={!groupName.trim()}
          className="w-full py-2.5 rounded-lg bg-[#1d4ed8] text-white text-sm font-medium hover:bg-[#2563eb] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  )
}

/* ── Step 2: Add Members ────────────────────────────────────────────── */

function MembersStep({
  search,
  setSearch,
  contacts,
  searchLoading,
  selectedMembers,
  toggleMember,
  onCreate,
  isCreating,
  error,
}: {
  search: string
  setSearch: (v: string) => void
  contacts: AppUser[]
  searchLoading: boolean
  selectedMembers: AppUser[]
  toggleMember: (u: AppUser) => void
  onCreate: () => void
  isCreating: boolean
  error?: string
}) {
  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Search input */}
      <div className="px-4 pt-4 pb-2 shrink-0">
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

      {/* Selected members chips */}
      {selectedMembers.length > 0 && (
        <div className="px-4 pb-2 flex flex-wrap gap-1.5 shrink-0">
          {selectedMembers.map((m) => (
            <button
              key={m.id}
              onClick={() => toggleMember(m)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#1d4ed8] text-white text-xs font-medium hover:bg-[#2563eb] transition-colors"
            >
              {m.fullname || m.username}
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          ))}
        </div>
      )}

      {/* Contact results */}
      <div className="flex-1 overflow-y-auto px-2">
        {search.length < 2 ? (
          <p className="text-slate-500 text-xs text-center mt-8">
            Type at least 2 characters to search
          </p>
        ) : searchLoading ? (
          <div className="space-y-1 p-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-lg">
                <div className="w-9 h-9 rounded-full bg-[#1e293b] animate-pulse shrink-0" />
                <div className="h-3.5 w-28 bg-[#1e293b] rounded animate-pulse" />
              </div>
            ))}
          </div>
        ) : contacts.length === 0 ? (
          <p className="text-slate-500 text-xs text-center mt-8">
            No users found for "{search}"
          </p>
        ) : (
          <div className="space-y-0.5">
            {contacts.map((user) => {
              const selected = selectedMembers.some((m) => m.id === user.id)
              return (
                <button
                  key={user.id}
                  onClick={() => toggleMember(user)}
                  className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg transition-colors text-left ${
                    selected ? 'bg-[#1e293b]' : 'hover:bg-[#1e293b]/50'
                  }`}
                >
                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-full bg-[#1d4ed8] flex items-center justify-center shrink-0">
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <span className="text-white text-xs font-semibold">
                        {(user.fullname || user.username).slice(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>

                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm truncate">{user.fullname || user.username}</p>
                    {user.fullname && (
                      <p className="text-slate-400 text-xs truncate">@{user.username}</p>
                    )}
                  </div>

                  {/* Checkbox */}
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                    selected
                      ? 'bg-[#1d4ed8] border-[#1d4ed8]'
                      : 'border-slate-500'
                  }`}>
                    {selected && (
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <p className="px-4 py-2 text-red-400 text-xs text-center shrink-0">{error}</p>
      )}

      {/* Create button */}
      <div className="px-4 py-4 border-t border-[#1e3a5f] shrink-0">
        <button
          onClick={onCreate}
          disabled={isCreating}
          className="w-full py-2.5 rounded-lg bg-[#1d4ed8] text-white text-sm font-medium hover:bg-[#2563eb] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {isCreating ? 'Creating…' : `Create Group${selectedMembers.length > 0 ? ` (${selectedMembers.length} member${selectedMembers.length !== 1 ? 's' : ''})` : ''}`}
        </button>
      </div>
    </div>
  )
}
