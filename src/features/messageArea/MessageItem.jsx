import { useUser } from "../authentication/useUser";
import { formatTime } from "../../utils/common";
import UserAvatar from "../../components/UserAvatar";

function MessageItem({ message, isRead }) {
  const { user } = useUser();
  const isOwn = message?.sender_id === user.id;

  const senderName =
    message?.sender?.fullname || message?.sender?.username || "";
  const senderAvatar = message?.sender?.avatar_url || null;

  return (
    <div className={`flex items-end gap-2 my-1 ${isOwn ? "flex-row-reverse" : "flex-row"}`}>
      {/* Avatar placeholder — keeps alignment consistent */}
      <div className="w-7 h-7 shrink-0">
        {!isOwn && (
          <UserAvatar src={senderAvatar} name={senderName} size={28} />
        )}
      </div>

      <div
        className={`relative ${
          isOwn
            ? "self-end rounded-br-none bg-gradient-to-br from-bgAccent to-bgAccentDim text-textPrimary-dark before:absolute before:bottom-0 before:right-0 before:h-0 before:w-0 before:translate-x-full before:border-l-8 before:border-t-8 before:border-l-bgAccentDim before:border-t-transparent before:content-[''] dark:from-bgAccent-dark dark:to-bgAccentDim-dark before:dark:border-l-bgAccentDim-dark"
            : "rounded-bl-none bg-bgPrimary before:absolute before:bottom-0 before:left-0 before:h-0 before:w-0 before:-translate-x-full before:border-r-8 before:border-t-8 before:border-r-bgPrimary before:border-t-transparent before:content-[''] dark:bg-LightShade/20 before:dark:border-r-LightShade/20"
        } w-fit max-w-[75%] rounded-2xl px-4 py-2 shadow-md before:shadow-md`}
      >
        <p>
          {message?.content}
          <span className="float-right ml-2 mt-2 select-none text-xs opacity-70 inline-flex items-center gap-1">
            {formatTime(message?.created_at)}
            {isOwn && (
              isRead
                ? (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '12px', height: '12px', color: '#93c5fd' }}>
                    <polyline points="17 6 6 17 1 12" />
                    <polyline points="23 6 12 17 10.5 15.5" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '12px', height: '12px', opacity: 0.6 }}>
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )
            )}
          </span>
        </p>
      </div>
    </div>
  );
}

export default MessageItem;
