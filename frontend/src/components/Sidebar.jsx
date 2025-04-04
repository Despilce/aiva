import { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import { Search, Users, X } from "lucide-react";
import { useMediaQuery } from "../hooks/useMediaQuery";

const Sidebar = () => {
  const {
    getUsers,
    users,
    searchUsers,
    searchResults,
    selectedUser,
    setSelectedUser,
    isUsersLoading,
    isSearching,
    isMobileView,
    setIsMobileView,
    clearSearchResults,
  } = useChatStore();

  const { onlineUsers } = useAuthStore();
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const isLargeScreen = useMediaQuery("(min-width: 1024px)");

  useEffect(() => {
    getUsers();
  }, [getUsers]);

  useEffect(() => {
    setIsMobileView(!isLargeScreen);
  }, [isLargeScreen, setIsMobileView]);

  // Handle search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        searchUsers(searchQuery);
      } else {
        clearSearchResults();
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, searchUsers, clearSearchResults]);

  const handleUserSelect = (user) => {
    setSelectedUser(user);
    setSearchQuery(""); // Clear search when user selected
  };

  // If in mobile view and chat is open, don't show sidebar
  if (isMobileView && selectedUser) {
    return null;
  }

  const displayedUsers = searchQuery ? searchResults : users;
  const filteredUsers = showOnlineOnly
    ? displayedUsers.filter((user) => onlineUsers.includes(user._id))
    : displayedUsers;

  if (isUsersLoading) return <SidebarSkeleton />;

  return (
    <aside
      className={`h-full ${
        isMobileView ? "w-full" : "w-20 lg:w-[24rem]"
      } border-r border-base-300 flex flex-col transition-all duration-200`}
    >
      <div className="border-b border-base-300 w-full p-5">
        <div className="flex items-center gap-2">
          <Users className="size-6" />
          <span
            className={`font-medium ${
              isMobileView ? "block" : "hidden lg:block"
            }`}
          >
            Contacts
          </span>
        </div>

        {/* Search input */}
        <div className="mt-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input input-bordered w-full h-10 pl-10 text-sm"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-base-content/50" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className="size-4 text-base-content/50" />
              </button>
            )}
          </div>
        </div>

        {/* Online filter toggle */}
        <div
          className={`mt-3 ${
            isMobileView ? "flex" : "hidden lg:flex"
          } items-center gap-2`}
        >
          <label className="cursor-pointer flex items-center gap-2">
            <input
              type="checkbox"
              checked={showOnlineOnly}
              onChange={(e) => setShowOnlineOnly(e.target.checked)}
              className="checkbox checkbox-sm"
            />
            <span className="text-sm">Show online only</span>
          </label>
          <span className="text-xs text-zinc-500">
            ({onlineUsers.length - 1} online)
          </span>
        </div>
      </div>

      <div className="overflow-y-auto w-full py-3">
        {isSearching ? (
          <div className="text-center text-zinc-500 py-4">Searching...</div>
        ) : (
          <>
            {filteredUsers.map((user) => (
              <button
                key={user._id}
                onClick={() => handleUserSelect(user)}
                className={`
                  w-full p-3 flex items-center gap-3
                  hover:bg-base-300 transition-colors
                  ${
                    selectedUser?._id === user._id
                      ? "bg-base-300 ring-1 ring-base-300"
                      : ""
                  }
                `}
              >
                <div
                  className={`relative ${
                    isMobileView ? "" : "mx-auto lg:mx-0"
                  }`}
                >
                  <img
                    src={user.profilePic || "/avatar.png"}
                    alt={user.name}
                    className="size-12 object-cover rounded-full"
                  />
                  {onlineUsers.includes(user._id) && (
                    <span className="absolute bottom-0 right-0 size-3 bg-green-500 rounded-full ring-2 ring-zinc-900" />
                  )}
                </div>

                <div
                  className={`${
                    isMobileView ? "block" : "hidden lg:block"
                  } text-left min-w-0`}
                >
                  <div className="font-medium truncate">{user.fullName}</div>
                  <div className="text-sm text-zinc-400">
                    {onlineUsers.includes(user._id) ? "Online" : "Offline"}
                  </div>
                </div>
              </button>
            ))}

            {filteredUsers.length === 0 && (
              <div className="text-center text-zinc-500 py-4">
                {searchQuery
                  ? "No users found"
                  : showOnlineOnly
                  ? "No online users"
                  : "No conversations yet"}
              </div>
            )}
          </>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
