import { useState, useEffect, useRef } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { axiosInstance } from "../lib/axios";
import { format } from "date-fns";

const PrivateChat = ({
  studentId,
  staffId,
  timer: initialTimer,
  onClose,
  onTimerExpire,
  departmentMessageId = null,
  postedIssue = null,
  isAssignedStaff = false,
  onSolved,
}) => {
  const { authUser, socket } = useAuthStore();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [timer, setTimer] = useState(null);
  const [isExpired, setIsExpired] = useState(false);
  const [studentUser, setStudentUser] = useState(null);
  const [staffUser, setStaffUser] = useState(null);
  const messageEndRef = useRef(null);
  const otherUserId = authUser._id === studentId ? staffId : studentId;

  // Fetch user info for both student and staff
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const [studentRes, staffRes] = await Promise.all([
          axiosInstance.get(`/auth/user/${studentId}`),
          axiosInstance.get(`/auth/user/${staffId}`),
        ]);
        setStudentUser(studentRes.data);
        setStaffUser(staffRes.data);
      } catch (e) {
        // fallback: just show 'Student' and 'Staff'
        setStudentUser({ _id: studentId, fullName: "Student" });
        setStaffUser({ _id: staffId, fullName: "Staff" });
      }
    };
    fetchUsers();
  }, [studentId, staffId]);

  // Timer logic: always use postedIssue.acceptedAt for persistency
  useEffect(() => {
    if (!postedIssue || !postedIssue.acceptedAt) {
      setTimer(null);
      setIsExpired(false);
      return;
    }
    const acceptedAt = new Date(postedIssue.acceptedAt).getTime();
    const updateTimer = () => {
      const now = Date.now();
      const elapsed = Math.floor((now - acceptedAt) / 1000);
      const left = 120 - elapsed;
      setTimer(left > 0 ? left : 0);
      if (left <= 0) setIsExpired(true);
    };
    updateTimer();
    if (timer === 0) return;
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line
  }, [postedIssue && postedIssue.acceptedAt]);

  // Call onTimerExpire only once when timer hits 0
  useEffect(() => {
    if (timer === 0 && onTimerExpire && !isExpired) {
      setIsExpired(true);
      onTimerExpire();
    }
    // eslint-disable-next-line
  }, [timer, onTimerExpire]);

  // Fetch messages between student and staff, filtered by departmentMessageId if present
  const fetchMessages = async () => {
    setIsLoading(true);
    try {
      let url = `/messages/${otherUserId}`;
      if (departmentMessageId) {
        url += `?departmentMessageId=${departmentMessageId}`;
      }
      const res = await axiosInstance.get(url);
      setMessages(res.data);
    } catch (error) {
      setMessages([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    // Subscribe to real-time updates
    socket.on("newMessage", (msg) => {
      if (
        (msg.senderId === authUser._id && msg.receiverId === otherUserId) ||
        (msg.senderId === otherUserId && msg.receiverId === authUser._id)
      ) {
        if (
          !departmentMessageId ||
          String(msg.departmentMessageId) === String(departmentMessageId)
        ) {
          setMessages((prev) => {
            // Prevent duplicate messages
            if (prev.some((m) => m._id === msg._id)) return prev;
            return [...prev, msg];
          });
        }
      }
    });
    return () => {
      socket.off("newMessage");
    };
    // eslint-disable-next-line
  }, [otherUserId, departmentMessageId]);

  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isExpired) return;
    setIsLoading(true);
    try {
      // Optimistically add the message to the UI for real-time feedback
      const optimisticMsg = {
        _id: `optimistic-${Date.now()}`,
        senderId: authUser._id,
        receiverId: otherUserId,
        text: input,
        departmentMessageId,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, optimisticMsg]);
      setInput("");
      await axiosInstance.post(`/messages/send/${otherUserId}`, {
        text: optimisticMsg.text,
        departmentMessageId,
      });
    } catch (error) {
      // Optionally show error
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to get sender info
  const getSenderInfo = (msg) => {
    if (msg.senderId === authUser._id)
      return { fullName: "You", profilePic: authUser.profilePic };
    if (msg.senderId === studentId)
      return studentUser || { fullName: "Student" };
    if (msg.senderId === staffId) return staffUser || { fullName: "Staff" };
    return { fullName: "Unknown" };
  };

  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex items-center justify-between p-4 border-b bg-base-100">
        <div className="font-bold text-lg">Private Chat</div>
        <div className="flex items-center gap-4">
          <span
            className={`font-mono font-bold ${
              isExpired ? "text-error" : "text-primary"
            }`}
          >
            Timer:{" "}
            {typeof timer === "number" && timer >= 0 ? (
              `${timer}s`
            ) : (
              <span className="loading loading-spinner loading-xs"></span>
            )}
          </span>
          {isAssignedStaff && !isExpired ? (
            <button className="btn btn-success btn-sm" onClick={onSolved}>
              Solved
            </button>
          ) : (
            onClose && (
              <button className="btn btn-sm" onClick={onClose}>
                Close
              </button>
            )
          )}
        </div>
      </div>
      {/* Show posted issue at the top if present */}
      {postedIssue && (
        <div className="bg-base-200 p-4 border-b border-base-300">
          <div className="font-semibold mb-1">Posted Issue:</div>
          <div className="text-base-content/80">{postedIssue.text}</div>
          <div className="text-xs text-base-content/60 mt-1">
            Posted by: {postedIssue.senderName}
          </div>
        </div>
      )}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-base-50">
        {messages.map((msg) => {
          const sender = getSenderInfo(msg);
          const isOwn = msg.senderId === authUser._id;
          return (
            <div
              key={msg._id}
              className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
            >
              <div className="flex items-end gap-2">
                {!isOwn && (
                  <img
                    src={sender.profilePic || "/avatar.png"}
                    alt={sender.fullName}
                    className="w-8 h-8 rounded-full border"
                  />
                )}
                <div
                  className={`max-w-xs rounded px-3 py-2 ${
                    isOwn ? "bg-primary text-primary-content" : "bg-base-200"
                  }`}
                >
                  <div className="text-xs font-semibold mb-1">
                    {isOwn ? "You" : sender.fullName}
                    <span className="text-[10px] text-base-content/60">
                      {format(new Date(msg.createdAt), "p")}
                    </span>
                  </div>
                  <div>{msg.text}</div>
                </div>
                {isOwn && (
                  <img
                    src={authUser.profilePic || "/avatar.png"}
                    alt={authUser.fullName}
                    className="w-8 h-8 rounded-full border"
                  />
                )}
              </div>
            </div>
          );
        })}
        <div ref={messageEndRef} />
        {isExpired && (
          <div className="text-center text-error font-semibold mt-4">
            Session expired. You can no longer send messages in this session.
          </div>
        )}
      </div>
      <form
        onSubmit={handleSend}
        className="flex gap-2 p-4 border-t bg-base-100"
      >
        <input
          type="text"
          className="input input-bordered flex-1"
          placeholder={isExpired ? "Chat closed" : "Type your message..."}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isLoading || isExpired}
        />
        <button
          type="submit"
          className="btn btn-primary"
          disabled={isLoading || !input.trim() || isExpired}
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default PrivateChat;
