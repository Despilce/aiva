import { Link } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { BotMessageSquare, Brain, LogOut, Settings, User } from "lucide-react";

const Navbar = () => {
  const { logout, authUser } = useAuthStore();

  return (
    <header
      className="bg-base-100 border-b border-base-300 fixed w-full top-0 z-40 
    backdrop-blur-lg bg-base-100/80"
    >
      <div className="container mx-auto px-1 h-16">
        <div className="flex items-center justify-between h-full">
          {/* Left Section - BotMessageSquare and Links */}
          <div className="flex items-center gap-8">
            <Link
              to="/"
              className="flex items-center gap-2.5 hover:opacity-80 transition-all"
            >
              <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <BotMessageSquare className="w-5 h-5 text-primary animate-shake" />
              </div>
            </Link>

            {/* Added Links */}
            <a
              href="https://inet.mdis.uz/"
              className="text-xs font-bold text-primary hover:opacity-80 transition-opacity"
            >
              inet
            </a>
            <a
              href="https://elearning.mdis.edu.sg/webapps/portal/execute/tabs/tabAction?tab_tab_group_id=_24_1"
              className="text-xs font-bold text-primary hover:opacity-80 transition-opacity"
            >
              blackboard
            </a>
            <a
              href="https://mail.mdis.uz/owa/auth/logon.aspx?replaceCurrent=1&url=https%3a%2f%2fmail.mdis.uz%2fowa%2f"
              className="text-xs font-bold text-primary hover:opacity-80 transition-opacity"
            >
              webmail
            </a>
          </div>

          {/* Right Section - Settings, Profile, and Logout */}
          <div className="flex items-center gap-2">
            <Link
              to={"/settings"}
              className={`
              btn btn-sm gap-2 transition-colors
              
              `}
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Settings</span>
            </Link>

            {authUser && (
              <>
                <Link to={"/profile"} className={`btn btn-sm gap-2`}>
                  <User className="size-4" />
                  <span className="hidden sm:inline">Profile</span>
                </Link>

                <button className="flex gap-2 items-center" onClick={logout}>
                  <LogOut className="size-4" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
