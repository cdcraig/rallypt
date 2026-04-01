-- Phase 2: Group Chat Schema
-- Creates groups, group_members, and extends existing messages table with group_id

-- Groups table
create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  icon_url text,
  created_by uuid not null references auth.users (id) on delete cascade,
  department_id uuid,
  created_at timestamptz not null default now()
);

-- Group members table
create table if not exists public.group_members (
  group_id uuid not null references public.groups (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'member' check (role in ('admin', 'member')),
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

-- Extend existing messages table with nullable group_id for group messages
-- null = 1:1 direct message (existing behavior), set = group message
alter table public.messages
  add column if not exists group_id uuid references public.groups (id) on delete cascade;

-- Existing rows have recipient_id set and group_id null (1:1 messages), which is valid.
-- Make recipient_id nullable so group messages don't require one.
alter table public.messages
  alter column recipient_id drop not null;

-- A message is either 1:1 (recipient_id set) or group (group_id set), never both
alter table public.messages
  add constraint message_target_check check (
    (recipient_id is not null and group_id is null) or
    (recipient_id is null and group_id is not null)
  );

-- Indexes
create index if not exists idx_messages_group_id on public.messages (group_id) where group_id is not null;
create index if not exists idx_group_members_user_id on public.group_members (user_id);
