import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import supabase from "../../services/supabase";
import { useUser } from "../authentication/useUser";
import {
  sendContactRequest,
  withdrawContactRequest,
  respondToRequest,
  getIncomingRequests,
  getOutgoingRequests,
  getContacts,
} from "./apiContacts";

// ─── Query keys ───────────────────────────────────────────────────────────────

const KEYS = {
  incoming: (uid) => ["contactRequests", "incoming", uid],
  outgoing: (uid) => ["contactRequests", "outgoing", uid],
  contacts: (uid) => ["contacts", uid],
};

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useIncomingRequests() {
  const {
    user: { id: myUserId },
  } = useUser();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: KEYS.incoming(myUserId),
    queryFn: getIncomingRequests,
  });

  // Realtime: invalidate when any request targeting me changes
  useEffect(() => {
    const channel = supabase
      .channel(`contact_requests_incoming_${myUserId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "contact_requests",
          filter: `to_user_id=eq.${myUserId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["contactRequests"] });
          queryClient.invalidateQueries({ queryKey: ["contacts"] });
        },
      )
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [myUserId, queryClient]);

  return query;
}

export function useOutgoingRequests() {
  const {
    user: { id: myUserId },
  } = useUser();

  return useQuery({
    queryKey: KEYS.outgoing(myUserId),
    queryFn: getOutgoingRequests,
  });
}

export function useContacts() {
  const {
    user: { id: myUserId },
  } = useUser();

  return useQuery({
    queryKey: KEYS.contacts(myUserId),
    queryFn: () => getContacts(myUserId),
  });
}

// Derives the relationship status for a specific user. Reads from cached queries
// so it triggers no extra network requests when data is already loaded.
export function useContactStatus(otherUserId) {
  const { data: incoming = [], isLoading: l1 } = useIncomingRequests();
  const { data: outgoing = [], isLoading: l2 } = useOutgoingRequests();
  const { data: contacts = [], isLoading: l3 } = useContacts();

  const isLoading = l1 || l2 || l3;

  if (isLoading) return { status: null, requestId: null, isLoading: true };

  const contact = contacts.find((c) => c.contactUser?.id === otherUserId);
  if (contact) return { status: "contact", requestId: contact.requestId, isLoading: false };

  const incomingReq = incoming.find((r) => r.from_user_id === otherUserId);
  if (incomingReq) return { status: "incoming_pending", requestId: incomingReq.id, isLoading: false };

  const outgoingReq = outgoing.find((r) => r.to_user_id === otherUserId);
  if (outgoingReq) return { status: "outgoing_pending", requestId: outgoingReq.id, isLoading: false };

  return { status: "none", requestId: null, isLoading: false };
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useSendContactRequest() {
  const queryClient = useQueryClient();
  const {
    user: { id: myUserId },
  } = useUser();

  return useMutation({
    mutationFn: sendContactRequest,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: KEYS.outgoing(myUserId) }),
    onError: (err) => toast.error(err.message),
  });
}

export function useWithdrawContactRequest() {
  const queryClient = useQueryClient();
  const {
    user: { id: myUserId },
  } = useUser();

  return useMutation({
    mutationFn: withdrawContactRequest,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: KEYS.outgoing(myUserId) }),
    onError: (err) => toast.error(err.message),
  });
}

export function useRespondToRequest() {
  const queryClient = useQueryClient();
  const {
    user: { id: myUserId },
  } = useUser();

  return useMutation({
    mutationFn: ({ requestId, status }) => respondToRequest(requestId, status),
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: KEYS.incoming(myUserId) });
      queryClient.invalidateQueries({ queryKey: KEYS.contacts(myUserId) });
      if (status === "accepted") toast.success("Contact added!");
    },
    onError: (err) => toast.error(err.message),
  });
}
