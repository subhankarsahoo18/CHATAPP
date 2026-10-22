import { useChatStore } from "../store/useChatStore";
import Sidebar from "../components/Sidebar";
import NoChatSelected from "../components/NoChatSelected";
import ChatContainer from "../components/ChatContainer";
import ContactDrawer from "../components/ContactDrawer";
import LightboxModal from "../components/LightboxModal";
import CallModal from "../components/CallModal";
import CreateGroupModal from "../components/CreateGroupModal";
import AddMembersModal from "../components/AddMembersModal";
import GroupCallModal from "../components/GroupCallModal";

const HomePage = () => {
  const { selectedUser } = useChatStore();

  return (
    <div className="h-screen bg-transparent pt-16 flex flex-col overflow-hidden">
      <div className="flex flex-1 h-[calc(100vh-4rem)] w-full overflow-hidden relative">
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
      </div>
    </div>
  );
};

export default HomePage;