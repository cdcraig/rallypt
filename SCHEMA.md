# RallyPT — Supabase Schema Reference

This document captures the existing Supabase schema as of Phase 1 (Convayto base). It is the source of truth for Phase 2 group chat design.

---

## Tables

### `conversations`
Stores 1-on-1 conversation metadata.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | UUID | PK, default `gen_random_uuid()` | |
| `created_at` | Timestamptz | default `now()` | |
| `user1_id` | UUID | FK → auth.users | First participant |
| `user2_id` | UUID | FK → auth.users | Second participant |
| `last_message` | JSONB | nullable | Denormalized for conversation list preview |

**Realtime:** enabled

`last_message` shape:
```json
{
  "id": "uuid",
  "created_at": "iso8601",
  "sender_id": "uuid",
  "content": "string"
}
```

---

### `messages`
Stores all chat messages.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | UUID | PK, default `gen_random_uuid()` | |
| `created_at` | Timestamptz | default `now()` | |
| `sender_id` | UUID | FK → auth.users, default `auth.uid()` | |
| `conversation_id` | UUID | FK → conversations | |
| `content` | Text | NOT NULL | |

**Realtime:** enabled

**Index:** `messages(conversation_id, created_at DESC)` — supports paginated fetch in reverse-chronological order.

---

## Views

### `users`
Read-only view over `auth.users`. Exposes profile fields from `raw_user_meta_data`.

| Column | Source |
|---|---|
| `id` | `auth.users.id` |
| `email` | `auth.users.email` |
| `username` | `raw_user_meta_data->>'username'` |
| `fullname` | `raw_user_meta_data->>'fullname'` |
| `avatar_url` | `raw_user_meta_data->>'avatar_url'` |
| `bio` | `raw_user_meta_data->>'bio'` |

**Access:** authenticated users only.

---

### `usernames`
Thin view — username column only. Used for pre-auth username availability checks at signup.

| Column | Source |
|---|---|
| `username` | `raw_user_meta_data->>'username'` |

**Access:** anonymous users allowed (`GRANT SELECT TO anon`).

---

## Storage

### `avatars` bucket
| Setting | Value |
|---|---|
| Public | Yes |
| Max file size | 5 MB |
| Allowed MIME types | image/jpeg, image/png, image/webp |
| Path pattern (user) | `{user_id}/avatar-{random}` |
| Path pattern (group) | `groups/{group_id}/avatar-{random}` |

---

## RLS Policies

### `conversations`

```sql
-- SELECT: only conversations the user is a participant in
CREATE POLICY "Users can view their conversations"
  ON conversations FOR SELECT
  USING (user1_id = auth.uid() OR user2_id = auth.uid());

-- INSERT: any authenticated user can start a conversation
CREATE POLICY "Authenticated users can create conversations"
  ON conversations FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- UPDATE: only participants can update (used for last_message denorm)
CREATE POLICY "Users can update their conversations"
  ON conversations FOR UPDATE
  USING (user1_id = auth.uid() OR user2_id = auth.uid());
```

### `messages`

```sql
-- SELECT: only messages in conversations the user participates in
CREATE POLICY "Users can view messages in their conversations"
  ON messages FOR SELECT
  USING (
    conversation_id IN (
      SELECT id FROM conversations
      WHERE user1_id = auth.uid() OR user2_id = auth.uid()
    )
  );

-- INSERT: sender must be current user, conversation must be theirs
CREATE POLICY "Users can insert messages in their conversations"
  ON messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid() AND
    conversation_id IN (
      SELECT id FROM conversations
      WHERE user1_id = auth.uid() OR user2_id = auth.uid()
    )
  );
```

### `users` view

```sql
CREATE POLICY "Authenticated users can view other users"
  ON users FOR SELECT
  USING (auth.role() = 'authenticated');
```

### `storage.objects` (avatars)

