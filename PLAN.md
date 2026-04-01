# RallyPT — Build Plan

## What Is It
A chat app for law enforcement. Officers get Signal-like UX. Departments get compliance, records, and oversight. Messages are NOT end-to-end encrypted — department access is the selling point.

## Tech Stack
- **Frontend:** Vite + React + TypeScript + Tailwind + Zustand + React Router
- **Mobile:** Capacitor (iOS + Android from one codebase)
- **Backend:** Supabase (Postgres, Auth, Realtime, Storage)
- **Base:** Fork of Convayto (Apache 2.0, already React + Vite + Supabase)
- **Repo:** github.com/cdcraig/rallypt (new repo)

## Business Model
- **Free tier:** Local-only, messages on device
- **Paid tier:** Server storage, history sync, export, new member history access

---

## Phase 1 — Project Setup & Foundation
> Get the repo running, strip Convayto branding, establish RallyPT structure

**Tasks:**
1. Fork Convayto → new `rallypt` repo on GitHub
2. Strip branding — rename to RallyPT, update logos/colors/copy
3. Audit Convayto's Supabase schema — document what exists (users, messages, friends)
4. Set up Supabase project for RallyPT (fresh instance)
5. Get it running locally with hot reload
6. Add Capacitor scaffolding (iOS + Android targets)

**Done when:** RallyPT runs locally in browser, connects to Supabase, can sign up and send a 1:1 message.

---

## Phase 2 — Group Chat (Core Feature)
> This is the primary use case. Everything else builds on top of groups.

**Tasks:**
1. Design group chat database schema:
   - `groups` table (id, name, icon, created_by, department_id, created_at)
   - `group_members` table (group_id, user_id, role: admin/member, joined_at)
   - Extend `messages` table with group_id (nullable — null = 1:1, set = group)
   - Row-level security policies for group access
2. Build group creation flow — name it, pick members from contacts
3. Build group chat view — message list, input, member count
4. Add/remove members (admin only)
5. Group shows in chat list alongside 1:1 conversations
6. Supabase Realtime subscriptions for group messages
7. User search / add contacts (extend Convayto's friend system)
8. Unread message counts per conversation

**Done when:** You can create a group, add members, send/receive messages in real-time, and see groups in your chat list.

---

## Phase 3 — MVP Polish
> Features that make it usable for real officers.

**Tasks:**
1. **Pinned messages** — any member can pin, pinned messages accessible via header tap
2. **Message export** — export chat history as PDF or text file
3. **Push notifications** — Firebase Cloud Messaging via Capacitor plugin, background + foreground
4. **New member history** — when someone joins a group, they see past messages (configurable: all history vs. last 30 days)
5. **Read receipts** — who's seen each message
6. **Typing indicators** — lightweight presence via Supabase Realtime
7. **Media sharing** — photos, files, voice messages via Supabase Storage
8. **Profile & settings** — display name, avatar, notification preferences

**Done when:** An officer could use this daily instead of Signal for group coordination.

---

## Phase 4 — Capacitor Mobile Build
> Wrap the web app for app stores.

**Tasks:**
1. Capacitor build for iOS + Android
2. Native push notification integration (FCM + APNs)
3. Test on physical devices — notifications, camera for photos, file picker
4. App Store / Play Store submission prep (icons, screenshots, descriptions)
5. Test deep links (tap notification → opens correct chat)

**Done when:** Installable native app on both platforms with working push notifications.

---

## Phase 5 — Department Admin & Compliance
> The features that sell to department leadership.

**Tasks:**
1. **Department/org model** — multi-tenancy, department admins
2. **Admin dashboard** — view all groups, member management, usage stats
3. **Message access** — department admins can access any group's messages (compliance)
4. **Audit logging** — who read what, when, message edits/deletes tracked
5. **Data retention policies** — auto-archive after X days, configurable per department
6. **User provisioning** — admin can invite officers, deactivate accounts

**Done when:** A department IT admin can manage their officers, enforce retention, and access records for compliance.

---

## Phase 6 — Later Features

### Going Live
Real-time location sharing on a map within a group chat. Officers tap "Go Live" and their position appears on a shared map visible to everyone in the chat.
- MapKit or Google Maps integration
- Location streaming via Supabase Realtime or WebSockets
- Privacy controls — opt-in per session, auto-timeout
- Battery optimization for continuous GPS

### Canvas
Persistent location trails. Same live map, but paths are drawn and saved over time. Critical for pursuit situations — see where everyone's been, who's closing in.
- Trail persistence in database (polyline storage)
- Replay mode — scrub through timeline
- Color-coded trails per officer
- Shareable canvas snapshots

### Remove from Local
Delete messages from device but keep them readable/sharable in cloud (paid tier).

### Directory
Searchable directory of officers across departments. Find and contact anyone in the system.

### Integrations
Connect with dispatch systems, CAD, body cam platforms, etc.

---

## Execution Plan

| Phase | Estimated Effort | Parallel? |
|-------|-----------------|-----------|
| Phase 1 — Setup | 3-5 tasks | First |
| Phase 2 — Group Chat | 6-8 tasks | After Phase 1 |
| Phase 3 — MVP Polish | 6-8 tasks, some parallel | After Phase 2 core |
| Phase 4 — Mobile Build | 4-5 tasks | After Phase 3 |
| Phase 5 — Admin/Compliance | 5-6 tasks | After Phase 3 |
| Phase 6 — Later Features | Scoped per feature | After MVP launch |

**Phase 1 starts immediately** after approval. Tasks get queued to the Jarvis background worker — they'll fork the repo, set up the project, and get the foundation running. Each phase checkpoint comes back to you for review before moving on.
