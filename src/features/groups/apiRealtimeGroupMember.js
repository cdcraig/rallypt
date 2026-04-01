import supabase from "../../services/supabase";

export function subscribeRealtimeGroupMember({ group_id, callback }) {
  if (!group_id) return;

  const roomName = `group-members-${group_id}`;

  const subscription = supabase
    .channel(roomName)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "group_members",
        filter: `group_id=eq.${group_id}`,
      },
      (payload) => {
        callback(payload);
      },
    )
    .subscribe();

  return subscription;
}