```sql
-- Path layout:
--   User avatars:  {user_id}/avatar-{random}          → foldername[1] = user_id
--   Group avatars: groups/{group_id}/avatar-{random}  → foldername[1] = 'groups', foldername[2] = group_id

CREATE POLICY "Users can upload their own avatars"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' AND (
      -- user avatar: first path segment must be the uploader's uid
      auth.uid()::text = (storage.foldername(name))[1]
      OR
      -- group avatar: path starts with groups/, uploader must be a group admin
      (
        (storage.foldername(name))[1] = 'groups' AND
        EXISTS (
          SELECT 1 FROM group_members
          WHERE group_id = (storage.foldername(name))[2]::uuid
            AND user_id  = auth.uid()
            AND role     = 'admin'
        )
      )
    )
  );

CREATE POLICY "Users can update their own avatars"
  ON storage.objects FOR UPDATE
  WITH CHECK (
    bucket_id = 'avatars' AND (
      -- user avatar
      auth.uid()::text = (storage.foldername(name))[1]
      OR
      -- group avatar
      (
        (storage.foldername(name))[1] = 'groups' AND
        EXISTS (
          SELECT 1 FROM group_members
          WHERE group_id = (storage.foldername(name))[2]::uuid
            AND user_id  = auth.uid()
            AND role     = 'admin'
        )
      )
    )
  );
```

---

## Supabase Features in Use

| Feature | Status | Notes |
|---|---|---|
| Auth | Active | Email/password. User metadata stored in `raw_user_meta_data` (username, fullname, bio, avatar_url) |
| Realtime | Active | `postgres_changes` on `messages` (filtered by `conversation_id`) and `conversations` (filtered by `user1_id` or `user2_id`) |
| Storage | Active | `avatars` bucket for profile pictures |
| Edge Functions | Not used | |
| pgvector | Not used | |

---

## Auth Metadata Shape

Profile data lives in `auth.users.raw_user_meta_data`, not a separate profiles table:

```typescript
{
  fullname: string,       // display name
  username: string,       // unique handle, [a-z0-9_-]
  bio: string,            // max 140 chars
  avatar_url: string,     // public storage URL
}
```

---

## Client-Side Query Patterns

All Supabase calls are in `src/features/*/api*.js` modules.

### Auth
- `supabase.auth.signUp()` — stores fullname, username, bio in metadata
- `supabase.auth.signInWithPassword()`
- `supabase.auth.signOut()`
- `supabase.auth.getSession()` — used to rehydrate current user
- `supabase.auth.updateUser()` — profile edits (name, bio, password, avatar_url)
- `supabase.auth.resetPasswordForEmail()`

### Conversations
- Fetch all conversations for sidebar: `.from("conversations").select("*").or(user1_id, user2_id).order("last_message->created_at", { ascending: false })`
- Open/create conversation: `.from("conversations").insert([{ user2_id }]).select()`
- Look up conversation between two users: `.from("conversations").select("*").in("user1_id", [...]).in("user2_id", [...])`

### Messages
- Paginated fetch (25/page, reverse-chron): `.from("messages").select("*").eq("conversation_id").order("created_at", { ascending: false }).range(from, to)`
- Send message: insert into `messages`, then update `conversations.last_message`

### Users
- Search: `.from("users").select("*").or(fullname.ilike, username.ilike, email.ilike)`
- Get by ID: `.from("users").select("*").eq("id", userId)`
- Username check: `.from("usernames").select("username").eq("username", username)`

### Storage
- Upload avatar: `supabase.storage.from("avatars").upload(fileName, file)`
- Delete old avatar: `supabase.storage.from("avatars").remove([fileName])`

