import supabase from "../../services/supabase";

// Send a contact request. RLS ensures from_user_id = auth.uid().
export async function sendContactRequest(toUserId) {
  const { data, error } = await supabase
    .from("contact_requests")
    .insert({ to_user_id: toUserId })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

// Sender withdraws a pending request (DELETE, RLS: status must be pending).
export async function withdrawContactRequest(requestId) {
  const { error } = await supabase
    .from("contact_requests")
    .delete()
    .eq("id", requestId);
  if (error) throw new Error(error.message);
}

// Recipient accepts or declines (status: "accepted" | "declined").
export async function respondToRequest(requestId, status) {
  const { data, error } = await supabase
    .from("contact_requests")
    .update({ status })
    .eq("id", requestId)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

// All pending requests sent TO me, with sender profile data.
// RLS filter (to_user_id = auth.uid()) is enforced server-side.
export async function getIncomingRequests() {
  const { data, error } = await supabase
    .from("contact_requests")
    .select("id, from_user_id, created_at")
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  if (!data.length) return [];

  const senderIds = data.map((r) => r.from_user_id);
  const { data: users, error: usersError } = await supabase
    .from("users")
    .select("id, fullname, username, avatar_url")
    .in("id", senderIds);
  if (usersError) throw new Error(usersError.message);

  const usersMap = Object.fromEntries(users.map((u) => [u.id, u]));
  return data.map((req) => ({ ...req, fromUser: usersMap[req.from_user_id] ?? null }));
}

// All pending requests I sent. RLS (from_user_id = auth.uid()) enforced server-side.
export async function getOutgoingRequests() {
  const { data, error } = await supabase
    .from("contact_requests")
    .select("id, to_user_id, created_at")
    .eq("status", "pending");
  if (error) throw new Error(error.message);
  return data ?? [];
}

// Accepted contacts, bi-directional. Returns { requestId, contactUser } per contact.
export async function getContacts(myUserId) {
  const { data, error } = await supabase
    .from("contact_requests")
    .select("id, from_user_id, to_user_id")
    .eq("status", "accepted")
    .or(`from_user_id.eq.${myUserId},to_user_id.eq.${myUserId}`);
  if (error) throw new Error(error.message);
  if (!data.length) return [];

  const otherIds = data.map((r) =>
    r.from_user_id === myUserId ? r.to_user_id : r.from_user_id,
  );
  const { data: users, error: usersError } = await supabase
    .from("users")
    .select("id, fullname, username, avatar_url")
    .in("id", otherIds);
  if (usersError) throw new Error(usersError.message);

  const usersMap = Object.fromEntries(users.map((u) => [u.id, u]));
  return data.map((req) => {
    const otherId =
      req.from_user_id === myUserId ? req.to_user_id : req.from_user_id;
    return { requestId: req.id, contactUser: usersMap[otherId] ?? null };
  });
}
