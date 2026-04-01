import supabase from '../supabase'
import type { Group, GroupMember, GroupWithMeta, Message } from '../../types'

const GROUP_SELECT = 'id, name, icon_url, created_by, department_id, created_at'
const MESSAGE_SELECT = `
  id, created_at, sender_id, group_id, content,
  sender:users!sender_id(id, fullname, username, avatar_url)
`
const MEMBER_SELECT = `
  group_id, user_id, role, joined_at,
  user:users!user_id(id, fullname, username, avatar_url)
`

// ── Read ──────────────────────────────────────────────────────────────────────

/**
 * Fetch a single group by ID with its member count.
 */
export async function fetchGroupInfo(groupId: string): Promise<GroupWithMeta> {
  const { data, error } = await supabase
    .from('groups')
    .select(GROUP_SELECT)
    .eq('id', groupId)
    .single()

  if (error) throw error

  const { count } = await supabase
    .from('group_members')
    .select('*', { count: 'exact', head: true })
    .eq('group_id', groupId)

  return { ...(data as unknown as Group), member_count: count ?? 0 }
}

/**
 * Fetch all groups the given user belongs to, with member counts.
 */
export async function fetchUserGroups(userId: string): Promise<GroupWithMeta[]> {
  const { data: memberships, error: memberError } = await supabase
    .from('group_members')
    .select('group_id')
    .eq('user_id', userId)

  if (memberError) throw memberError

  const groupIds = memberships.map((m) => m.group_id)
  if (groupIds.length === 0) return []

  const { data: groups, error: groupError } = await supabase
    .from('groups')
    .select(GROUP_SELECT)
    .in('id', groupIds)
    .order('created_at', { ascending: false })

  if (groupError) throw groupError

  const countResults = await Promise.all(
    groupIds.map((id) =>
      supabase
        .from('group_members')
        .select('*', { count: 'exact', head: true })
        .eq('group_id', id)
        .then(({ count }) => [id, count ?? 0] as const)
    )
  )
  const countMap = Object.fromEntries(countResults)

  return (groups as unknown as Group[]).map((g) => ({
    ...g,
    member_count: countMap[g.id] ?? 0,
  }))
}

/**
 * Fetch all members of a group, joined with their user profile.
 */
export async function fetchGroupMembers(groupId: string): Promise<GroupMember[]> {
  const { data, error } = await supabase
    .from('group_members')
    .select(MEMBER_SELECT)
    .eq('group_id', groupId)
    .order('joined_at', { ascending: true })

  if (error) throw error
  return (data as unknown) as GroupMember[]
}

/**
 * Fetch a page of messages for a group (newest-first within the page).
 * pageParam is a zero-based page index; PAGE_SIZE messages per page.
 */
export const GROUP_MESSAGES_PAGE_SIZE = 30

export async function fetchGroupMessages({
  groupId,
  pageParam = 0,
}: {
  groupId: string
  pageParam?: number
}): Promise<Message[]> {
  const from = pageParam * GROUP_MESSAGES_PAGE_SIZE
  const to = from + GROUP_MESSAGES_PAGE_SIZE - 1

  const { data, error } = await supabase
    .from('messages')
    .select(MESSAGE_SELECT)
    .eq('group_id', groupId)
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) throw error
  return ((data as unknown) as Message[]).reverse()
}

// ── Write ─────────────────────────────────────────────────────────────────────

/**
 * Create a new group. The database trigger automatically adds the creator
 * as an admin member, so no separate addGroupMember call is needed.
 */
export async function createGroup({
  name,
  createdBy,
  departmentId = null,
  iconUrl = null,
}: {
  name: string
  createdBy: string
  departmentId?: string | null
  iconUrl?: string | null
}): Promise<Group> {
  const { data, error } = await supabase
    .from('groups')
    .insert({ name, created_by: createdBy, department_id: departmentId, icon_url: iconUrl })
    .select(GROUP_SELECT)
    .single()

  if (error) throw error
  return (data as unknown) as Group
}

/**
 * Add a user to a group. Requires the caller to be a group admin (enforced by RLS).
 */
export async function addGroupMember({
  groupId,
  userId,
  role = 'member',
}: {
  groupId: string
  userId: string
  role?: 'admin' | 'member'
}): Promise<GroupMember> {
  const { data, error } = await supabase
    .from('group_members')
    .insert({ group_id: groupId, user_id: userId, role })
    .select(MEMBER_SELECT)
    .single()

  if (error) throw error
  return (data as unknown) as GroupMember
}

/**
 * Promote a group member to admin. Requires the caller to be a group admin (enforced by RLS).
 */
export async function updateGroupMemberRole({
  groupId,
  userId,
  role,
}: {
  groupId: string
  userId: string
  role: 'admin' | 'member'
}): Promise<void> {
  const { error } = await supabase
    .from('group_members')
    .update({ role })
    .eq('group_id', groupId)
    .eq('user_id', userId)

  if (error) throw error
}

/**
 * Remove a user from a group. Admins can remove anyone; members can remove
 * themselves (leave group). Both cases are enforced by RLS.
 */
export async function removeGroupMember({
  groupId,
  userId,
}: {
  groupId: string
  userId: string
}): Promise<void> {
  const { error } = await supabase
    .from('group_members')
    .delete()
    .eq('group_id', groupId)
    .eq('user_id', userId)

  if (error) throw error
}

/**
 * Send a message to a group. Returns the inserted message with sender details.
 */
export async function sendGroupMessage({
  groupId,
  content,
  senderId,
}: {
  groupId: string
  content: string
  senderId: string
}): Promise<Message> {
  const { data, error } = await supabase
    .from('messages')
    .insert({ group_id: groupId, content, sender_id: senderId })
    .select(MESSAGE_SELECT)
    .single()

  if (error) throw error
  return (data as unknown) as Message
}