### Realtime
```javascript
// Messages — scoped to a single conversation
supabase.channel(conversation_id)
  .on("postgres_changes", {
    event: "*", schema: "public", table: "messages",
    filter: `conversation_id=eq.${conversation_id}`
  }, callback)
  .subscribe();

// Conversations — both columns for current user
supabase.channel(myUserId)
  .on("postgres_changes", {
    event: "*", schema: "public", table: "conversations",
    filter: `user1_id=eq.${myUserId}`
  }, callback)
  .on("postgres_changes", {
    event: "*", schema: "public", table: "conversations",
    filter: `user2_id=eq.${myUserId}`
  }, callback)
  .subscribe();
```

---

## Validation Constants (`src/config.js`)

| Constant | Value |
|---|---|
| `MIN_USERNAME_LENGTH` | 4 |
| `MAX_USERNAME_LENGTH` | 30 |
| `MIN_PASSWORD_LENGTH` | 6 |
| `MAX_NAME_LENGTH` | 70 |
| `MAX_BIO_LENGTH` | 140 |
| `MAX_MESSAGES_PER_PAGE` | 25 |
| `MAXIMUM_AVATAR_FILE_SIZE` | 5 MB |
| `USERNAME_REGEX` | `/^[a-z0-9_-]+$/` |

---

## Phase 2 Schema Extensions (Group Chat)

**Migration:** `supabase/migrations/20260331000000_phase2_group_chat.sql`

### `groups` ✓ implemented
| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | UUID | PK, default `gen_random_uuid()` | |
| `name` | Text | NOT NULL | |
| `icon` | Text | nullable | Storage URL for group icon |
| `created_by` | UUID | FK → auth.users, NOT NULL | |
| `department_id` | UUID | nullable | Future FK to departments table |
| `created_at` | Timestamptz | NOT NULL, default `now()` | |

**Indexes:** `groups_created_by_idx` on `created_by`.

**RLS:** SELECT/UPDATE/DELETE gated on membership; any authenticated user can INSERT with `created_by = auth.uid()`.

---

### `group_members` ✓ implemented
| Column | Type | Constraints | Notes |
|---|---|---|---|
| `group_id` | UUID | PK (composite), FK → groups, CASCADE | |
| `user_id` | UUID | PK (composite), FK → auth.users, CASCADE | |
| `role` | Text | NOT NULL, default `'member'`, CHECK IN (`'admin'`, `'member'`) | |
| `joined_at` | Timestamptz | NOT NULL, default `now()` | |

**PK:** (`group_id`, `user_id`)

**Indexes:** `group_members_user_id_idx` on `user_id` (all groups for a user); `group_members_group_id_idx` on `group_id` (all members of a group).

**RLS:**
- SELECT: any member can see the roster of groups they belong to
- INSERT: admins only (bootstrap trigger handles creator)
- UPDATE: admins only (role changes)
- DELETE: admins can remove anyone; members can remove themselves (leave)

---

### Changes to `messages` ✓ implemented

**Migration:** `supabase/migrations/20260331000000_phase2_group_chat.sql`

- Added `group_id` UUID FK → groups (nullable)
- `conversation_id` made nullable
- CHECK constraint `messages_conversation_or_group`: exactly one of `conversation_id` or `group_id` must be set
- Index: `messages_group_id_created_at` on `(group_id, created_at DESC)`

**RLS (group scope):**

```sql
-- SELECT: members can read group messages
CREATE POLICY "Users can view messages in their groups"
  ON messages FOR SELECT
  USING (
    group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
  );

-- INSERT: members can send group messages (sender must be self)
CREATE POLICY "Users can insert messages in their groups"
  ON messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
  );
```

### Bootstrap trigger ✓ implemented

`trg_add_group_creator` — AFTER INSERT on `groups`, auto-inserts the creator as an `admin` in `group_members` via `SECURITY DEFINER` function. Solves the chicken-and-egg problem where the `group_members` INSERT policy requires existing admin membership.

### Realtime ✓ enabled

Both `groups` and `group_members` added to `supabase_realtime` publication.

**Client subscriptions still needed:**
- Messages channel per group: `filter: group_id=eq.${groupId}`
- Group membership changes channel
