-- Phase 3: System messages — "Joined group" events

-- ── 1. Add message_type column ────────────────────────────────────────────────

alter table public.messages
  add column message_type text not null default 'user'
    check (message_type in ('user', 'system'));

-- ── 2. Trigger: insert "joined the group" system message on new member ────────

create or replace function public.handle_member_joined()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Skip for the group creator (auto-added by the group creation trigger)
  if NEW.user_id = (select created_by from public.groups where id = NEW.group_id) then
    return NEW;
  end if;

  insert into public.messages (group_id, sender_id, content, message_type)
  values (NEW.group_id, NEW.user_id, 'joined the group', 'system');

  return NEW;
end;
$$;

create trigger on_member_joined
  after insert on public.group_members
  for each row
  execute function public.handle_member_joined();
