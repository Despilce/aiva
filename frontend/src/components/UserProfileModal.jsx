import { X } from "lucide-react";
import { formatDate } from "../lib/utils";

const UserProfileModal = ({ user, onClose }) => {
  if (!user) return null;

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
          <h2 className="text-2xl font-bold mb-1">{user.fullName}</h2>
          <p className="text-base-content/70 mb-4">{user.email}</p>

          {/* Performance Metrics for Staff */}
          {user.userType === "staff" && (
            <div className="mb-6 p-4 bg-base-200 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">
                Performance Metrics
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div
                    className="radial-progress text-primary"
                    style={{
                      "--value": user.performanceMetrics?.percentage || 0,
                      "--size": "4rem",
                    }}
                  >
                    {user.performanceMetrics?.percentage || 0}%
                  </div>
                  <p className="text-sm mt-2">Performance</p>
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
          )}

          {/* Biography */}
          {user.biography && (
            <div className="mb-4 text-left">
              <h3 className="text-sm font-medium text-base-content/70 mb-1">
                Biography
              </h3>
              <p className="text-base bg-base-200 p-3 rounded-lg">
                {user.biography}
              </p>
            </div>
          )}

          {/* Additional info */}
          <div className="bg-base-200 rounded-lg p-4 text-sm">
            <p className="flex items-center justify-between">
              <span className="text-base-content/60">Member since</span>
              <span className="font-medium">{formatDate(user.createdAt)}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfileModal;
