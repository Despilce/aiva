import { useState, useEffect, useRef } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { axiosInstance } from "../lib/axios";
import UserProfileModal from "./UserProfileModal";
import { format } from "date-fns";
import Modal from "./Modal";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { X } from "lucide-react";
import PrivateChat from "./PrivateChat";

const DepartmentPortalChat = ({ department, onClose }) => {
  const { authUser, socket } = useAuthStore();
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
  const [selectedDate, setSelectedDate] = useState(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [deptStats, setDeptStats] = useState(null);
  const [isDeptStatsLoading, setIsDeptStatsLoading] = useState(false);
  const [privateChat, setPrivateChat] = useState(null);

  const departmentAvatars = {
    "SSU(Student Support Unit)": "/SSU.jpg",
    "LRC(Learning Resource Center)": "/LRC.jpg",
    "EU(Exam Unit)": "/departments/eu.png",
    "IT Department": "/departments/it.png",
    "CR(Central Registry)": "/departments/cr.png",
    "Academic Department": "/departments/ac.png",
  };

  // Fetch messages for the department portal
  const fetchMessages = async (date = null) => {
    setIsLoading(true);
    setError("");
    try {
      let url = `/department-messages/${encodeURIComponent(department)}`;
      if (date) {
        url += `?date=${date.toISOString().split("T")[0]}`;
      }
      const res = await axiosInstance.get(url);
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
    if (department) fetchMessages(selectedDate);
    // eslint-disable-next-line
  }, [department, selectedDate]);

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
      await fetchMessages(selectedDate);
    } catch (error) {
      setError(error?.response?.data?.error || "Failed to send message.");
    } finally {
      setIsLoading(false);
    }
  };

  // Find the current active chat (open or assigned, not solved/not_solved)
  const activeChat = messages
    .slice()
    .reverse()
    .find(
      (msg) =>
        ((authUser.userType === "student" && msg.senderId === authUser._id) ||
          (authUser.userType === "staff" &&
            msg.assignedStaff &&
            msg.assignedStaff._id === authUser._id)) &&
        (msg.status === "open" || msg.status === "assigned")
    );

  // Timer: persistent and real-time based on acceptedAt of activeChat
  useEffect(() => {
    if (!activeChat || !activeChat.acceptedAt) {
      setTimer(null);
      return;
    }
    const acceptedAt = new Date(activeChat.acceptedAt).getTime();
    const now = Date.now();
    const elapsed = Math.floor((now - acceptedAt) / 1000);
    const initial = 120 - elapsed;
    setTimer(initial > 0 ? initial : 0);
    if (initial <= 0) return;
    const interval = setInterval(() => {
      const now2 = Date.now();
      const elapsed2 = Math.floor((now2 - acceptedAt) / 1000);
      const left = 120 - elapsed2;
      setTimer(left > 0 ? left : 0);
      if (left <= 0) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, [activeChat && activeChat.acceptedAt]);

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

  // Fetch department stats when modal opens
  useEffect(() => {
    if (showDeptModal) {
      setIsDeptStatsLoading(true);
      axiosInstance
        .get(`/stats/department/${encodeURIComponent(department)}`)
        .then((res) => setDeptStats(res.data))
        .catch(() => setDeptStats(null))
        .finally(() => setIsDeptStatsLoading(false));
    }
  }, [showDeptModal, department]);

  // Message input logic:
  // For students: allow sending if (a) activeChat exists and is assigned and timer > 0, or (b) no activeChat exists (can start new issue)
  // For staff: allow sending if activeChat exists and is assigned and timer > 0
  const studentCanSend =
    authUser.userType === "student" &&
    ((activeChat && activeChat.status === "assigned" && timer > 0) ||
      !activeChat);
  const staffCanSend =
    authUser.userType === "staff" &&
    activeChat &&
    activeChat.status === "assigned" &&
    activeChat.assignedStaff &&
    activeChat.assignedStaff._id === authUser._id &&
    timer > 0;

  // Real-time department chat updates
  useEffect(() => {
    if (!socket || !department) return;
    const handleRealtimeUpdate = () => fetchMessages(selectedDate);
    socket.on("departmentMessage:new", handleRealtimeUpdate);
    socket.on("departmentMessage:accepted", handleRealtimeUpdate);
    socket.on("departmentMessage:solved", handleRealtimeUpdate);
    return () => {
      socket.off("departmentMessage:new", handleRealtimeUpdate);
      socket.off("departmentMessage:accepted", handleRealtimeUpdate);
      socket.off("departmentMessage:solved", handleRealtimeUpdate);
    };
    // eslint-disable-next-line
  }, [socket, department, selectedDate]);

  useEffect(() => {
    if (!socket) return;
    const handlePrivateChatStart = ({ studentId, staffId }) => {
      if (authUser._id === studentId || authUser._id === staffId) {
        setPrivateChat({ studentId, staffId });
      }
    };
    socket.on("departmentMessage:privateChatStart", handlePrivateChatStart);
    return () => {
      socket.off("departmentMessage:privateChatStart", handlePrivateChatStart);
    };
  }, [socket, authUser._id]);

  const handleAccept = async (messageId, studentId) => {
    setIsLoading(true);
    setError("");
    try {
      await axiosInstance.post(`/department-messages/accept/${messageId}`);
      setTimer(120);
      await fetchMessages(selectedDate);
    } catch (error) {
      setError(error?.response?.data?.error || "Failed to accept message.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSolved = async (messageId) => {
    setIsLoading(true);
    setError("");
    try {
      await axiosInstance.post(`/department-messages/solve/${messageId}`);
      await fetchMessages(selectedDate);
      setTimer(null); // Stop the timer when solved
    } catch (error) {
      setError(error?.response?.data?.error || "Failed to mark as solved.");
    } finally {
      setIsLoading(false);
    }
  };

  // Block new issues if privateChat is active
  const canSendNewIssue = !(
    activeChat &&
    (activeChat.status === "open" || activeChat.status === "assigned")
  );

  // Render private chat UI if privateChat is set
  if (privateChat) {
    // Find the posted issue for this session (the original open/assigned message)
    const postedIssue =
      messages.find(
        (msg) =>
          msg.status === "assigned" &&
          msg.assignedStaff &&
          msg.assignedStaff._id === privateChat.staffId &&
          msg.senderId === privateChat.studentId
      ) ||
      messages.find(
        (msg) => msg.status === "open" && msg.senderId === privateChat.studentId
      );
    // Use the departmentMessageId from the posted issue
    const departmentMessageId = postedIssue ? postedIssue._id : null;
    return (
      <PrivateChat
        studentId={privateChat.studentId}
        staffId={privateChat.staffId}
        timer={timer}
        onClose={() => setPrivateChat(null)}
        onTimerExpire={() => {}}
        departmentMessageId={departmentMessageId}
        postedIssue={postedIssue}
      />
    );
  }

  // Always show PrivateChat if there is an active session (open or assigned)
  if (
    activeChat &&
    (activeChat.status === "open" || activeChat.status === "assigned")
  ) {
    const postedIssue = activeChat;
    const departmentMessageId = postedIssue ? postedIssue._id : null;
    // Determine studentId and staffId for the session
    const studentId = postedIssue.senderId;
    const staffId = postedIssue.assignedStaff
      ? postedIssue.assignedStaff._id
      : null;
    // Only show PrivateChat if both student and staff are defined (after accept)
    if (studentId && staffId) {
      return (
        <PrivateChat
          studentId={studentId}
          staffId={staffId}
          timer={timer}
          onClose={() => {}}
          onTimerExpire={async () => {
            // When timer expires, refresh portal state so the UI updates
            await fetchMessages(selectedDate);
          }}
          departmentMessageId={departmentMessageId}
          postedIssue={postedIssue}
        />
      );
    }
    // If not yet accepted, show waiting message
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <div className="text-lg font-semibold mb-4">
          Waiting for staff to accept your issue...
        </div>
        <div className="text-base-content/70">
          You will be redirected to a private chat once a staff accepts your
          issue.
        </div>
      </div>
    );
  }

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
          {/* Manager calendar button - responsive */}
          {authUser.userType === "manager" &&
            authUser.department === department && (
              <>
                <button
                  className="btn btn-xs btn-outline ml-2 hidden sm:flex items-center gap-1"
                  onClick={() => setShowCalendar((v) => !v)}
                >
                  <span role="img" aria-label="calendar">
                    📅
                  </span>
                  <span className="hidden sm:inline">Calendar</span>
                </button>
                <button
                  className="btn btn-xs btn-ghost ml-2 flex sm:hidden items-center justify-center"
                  onClick={() => setShowCalendar((v) => !v)}
                  title="Calendar"
                >
                  <span
                    role="img"
                    aria-label="calendar"
                    style={{ fontSize: "1.25rem", lineHeight: 1 }}
                  >
                    📅
                  </span>
                </button>
                {showCalendar && (
                  <div className="absolute z-50 mt-12">
                    <DatePicker
                      selected={selectedDate}
                      onChange={(date) => {
                        setSelectedDate(date);
                        setShowCalendar(false);
                      }}
                      inline
                    />
                    <button
                      className="btn btn-xs btn-warning mt-2 w-full"
                      onClick={() => {
                        setSelectedDate(null);
                        setShowCalendar(false);
                      }}
                    >
                      Clear Filter
                    </button>
                  </div>
                )}
              </>
            )}
        </div>
        {/* Responsive close button */}
        <button className="btn btn-sm hidden sm:inline-flex" onClick={onClose}>
          Close
        </button>
        <button
          className="btn btn-sm flex sm:hidden items-center justify-center p-2"
          onClick={onClose}
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-base-50">
        {error && <div className="text-error font-semibold mb-2">{error}</div>}
        {isLoading ? (
          <div>Loading...</div>
        ) : messages.length === 0 ? (
          <div className="text-base-content/60 italic">{emptyStateMessage}</div>
        ) : (
          <>
            {activeChat && activeChat.status === "assigned" && timer > 0 && (
              <div className="w-full flex justify-center py-2">
                <span className="font-mono text-lg font-bold text-primary">
                  Timer: {timer}s
                </span>
              </div>
            )}
            {messages.map((msg) => (
              <div
                key={msg._id}
                className={`flex items-center gap-2 ${
                  msg.status === "not_solved"
                    ? "bg-warning/30 border-l-4 border-warning"
                    : ""
                }`}
              >
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
                      {msg.createdAt
                        ? format(new Date(msg.createdAt), "p")
                        : ""}
                    </span>
                  </div>
                  <div
                    className={`bg-base-200 rounded px-3 py-2 mt-1 ${
                      msg.status === "not_solved"
                        ? "text-warning font-bold"
                        : ""
                    }`}
                  >
                    {msg.text}
                    {msg.status === "not_solved" && (
                      <div className="text-xs text-warning mt-1 font-bold">
                        Not solved in time! Assigned staff:{" "}
                        {msg.assignedStaff?.fullName || "Unknown"}
                      </div>
                    )}
                  </div>
                  {/* Solved by and time taken */}
                  {msg.status === "solved" &&
                    msg.solvedAt &&
                    msg.acceptedAt && (
                      <div className="text-xs text-success mt-1">
                        Solved by {msg.assignedStaff?.fullName || "Staff"} ·
                        Time taken:{" "}
                        {Math.round(
                          (new Date(msg.solvedAt) - new Date(msg.acceptedAt)) /
                            1000
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
                {/* Staff: show Accept button for unassigned student messages */}
                {authUser.userType === "staff" &&
                  msg.status === "open" &&
                  msg.senderType === "student" &&
                  !msg.assignedStaff && (
                    <button
                      className="btn btn-xs btn-primary"
                      onClick={(e) => {
                        e.preventDefault();
                        handleAccept(msg._id, msg.senderId);
                      }}
                      disabled={isLoading || !canSendNewIssue}
                    >
                      Accept
                    </button>
                  )}
                {/* Assigned staff: show Solved button for their assigned issue */}
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
            ))}
            <div ref={messageEndRef} />
          </>
        )}
      </div>
      {/* Message input for students and assigned staff only */}
      {(studentCanSend || staffCanSend) && (
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
            disabled={isLoading || (!studentCanSend && !staffCanSend)}
          />
          <button
            type="submit"
            className="btn btn-primary"
            disabled={
              isLoading || !input.trim() || (!studentCanSend && !staffCanSend)
            }
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
            {isDeptStatsLoading ? (
              <div className="mt-4">Loading performance...</div>
            ) : deptStats ? (
              <div className="w-full mt-4 bg-base-200 rounded-lg p-4 text-center">
                <div className="font-semibold mb-2">Performance Metrics</div>
                <div className="flex flex-col gap-2 items-center">
                  <div>
                    <span className="font-bold text-lg text-success">
                      {deptStats.totalIssues > 0
                        ? Math.round(
                            (deptStats.solvedIssues / deptStats.totalIssues) *
                              100
                          )
                        : 0}
                      %
                    </span>
                    <span className="ml-2 text-xs text-base-content/60">
                      Success Rate
                    </span>
                  </div>
                  <div className="flex gap-4 justify-center">
                    <div>
                      <div className="text-xs text-base-content/60">
                        Total Issues
                      </div>
                      <div className="font-bold">{deptStats.totalIssues}</div>
                    </div>
                    <div>
                      <div className="text-xs text-base-content/60">Solved</div>
                      <div className="font-bold text-success">
                        {deptStats.solvedIssues}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-base-content/60">
                        Unsolved
                      </div>
                      <div className="font-bold text-error">
                        {deptStats.unsolvedIssues}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-4 text-error">
                Failed to load performance metrics
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default DepartmentPortalChat;
