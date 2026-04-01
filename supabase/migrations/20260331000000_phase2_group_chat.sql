-- Phase 2: Group Chat — Tables, Indexes, RLS Policies, and Realtime
-- Run in Supabase SQL Editor or via `supabase db push`

-- ============================================================
-- 1. Create tables
-- ============================================================

CREATE TABLE groups (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT        NOT NULL,
  icon          TEXT,                          -- nullable storage URL
  created_by    UUID        NOT NULL REFERENCES auth.users (id),
  department_id UUID,                          -- future: FK to departments table
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE group_members (
  group_id  UUID        NOT NULL REFERENCES groups (id) ON DELETE CASCADE,
  user_id   UUID        NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  role      TEXT        NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  PRIMARY KEY (group_id, user_id)
);

-- ============================================================
-- 2. Indexes
-- ============================================================

-- Look up all groups a user belongs to (most common query path)
CREATE INDEX group_members_user_id_idx ON group_members (user_id);

-- Look up all members of a group
CREATE INDEX group_members_group_id_idx ON group_members (group_id);

-- Look up groups created by a specific user
CREATE INDEX groups_created_by_idx ON groups (created_by);

-- ============================================================
-- 3. Extend messages for group chat
-- ============================================================

-- Make conversation_id nullable (was implicitly required for 1-on-1)
ALTER TABLE messages
  ALTER COLUMN conversation_id DROP NOT NULL;

-- Add group_id — NULL = 1-on-1 message, non-null = group message
ALTER TABLE messages
  ADD COLUMN group_id UUID REFERENCES groups (id);

-- Ensure a message belongs to exactly one context: conversation or group
ALTER TABLE messages
  ADD CONSTRAINT messages_conversation_or_group CHECK (
    (conversation_id IS NOT NULL AND group_id IS NULL) OR
    (conversation_id IS NULL  AND group_id IS NOT NULL)
  );

-- Index for paginated group message fetch (mirrors the existing conversation index)
CREATE INDEX messages_group_id_created_at_idx ON messages (group_id, created_at DESC);

-- ============================================================
-- 4. Enable RLS
-- ============================================================

ALTER TABLE groups       ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 5. Enable Realtime
-- ============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE groups;
ALTER PUBLICATION supabase_realtime ADD TABLE group_members;

-- ============================================================
-- 6. RLS — groups
-- ============================================================

-- SELECT: members can view groups they belong to
CREATE POLICY "Members can view their groups"
  ON groups FOR SELECT
  USING (
    id IN (
      SELECT group_id FROM group_members
      WHERE user_id = auth.uid()
    )
  );

-- INSERT: any authenticated user can create a group
CREATE POLICY "Authenticated users can create groups"
  ON groups FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    AND created_by = auth.uid()
  );

-- UPDATE: only group admins can update group details (name, icon)
CREATE POLICY "Group admins can update their groups"
  ON groups FOR UPDATE
  USING (
    id IN (
      SELECT group_id FROM group_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- DELETE: only group admins can delete a group
CREATE POLICY "Group admins can delete their groups"
  ON groups FOR DELETE
  USING (
    id IN (
      SELECT group_id FROM group_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================
-- 7. RLS — group_members
-- ============================================================

-- SELECT: members can see who else is in their groups
CREATE POLICY "Members can view group membership"
  ON group_members FOR SELECT
  USING (
    group_id IN (
      SELECT group_id FROM group_members
      WHERE user_id = auth.uid()
    )
  );

-- INSERT: only admins can add members (bootstrap trigger handles creator)
CREATE POLICY "Admins can add group members"
  ON group_members FOR INSERT
  WITH CHECK (
    group_id IN (
      SELECT group_id FROM group_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- UPDATE: only admins can change member roles
CREATE POLICY "Admins can update member roles"
  ON group_members FOR UPDATE
  USING (
    group_id IN (
      SELECT group_id FROM group_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- DELETE: admins can remove members; members can leave themselves
CREATE POLICY "Admins can remove members, members can leave"
  ON group_members FOR DELETE
  USING (
    user_id = auth.uid()
    OR group_id IN (
      SELECT group_id FROM group_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================
-- 8. RLS — messages (group scope)
-- ============================================================

-- SELECT: members can read messages in their groups
CREATE POLICY "Users can view messages in their groups"
  ON messages FOR SELECT
  USING (
    group_id IN (
      SELECT group_id FROM group_members
      WHERE user_id = auth.uid()
    )
  );

-- INSERT: sender must be current user and a member of the group
CREATE POLICY "Users can insert messages in their groups"
  ON messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND group_id IN (
      SELECT group_id FROM group_members
      WHERE user_id = auth.uid()
    )
  );

-- ============================================================
-- 9. Trigger: auto-add group creator as admin
-- ============================================================
-- When a group is created the creator is not yet in group_members,
-- which would block the membership-gated policies. This trigger
-- inserts the creator as an admin immediately after the group row lands.

CREATE OR REPLACE FUNCTION add_group_creator_as_admin()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO group_members (group_id, user_id, role)
  VALUES (NEW.id, NEW.created_by, 'admin');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_add_group_creator
  AFTER INSERT ON groups
  FOR EACH ROW
  EXECUTE FUNCTION add_group_creator_as_admin();
