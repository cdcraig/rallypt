import supabase from "../../services/supabase";

export function subscribeRealtimeGroupMessage({ group_id, callback }) {
  if (!group_id) return;

  const roomName = `group-messages-${group_id}`;

  const subscription = supabase
    .channel(roomName)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "messages",
        filter: `group_id=eq.${group_id}`,
      },
      (payload) => {
        callback(payload.new);
      },
    )
    .subscribe();

  return subscription;
}
