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
  recipient_id?: string | null
  group_id?: string | null
  content: string
  sender?: AppUser
}
