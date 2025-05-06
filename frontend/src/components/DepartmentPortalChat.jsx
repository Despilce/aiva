import { useState, useEffect, useRef } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { axiosInstance } from "../lib/axios";
import UserProfileModal from "./UserProfileModal";
import { format } from "date-fns";
import Modal from "./Modal";

const DepartmentPortalChat = ({ department, onClose }) => {
  const { authUser } = useAuthStore();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [timer, setTimer] = useState(null);
  const [profileUser, setProfileUser] = useState(null);
  const [error, setError] = useState("");
  const messageEndRef = useRef(null);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [deptImgError, setDeptImgError] = useState(false);

  const departmentAvatars = {
    "SSU(Student Support Unit)": "/SSU.jpg",
    "LRC(Learning Resource Center)": "/LRC.jpg",
    "EU(Exam Unit)": "/departments/eu.png",
    "IT Department": "/departments/it.png",
    "CR(Central Registry)": "/departments/cr.png",
    "Academic Department": "/departments/ac.png",
  };

  // Fetch messages for the department portal
  const fetchMessages = async () => {
    setIsLoading(true);
    setError("");
    try {
      const res = await axiosInstance.get(
        `/department-messages/${encodeURIComponent(department)}`
      );
      setMessages(res.data);
    } catch (error) {
      setMessages([]);
      // Only show error for staff, not students
      if (authUser.userType !== "student") {
        setError("Failed to load messages. Please try again later.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (department) fetchMessages();
    // eslint-disable-next-line
  }, [department]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Send message handler
  const handleSend = async (e) => {
    e.preventDefault();
    setError("");
    if (!input.trim()) return;
    setIsLoading(true);
    try {
      await axiosInstance.post(
        `/department-messages/send/${encodeURIComponent(department)}`,
        { text: input }
      );
      setInput("");
      await fetchMessages();
    } catch (error) {
      setError(error?.response?.data?.error || "Failed to send message.");
    } finally {
      setIsLoading(false);
    }
  };

  // Accept handler (for staff)
  const handleAccept = async (messageId) => {
    setIsLoading(true);
    setError("");
    try {
      await axiosInstance.post(`/department-messages/accept/${messageId}`);
      await fetchMessages();
      setTimer(30); // Start timer for the accepted message
    } catch (error) {
      setError(error?.response?.data?.error || "Failed to accept message.");
    } finally {
      setIsLoading(false);
    }
  };

  // Solved handler (for assigned staff)
  const handleSolved = async (messageId) => {
    setIsLoading(true);
    setError("");
    try {
      await axiosInstance.post(`/department-messages/solve/${messageId}`);
      await fetchMessages();
      setTimer(null);
    } catch (error) {
      setError(error?.response?.data?.error || "Failed to mark as solved.");
    } finally {
      setIsLoading(false);
    }
  };

  // Timer effect: only for assigned staff
  useEffect(() => {
    if (timer === null) return;
    if (timer === 0) return;
    const interval = setInterval(() => {
      setTimer((t) => (t > 0 ? t - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [timer]);

  // Find the latest assigned message for timer and solved logic
  const latestAssigned = messages
    .slice()
    .reverse()
    .find(
      (msg) =>
        msg.status === "assigned" &&
        msg.assignedStaff &&
        msg.assignedStaff._id === authUser._id
    );

  // Find the latest assigned message for student view
  const latestStudentAssigned = messages
    .slice()
    .reverse()
    .find((msg) => msg.status === "assigned" && msg.senderId === authUser._id);

  // Only allow staff from the correct department to accept
  const canAccept =
    authUser.userType === "staff" && authUser.department === department;

  // Reset modals and profile state when department changes (chat switch)
  useEffect(() => {
    setShowDeptModal(false);
    setProfileUser(null);
    setProfileError("");
    setIsProfileLoading(false);
    setDeptImgError(false);
  }, [department]);

  // Show user profile modal on avatar click (always fetch latest info)
  const handleShowProfile = async (userId) => {
    setIsProfileLoading(true);
    setProfileError("");
    setProfileUser(null);
    try {
      const res = await axiosInstance.get(`/auth/user/${userId}`);
      setProfileUser(res.data);
    } catch (error) {
      setProfileUser(null);
      setProfileError("User not found");
    } finally {
      setIsProfileLoading(false);
    }
  };

  // Determine if the staff is the assigned staff for the current open issue
  const assignedStaffId = messages.find(
    (msg) => msg.status === "assigned" && msg.assignedStaff
  )?.assignedStaff?._id;
  const isAssignedStaff =
    authUser.userType === "staff" && assignedStaffId === authUser._id;

  // Determine if the user can send messages
  const canSend =
    authUser.userType === "student" ||
    (authUser.userType === "staff" && isAssignedStaff);

  // Determine the correct empty state message
  const emptyStateMessage =
    authUser.userType === "student"
      ? "No messages yet. Start a conversation."
      : "No messages yet. Waiting for a student to start a conversation.";

  return (
    <div className="flex-1 flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b bg-base-100">
        <div className="flex items-center gap-3">
          {/* Department avatar */}
          <button
            className="avatar w-12 h-12 rounded-full overflow-hidden border border-base-300 focus:outline-none"
            style={{ padding: 0, background: "none" }}
            type="button"
            onClick={() => setShowDeptModal(true)}
          >
            <img
              src={
                deptImgError
                  ? "/departments/default.png"
                  : departmentAvatars[department] || "/departments/default.png"
              }
              alt={department}
              className="w-full h-full object-cover"
              onError={() => setDeptImgError(true)}
            />
          </button>
          <div className="font-bold text-lg">{department} Portal</div>
        </div>
        <button className="btn btn-sm" onClick={onClose}>
          Close
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-base-50">
        {error && <div className="text-error font-semibold mb-2">{error}</div>}
        {isLoading ? (
          <div>Loading...</div>
        ) : messages.length === 0 ? (
          <div className="text-base-content/60 italic">{emptyStateMessage}</div>
        ) : (
          messages.map((msg) => (
            <div key={msg._id} className="flex items-center gap-2">
              {/* Avatar with click to show profile */}
              <button
                className="avatar w-10 h-10 rounded-full overflow-hidden border border-base-300 focus:outline-none"
                onClick={() => handleShowProfile(msg.senderId)}
                style={{ padding: 0, background: "none" }}
                type="button"
              >
                <img
                  src={msg.profilePic || "/avatar.png"}
                  alt={msg.senderName}
                  className="w-full h-full object-cover"
                />
              </button>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{msg.senderName}</span>
                  {/* Timestamp */}
                  <span className="text-xs text-base-content/60">
                    {msg.createdAt ? format(new Date(msg.createdAt), "p") : ""}
                  </span>
                </div>
                <div className="bg-base-200 rounded px-3 py-2 mt-1">
                  {msg.text}
                </div>
                {/* Solved by and time taken */}
                {msg.status === "solved" && msg.solvedAt && msg.acceptedAt && (
                  <div className="text-xs text-success mt-1">
                    Solved by {msg.assignedStaff?.fullName || "Staff"} · Time
                    taken:{" "}
                    {Math.round(
                      (new Date(msg.solvedAt) - new Date(msg.acceptedAt)) / 1000
                    )}
                    s
                  </div>
                )}
                {/* Accepted by for other staff while assigned */}
                {msg.status === "assigned" &&
                  msg.assignedStaff &&
                  msg.assignedStaff._id !== authUser._id && (
                    <div className="text-xs text-primary mt-1">
                      Accepted by {msg.assignedStaff.fullName}
                    </div>
                  )}
              </div>
              {/* Timer visible to both student and staff if assigned */}
              {msg.status === "assigned" && msg.assignedStaff && (
                <span className="ml-2 font-mono text-lg">
                  Timer: {timer ?? 30}s
                </span>
              )}
              {/* Staff: show Accept button for unassigned student messages */}
              {canAccept &&
                msg.status === "open" &&
                msg.senderType === "student" && (
                  <button
                    className="btn btn-xs btn-primary"
                    onClick={() => handleAccept(msg._id)}
                    disabled={isLoading}
                  >
                    Accept
                  </button>
                )}
              {/* Assigned staff: show Solved button */}
              {authUser.userType === "staff" &&
                msg.status === "assigned" &&
                msg.assignedStaff &&
                msg.assignedStaff._id === authUser._id && (
                  <button
                    className="btn btn-success btn-xs ml-2"
                    onClick={() => handleSolved(msg._id)}
                    disabled={isLoading}
                  >
                    Solved
                  </button>
                )}
            </div>
          ))
        )}
        <div ref={messageEndRef} />
      </div>
      {/* Message input for students and assigned staff only */}
      {(authUser.userType === "student" || isAssignedStaff) && (
        <form
          onSubmit={handleSend}
          className="flex gap-2 p-4 border-t bg-base-100"
        >
          <input
            type="text"
            className="input input-bordered flex-1"
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading || !canSend}
          />
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isLoading || !input.trim() || !canSend}
          >
            Send
          </button>
        </form>
      )}
      {/* Student profile modal for staff */}
      {(isProfileLoading || profileUser || profileError) && (
        <UserProfileModal
          user={profileUser}
          onClose={() => {
            setProfileUser(null);
            setProfileError("");
          }}
        >
          {isProfileLoading ? (
            <div className="p-8 text-center">Loading...</div>
          ) : profileError ? (
            <div className="p-8 text-center text-error">{profileError}</div>
          ) : null}
        </UserProfileModal>
      )}
      {/* Department info modal */}
      {showDeptModal && (
        <Modal onClose={() => setShowDeptModal(false)}>
          <div className="flex flex-col items-center p-8">
            <img
              src={
                deptImgError
                  ? "/departments/default.png"
                  : departmentAvatars[department] || "/departments/default.png"
              }
              alt={department}
              className="w-32 h-32 rounded-full object-cover border mb-4 bg-white"
              onError={() => setDeptImgError(true)}
            />
            <div className="font-bold text-xl mb-2 text-center">
              {department}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default DepartmentPortalChat;
