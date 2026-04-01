-- Phase 3: Pinned messages
-- Adds pinned_at + pinned_by to messages; RLS allows group admins or message sender to pin.

ALTER TABLE public.messages
  ADD COLUMN pinned_at TIMESTAMPTZ,
  ADD COLUMN pinned_by UUID REFERENCES auth.users(id);

-- Group admins or message sender can pin/unpin group messages
CREATE POLICY "Group admins and senders can pin messages"
  ON public.messages FOR UPDATE
  USING (
    group_id IS NOT NULL
    AND group_id IN (
      SELECT group_id FROM public.group_members WHERE user_id = auth.uid()
    )
    AND (
      sender_id = auth.uid()
      OR group_id IN (
        SELECT group_id FROM public.group_members
        WHERE user_id = auth.uid() AND role = 'admin'
      )
    )
  )
  WITH CHECK (
    group_id IS NOT NULL
    AND group_id IN (
      SELECT group_id FROM public.group_members WHERE user_id = auth.uid()
    )
    AND (
      sender_id = auth.uid()
      OR group_id IN (
        SELECT group_id FROM public.group_members
        WHERE user_id = auth.uid() AND role = 'admin'
      )
    )
  );
