import { ArrowLeft, Phone, Video, Search, Info, X, Users } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { getAvatar, getGroupAvatar } from "../lib/avatar";

const ChatHeader = () => {
  const {
    selectedUser,
    setSelectedUser,
    startCall,
    startGroupCall,
    isSearchInChatOpen,
    setIsSearchInChatOpen,
    searchInChatQuery,
    setSearchInChatQuery,
    isContactDrawerOpen,
    setIsContactDrawerOpen,
    typingUsers,
    groupTypingUsers,
  } = useChatStore();

  const { onlineUsers, authUser } = useAuthStore();

  if (!selectedUser) return null;

  const isGroup = Boolean(selectedUser.isGroup || selectedUser.members);

  // Status for 1-on-1
  const isOnline = !isGroup && onlineUsers.includes(selectedUser._id);
  const isTyping = !isGroup && typingUsers[selectedUser._id];

  // Status for Group
  const currentGroupTypers = isGroup ? groupTypingUsers[selectedUser._id] || {} : {};
  const groupTypingNames = Object.values(currentGroupTypers);
  const isGroupTyping = groupTypingNames.length > 0;

  // Avatar
  const avatarUrl = isGroup
    ? getGroupAvatar(selectedUser)
    : getAvatar(selectedUser);

  // Display names summary for group
  const memberSummary = isGroup
    ? selectedUser.members
        ?.map((m) =>
          typeof m === "object"
            ? m._id === authUser?._id
              ? "You"
              : m.fullName?.split(" ")[0]
            : "Member"
        )
        .filter(Boolean)
        .join(", ")
    : "";

  const handleCall = (callType) => {
    if (isGroup) {
      startGroupCall(selectedUser, callType);
    } else {
      startCall(selectedUser, callType);
    }
  };

  return (
    <div className="border-b border-white/10 sticky top-0 z-30 backdrop-blur-xl bg-[var(--color-surface)]/75">
      <div className="p-2.5 sm:p-3.5 flex items-center justify-between gap-2 min-w-0">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          {/* Back button on mobile */}
          <button
            onClick={() => setSelectedUser(null)}
            className="md:hidden p-1.5 sm:p-2 -ml-1 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors flex-shrink-0"
            title="Back to chats"
          >
            <ArrowLeft className="size-5" />
          </button>

          {/* Avatar (Clickable to open drawer) */}
          <div
            onClick={() => setIsContactDrawerOpen(!isContactDrawerOpen)}
            className="relative flex-shrink-0 cursor-pointer group"
          >
            <div className="size-9 sm:size-11 rounded-full overflow-hidden border border-white/15 shadow-lg group-hover:scale-105 transition-transform">
              <img
                src={avatarUrl}
                alt={isGroup ? selectedUser.name : selectedUser.fullName}
                className="w-full h-full object-cover"
              />
            </div>
            {isGroup ? (
              <span className="absolute bottom-0 right-0 size-3 sm:size-3.5 bg-emerald-500 rounded-full ring-2 ring-slate-900 flex items-center justify-center text-white text-[7px] sm:text-[8px]">
                <Users className="size-2 sm:size-2.5" />
              </span>
            ) : isOnline ? (
              <span className="absolute bottom-0 right-0 size-2.5 sm:size-3 bg-emerald-400 rounded-full ring-2 ring-slate-900 shadow-[0_0_8px_#34d399]" />
            ) : null}
          </div>

          {/* User/Group Info (Clickable) */}
          <div
            onClick={() => setIsContactDrawerOpen(!isContactDrawerOpen)}
            className="cursor-pointer min-w-0 flex-1"
          >
            <h3 className="font-bold text-white text-sm sm:text-[15px] truncate tracking-tight hover:text-sky-300 transition-colors flex items-center gap-1.5">
              <span>{isGroup ? selectedUser.name : selectedUser.fullName}</span>
            </h3>

            <div className="text-[11px] sm:text-xs font-medium flex items-center gap-1.5 mt-0.5 truncate max-w-[150px] sm:max-w-xs">
              {isGroup ? (
                isGroupTyping ? (
                  <span className="text-emerald-400 font-semibold flex items-center gap-1 animate-pulse">
                    <span className="size-1.5 rounded-full bg-emerald-400" />
                    {groupTypingNames[0]} is typing...
                  </span>
                ) : (
                  <span className="text-white/50 truncate">
                    {selectedUser.members?.length || 0} participants • {memberSummary}
                  </span>
                )
              ) : isTyping ? (
                <span className="text-sky-400 font-semibold flex items-center gap-1 animate-pulse">
                  <span className="size-1.5 rounded-full bg-sky-400" /> typing...
                </span>
              ) : isOnline ? (
                <span className="text-emerald-400">Online</span>
              ) : (
                <span className="text-white/40">Offline</span>
              )}
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
          {/* Voice Call */}
          <button
            onClick={() => handleCall("audio")}
            className="p-1.5 sm:p-2.5 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors"
            title={isGroup ? "Group voice call" : "Voice call"}
          >
            <Phone className="size-4 sm:size-4.5" />
          </button>

          {/* Video Call */}
          <button
            onClick={() => handleCall("video")}
            className="p-1.5 sm:p-2.5 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors"
            title={isGroup ? "Group video call" : "Video call"}
          >
            <Video className="size-4 sm:size-4.5" />
          </button>

          {/* Search in chat toggle */}
          <button
            onClick={() => setIsSearchInChatOpen(!isSearchInChatOpen)}
            className={`p-1.5 sm:p-2.5 rounded-full transition-colors ${
              isSearchInChatOpen
                ? "bg-sky-500/20 text-sky-400"
                : "hover:bg-white/10 text-white/70 hover:text-white"
            }`}
            title="Search in conversation"
          >
            <Search className="size-4 sm:size-4.5" />
          </button>

          {/* Contact / Group Details Drawer toggle */}
          <button
            onClick={() => setIsContactDrawerOpen(!isContactDrawerOpen)}
            className={`p-1.5 sm:p-2.5 rounded-full transition-colors ${
              isContactDrawerOpen
                ? "bg-white/15 text-white"
                : "hover:bg-white/10 text-white/70 hover:text-white"
            }`}
            title={isGroup ? "Group info" : "Contact details"}
          >
            <Info className="size-4 sm:size-4.5" />
          </button>

          {/* Close Chat on Desktop */}
          <button
            onClick={() => setSelectedUser(null)}
            className="hidden md:flex p-2.5 rounded-full hover:bg-white/10 text-white/40 hover:text-white transition-colors"
            title="Close conversation"
          >
            <X className="size-4.5" />
          </button>
        </div>
      </div>

      {/* In-chat search bar overlay when opened */}
      {isSearchInChatOpen && (
        <div className="px-4 py-2 bg-black/40 border-t border-white/5 flex items-center gap-2 animate-fade-in">
          <Search className="size-4 text-white/40 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search within this chat..."
            value={searchInChatQuery}
            onChange={(e) => setSearchInChatQuery(e.target.value)}
            className="flex-1 bg-transparent border-none text-white placeholder-white/30 text-xs focus:outline-none"
            autoFocus
          />
          {searchInChatQuery && (
            <button
              onClick={() => setSearchInChatQuery("")}
              className="text-white/40 hover:text-white text-xs"
            >
              Clear
            </button>
          )}
          <button
            onClick={() => setIsSearchInChatOpen(false)}
            className="p-1 text-white/40 hover:text-white ml-1"
          >
            <X className="size-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default ChatHeader;