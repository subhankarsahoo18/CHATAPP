import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";
import { soundFx } from "../lib/audioSound";
import {
  showDeviceNotification,
  formatMessagePreview,
  notifyOfflineMessages,
} from "../lib/deviceNotification";

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  groups: [],
  searchResults: [],
  typingUsers: {},
  groupTypingUsers: {}, // { [groupId]: { [userId]: userName } }
  selectedUser: null, // Holds active 1-on-1 contact OR active group (with isGroup: true)
  isUsersLoading: false,
  isGroupsLoading: false,
  isMessagesLoading: false,
  isSearching: false,

  // Rich Chat Modals & Drawers
  replyingTo: null,
  isContactDrawerOpen: false,
  isSearchInChatOpen: false,
  searchInChatQuery: "",
  lightboxImage: null,
  isCreateGroupModalOpen: false,
  isAddMemberModalOpen: false,

  // 1-on-1 Call State
  callState: {
    isOpen: false,
    callType: "audio", // "audio" | "video"
    status: "idle",    // "idle" | "calling" | "incoming" | "connected"
    isCaller: false,
    targetUser: null,
    incomingSignal: null,
  },

  // Group Call State (Multi-user Audio / Video Call)
  groupCallState: {
    isOpen: false,
    groupId: null,
    groupName: "",
    groupPic: "",
    callType: "audio", // "audio" | "video"
    status: "idle",    // "idle" | "calling" | "incoming" | "connected"
    isCaller: false,
    caller: null,
    members: [],
    participants: [],
  },

  setReplyingTo: (message) => set({ replyingTo: message }),
  setIsContactDrawerOpen: (isOpen) => set({ isContactDrawerOpen: isOpen }),
  setIsSearchInChatOpen: (isOpen) => set({ isSearchInChatOpen: isOpen, searchInChatQuery: "" }),
  setSearchInChatQuery: (query) => set({ searchInChatQuery: query }),
  setLightboxImage: (imageUrl) => set({ lightboxImage: imageUrl }),
  setIsCreateGroupModalOpen: (isOpen) => set({ isCreateGroupModalOpen: isOpen }),
  setIsAddMemberModalOpen: (isOpen) => set({ isAddMemberModalOpen: isOpen }),

  // ================= 1-on-1 CALL HANDLERS =================
  startCall: (targetUser, callType = "audio") => {
    soundFx.resume();

    set({
      callState: {
        isOpen: true,
        callType,
        status: "calling",
        isCaller: true,
        targetUser,
        incomingSignal: null,
      },
    });

    soundFx.startCallingRingtone();
  },

  acceptCall: () => {
    soundFx.resume();
    const { callState } = get();
    soundFx.stopRingtone();

    set({
      callState: {
        ...callState,
        status: "connected",
      },
    });
  },

  rejectCall: () => {
    const { callState } = get();
    const socket = useAuthStore.getState().socket;

    soundFx.stopRingtone();
    soundFx.playCallEndTone();

    if (socket && callState.targetUser) {
      socket.emit("rejectCall", { to: callState.targetUser._id });
    }

    set({
      callState: {
        isOpen: false,
        callType: "audio",
        status: "idle",
        isCaller: false,
        targetUser: null,
        incomingSignal: null,
      },
    });
  },

  endCall: () => {
    const { callState } = get();
    const socket = useAuthStore.getState().socket;

    soundFx.stopRingtone();
    soundFx.playCallEndTone();

    if (socket && callState.targetUser) {
      socket.emit("endCall", { to: callState.targetUser._id });
    }

    set({
      callState: {
        isOpen: false,
        callType: "audio",
        status: "idle",
        isCaller: false,
        targetUser: null,
        incomingSignal: null,
      },
    });
  },

  // ================= GROUP CALL HANDLERS =================
  startGroupCall: (group, callType = "audio") => {
    soundFx.resume();
    const socket = useAuthStore.getState().socket;
    const authUser = useAuthStore.getState().authUser;

    const callerObj = {
      _id: authUser._id,
      fullName: authUser.fullName,
      profilePic: authUser.profilePic,
    };

    set({
      groupCallState: {
        isOpen: true,
        groupId: group._id,
        groupName: group.name,
        groupPic: group.groupPic,
        callType,
        status: "calling",
        isCaller: true,
        caller: callerObj,
        members: group.members || [],
        participants: [
          {
            user: callerObj,
            socketId: socket?.id,
            isMuted: false,
            isVideoOff: callType === "audio",
          },
        ],
      },
    });

    soundFx.startCallingRingtone();

    if (socket) {
      socket.emit("startGroupCall", {
        groupId: group._id,
        groupName: group.name,
        groupPic: group.groupPic,
        callType,
        members: group.members?.map((m) => (typeof m === "object" ? m._id : m)),
        caller: callerObj,
      });
    }
  },

  acceptGroupCall: () => {
    soundFx.resume();
    const socket = useAuthStore.getState().socket;
    const authUser = useAuthStore.getState().authUser;
    const { groupCallState } = get();

    soundFx.stopRingtone();

    const myParticipant = {
      user: {
        _id: authUser._id,
        fullName: authUser.fullName,
        profilePic: authUser.profilePic,
      },
      socketId: socket?.id,
      isMuted: false,
      isVideoOff: groupCallState.callType === "audio",
    };

    const exists = groupCallState.participants.some(
      (p) => p.user?._id === authUser._id
    );

    set({
      groupCallState: {
        ...groupCallState,
        status: "connected",
        participants: exists
          ? groupCallState.participants
          : [...groupCallState.participants, myParticipant],
      },
    });

    if (socket && groupCallState.groupId) {
      socket.emit("joinGroupCall", {
        groupId: groupCallState.groupId,
        user: myParticipant.user,
        callType: groupCallState.callType,
      });
    }
  },

  rejectGroupCall: () => {
    const socket = useAuthStore.getState().socket;
    const authUser = useAuthStore.getState().authUser;
    const { groupCallState } = get();

    soundFx.stopRingtone();
    soundFx.playCallEndTone();

    if (socket && groupCallState.groupId) {
      socket.emit("rejectGroupCall", {
        groupId: groupCallState.groupId,
        user: { _id: authUser._id, fullName: authUser.fullName },
      });
    }

    set({
      groupCallState: {
        isOpen: false,
        groupId: null,
        groupName: "",
        groupPic: "",
        callType: "audio",
        status: "idle",
        isCaller: false,
        caller: null,
        members: [],
        participants: [],
      },
    });
  },

  leaveGroupCall: () => {
    const socket = useAuthStore.getState().socket;
    const authUser = useAuthStore.getState().authUser;
    const { groupCallState } = get();

    soundFx.stopRingtone();
    soundFx.playCallEndTone();

    if (socket && groupCallState.groupId) {
      socket.emit("leaveGroupCall", {
        groupId: groupCallState.groupId,
        user: { _id: authUser._id, fullName: authUser.fullName },
      });
    }

    set({
      groupCallState: {
        isOpen: false,
        groupId: null,
        groupName: "",
        groupPic: "",
        callType: "audio",
        status: "idle",
        isCaller: false,
        caller: null,
        members: [],
        participants: [],
      },
    });
  },

  toggleGroupCallMute: (isMuted) => {
    const socket = useAuthStore.getState().socket;
    const authUser = useAuthStore.getState().authUser;
    const { groupCallState } = get();

    set((state) => ({
      groupCallState: {
        ...state.groupCallState,
        participants: state.groupCallState.participants.map((p) =>
          p.user?._id === authUser._id ? { ...p, isMuted } : p
        ),
      },
    }));

    if (socket && groupCallState.groupId) {
      socket.emit("groupCallStateUpdate", {
        groupId: groupCallState.groupId,
        user: { _id: authUser._id, fullName: authUser.fullName },
        isMuted,
        isVideoOff: false,
      });
    }
  },

  toggleGroupCallVideo: (isVideoOff) => {
    const socket = useAuthStore.getState().socket;
    const authUser = useAuthStore.getState().authUser;
    const { groupCallState } = get();

    set((state) => ({
      groupCallState: {
        ...state.groupCallState,
        participants: state.groupCallState.participants.map((p) =>
          p.user?._id === authUser._id ? { ...p, isVideoOff } : p
        ),
      },
    }));

    if (socket && groupCallState.groupId) {
      socket.emit("groupCallStateUpdate", {
        groupId: groupCallState.groupId,
        user: { _id: authUser._id, fullName: authUser.fullName },
        isMuted: false,
        isVideoOff,
      });
    }
  },

  // ================= USERS & CONTACTS =================
  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");
      set({ users: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load chats");
    } finally {
      set({ isUsersLoading: false });
    }
  },

  searchGlobalUsers: async (query) => {
    if (!query || !query.trim()) {
      set({ searchResults: [] });
      return;
    }
    set({ isSearching: true });
    try {
      const res = await axiosInstance.get(
        `/messages/search?query=${encodeURIComponent(query.trim())}`
      );
      set({ searchResults: res.data });
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      set({ isSearching: false });
    }
  },

  // ================= GROUPS MANAGEMENT =================
  getGroups: async () => {
    set({ isGroupsLoading: true });
    try {
      const res = await axiosInstance.get("/groups");
      const mapped = res.data.map((g) => ({ ...g, isGroup: true }));
      set({ groups: mapped });
    } catch (error) {
      console.error("Failed to load groups:", error);
    } finally {
      set({ isGroupsLoading: false });
    }
  },

  createGroup: async (groupData) => {
    try {
      const res = await axiosInstance.post("/groups", groupData);
      const newGroup = { ...res.data, isGroup: true };
      set((state) => ({
        groups: [newGroup, ...state.groups],
        isCreateGroupModalOpen: false,
      }));
      toast.success(`Group "${newGroup.name}" created!`);
      get().setSelectedUser(newGroup);
      return newGroup;
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to create group");
      throw error;
    }
  },

  updateGroup: async (groupId, data) => {
    try {
      const res = await axiosInstance.put(`/groups/${groupId}`, data);
      const updated = { ...res.data, isGroup: true };
      set((state) => ({
        groups: state.groups.map((g) => (g._id === groupId ? updated : g)),
        selectedUser:
          state.selectedUser?._id === groupId ? updated : state.selectedUser,
      }));
      toast.success("Group details updated");
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to update group");
    }
  },

  addMembersToGroup: async (groupId, members) => {
    try {
      const res = await axiosInstance.post(`/groups/${groupId}/members`, { members });
      const updated = { ...res.data, isGroup: true };
      set((state) => ({
        groups: state.groups.map((g) => (g._id === groupId ? updated : g)),
        selectedUser:
          state.selectedUser?._id === groupId ? updated : state.selectedUser,
        isAddMemberModalOpen: false,
      }));
      toast.success("Members added successfully");
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to add members");
    }
  },

  removeMemberFromGroup: async (groupId, userId) => {
    try {
      const res = await axiosInstance.delete(`/groups/${groupId}/members/${userId}`);
      if (res.data?.group) {
        const updated = { ...res.data.group, isGroup: true };
        set((state) => ({
          groups: state.groups.map((g) => (g._id === groupId ? updated : g)),
          selectedUser:
            state.selectedUser?._id === groupId ? updated : state.selectedUser,
        }));
      }
      toast.success("Member removed");
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to remove member");
    }
  },

  leaveGroup: async (groupId) => {
    try {
      const authUser = useAuthStore.getState().authUser;
      await axiosInstance.delete(`/groups/${groupId}/members/${authUser._id}`);
      set((state) => ({
        groups: state.groups.filter((g) => g._id !== groupId),
        selectedUser: state.selectedUser?._id === groupId ? null : state.selectedUser,
      }));
      toast.success("You left the group");
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to leave group");
    }
  },

  toggleGroupAdmin: async (groupId, userId) => {
    try {
      const res = await axiosInstance.put(`/groups/${groupId}/admins/${userId}`);
      const updated = { ...res.data, isGroup: true };
      set((state) => ({
        groups: state.groups.map((g) => (g._id === groupId ? updated : g)),
        selectedUser:
          state.selectedUser?._id === groupId ? updated : state.selectedUser,
      }));
      toast.success("Admin role updated");
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to change admin role");
    }
  },

  // ================= GET MESSAGES =================
  getMessages: async (targetId) => {
    const { selectedUser } = get();
    const isGroup = Boolean(selectedUser?.isGroup || selectedUser?.members);
    set({ isMessagesLoading: true });

    try {
      const endpoint = isGroup
        ? `/groups/${targetId}/messages`
        : `/messages/${targetId}`;

      const res = await axiosInstance.get(endpoint);
      set({ messages: res.data });

      if (isGroup) {
        // Reset unread count for this group
        set((state) => ({
          groups: state.groups.map((g) =>
            g._id === targetId ? { ...g, unreadCount: 0 } : g
          ),
        }));
      } else {
        // Reset unread count for this user in sidebar
        set((state) => ({
          users: state.users.map((u) =>
            u._id === targetId ? { ...u, unreadCount: 0 } : u
          ),
        }));
      }
    } catch (error) {
      toast.error(error.response?.data?.error || error.response?.data?.message || "Failed to load messages");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  // ================= SEND MESSAGE =================
  sendMessage: async (messageData) => {
    const { selectedUser, messages, users, groups } = get();
    if (!selectedUser) return;
    const isGroup = Boolean(selectedUser.isGroup || selectedUser.members);

    try {
      const endpoint = isGroup
        ? `/groups/${selectedUser._id}/messages`
        : `/messages/send/${selectedUser._id}`;

      const res = await axiosInstance.post(endpoint, messageData);
      const sentMsg = res.data;

      set({ messages: [...messages, sentMsg], replyingTo: null });
      soundFx.playSentSound();

      if (isGroup) {
        // Update group sidebar with latest message
        const existingGroup = groups.find((g) => g._id === selectedUser._id) || selectedUser;
        const updatedGroup = {
          ...existingGroup,
          lastMessage: sentMsg,
          unreadCount: 0,
        };
        const restGroups = groups.filter((g) => g._id !== selectedUser._id);
        set({ groups: [updatedGroup, ...restGroups] });
      } else {
        // Update 1-on-1 sidebar user
        const existingUser = users.find((u) => u._id === selectedUser._id) || selectedUser;
        const updatedUser = {
          ...existingUser,
          lastMessage: {
            _id: sentMsg._id,
            text: sentMsg.text,
            image: sentMsg.image,
            audio: sentMsg.audio,
            senderId: sentMsg.senderId,
            status: sentMsg.status,
            createdAt: sentMsg.createdAt,
          },
        };
        const remainingUsers = users.filter((u) => u._id !== selectedUser._id);
        set({ users: [updatedUser, ...remainingUsers] });
      }
    } catch (error) {
      toast.error(error.response?.data?.error || error.response?.data?.message || "Failed to send message");
    }
  },

  // ================= TOGGLE REACTION =================
  toggleReaction: async (messageId, emoji) => {
    try {
      const authUser = useAuthStore.getState().authUser;
      // Optimistic update
      set((state) => ({
        messages: state.messages.map((msg) => {
          if (msg._id !== messageId) return msg;
          const reactions = msg.reactions || [];
          const existingIdx = reactions.findIndex((r) => r.userId === authUser._id);
          let newReactions = [...reactions];
          if (existingIdx > -1) {
            if (newReactions[existingIdx].emoji === emoji) {
              newReactions.splice(existingIdx, 1);
            } else {
              newReactions[existingIdx] = { ...newReactions[existingIdx], emoji };
            }
          } else {
            newReactions.push({ userId: authUser._id, emoji });
          }
          return { ...msg, reactions: newReactions };
        }),
      }));

      await axiosInstance.post(`/messages/react/${messageId}`, { emoji });
    } catch (error) {
      console.error("Failed to react to message:", error);
    }
  },

  // ================= DELETE MESSAGE =================
  deleteMessage: async (messageId, deleteType = "forEveryone") => {
    try {
      if (deleteType === "forMe") {
        set((state) => ({
          messages: state.messages.filter((m) => m._id !== messageId),
        }));
        await axiosInstance.delete(`/messages/${messageId}?type=forMe`);
        toast.success("Deleted for you");
      } else {
        set((state) => ({
          messages: state.messages.map((m) =>
            m._id === messageId
              ? {
                  ...m,
                  isDeleted: true,
                  text: "This message was deleted",
                  image: null,
                  audio: null,
                  audioDuration: 0,
                }
              : m
          ),
        }));
        await axiosInstance.delete(`/messages/${messageId}?type=forEveryone`);
        toast.success("Deleted for everyone");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete message");
    }
  },

  // ================= SOCKET SUBSCRIBE =================
  subscribeToMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    // Clean up existing listeners
    get().unsubscribeFromMessages();

    // 1-on-1 NEW MESSAGE LISTENER
    socket.on("newMessage", (newMessage) => {
      const { selectedUser, messages, users } = get();
      const isFromActiveChat =
        selectedUser && !selectedUser.isGroup && newMessage.senderId === selectedUser._id;

      soundFx.playReceivedSound();

      if (isFromActiveChat) {
        set({ messages: [...messages, newMessage] });
        socket.emit("markMessagesAsRead", { senderId: selectedUser._id });
      }

      // Update sidebar
      const senderId = newMessage.senderId;
      const existingUser = users.find((u) => u._id === senderId);

      if (existingUser) {
        const updatedUser = {
          ...existingUser,
          lastMessage: {
            _id: newMessage._id,
            text: newMessage.text,
            image: newMessage.image,
            audio: newMessage.audio,
            senderId: newMessage.senderId,
            status: newMessage.status,
            createdAt: newMessage.createdAt,
          },
          unreadCount: isFromActiveChat ? 0 : (existingUser.unreadCount || 0) + 1,
        };
        const rest = users.filter((u) => u._id !== senderId);
        set({ users: [updatedUser, ...rest] });
      } else {
        get().getUsers();
      }

      // Trigger native device notification if tab is hidden or outside active chat
      const isHidden = typeof document !== "undefined" && document.hidden;
      if (isHidden || !isFromActiveChat) {
        const senderName = existingUser?.fullName || "New Message";
        showDeviceNotification({
          title: senderName,
          body: formatMessagePreview(newMessage),
          icon: existingUser?.profilePic,
          senderId: senderId,
          isGroup: false,
          onClick: () => {
            const u = get().users.find((user) => user._id === senderId);
            if (u) get().setSelectedUser(u);
          },
        });
      }
    });

    // GROUP NEW MESSAGE LISTENER
    socket.on("newGroupMessage", (newMessage) => {
      const { selectedUser, messages, groups } = get();
      const isFromActiveGroup =
        selectedUser && (selectedUser.isGroup || selectedUser.members) && selectedUser._id === newMessage.groupId;

      soundFx.playReceivedSound();

      if (isFromActiveGroup) {
        set({ messages: [...messages, newMessage] });
      }

      // Bump group in sidebar
      const existingGroup = groups.find((g) => g._id === newMessage.groupId);
      if (existingGroup) {
        const updatedGroup = {
          ...existingGroup,
          lastMessage: newMessage,
          unreadCount: isFromActiveGroup ? 0 : (existingGroup.unreadCount || 0) + 1,
        };
        const rest = groups.filter((g) => g._id !== newMessage.groupId);
        set({ groups: [updatedGroup, ...rest] });
      } else {
        get().getGroups();
      }

      // Trigger native device notification if tab is hidden or outside active group
      const isHidden = typeof document !== "undefined" && document.hidden;
      if (isHidden || !isFromActiveGroup) {
        const groupName = existingGroup?.name || "Group Message";
        const senderName = newMessage.senderId?.fullName || "Member";
        showDeviceNotification({
          title: `${groupName} • ${senderName}`,
          body: formatMessagePreview(newMessage),
          icon: existingGroup?.groupPic,
          senderId: newMessage.senderId?._id || newMessage.senderId,
          isGroup: true,
          groupId: newMessage.groupId,
          onClick: () => {
            const g = get().groups.find((group) => group._id === newMessage.groupId);
            if (g) get().setSelectedUser(g);
          },
        });
      }
    });

    // GROUP CREATED LISTENER
    socket.on("newGroupCreated", (newGroup) => {
      set((state) => {
        if (state.groups.some((g) => g._id === newGroup._id)) return state;
        return { groups: [{ ...newGroup, isGroup: true }, ...state.groups] };
      });
      toast.success(`You were added to "${newGroup.name}"!`);
    });

    // GROUP UPDATED LISTENER
    socket.on("groupUpdated", (updatedGroup) => {
      const withFlag = { ...updatedGroup, isGroup: true };
      set((state) => ({
        groups: state.groups.map((g) => (g._id === updatedGroup._id ? withFlag : g)),
        selectedUser:
          state.selectedUser?._id === updatedGroup._id ? withFlag : state.selectedUser,
      }));
    });

    // REMOVED FROM GROUP
    socket.on("removedFromGroup", ({ groupId }) => {
      set((state) => ({
        groups: state.groups.filter((g) => g._id !== groupId),
        selectedUser: state.selectedUser?._id === groupId ? null : state.selectedUser,
      }));
      toast("You were removed from a group", { icon: "ℹ️" });
    });

    // REACTION LISTENER
    socket.on("messageReaction", ({ messageId, reactions }) => {
      set((state) => ({
        messages: state.messages.map((m) =>
          m._id === messageId ? { ...m, reactions } : m
        ),
      }));
    });

    // DELETE LISTENER
    socket.on("messageDeleted", ({ messageId }) => {
      set((state) => ({
        messages: state.messages.map((m) =>
          m._id === messageId
            ? { ...m, isDeleted: true, text: "This message was deleted", image: null, audio: null }
            : m
        ),
      }));
    });

    // DELIVERED LISTENER
    socket.on("messagesDelivered", ({ receiverId }) => {
      const authUser = useAuthStore.getState().authUser;
      if (receiverId === authUser?._id) return;

      set((state) => ({
        messages: state.messages.map((msg) =>
          msg.status === "sent" && msg.receiverId === receiverId
            ? { ...msg, status: "delivered" }
            : msg
        ),
      }));
    });

    // READ LISTENER
    socket.on("messagesRead", ({ receiverId }) => {
      const authUser = useAuthStore.getState().authUser;
      if (receiverId === authUser?._id) return;

      set((state) => ({
        messages: state.messages.map((msg) =>
          msg.status !== "read" && msg.receiverId === receiverId
            ? { ...msg, status: "read" }
            : msg
        ),
      }));
    });

    // TYPING LISTENERS (1-on-1)
    socket.on("userTyping", ({ senderId }) => {
      set((state) => ({
        typingUsers: { ...state.typingUsers, [senderId]: true },
      }));
    });

    socket.on("userStoppedTyping", ({ senderId }) => {
      set((state) => ({
        typingUsers: { ...state.typingUsers, [senderId]: false },
      }));
    });

    // GROUP TYPING LISTENERS
    socket.on("groupUserTyping", ({ groupId, user }) => {
      if (!groupId || !user) return;
      set((state) => ({
        groupTypingUsers: {
          ...state.groupTypingUsers,
          [groupId]: {
            ...(state.groupTypingUsers[groupId] || {}),
            [user._id]: user.fullName,
          },
        },
      }));
    });

    socket.on("groupUserStoppedTyping", ({ groupId, userId }) => {
      if (!groupId || !userId) return;
      set((state) => {
        const currentGroupTypers = { ...(state.groupTypingUsers[groupId] || {}) };
        delete currentGroupTypers[userId];
        return {
          groupTypingUsers: {
            ...state.groupTypingUsers,
            [groupId]: currentGroupTypers,
          },
        };
      });
    });

    // Ensure global call listeners are also active
    get().subscribeToCalls();
  },

  // ================= GLOBAL CALL SIGNALING SUBSCRIPTION =================
  subscribeToCalls: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    // Remove existing call listeners to prevent duplicates
    socket.off("incomingCall");
    socket.off("callAccepted");
    socket.off("callRejected");
    socket.off("callEnded");
    socket.off("incomingGroupCall");
    socket.off("groupCallParticipantJoined");
    socket.off("groupCallParticipantLeft");
    socket.off("groupCallParticipantStateUpdated");

    // 1-on-1 CALL SIGNALING
    socket.on("incomingCall", ({ from, name, avatar, callType, signal }) => {
      set({
        callState: {
          isOpen: true,
          callType: callType || "audio",
          status: "incoming",
          isCaller: false,
          incomingSignal: signal || null,
          targetUser: {
            _id: from,
            fullName: name,
            profilePic: avatar,
          },
        },
      });
      soundFx.startIncomingRingtone();
    });

    socket.on("callAccepted", ({ signal } = {}) => {
      soundFx.stopRingtone();
      set((state) => ({
        callState: {
          ...state.callState,
          status: "connected",
          incomingSignal: signal || state.callState.incomingSignal,
        },
      }));
    });

    socket.on("callRejected", () => {
      soundFx.stopRingtone();
      soundFx.playCallEndTone();
      toast("Call was declined", { icon: "📵" });
      set({
        callState: {
          isOpen: false,
          callType: "audio",
          status: "idle",
          isCaller: false,
          targetUser: null,
          incomingSignal: null,
        },
      });
    });

    socket.on("callEnded", () => {
      soundFx.stopRingtone();
      soundFx.playCallEndTone();
      toast("Call ended", { icon: "📞" });
      set({
        callState: {
          isOpen: false,
          callType: "audio",
          status: "idle",
          isCaller: false,
          targetUser: null,
          incomingSignal: null,
        },
      });
    });

    // GROUP CALL SIGNALING
    socket.on("incomingGroupCall", ({ groupId, groupName, groupPic, callType, caller, members }) => {
      set({
        groupCallState: {
          isOpen: true,
          groupId,
          groupName,
          groupPic,
          callType: callType || "audio",
          status: "incoming",
          isCaller: false,
          caller,
          members: members || [],
          participants: [
            {
              user: caller,
              isMuted: false,
              isVideoOff: callType === "audio",
            },
          ],
        },
      });
      soundFx.startIncomingRingtone();
    });

    socket.on("groupCallParticipantJoined", ({ user, socketId, callType }) => {
      soundFx.playSentSound();
      set((state) => {
        const exists = state.groupCallState.participants.some(
          (p) => p.user?._id === user._id
        );
        if (exists) return state;

        return {
          groupCallState: {
            ...state.groupCallState,
            status: "connected",
            participants: [
              ...state.groupCallState.participants,
              {
                user,
                socketId,
                isMuted: false,
                isVideoOff: callType === "audio",
              },
            ],
          },
        };
      });
    });

    socket.on("groupCallParticipantLeft", ({ user, socketId }) => {
      set((state) => ({
        groupCallState: {
          ...state.groupCallState,
          participants: state.groupCallState.participants.filter(
            (p) => p.socketId !== socketId && p.user?._id !== user?._id
          ),
        },
      }));
    });

    socket.on("groupCallParticipantStateUpdated", ({ user, isMuted, isVideoOff, socketId }) => {
      set((state) => ({
        groupCallState: {
          ...state.groupCallState,
          participants: state.groupCallState.participants.map((p) =>
            p.socketId === socketId || p.user?._id === user?._id
              ? { ...p, isMuted, isVideoOff }
              : p
          ),
        },
      }));
    });

    // OFFLINE MESSAGES LISTENER (Triggered when user turns on internet / reconnects)
    socket.off("offlineMessagesReceived");
    socket.on("offlineMessagesReceived", (offlineMessages) => {
      console.log("[Socket] Received offline messages:", offlineMessages?.length);
      if (!Array.isArray(offlineMessages) || offlineMessages.length === 0) return;

      // 1. Show device notification on notification panel with sender name & message
      notifyOfflineMessages(offlineMessages, (sender) => {
        const user = get().users.find((u) => u._id === sender._id) || sender;
        get().setSelectedUser(user);
      });

      // 2. Refresh sidebar contacts and groups
      get().getUsers();
      get().getGroups();

      // 3. If currently open chat matches, append new messages
      const currentChat = get().selectedUser;
      if (currentChat && !currentChat.isGroup) {
        const relevant = offlineMessages.filter((m) => {
          const sId = typeof m.senderId === "object" ? m.senderId?._id : m.senderId;
          return sId?.toString() === currentChat._id?.toString();
        });
        if (relevant.length > 0) {
          set((state) => {
            const existingIds = new Set(state.messages.map((m) => m._id));
            const newItems = relevant.filter((m) => !existingIds.has(m._id));
            return { messages: [...state.messages, ...newItems] };
          });
        }
      }
    });
  },

  unsubscribeFromCalls: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;
    socket.off("incomingCall");
    socket.off("callAccepted");
    socket.off("callRejected");
    socket.off("callEnded");
    socket.off("incomingGroupCall");
    socket.off("groupCallParticipantJoined");
    socket.off("groupCallParticipantLeft");
    socket.off("groupCallParticipantStateUpdated");
    socket.off("offlineMessagesReceived");
  },

  checkOfflineMessages: async () => {
    const socket = useAuthStore.getState().socket;
    if (socket) {
      socket.emit("checkOfflineMessages");
    }

    try {
      const res = await axiosInstance.get("/messages/unread-offline");
      if (Array.isArray(res.data) && res.data.length > 0) {
        notifyOfflineMessages(res.data, (sender) => {
          const user = get().users.find((u) => u._id === sender._id) || sender;
          get().setSelectedUser(user);
        });
        get().getUsers();
      }
    } catch (err) {
      console.warn("Could not fetch offline unread messages:", err);
    }
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;
    socket.off("newMessage");
    socket.off("newGroupMessage");
    socket.off("newGroupCreated");
    socket.off("groupUpdated");
    socket.off("removedFromGroup");
    socket.off("messagesDelivered");
    socket.off("messagesRead");
    socket.off("userTyping");
    socket.off("userStoppedTyping");
    socket.off("groupUserTyping");
    socket.off("groupUserStoppedTyping");
    socket.off("messageReaction");
    socket.off("messageDeleted");
  },

  setSelectedUser: (selectedUser) => {
    const socket = useAuthStore.getState().socket;
    const current = get().selectedUser;

    // Leave old group room if was in group
    if (socket && current?.isGroup) {
      socket.emit("leaveGroupRoom", { groupId: current._id });
    }

    // Join new group room if selecting group
    if (socket && selectedUser?.isGroup) {
      socket.emit("joinGroupRoom", { groupId: selectedUser._id });
    }

    set({
      selectedUser,
      isContactDrawerOpen: false,
      isSearchInChatOpen: false,
      searchInChatQuery: "",
      replyingTo: null,
    });
  },
}));
