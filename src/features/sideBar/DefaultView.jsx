import { useState } from "react";
import Copyright from "../../components/Copyright";
import { useUi } from "../../contexts/UiContext";
import SearchView from "../userSearch/SearchView";
import ContactsView from "../contacts/ContactsView";
import ContactRequestsView from "../contacts/ContactRequestsView";
import { useIncomingRequests } from "../contacts/useContactData";
import Header from "./Header";
import SearchBox from "./SearchBox";
import UsersView from "./UsersView";

// Tab bar — shown when the search overlay is closed
function TabBar({ activeTab, onTabChange, pendingCount }) {
  return (
    <div className="mt-3 flex gap-1 rounded-lg bg-LightShade/10 p-1">
      <TabButton
        label="Chats"
        active={activeTab === "chats"}
        onClick={() => onTabChange("chats")}
      />
      <TabButton
        label="Contacts"
        active={activeTab === "contacts"}
        onClick={() => onTabChange("contacts")}
        badge={pendingCount}
      />
    </div>
  );
}

function TabButton({ label, active, onClick, badge }) {
  return (
    <button
      onClick={onClick}
      className={`relative flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-sm font-medium transition-colors ${
        active
          ? "bg-bgPrimary text-textPrimary shadow-sm dark:bg-slate-700 dark:text-white"
          : "text-LightGray hover:text-textPrimary dark:hover:text-white"
      }`}
    >
      {label}
      {badge > 0 && (
        <span className="flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-bold text-white leading-none">
          {badge}
        </span>
      )}
    </button>
  );
}

// Contacts tab content — contacts list + requests entry point
function ContactsTab({ pendingCount, onShowRequests }) {
  return (
    <div className="flex h-full flex-col">
      {pendingCount > 0 && (
        <button
          onClick={onShowRequests}
          className="mx-2 mt-2 flex items-center justify-between rounded-lg bg-blue-600/10 px-3 py-2.5 text-sm text-blue-400 transition-colors hover:bg-blue-600/20"
        >
          <span className="font-medium">Contact Requests</span>
          <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-blue-600 px-1.5 text-xs font-bold text-white">
            {pendingCount}
          </span>
        </button>
      )}
      <div className="flex-1 overflow-auto">
        <ContactsView />
      </div>
    </div>
  );
}

function DefaultView() {
  const { isSearchViewOpen } = useUi();
  const [activeTab, setActiveTab] = useState("chats");
  const [showRequests, setShowRequests] = useState(false);
  const { data: incoming = [] } = useIncomingRequests();
  const pendingCount = incoming.length;

  // Requests panel slides in over the contacts tab
  if (showRequests) {
    return (
      <div className="relative z-30 h-screen-safe overflow-hidden">
        <ContactRequestsView onBack={() => setShowRequests(false)} />
      </div>
    );
  }

  return (
    <div className="relative z-30 grid h-screen-safe select-none grid-cols-1 grid-rows-[auto_1fr] overflow-hidden">
      <div className="px-2 py-4">
        <Header />
        <SearchBox />
        {!isSearchViewOpen && (
          <TabBar
            activeTab={activeTab}
            onTabChange={setActiveTab}
            pendingCount={pendingCount}
          />
        )}
      </div>

      <div className="h-full overflow-auto">
        {isSearchViewOpen ? (
          <SearchView />
        ) : activeTab === "chats" ? (
          <UsersView />
        ) : (
          <ContactsTab
            pendingCount={pendingCount}
            onShowRequests={() => setShowRequests(true)}
          />
        )}
      </div>

      <Copyright />
    </div>
  );
}

export default DefaultView;
