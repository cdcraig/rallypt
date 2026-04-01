import {
  HiOutlineUserPlus,
  HiOutlineCheck,
  HiOutlineXMark,
  HiOutlineClock,
} from "react-icons/hi2";
import {
  useContactStatus,
  useSendContactRequest,
  useWithdrawContactRequest,
  useRespondToRequest,
} from "./useContactData";

// Renders the appropriate action for a user based on their contact relationship:
//   none             → Add button
//   outgoing_pending → Pending (click to withdraw)
//   incoming_pending → Accept + Decline
//   contact          → Contact badge
//   null (loading)   → skeleton pill

function ContactRequestButton({ userId }) {
  const { status, requestId, isLoading } = useContactStatus(userId);
  const { mutate: send, isPending: isSending } = useSendContactRequest();
  const { mutate: withdraw, isPending: isWithdrawing } = useWithdrawContactRequest();
  const { mutate: respond, isPending: isResponding } = useRespondToRequest();

  if (isLoading) {
    return <div className="h-7 w-14 animate-pulse rounded-full bg-slate-700/40" />;
  }

  if (status === "contact") {
    return (
      <span className="flex items-center gap-1 rounded-full border border-navy-light/40 px-2.5 py-1 text-xs text-navy-light dark:border-blue-400/30 dark:text-blue-400">
        <HiOutlineCheck size={13} />
        Contact
      </span>
    );
  }

  if (status === "outgoing_pending") {
    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          withdraw(requestId);
        }}
        disabled={isWithdrawing}
        title="Withdraw request"
        className="flex items-center gap-1 rounded-full border border-slate-600/40 px-2.5 py-1 text-xs text-slate-400 transition-colors hover:border-red-500/40 hover:text-red-400 disabled:opacity-50"
      >
        <HiOutlineClock size={13} />
        Pending
      </button>
    );
  }

  if (status === "incoming_pending") {
    return (
      <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={() => respond({ requestId, status: "accepted" })}
          disabled={isResponding}
          className="flex items-center gap-1 rounded-full bg-navy-light px-2.5 py-1 text-xs text-white transition-colors hover:bg-navy disabled:opacity-50"
        >
          <HiOutlineCheck size={13} />
          Accept
        </button>
        <button
          onClick={() => respond({ requestId, status: "declined" })}
          disabled={isResponding}
          title="Decline"
          className="flex items-center rounded-full border border-slate-600/40 px-2 py-1 text-slate-400 transition-colors hover:border-red-500/40 hover:text-red-400 disabled:opacity-50"
        >
          <HiOutlineXMark size={14} />
        </button>
      </div>
    );
  }

  // status === "none"
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        send(userId);
      }}
      disabled={isSending}
      className="flex items-center gap-1 rounded-full bg-navy-light px-2.5 py-1 text-xs text-white transition-colors hover:bg-navy disabled:opacity-50"
    >
      <HiOutlineUserPlus size={13} />
      Add
    </button>
  );
}

export default ContactRequestButton;
