import { useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import Sidebar from "../components/Sidebar";
import NoChatSelected from "../components/NoChatSelected";
import ChatContainer from "../components/ChatContainer";
import ContactDrawer from "../components/ContactDrawer";
import LightboxModal from "../components/LightboxModal";
import CallModal from "../components/CallModal";
import CreateGroupModal from "../components/CreateGroupModal";
import AddMembersModal from "../components/AddMembersModal";
import GroupCallModal from "../components/GroupCallModal";
import NotificationPromptBanner from "../components/NotificationPromptBanner";
import toast from "react-hot-toast";

const HomePage = () => {
  const {
    selectedUser,
    setSelectedUser,
    users,
    groups,
    subscribeToMessages,
    subscribeToCalls,
    checkOfflineMessages,
    getUsers,
    getGroups,
  } = useChatStore();
  const { socket, reconnectSocket } = useAuthStore();

  // 🔥 Ensure message listening and call signaling are continuously active whenever socket is connected
  useEffect(() => {
    if (socket) {
      subscribeToMessages();
      subscribeToCalls();
    }
  }, [socket, subscribeToMessages, subscribeToCalls]);

  // 🔥 DETECT WHEN USER TURNS ON INTERNET CONNECTION & INSTANTLY DELIVER NOTIFICATIONS
  useEffect(() => {
    let retryTimers = [];

    const syncNetworkAndMessages = () => {
      // 1. Force socket to reconnect immediately if disconnected
      reconnectSocket();

      // 2. Fetch offline messages and refresh contacts & groups
      checkOfflineMessages();
      getUsers();
      getGroups();
    };

    const handleOnline = () => {
      console.log("[Network] Internet connection restored - triggering instant message check");
      toast.success("Internet connection restored! Checking messages...", {
        icon: "🌐",
      });

      // Clear any prior retry timers
      retryTimers.forEach(clearTimeout);
      retryTimers = [];

      // 1. Immediate sync attempt
      syncNetworkAndMessages();

      // 2. Staged retries at 1000ms, 2500ms, and 5000ms to guarantee delivery as DNS & TLS stabilize
      const delays = [1000, 2500, 5000];
      delays.forEach((delay) => {
        const timer = setTimeout(() => {
          if (typeof navigator !== "undefined" && navigator.onLine) {
            syncNetworkAndMessages();
          }
        }, delay);
        retryTimers.push(timer);
      });
    };

    window.addEventListener("online", handleOnline);

    // Initial check when page mounts if user is already online
    if (typeof navigator !== "undefined" && navigator.onLine) {
      syncNetworkAndMessages();
    }

    // Periodic gentle heartbeat check (every 20 seconds) while online
    const intervalTimer = setInterval(() => {
      if (typeof navigator !== "undefined" && navigator.onLine) {
        if (!socket || !socket.connected) {
          reconnectSocket();
        }
      }
    }, 20000);

    return () => {
      window.removeEventListener("online", handleOnline);
      retryTimers.forEach(clearTimeout);
      clearInterval(intervalTimer);
    };
  }, [checkOfflineMessages, getUsers, getGroups, reconnectSocket, socket]);

  // Handle clicking notifications from device notification shade / panel
  useEffect(() => {
    if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
      const handleSwMessage = (event) => {
        if (event.data?.type === "OPEN_CHAT") {
          const { senderId, isGroup, groupId } = event.data;
          if (isGroup && groupId) {
            const foundGroup = groups.find((g) => g._id === groupId);
            if (foundGroup) setSelectedUser(foundGroup);
          } else if (senderId) {
            const foundUser = users.find((u) => u._id === senderId);
            if (foundUser) setSelectedUser(foundUser);
          }
        }
      };

      navigator.serviceWorker.addEventListener("message", handleSwMessage);
      return () => {
        navigator.serviceWorker.removeEventListener("message", handleSwMessage);
      };
    }
  }, [users, groups, setSelectedUser]);

  return (
    <div
      className={`h-[100dvh] min-h-[100dvh] bg-transparent flex flex-col overflow-hidden ${
        selectedUser ? "pt-0 md:pt-16" : "pt-16"
      }`}
    >
      <div className="flex flex-1 h-full w-full overflow-hidden relative">
        {/* Sidebar: always visible on desktop; on mobile visible only when no chat is active */}
        <div
          className={`h-full ${
            selectedUser ? "hidden md:flex" : "flex w-full md:w-auto"
          }`}
        >
          <Sidebar />
        </div>

        {/* Chat Area: on desktop shows NoChatSelected if none chosen; on mobile visible only when chat active */}
        <div
          className={`flex-1 h-full flex flex-col ${
            !selectedUser ? "hidden md:flex" : "flex w-full"
          }`}
        >
          {!selectedUser ? <NoChatSelected /> : <ChatContainer />}
        </div>

        {/* Slide-over contact / group info drawer */}
        <ContactDrawer />

        {/* Lightbox attachment preview */}
        <LightboxModal />

        {/* 1-on-1 Audio / Video Call modal */}
        <CallModal />

        {/* Multi-participant WhatsApp Group Audio / Video Call modal */}
        <GroupCallModal />

        {/* WhatsApp-style Create Group modal */}
        <CreateGroupModal />

        {/* Add Members to Group modal */}
        <AddMembersModal />

        {/* WhatsApp-style Device Notification Permission Prompt */}
        <NotificationPromptBanner />
      </div>
    </div>
  );
};

export default HomePage;