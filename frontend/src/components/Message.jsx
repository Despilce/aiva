import { useState } from "react";
import { formatMessageTime } from "../lib/utils";
import ImageViewer from "./ImageViewer";

const Message = ({ message, isOwnMessage }) => {
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);

  return (
    <>
      <div className={`chat ${isOwnMessage ? "chat-end" : "chat-start"}`}>
        <div className="chat-image avatar">
          <div className="w-10 rounded-full">
            <img
              src={message.sender.profilePic || "/avatar.png"}
              alt="avatar"
            />
          </div>
        </div>
        <div
          className={`chat-header opacity-50 ${
            isOwnMessage ? "text-right" : ""
          }`}
        >
          {message.sender.fullName}
          <time className="text-xs ml-1">
            {formatMessageTime(message.createdAt)}
          </time>
        </div>
        <div
          className={`chat-bubble p-0 overflow-hidden flex flex-col ${
            isOwnMessage ? "chat-bubble-primary" : ""
          }`}
        >
          {message.text && (
            <p className="px-4 py-3 break-words">{message.text}</p>
          )}
          {message.img && (
            <div className={`${message.text ? "mt-1" : ""} flex`}>
              <img
                src={message.img}
                alt="message"
                onClick={() => setIsImageViewerOpen(true)}
                className="w-auto max-h-[280px] object-contain cursor-pointer hover:brightness-90 transition-all"
                style={{
                  maxWidth: "280px",
                }}
              />
            </div>
          )}
        </div>
      </div>

      <ImageViewer
        isOpen={isImageViewerOpen}
        imageUrl={message.img}
        onClose={() => setIsImageViewerOpen(false)}
      />
    </>
  );
};

export default Message;
