-- Contact requests table
-- Tracks add-contact requests between users. Status: pending → accepted | declined.
-- A "contact" is an accepted request. Queried bi-directionally via OR on from/to.

CREATE TABLE IF NOT EXISTS contact_requests (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  from_user_id UUID       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_user_id   UUID       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status       TEXT       NOT NULL DEFAULT 'pending'
                          CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at   TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE (from_user_id, to_user_id),
  CHECK  (from_user_id != to_user_id)
);

-- Row-level security
ALTER TABLE contact_requests ENABLE ROW LEVEL SECURITY;

-- Both parties can read their own requests
CREATE POLICY "view_own_contact_requests"
  ON contact_requests FOR SELECT
  USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

-- Only the sender can insert (from_user_id must match the authed user)
CREATE POLICY "send_contact_requests"
  ON contact_requests FOR INSERT
  WITH CHECK (auth.uid() = from_user_id);

-- Only the recipient can accept/decline
CREATE POLICY "respond_to_contact_requests"
  ON contact_requests FOR UPDATE
  USING (auth.uid() = to_user_id);

-- Sender can withdraw a pending request
CREATE POLICY "withdraw_contact_requests"
  ON contact_requests FOR DELETE
  USING (auth.uid() = from_user_id AND status = 'pending');

-- Index for fast lookup of incoming pending requests
CREATE INDEX IF NOT EXISTS idx_contact_requests_to_user_pending
  ON contact_requests (to_user_id) WHERE status = 'pending';

-- Index for fast lookup of accepted contacts
CREATE INDEX IF NOT EXISTS idx_contact_requests_accepted
  ON contact_requests (from_user_id, to_user_id) WHERE status = 'accepted';
