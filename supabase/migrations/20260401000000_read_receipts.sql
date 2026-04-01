-- Phase 3: Read receipts
-- Tracks which users have read which messages

CREATE TABLE IF NOT EXISTS public.message_reads (
  message_id UUID    NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id    UUID    NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  read_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (message_id, user_id)
);

-- Fast lookup: all readers for a set of message IDs
CREATE INDEX message_reads_message_id_idx ON public.message_reads(message_id);

-- RLS
ALTER TABLE public.message_reads ENABLE ROW LEVEL SECURITY;

-- Users can insert their own read receipts
CREATE POLICY "users_insert_own_reads" ON public.message_reads
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Group members can view read receipts for messages in their groups
CREATE POLICY "members_select_reads" ON public.message_reads
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.messages m
      JOIN public.group_members gm ON gm.group_id = m.group_id
      WHERE m.id = message_reads.message_id
        AND gm.user_id = auth.uid()
    )
  );

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_reads;
