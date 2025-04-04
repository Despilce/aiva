import { useState } from "react";
import { X } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import UserProfileModal from "./UserProfileModal";
import { formatLastSeen } from "../lib/utils";

const ChatHeader = () => {
  const { selectedUser, setSelectedUser } = useChatStore();
  const { onlineUsers } = useAuthStore();
  const [showProfile, setShowProfile] = useState(false);

  const isOnline = onlineUsers.includes(selectedUser._id);

  return (
    <>
      <div className="p-2.5 border-b border-base-300">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowProfile(true)}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            {/* Avatar */}
            <div className="avatar">
              <div className="size-10 rounded-full relative">
                <img
                  src={selectedUser.profilePic || "/avatar.png"}
                  alt={selectedUser.fullName}
                />
              </div>
            </div>

            {/* User info */}
            <div>
              <h3 className="font-medium">{selectedUser.fullName}</h3>
              <p className="text-sm text-base-content/70">
                {isOnline
                  ? "Online"
                  : `Last seen ${formatLastSeen(selectedUser.lastSeen)}`}
              </p>
            </div>
          </button>

          {/* Close button */}
          <button onClick={() => setSelectedUser(null)}>
            <X />
          </button>
        </div>
      </div>

      {/* Profile Modal */}
      {showProfile && (
        <UserProfileModal
          user={selectedUser}
          onClose={() => setShowProfile(false)}
        />
      )}
    </>
  );
};

export default ChatHeader;
