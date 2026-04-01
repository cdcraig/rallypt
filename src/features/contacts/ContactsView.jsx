import { useNavigate } from "react-router-dom";
import { useContacts } from "./useContactData";
import Loader from "../../components/Loader";
import ShortTextMessage from "../../components/ShortTextMessage";
import UserAvatar from "../../components/UserAvatar";
import { useUi } from "../../contexts/UiContext";
import { HiOutlineUserGroup } from "react-icons/hi2";

// Group a sorted contact list into alphabetical sections.
function groupByLetter(contacts) {
  const sorted = [...contacts].sort((a, b) =>
    (a.contactUser?.fullname ?? "").localeCompare(b.contactUser?.fullname ?? ""),
  );

  const sections = [];
  let current = null;

  for (const item of sorted) {
    const letter = (item.contactUser?.fullname?.[0] ?? "#").toUpperCase();
    if (letter !== current) {
      current = letter;
      sections.push({ letter, items: [] });
    }
    sections[sections.length - 1].items.push(item);
  }

  return sections;
}

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
        <HiOutlineUserGroup size={48} strokeWidth={1} />
        <p className="text-sm">No contacts yet. Search for officers to connect.</p>
      </div>
    );
  }

  const sections = groupByLetter(contacts);

  return (
    <div className="fadeIn pb-2">
      {sections.map(({ letter, items }) => (
        <div key={letter}>
          {/* Section header */}
          <div className="sticky top-0 z-10 bg-bgPrimary/80 px-4 py-1 dark:bg-bgPrimary-dark/80">
            <span className="text-xs font-semibold uppercase tracking-widest text-navy-light opacity-70">
              {letter}
            </span>
          </div>

          {/* Contact rows */}
          <div className="px-2">
            {items.map(({ requestId, contactUser }) => {
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
                  onKeyDown={(e) =>
                    e.key === "Enter" && navigate(`/chat/${contactUser.id}`)
                  }
                  className="flex cursor-pointer select-none items-center gap-3 rounded-lg p-2 hover:bg-LightShade/20"
                >
                  <UserAvatar
                    src={contactUser.avatar_url}
                    name={contactUser.fullname}
                    size={44}
                  />
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
        </div>
      ))}
    </div>
  );
}

export default ContactsView;
