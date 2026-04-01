-- Auto-add the group creator as an admin member when a group is created

create or replace function public.handle_new_group()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.group_members (group_id, user_id, role)
  values (new.id, new.created_by, 'admin');
  return new;
end;
$$;

create trigger on_group_created
  after insert on public.groups
  for each row
  execute function public.handle_new_group();
