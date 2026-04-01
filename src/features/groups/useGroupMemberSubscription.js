import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { subscribeRealtimeGroupMember } from "./apiRealtimeGroupMember";

function useGroupMemberSubscription({ group_id }) {
  const queryClient = useQueryClient();
  const subscriptionRef = useRef(null);

  useEffect(
    function () {
      if (!group_id) return;

      if (subscriptionRef.current) subscriptionRef.current.unsubscribe();

      function callback(payload) {
        queryClient.setQueryData(["groupMembers", group_id], (prevData) => {
          if (!prevData) return prevData;

          if (payload.eventType === "INSERT") {
            return [...prevData, payload.new];
          } else if (payload.eventType === "UPDATE") {
            return prevData.map((member) =>
              member.user_id === payload.new.user_id ? { ...member, ...payload.new } : member,
            );
          } else if (payload.eventType === "DELETE") {
            return prevData.filter(
              (member) => member.user_id !== payload.old.user_id,
            );
          }

          return prevData;
        });
      }

      subscriptionRef.current = subscribeRealtimeGroupMember({
        group_id,
        callback,
      });

      return () => {
        subscriptionRef.current?.unsubscribe();
        subscriptionRef.current = null;
      };
    },
    [group_id, queryClient],
  );
}

export default useGroupMemberSubscription;
