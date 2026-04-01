import { useNavigate } from 'react-router-dom'
import { HiArrowLeft, HiCog6Tooth, HiBellSlash, HiBell, HiMoon, HiSun } from 'react-icons/hi2'
import { useUi } from '../../contexts/UiContext'
import { useUser } from '../authentication/useUser'
import { useChatList } from '../../hooks/useChatList'
import { useNotificationPrefs } from '../../hooks/useNotificationPrefs'
import UserAvatar from '../../components/UserAvatar'

const APP_VERSION = '0.1.0'

// ─── Pill Toggle ──────────────────────────────────────────────────────────────
function PillToggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${
        checked ? 'bg-violet-600' : 'bg-slate-300 dark:bg-slate-600'
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200 mt-0.5 ${
          checked ? 'translate-x-5' : 'translate-x-0.5'
        }`}
      />
    </button>
  )
}

// ─── Section wrapper ──────────────────────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h2 className="mb-3 px-1 text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
        {title}
      </h2>
      <div className="rounded-2xl bg-white dark:bg-[#1e293b] divide-y divide-slate-100 dark:divide-slate-700/60 overflow-hidden shadow-sm">
        {children}
      </div>
    </div>
  )
}

// ─── Row wrappers ─────────────────────────────────────────────────────────────
function SettingsRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3.5">
      {children}
    </div>
  )
}

function SettingsLabel({ icon, label, sub }: { icon?: React.ReactNode; label: string; sub?: string }) {
  return (
    <div className="flex items-center gap-3 min-w-0">
      {icon && (
        <span className="text-slate-500 dark:text-slate-400 text-lg shrink-0">{icon}</span>
      )}
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">{label}</p>
        {sub && <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export function SettingsPage() {
  const navigate = useNavigate()
  const { isDarkMode, toggleDarkMode, openAccountView } = useUi()
  const { user } = useUser()
  const { data: chatEntries = [] } = useChatList()
  const { isChatMuted, muteChat, unmuteChat, quietHours, setQuietHours } =
    useNotificationPrefs()

  const userData = user?.user_metadata as
    | { fullname?: string; username?: string; avatar_url?: string }
    | undefined

  const groupChats = chatEntries.filter((e) => e.type === 'group')

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a1628]">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3 bg-white dark:bg-[#0f172a] border-b border-slate-100 dark:border-slate-800">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Go back"
        >
          <HiArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <HiCog6Tooth className="w-5 h-5 text-slate-400 dark:text-slate-500" />
          <h1 className="text-base font-semibold text-slate-800 dark:text-slate-100">Settings</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">

        {/* ── Profile section ── */}
        <Section title="Profile">
          <div className="px-4 py-4 flex items-center gap-4">
            <UserAvatar
              src={userData?.avatar_url}
              name={userData?.fullname || userData?.username || ''}
              size={56}
            />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-800 dark:text-slate-100 truncate">
                {userData?.fullname || 'No name set'}
              </p>
              {userData?.username && (
                <p className="text-sm text-slate-400 dark:text-slate-500 mt-0.5">
                  @{userData.username}
                </p>
              )}
            </div>
            <button
              onClick={openAccountView}
              className="shrink-0 px-3.5 py-1.5 text-sm font-medium rounded-xl bg-violet-600 text-white hover:bg-violet-700 transition-colors"
            >
              Edit Profile
            </button>
          </div>
        </Section>

        {/* ── Notifications section ── */}
        <Section title="Notifications">
          {/* Quiet hours toggle */}
          <SettingsRow>
            <SettingsLabel
              icon={quietHours.enabled ? <HiBellSlash /> : <HiBell />}
              label="Quiet Hours"
              sub={
                quietHours.enabled
                  ? `${quietHours.start} – ${quietHours.end}`
                  : 'Silence notifications during set hours'
              }
            />
            <PillToggle
              checked={quietHours.enabled}
              onChange={() =>
                setQuietHours({ ...quietHours, enabled: !quietHours.enabled })
              }
            />
          </SettingsRow>

          {/* Time pickers — only visible when quiet hours is on */}
          {quietHours.enabled && (
            <div className="px-4 py-3 flex items-center gap-4 bg-slate-50/50 dark:bg-slate-800/30">
              <div className="flex flex-col gap-0.5">
                <label className="text-xs text-slate-400 dark:text-slate-500">Start</label>
                <input
                  type="time"
                  value={quietHours.start}
                  onChange={(e) =>
                    setQuietHours({ ...quietHours, start: e.target.value })
                  }
                  className="text-sm text-slate-800 dark:text-slate-100 bg-transparent border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
              <span className="text-slate-400 dark:text-slate-500 text-sm mt-4">to</span>
              <div className="flex flex-col gap-0.5">
                <label className="text-xs text-slate-400 dark:text-slate-500">End</label>
                <input
                  type="time"
                  value={quietHours.end}
                  onChange={(e) =>
                    setQuietHours({ ...quietHours, end: e.target.value })
                  }
                  className="text-sm text-slate-800 dark:text-slate-100 bg-transparent border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
            </div>
          )}
        </Section>

        {/* ── Muted chats section (only when there are groups) ── */}
        {groupChats.length > 0 && (
          <Section title="Muted Chats">
            {groupChats.map((chat) => {
              const muted = isChatMuted(chat.id)
              return (
                <SettingsRow key={chat.id}>
                  <SettingsLabel
                    label={chat.name}
                    sub={muted ? 'Muted' : 'Notifications on'}
                  />
                  <PillToggle
                    checked={muted}
                    onChange={() =>
                      muted ? unmuteChat(chat.id) : muteChat(chat.id)
                    }
                  />
                </SettingsRow>
              )
            })}
          </Section>
        )}

        {/* ── Appearance section ── */}
        <Section title="Appearance">
          <SettingsRow>
            <SettingsLabel
              icon={isDarkMode ? <HiMoon /> : <HiSun />}
              label="Dark Mode"
              sub={isDarkMode ? 'Currently dark' : 'Currently light'}
            />
            <PillToggle checked={isDarkMode} onChange={toggleDarkMode} />
          </SettingsRow>
        </Section>

        {/* ── About section ── */}
        <Section title="About">
          <SettingsRow>
            <SettingsLabel label="App" />
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              RallyPT
            </span>
          </SettingsRow>
          <SettingsRow>
            <SettingsLabel label="Version" />
            <span className="text-sm text-slate-500 dark:text-slate-400">
              v{APP_VERSION}
            </span>
          </SettingsRow>
          <div className="px-4 py-3">
            <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed">
              Secure communications for law enforcement teams. Built for the field.
            </p>
          </div>
        </Section>

      </div>
    </div>
  )
}

export default SettingsPage
