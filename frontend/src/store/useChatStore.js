import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [], // Users with existing chats
  allUsers: [], // All users for department filtering
  searchResults: [], // Search results from all users
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  isSearching: false,
  isMobileView: false, // Track if we're in mobile view

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      // Get users with existing chats
      const chatsRes = await axiosInstance.get("/messages/users/chats");
      set({ users: chatsRes.data });

      // Also fetch all users for department filtering
      const allUsersRes = await axiosInstance.get("/messages/users/sidebar");
      set({ allUsers: allUsersRes.data });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isUsersLoading: false });
    }
  },

  searchUsers: async (query) => {
    set({ isSearching: true });
    try {
      const res = await axiosInstance.get(`/messages/users/search?q=${query}`);
      set({ searchResults: res.data });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isSearching: false });
    }
  },

  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      // Fetch both normal and posted-issue chats
      const [normalRes, postedRes] = await Promise.all([
        axiosInstance.get(`/messages/${userId}?departmentMessageId=`), // normal
        axiosInstance.get(`/messages/${userId}`), // all (for now, fallback)
      ]);
      // For now, use all messages, but expose a helper to filter by departmentMessageId
      set({ messages: postedRes.data });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (messageData) => {
    const { selectedUser, messages, users } = get();
    try {
      const res = await axiosInstance.post(
        `/messages/send/${selectedUser._id}`,
        messageData
      );
      set({
        messages: [...messages, res.data],
        // Add user to chat list if not already there
        users: users.some((u) => u._id === selectedUser._id)
          ? users
          : [...users, selectedUser],
      });
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },

  subscribeToMessages: () => {
    const { selectedUser } = get();
    if (!selectedUser) return;

    const socket = useAuthStore.getState().socket;

    socket.on("newMessage", (newMessage) => {
      const isMessageSentFromSelectedUser =
        newMessage.senderId === selectedUser._id;
      if (!isMessageSentFromSelectedUser) return;

      set({
        messages: [...get().messages, newMessage],
      });
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    socket.off("newMessage");
  },

  setSelectedUser: (selectedUser) => set({ selectedUser }),
  setIsMobileView: (isMobileView) => set({ isMobileView }),
  clearSearchResults: () => set({ searchResults: [] }),

  // Helper: check if a chat with a user is from a posted issue
  isPostedIssueChat: (messages) => {
    return (
      Array.isArray(messages) && messages.some((msg) => msg.departmentMessageId)
    );
  },
}));
