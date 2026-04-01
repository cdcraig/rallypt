import { useSearchedUsers } from "./useSearchedUsers";
import Loader from "../../components/Loader";
import { useUi } from "../../contexts/UiContext";
import ShortTextMessage from "../../components/ShortTextMessage";
import { HiOutlineUserCircle } from "react-icons/hi2";
import { useNavigate } from "react-router-dom";
import ContactRequestButton from "../contacts/ContactRequestButton";

// Inline result row — user info on the left, contact action pinned to the right.
function SearchResultRow({ id, avatar_url, fullname, username }) {
  const { closeSearchView } = useUi();
  const navigate = useNavigate();

  function handleRowClick() {
    closeSearchView({ back: false });
    navigate(`/chat/${id}`, { replace: true });
  }

  return (
    <div className="flex items-center gap-2 rounded-lg p-2 hover:bg-LightShade/20">
      {/* Clickable user area */}
      <div
        role="button"
        tabIndex={0}
        onClick={handleRowClick}
        onKeyDown={(e) => e.key === "Enter" && handleRowClick()}
        className="flex min-w-0 flex-1 cursor-pointer select-none items-center gap-2"
      >
        <span className="h-11 w-11 flex-shrink-0 overflow-hidden rounded-full">
          {avatar_url ? (
            <img
              src={avatar_url}
              alt={fullname}
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
          <span className="truncate font-bold">{fullname}</span>
          <span className="truncate text-sm opacity-60">@{username}</span>
        </span>
      </div>

      {/* Contact action — stopPropagation handled inside ContactRequestButton */}
      <div className="flex-shrink-0 pr-1">
        <ContactRequestButton userId={id} />
      </div>
    </div>
  );
}

function SearchView() {
  const { users, isShortQuery, isLoading, error } = useSearchedUsers();

  if (isShortQuery) {
    return <ShortTextMessage>Search for people</ShortTextMessage>;
  }

  if (isLoading) {
    return (
      <ShortTextMessage opacity={100}>
        <Loader text="Searching" size="medium" />
      </ShortTextMessage>
    );
  }

  if (error) {
    return <ShortTextMessage>⚠️ Something went wrong!</ShortTextMessage>;
  }

  if (!users.length) {
    return <ShortTextMessage>No users found</ShortTextMessage>;
  }

  return (
    <div className="fadeIn p-2">
      {users.map(({ id, avatar_url, fullname, username }) => (
        <SearchResultRow
          key={id}
          id={id}
          avatar_url={avatar_url}
          fullname={fullname}
          username={username}
        />
      ))}
    </div>
  );
}

export default SearchView;
