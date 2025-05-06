import { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import { Search, Users } from "lucide-react";
import { useMediaQuery } from "../hooks/useMediaQuery";
import DepartmentsList from "./DepartmentsList";
import UserProfileModal from "./UserProfileModal";

const Sidebar = ({ onDepartmentPortalSelect }) => {
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

  const { authUser, onlineUsers } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [showSelfProfile, setShowSelfProfile] = useState(false);
  const [sidebarMode, setSidebarMode] = useState("personal"); // 'personal' or 'support'
  const isLargeScreen = useMediaQuery("(min-width: 1024px)");
  const isStaff = authUser.userType === "staff";
  const [departmentSearch, setDepartmentSearch] = useState("");
  const departments = [
    {
      id: "SSU(Student Support Unit)",
      name: "SSU",
      fullName: "SSU(Student Support Unit)",
      image: "/SSU.jpg",
      type: "image",
    },
    {
      id: "LRC(Learning Resource Center)",
      name: "LRC",
      fullName: "LRC(Learning Resource Center)",
      image: "/LRC.jpg",
      type: "image",
    },
    {
      id: "EU(Exam Unit)",
      name: "EU",
      fullName: "EU(Exam Unit)",
      bgColor: "#4F46E5",
      type: "letter",
    },
    {
      id: "IT department",
      name: "IT",
      fullName: "IT Department",
      bgColor: "#059669",
      type: "letter",
    },
    {
      id: "CR(Central Registry)",
      name: "CR",
      fullName: "CR(Central Registry)",
      bgColor: "#DC2626",
      type: "letter",
    },
    {
      id: "Academic department",
      name: "AC",
      fullName: "Academic Department",
      bgColor: "#9333EA",
      type: "letter",
    },
  ];
  const staffDepartment = departments.find((d) => d.id === authUser.department);

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
    if (user._id === authUser._id) {
      setShowSelfProfile(true);
      setSelectedUser(null);
    } else {
      setSelectedUser(user);
      setShowSelfProfile(false);
    }
    setSearchQuery("");
  };

  // New: clear selected user when department portal is selected
  const handleDepartmentPortalSelect = (deptId) => {
    setSelectedUser(null);
    if (onDepartmentPortalSelect) onDepartmentPortalSelect(deptId);
  };

  // If in mobile view and chat is open, don't show sidebar
  if (isMobileView && selectedUser) {
    return null;
  }

  // Personal mode: show existing chats
  const displayedUsers = searchQuery ? searchResults : users;

  return (
    <>
      <aside
        className={`h-full ${
          isMobileView ? "w-full" : "w-20 lg:w-[24rem]"
        } border-r border-base-300 flex flex-col transition-all duration-200`}
      >
        {/* Toggle Bar */}
        <div className="flex w-full">
          <button
            className={`flex-1 py-2 text-sm font-semibold rounded-tl-lg ${
              sidebarMode === "personal"
                ? "bg-primary text-white"
                : "bg-base-200 text-base-content"
            }`}
            onClick={() => setSidebarMode("personal")}
          >
            Personal
          </button>
          <button
            className={`flex-1 py-2 text-sm font-semibold rounded-tr-lg ${
              sidebarMode === "support"
                ? "bg-primary text-white"
                : "bg-base-200 text-base-content"
            }`}
            onClick={() => {
              setSidebarMode("support");
              // For staff, auto-open their department portal
              if (isStaff && staffDepartment && onDepartmentPortalSelect) {
                onDepartmentPortalSelect(staffDepartment.id);
              }
            }}
          >
            {isStaff ? "Your Department" : "Support Channels"}
          </button>
        </div>

        {/* Content */}
        {sidebarMode === "personal" ? (
          <div className="border-b border-base-300 w-full p-5 pb-0">
            <div className="flex items-center gap-2">
              
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
                    <span className="size-4 text-base-content/50">×</span>
                  </button>
                )}
              </div>
            </div>
            <div className="overflow-y-auto w-full py-3">
              {isSearching ? (
                <div className="text-center text-zinc-500 py-4">
                  Searching...
                </div>
              ) : (
                <>
                  {displayedUsers.map((user) => (
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
                        className={`$${
                          isMobileView ? "block" : "hidden lg:block"
                        } text-left min-w-0`}
                      >
                        <div className="font-medium truncate">
                          {user.fullName}
                          {user._id === authUser._id && " (You)"}
                        </div>
                        <div className="text-sm text-zinc-400">
                          {user.department ||
                            (onlineUsers.includes(user._id)
                              ? "Online"
                              : "Offline")}
                        </div>
                      </div>
                    </button>
                  ))}
                  {displayedUsers.length === 0 && (
                    <div className="text-center text-zinc-500 py-4">
                      {searchQuery ? "No users found" : "No conversations yet"}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        ) : isStaff ? (
          <div className="p-5">
            {/* Only show staff's own department, auto-open portal */}
            <div className="flex flex-col gap-2">
              <button
                className="flex items-center gap-3 p-2 rounded-lg bg-primary/10 ring-2 ring-primary"
                onClick={() => onDepartmentPortalSelect(staffDepartment.id)}
              >
                <div
                  className={`w-11 h-11 rounded-full overflow-hidden flex items-center justify-center`}
                  style={{ backgroundColor: staffDepartment.bgColor }}
                >
                  {staffDepartment.type === "image" ? (
                    <img
                      src={staffDepartment.image}
                      alt={staffDepartment.fullName}
                      className="w-full h-full object-cover"
                      draggable="false"
                    />
                  ) : (
                    <span className="text-base font-bold text-white">
                      {staffDepartment.name}
                    </span>
                  )}
                </div>
                <span className="text-sm font-medium text-base-content/80 text-left">
                  {staffDepartment.fullName}
                </span>
              </button>
            </div>
          </div>
        ) : (
          <div className="p-5">
            {/* Department search bar for students */}
            <div className="mb-3">
              <input
                type="text"
                placeholder="Search departments..."
                value={departmentSearch}
                onChange={(e) => setDepartmentSearch(e.target.value)}
                className="input input-bordered w-full h-10 text-sm"
              />
            </div>
            <DepartmentsList
              vertical
              onDepartmentSelect={handleDepartmentPortalSelect}
              departmentFilter={departmentSearch}
            />
          </div>
        )}
      </aside>
      {/* Self Profile Modal */}
      {showSelfProfile && (
        <UserProfileModal
          user={authUser}
          onClose={() => setShowSelfProfile(false)}
          isSelfView={true}
        />
      )}
    </>
  );
};

export default Sidebar;
