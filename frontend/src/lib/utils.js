export const formatMessageTime = (date) => {
  const messageDate = new Date(date);
  const now = new Date();
  const diffInDays = Math.floor((now - messageDate) / (1000 * 60 * 60 * 24));
  const diffInMinutes = Math.floor((now - messageDate) / (1000 * 60));
  const diffInHours = Math.floor(diffInMinutes / 60);

  if (diffInDays === 0) {
    // Today - show time only
    return messageDate.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    });
  } else if (diffInDays === 1) {
    // Yesterday - show "Yesterday" and time
    return `Yesterday at ${messageDate.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    })}`;
  } else if (diffInDays < 7) {
    // Within a week - show day name and time
    return messageDate.toLocaleDateString("en-US", {
      weekday: "long",
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    });
  } else {
    // Older - show full date and time
    return messageDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    });
  }
};

export const formatLastSeen = (date) => {
  if (!date) return "";

  const lastSeenDate = new Date(date);
  const now = new Date();
  const diffInMinutes = Math.floor((now - lastSeenDate) / (1000 * 60));
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInMinutes < 1) return "just now";
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInHours < 24) return `${diffInHours}h ago`;
  if (diffInDays === 1) return "yesterday";
  if (diffInDays < 7) {
    return lastSeenDate.toLocaleDateString("en-US", {
      weekday: "long",
    });
  }
  return lastSeenDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

export const formatDate = (date) => {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};
