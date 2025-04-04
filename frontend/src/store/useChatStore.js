import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [], // Users with existing chats
  searchResults: [], // Search results from all users
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  isSearching: false,
  isMobileView: false, // Track if we're in mobile view

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users/chats");
      set({ users: res.data });
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
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: res.data });
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
}));
