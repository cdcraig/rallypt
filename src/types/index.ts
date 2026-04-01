export interface AppUser {
  id: string
  email?: string
  username: string
  fullname: string
  avatar_url: string | null
}

export interface Group {
  id: string
  name: string
  icon: string | null
  created_by: string
  department_id: string | null
  created_at: string
}

export interface GroupMember {
  group_id: string
  user_id: string
  role: 'admin' | 'member'
  joined_at: string
  user?: AppUser
}

export interface GroupWithMeta extends Group {
  member_count: number
}

export interface Message {
  id: string
  created_at: string
  sender_id: string
  group_id: string | null
  recipient_id: string | null
  content: string
  sender?: AppUser
}

/** Unified chat list entry — represents either a group or a 1:1 conversation */
export interface ChatEntry {
  id: string // group_id or the other user's id
  type: 'group' | 'dm'
  name: string
  avatarUrl: string | null
  lastMessage: string | null
  lastMessageAt: string | null
  unreadCount: number
}
