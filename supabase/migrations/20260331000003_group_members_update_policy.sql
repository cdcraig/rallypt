-- Allow group admins to update member roles (promote/demote)
create policy "Group admins can update member roles"
  on public.group_members for update
  using (
    group_id in (
      select group_id from public.group_members
      where user_id = auth.uid() and role = 'admin'
    )
  );
