import { useChatStore } from "../store/useChatStore";
import { useEffect, useRef } from "react";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { useAuthStore } from "../store/useAuthStore";
import { ArrowLeft } from "lucide-react";
import Message from "./Message";
import { format } from "date-fns";

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
    isPostedIssueChat,
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

  let postedIssue = null;
  if (Array.isArray(messages) && messages.length > 0) {
    postedIssue = messages.find((msg) => msg.departmentMessageId);
  }

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

      {postedIssue && (
        <div className="bg-base-200 p-4 border-b border-base-300">
          <div className="font-semibold mb-1">Portal Posted Issue:</div>
          <div className="text-base-content/80">{postedIssue.text}</div>
          <div className="text-xs text-base-content/60 mt-1">
            Posted by:{" "}
            {postedIssue.senderId === authUser._id
              ? "You"
              : selectedUser.fullName}
            {postedIssue.createdAt && (
              <span> · {format(new Date(postedIssue.createdAt), "p")}</span>
            )}
          </div>
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
