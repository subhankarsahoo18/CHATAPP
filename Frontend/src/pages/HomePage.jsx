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
    subscribeToCalls,
    checkOfflineMessages,
    getUsers,
    getGroups,
  } = useChatStore();
  const { socket } = useAuthStore();

  // Ensure call signaling is continuously active whenever the socket is connected
  useEffect(() => {
    if (socket) {
      subscribeToCalls();
    }
  }, [socket, subscribeToCalls]);

  // 🔥 DETECT WHEN USER TURNS ON INTERNET CONNECTION
  useEffect(() => {
    const handleOnline = () => {
      console.log("[Network] Internet connection restored!");
      toast.success("Internet connection restored! Checking for messages...", {
        icon: "🌐",
      });
      checkOfflineMessages();
      getUsers();
      getGroups();
    };

    window.addEventListener("online", handleOnline);

    // Initial check when page mounts if user is already online
    if (typeof navigator !== "undefined" && navigator.onLine) {
      checkOfflineMessages();
    }

    return () => {
      window.removeEventListener("online", handleOnline);
    };
  }, [checkOfflineMessages, getUsers, getGroups]);

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