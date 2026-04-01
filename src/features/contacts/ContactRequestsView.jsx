import { HiOutlineCheck, HiOutlineXMark, HiArrowLeft } from "react-icons/hi2";
import { useIncomingRequests, useRespondToRequest } from "./useContactData";
import Loader from "../../components/Loader";
import ShortTextMessage from "../../components/ShortTextMessage";
import UserAvatar from "../../components/UserAvatar";

function ContactRequestsView({ onBack }) {
  const { data: requests = [], isLoading } = useIncomingRequests();
  const { mutate: respond, isPending: isResponding } = useRespondToRequest();

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-LightShade/10 px-4 py-3">
        <button
          onClick={onBack}
          className="rounded-full p-1 text-slate-400 transition-colors hover:text-white"
        >
          <HiArrowLeft size={20} />
        </button>
        <span className="font-semibold">Contact Requests</span>
        {requests.length > 0 && (
          <span className="ml-auto flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-navy-light px-1.5 text-xs font-bold text-white">
            {requests.length}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <ShortTextMessage opacity={100}>
            <Loader text="Loading" size="medium" />
          </ShortTextMessage>
        ) : !requests.length ? (
          <div className="flex flex-col items-center justify-center gap-2 px-6 py-14 text-center opacity-50">
            <p className="text-sm">No pending requests.</p>
          </div>
        ) : (
          <div className="fadeIn space-y-1 p-2">
            {requests.map((req) => {
              if (!req.fromUser) return null;
              return (
                <div
                  key={req.id}
                  className="flex items-center gap-3 rounded-lg p-2"
                >
                  <UserAvatar
                    src={req.fromUser.avatar_url}
                    name={req.fromUser.fullname}
                    size={44}
                  />

                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-sm font-bold">
                      {req.fromUser.fullname}
                    </span>
                    <span className="truncate text-xs opacity-60">
                      @{req.fromUser.username}
                    </span>
                  </span>

                  <div className="flex flex-shrink-0 gap-1.5">
                    <button
                      onClick={() =>
                        respond({ requestId: req.id, status: "accepted" })
                      }
                      disabled={isResponding}
                      className="flex items-center gap-1 rounded-full bg-navy-light px-3 py-1.5 text-xs text-white transition-colors hover:bg-navy disabled:opacity-50"
                    >
                      <HiOutlineCheck size={13} />
                      Accept
                    </button>
                    <button
                      onClick={() =>
                        respond({ requestId: req.id, status: "declined" })
                      }
                      disabled={isResponding}
                      title="Decline"
                      className="flex items-center rounded-full border border-slate-600/40 px-2 py-1.5 text-slate-400 transition-colors hover:border-red-500/40 hover:text-red-400 disabled:opacity-50"
                    >
                      <HiOutlineXMark size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default ContactRequestsView;
