import { HiOutlineUserCircle } from "react-icons/hi2";
import { useNavigate } from "react-router-dom";
import { useContacts } from "./useContactData";
import Loader from "../../components/Loader";
import ShortTextMessage from "../../components/ShortTextMessage";
import { useUi } from "../../contexts/UiContext";

function ContactsView() {
  const { data: contacts = [], isLoading } = useContacts();
  const navigate = useNavigate();
  const { closeSidebar } = useUi();

  if (isLoading) {
    return (
      <ShortTextMessage opacity={100}>
        <Loader text="Loading" size="medium" />
      </ShortTextMessage>
    );
  }

  if (!contacts.length) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center opacity-50">
        <HiOutlineUserCircle size={48} strokeWidth={1} />
        <p className="text-sm">No contacts yet. Search for officers to connect.</p>
      </div>
    );
  }

  return (
    <div className="fadeIn p-2">
      {contacts.map(({ requestId, contactUser }) => {
        if (!contactUser) return null;
        return (
          <div
            key={requestId}
            role="button"
            tabIndex={0}
            onClick={() => {
              closeSidebar();
              navigate(`/chat/${contactUser.id}`);
            }}
            onKeyDown={(e) => e.key === "Enter" && navigate(`/chat/${contactUser.id}`)}
            className="flex cursor-pointer select-none items-center gap-3 rounded-lg p-2 hover:bg-LightShade/20"
          >
            <span className="h-11 w-11 flex-shrink-0 overflow-hidden rounded-full">
              {contactUser.avatar_url ? (
                <img
                  src={contactUser.avatar_url}
                  alt={contactUser.fullname}
                  className="pointer-events-none h-full w-full object-cover"
                />
              ) : (
                <HiOutlineUserCircle
                  size={50}
                  viewBox="2 2 24 24"
                  opacity={0.5}
                  strokeWidth="1"
                />
              )}
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="truncate font-bold">{contactUser.fullname}</span>
              <span className="truncate text-sm opacity-60">
                @{contactUser.username}
              </span>
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default ContactsView;
