import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { subscribeRealtimeGroupMessage } from "./apiRealtimeGroupMessage";

function useGroupMessageSubscription({ group_id }) {
  const queryClient = useQueryClient();
  const subscriptionRef = useRef(null);

  useEffect(
    function () {
      if (!group_id) return;

      if (subscriptionRef.current) subscriptionRef.current.unsubscribe();

      function callback(newData) {
        queryClient.setQueryData(["group", group_id], (prevData) => {
          if (!prevData) return prevData;

          const existingOptimisticMessage = prevData?.pages[0]?.find(
            (message) => message?.id === newData.id,
          );

          if (existingOptimisticMessage) {
            return {
              ...prevData,
              pages: prevData.pages
                .slice()
                .map((page, index) =>
                  index === 0
                    ? page.map((message) =>
                        message.id === newData.id ? newData : message,
                      )
                    : page,
                ),
            };
          } else {
            return {
              ...prevData,
              pages: prevData.pages.slice().map((page, index) => {
                return index === 0 ? [...page, newData] : page;
              }),
            };
          }
        });
      }

      subscriptionRef.current = subscribeRealtimeGroupMessage({
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

export default useGroupMessageSubscription;
