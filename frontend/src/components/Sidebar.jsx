import { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import { Search, Users, X } from "lucide-react";
import { useMediaQuery } from "../hooks/useMediaQuery";
import DepartmentsList from "./DepartmentsList";
import UserProfileModal from "./UserProfileModal";

const Sidebar = () => {
  const {
    getUsers,
    users,
    allUsers,
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
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSelfProfile, setShowSelfProfile] = useState(false);
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
    // If clicking on own profile, show profile view instead of chat
    if (user._id === authUser._id) {
      setShowSelfProfile(true);
      setSelectedUser(null);
    } else {
      setSelectedUser(user);
      setShowSelfProfile(false);
    }
    setSearchQuery(""); // Clear search when user selected
  };

  // If in mobile view and chat is open, don't show sidebar
  if (isMobileView && selectedUser) {
    return null;
  }

  // Use different user lists based on context
  const baseUsers = selectedDepartment ? allUsers : users;
  const displayedUsers = searchQuery ? searchResults : baseUsers;

  const getDepartmentUsers = () => {
    if (!selectedDepartment) return displayedUsers;

    // Get all staff from the selected department
    const departmentStaff = allUsers.filter(
      (user) =>
        user.userType === "staff" && user.department === selectedDepartment
    );

    // If logged-in user is staff and from this department, ensure they're included
    if (
      authUser.userType === "staff" &&
      authUser.department === selectedDepartment
    ) {
      const selfIncluded = departmentStaff.some(
        (user) => user._id === authUser._id
      );
      if (!selfIncluded) {
        departmentStaff.push(authUser);
      }
    }

    return departmentStaff;
  };

  const filteredUsers = getDepartmentUsers();

  // Debug logging
  console.log("Department Filter Debug:", {
    selectedDepartment,
    authUserDepartment: authUser?.department,
    authUserType: authUser?.userType,
    totalUsers: filteredUsers.length,
    users: filteredUsers.map((u) => ({
      id: u._id,
      name: u.fullName,
      department: u.department,
      type: u.userType,
    })),
  });

  if (isUsersLoading) return <SidebarSkeleton />;

  return (
    <>
      <aside
        className={`h-full ${
          isMobileView ? "w-full" : "w-20 lg:w-[24rem]"
        } border-r border-base-300 flex flex-col transition-all duration-200`}
      >
        <div className="border-b border-base-300 w-full p-5 pb-0">
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

          {/* Departments List */}
          <div className="mt-3">
            <DepartmentsList
              onDepartmentSelect={setSelectedDepartment}
              selectedDepartment={selectedDepartment}
            />
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
                    <div className="font-medium truncate">
                      {user.fullName}
                      {user._id === authUser._id && " (You)"}
                    </div>
                    <div className="text-sm text-zinc-400">
                      {user.department ||
                        (onlineUsers.includes(user._id) ? "Online" : "Offline")}
                    </div>
                  </div>
                </button>
              ))}

              {filteredUsers.length === 0 && (
                <div className="text-center text-zinc-500 py-4">
                  {searchQuery
                    ? "No users found"
                    : selectedDepartment
                    ? "No staff members in this department"
                    : "No conversations yet"}
                </div>
              )}
            </>
          )}
        </div>
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
