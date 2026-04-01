-- Read receipts: track last-read message per user per conversation/group
CREATE TABLE IF NOT EXISTS read_receipts (
  id                    UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id               UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id       UUID        REFERENCES conversations(id) ON DELETE CASCADE,
  group_id              UUID        REFERENCES groups(id) ON DELETE CASCADE,
  last_read_message_id  UUID        REFERENCES messages(id) ON DELETE SET NULL,
  read_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT read_receipts_context_check CHECK (
    (conversation_id IS NOT NULL AND group_id IS NULL)
    OR
    (conversation_id IS NULL AND group_id IS NOT NULL)
  ),
  CONSTRAINT read_receipts_user_group_unique UNIQUE (user_id, group_id),
  CONSTRAINT read_receipts_user_conv_unique  UNIQUE (user_id, conversation_id)
);

CREATE INDEX IF NOT EXISTS idx_read_receipts_group
  ON read_receipts(group_id) WHERE group_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_read_receipts_conversation
  ON read_receipts(conversation_id) WHERE conversation_id IS NOT NULL;

-- RLS
ALTER TABLE read_receipts ENABLE ROW LEVEL SECURITY;

-- Users can view receipts for their own conversations and groups
CREATE POLICY "read_receipts_select" ON read_receipts
  FOR SELECT USING (
    user_id = auth.uid()
    OR (
      group_id IS NOT NULL AND group_id IN (
        SELECT group_id FROM group_members WHERE user_id = auth.uid()
      )
    )
    OR (
      conversation_id IS NOT NULL AND conversation_id IN (
        SELECT id FROM conversations
        WHERE user1_id = auth.uid() OR user2_id = auth.uid()
      )
    )
  );

-- Users can only insert their own receipts
CREATE POLICY "read_receipts_insert" ON read_receipts
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can only update their own receipts
CREATE POLICY "read_receipts_update" ON read_receipts
  FOR UPDATE USING (user_id = auth.uid());

-- Enable realtime so read receipt updates broadcast to participants
ALTER PUBLICATION supabase_realtime ADD TABLE read_receipts;
