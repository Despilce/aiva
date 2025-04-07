import { X } from "lucide-react";
import { formatDate } from "../lib/utils";

const UserProfileModal = ({ user, onClose, isSelfView = false }) => {
  if (!user) return null;

  const isStaff = user.userType === "staff";

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-base-100 rounded-lg max-w-md w-full shadow-xl">
        {/* Header with close button */}
        <div className="flex justify-end p-2">
          <button onClick={onClose} className="btn btn-ghost btn-sm btn-circle">
            <X className="size-5" />
          </button>
        </div>

        {/* Profile content */}
        <div className="p-6 pt-0 text-center">
          {/* Profile picture */}
          <div className="avatar mb-4">
            <div className="w-32 h-32 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
              <img
                src={user.profilePic || "/avatar.png"}
                alt={user.fullName}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* User info */}
          <h2 className="text-2xl font-bold mb-1">
            {user.fullName}
            {isSelfView && " (You)"}
          </h2>
          <p className="text-base-content/70 mb-2">{user.email}</p>

          {/* User Type Badge */}
          <div className="badge badge-primary mb-4">
            {user.userType.charAt(0).toUpperCase() + user.userType.slice(1)}
          </div>

          {/* Staff-specific information */}
          {isStaff && (
            <div className="space-y-4">
              {/* Department and Position */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-base-200 p-3 rounded-lg">
                  <p className="text-sm text-base-content/70">Department</p>
                  <p className="font-medium">{user.department}</p>
                </div>
                <div className="bg-base-200 p-3 rounded-lg">
                  <p className="text-sm text-base-content/70">Position</p>
                  <p className="font-medium">{user.position}</p>
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="bg-base-200 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">
                  Performance Metrics
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div
                      className="radial-progress text-primary mx-auto"
                      style={{
                        "--value": user.performanceMetrics?.percentage || 0,
                        "--size": "4rem",
                      }}
                    >
                      {user.performanceMetrics?.percentage || 0}%
                    </div>
                    <p className="text-sm mt-2">Success Rate</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {user.performanceMetrics?.totalIssues || 0}
                    </div>
                    <p className="text-sm">Total Issues</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {user.performanceMetrics?.solvedIssues || 0}
                    </div>
                    <p className="text-sm">Solved Issues</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Biography */}
          {user.biography && (
            <div className="mt-4 text-left">
              <h3 className="text-sm font-medium text-base-content/70 mb-1">
                Biography
              </h3>
              <p className="text-base bg-base-200 p-3 rounded-lg">
                {user.biography}
              </p>
            </div>
          )}

          {/* Join Date */}
          <div className="mt-6 text-sm text-base-content/60">
            Joined {formatDate(user.createdAt)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfileModal;
