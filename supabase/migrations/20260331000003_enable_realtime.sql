-- Phase 2: Enable Supabase Realtime on chat tables
-- This allows clients to subscribe to INSERT/UPDATE/DELETE events

alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.groups;
alter publication supabase_realtime add table public.group_members;
