import { useChatStore } from "../store/useChatStore";
import { useEffect, useRef } from "react";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { useAuthStore } from "../store/useAuthStore";
import { ArrowLeft } from "lucide-react";
import Message from "./Message";
import Timer from "./Timer";

const ChatContainer = () => {
  const {
    messages,
    getMessages,
    isMessagesLoading,
    selectedUser,
    setSelectedUser,
    subscribeToMessages,
    unsubscribeFromMessages,
    isMobileView,
  } = useChatStore();
  const { authUser } = useAuthStore();
  const messageEndRef = useRef(null);

  useEffect(() => {
    getMessages(selectedUser._id);
    subscribeToMessages();
    return () => unsubscribeFromMessages();
  }, [
    selectedUser._id,
    getMessages,
    subscribeToMessages,
    unsubscribeFromMessages,
  ]);

  useEffect(() => {
    if (messageEndRef.current && messages) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  if (isMessagesLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-auto">
        <ChatHeader />
        <MessageSkeleton />
        <MessageInput />
      </div>
    );
  }

  // Check if the chat is between a student and staff
  const isStudentStaffChat =
    (authUser.userType === "student" && selectedUser.userType === "staff") ||
    (authUser.userType === "staff" && selectedUser.userType === "student");

  return (
    <div
      className={`flex-1 flex flex-col overflow-auto ${
        isMobileView ? "w-full" : ""
      }`}
    >
      {/* Mobile back button */}
      {isMobileView && (
        <div className="p-2 border-b border-base-300">
          <button
            onClick={() => setSelectedUser(null)}
            className="btn btn-ghost btn-sm gap-2"
          >
            <ArrowLeft className="size-4" />
            Back to contacts
          </button>
        </div>
      )}

      <ChatHeader />

      {/* Show timer only in student-staff chats */}
      {isStudentStaffChat && (
        <div className="border-b border-base-300">
          <Timer />
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <Message
            key={message._id}
            message={{
              ...message,
              img: message.image,
              sender: {
                _id: message.senderId,
                fullName:
                  message.senderId === authUser._id
                    ? authUser.fullName
                    : selectedUser.fullName,
                profilePic:
                  message.senderId === authUser._id
                    ? authUser.profilePic
                    : selectedUser.profilePic,
              },
            }}
            isOwnMessage={message.senderId === authUser._id}
          />
        ))}
        <div ref={messageEndRef} />
      </div>

      <MessageInput />
    </div>
  );
};

export default ChatContainer;
