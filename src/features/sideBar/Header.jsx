import { useUser } from "../authentication/useUser";
import { useUi } from "../../contexts/UiContext";
import { useNavigate } from "react-router-dom";
import Profile from "../../components/Profile";
import DropdownMenu from "../../components/DropdownMenu";
import IconButton from "../../components/IconButton";
import SignoutButton from "./SignoutButton";
import { HiCog6Tooth } from "react-icons/hi2";

function Header() {
  const { user } = useUser();
  const userData = user?.user_metadata;
  const navigate = useNavigate();

  const {
    openAccountView,
    isSearchViewOpen,
    closeSearchView,
    isMenuOpen,
    toggleMenu,
  } = useUi();

  function handleMenuBtnClick() {
    // if is searching then close search view else open menu
    if (isSearchViewOpen) {
      closeSearchView();
    } else {
      toggleMenu();
    }
  }

  return (
    <div className="mb-4 flex items-center justify-between gap-2">
      <div className="relative">
        <IconButton onClick={handleMenuBtnClick}>
          {isSearchViewOpen && <IconButton.Back />}
          {isMenuOpen && <IconButton.Close />}
          {!isSearchViewOpen && !isMenuOpen && <IconButton.Menu />}
        </IconButton>

        {isMenuOpen && <DropdownMenu />}
      </div>

      <Profile userData={userData} onClick={openAccountView} />

      <button
        onClick={() => navigate("/settings")}
        className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-LightShade/10 dark:hover:bg-LightShade/10 transition-colors"
        aria-label="Settings"
        title="Settings"
      >
        <HiCog6Tooth className="w-5 h-5" />
      </button>

      <SignoutButton />
    </div>
  );
}

export default Header;
