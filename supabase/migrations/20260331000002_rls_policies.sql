-- Phase 2: Row-Level Security Policies
-- Users can only see messages in groups they belong to, and their own 1:1 messages

-- Enable RLS on all tables
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.messages enable row level security;

-- ============================================================
-- GROUPS policies
-- ============================================================

-- Users can see groups they belong to
create policy "Users can view their groups"
  on public.groups for select
  using (
    id in (
      select group_id from public.group_members where user_id = auth.uid()
    )
  );

-- Any authenticated user can create a group
create policy "Authenticated users can create groups"
  on public.groups for insert
  with check (auth.uid() = created_by);

-- Only group admins can update group details
create policy "Group admins can update groups"
  on public.groups for update
  using (
    id in (
      select group_id from public.group_members
      where user_id = auth.uid() and role = 'admin'
    )
  );

-- Only group admins can delete groups
create policy "Group admins can delete groups"
  on public.groups for delete
  using (
    id in (
      select group_id from public.group_members
      where user_id = auth.uid() and role = 'admin'
    )
  );

-- ============================================================
-- GROUP_MEMBERS policies
-- ============================================================

-- Users can see members of groups they belong to
create policy "Users can view members of their groups"
  on public.group_members for select
  using (
    group_id in (
      select group_id from public.group_members where user_id = auth.uid()
    )
  );

-- Group admins can add members
create policy "Group admins can add members"
  on public.group_members for insert
  with check (
    group_id in (
      select group_id from public.group_members
      where user_id = auth.uid() and role = 'admin'
    )
  );

-- Group admins can remove members
create policy "Group admins can remove members"
  on public.group_members for delete
  using (
    group_id in (
      select group_id from public.group_members
      where user_id = auth.uid() and role = 'admin'
    )
  );

-- Members can leave groups (remove themselves)
create policy "Users can leave groups"
  on public.group_members for delete
  using (user_id = auth.uid());

-- ============================================================
-- MESSAGES policies
-- ============================================================

-- Users can see group messages for groups they belong to, and their own 1:1 messages
create policy "Users can view their messages"
  on public.messages for select
  using (
    -- 1:1 messages: user is sender or recipient
    (group_id is null and (sender_id = auth.uid() or recipient_id = auth.uid()))
    or
    -- Group messages: user is a member of the group
    (group_id is not null and group_id in (
      select group_id from public.group_members where user_id = auth.uid()
    ))
  );

-- Users can send 1:1 messages as themselves
create policy "Users can send direct messages"
  on public.messages for insert
  with check (
    sender_id = auth.uid()
    and group_id is null
    and recipient_id is not null
  );

-- Users can send group messages to groups they belong to
create policy "Users can send group messages"
  on public.messages for insert
  with check (
    sender_id = auth.uid()
    and group_id is not null
    and group_id in (
      select group_id from public.group_members where user_id = auth.uid()
    )
  );
