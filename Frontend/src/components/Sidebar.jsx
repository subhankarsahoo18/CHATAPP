import { useEffect, useState, useMemo } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import {
  Users,
  Search,
  X,
  MessageSquare,
  Check,
  CheckCheck,
  Camera,
  Mic,
  Sparkles,
  Plus,
  UserPlus,
} from "lucide-react";
import { getAvatar, getGroupAvatar } from "../lib/avatar";
import { formatConversationTime } from "../lib/util";

const Sidebar = () => {
  const {
    getUsers,
    users,
    groups,
    getGroups,
    selectedUser,
    setSelectedUser,
    isUsersLoading,
    isGroupsLoading,
    searchGlobalUsers,
    searchResults,
    isSearching,
    setIsCreateGroupModalOpen,
  } = useChatStore();

  const { authUser, onlineUsers } = useAuthStore();
  const [activeTab, setActiveTab] = useState("chats"); // "chats" | "groups" | "contacts"
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Debounced search
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      searchGlobalUsers(searchQuery);
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, searchGlobalUsers]);

  useEffect(() => {
    getUsers();
    getGroups();
  }, [getUsers, getGroups]);

  // Separate active chats (users with a lastMessage) and all contacts
  const { recentChats, otherContacts } = useMemo(() => {
    const recent = [];
    const others = [];

    users.forEach((u) => {
      if (u._id === authUser?._id) return;
      if (u.lastMessage) {
        recent.push(u);
      } else {
        others.push(u);
      }
    });

    return { recentChats: recent, otherContacts: others };
  }, [users, authUser]);

  // Calculate unread counts
  const totalDirectUnread = useMemo(() => {
    return recentChats.reduce((acc, u) => acc + (u.unreadCount || 0), 0);
  }, [recentChats]);

  const totalGroupsUnread = useMemo(() => {
    return groups.reduce((acc, g) => acc + (g.unreadCount || 0), 0);
  }, [groups]);

  // Filter based on active tab and online checkbox
  const displayedUsers = useMemo(() => {
    let list = otherContacts;
    if (activeTab === "chats") {
      list = recentChats;
    }
    if (showOnlineOnly) {
      list = list.filter((user) => onlineUsers.includes(user._id));
    }
    return list;
  }, [activeTab, recentChats, otherContacts, showOnlineOnly, onlineUsers]);

  // Filter groups if searching
  const displayedGroups = useMemo(() => {
    if (!searchQuery.trim()) return groups;
    const q = searchQuery.toLowerCase();
    return groups.filter(
      (g) =>
        g.name?.toLowerCase().includes(q) ||
        g.description?.toLowerCase().includes(q)
    );
  }, [groups, searchQuery]);

  if (isUsersLoading && isGroupsLoading) return <SidebarSkeleton />;

  return (
    <aside className="h-full w-full md:w-80 lg:w-96 glass-panel border-r border-y-0 border-l-0 flex flex-col transition-all duration-300 relative z-20 bg-[var(--color-surface)]/60 backdrop-blur-2xl">
      {/* Top Header */}
      <div className="p-4 border-b border-white/10 backdrop-blur-md">
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-[0_0_15px_rgba(56,189,248,0.3)]">
              <MessageSquare className="size-5" />
            </div>
            <div>
              <h2 className="font-bold text-white text-lg tracking-tight leading-none">Messages</h2>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="size-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_#34d399]" />
                <span className="text-[11px] text-white/50 font-medium">
                  {Math.max(0, onlineUsers.length - 1)} online
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* New Group Button */}
            <button
              onClick={() => setIsCreateGroupModalOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-sky-400 text-xs font-semibold transition-all hover:scale-105 active:scale-95"
              title="Create New Group"
            >
              <Plus className="size-3.5" />
              <span>Group</span>
            </button>

            {/* Online Toggle Chip */}
            <label className="cursor-pointer flex items-center gap-1.5 bg-white/5 hover:bg-white/10 px-2.5 py-1.5 rounded-full border border-white/10 transition-colors">
              <input
                type="checkbox"
                checked={showOnlineOnly}
                onChange={(e) => setShowOnlineOnly(e.target.checked)}
                className="checkbox checkbox-xs rounded-full checkbox-info"
              />
              <span className="text-xs font-medium text-white/70">Online</span>
            </label>
          </div>
        </div>

        {/* Tab switchers: "Chats", "Groups", and "Contacts" */}
        <div className="grid grid-cols-3 gap-1 p-1 bg-black/30 rounded-xl border border-white/5 mb-3">
          <button
            onClick={() => setActiveTab("chats")}
            className={`py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === "chats"
                ? "bg-white/15 text-white shadow-sm"
                : "text-white/50 hover:text-white"
            }`}
          >
            <span>Chats</span>
            {totalDirectUnread > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-sky-500 text-white text-[10px] font-bold">
                {totalDirectUnread}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("groups")}
            className={`py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === "groups"
                ? "bg-white/15 text-white shadow-sm"
                : "text-white/50 hover:text-white"
            }`}
          >
            <Users className="size-3.5" />
            <span>Groups</span>
            {totalGroupsUnread > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-emerald-500 text-white text-[10px] font-bold">
                {totalGroupsUnread}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("contacts")}
            className={`py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === "contacts"
                ? "bg-white/15 text-white shadow-sm"
                : "text-white/50 hover:text-white"
            }`}
          >
            <UserPlus className="size-3.5" />
            <span>Discover</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative flex items-center">
          <Search className="absolute left-3.5 size-4 text-white/40 pointer-events-none" />
          <input
            type="text"
            placeholder={
              activeTab === "groups"
                ? "Search groups..."
                : "Search messages or people..."
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-9 py-2 bg-black/25 border border-white/10 rounded-xl text-white placeholder-white/35 text-xs font-medium focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 text-white/40 hover:text-white transition-colors"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main List Area */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1 custom-scrollbar">
        {/* Loading state for search */}
        {isSearching && (
          <div className="text-center py-6 text-white/50 text-xs flex items-center justify-center gap-2">
            <span className="loading loading-spinner loading-xs text-sky-400" />
            Searching contacts...
          </div>
        )}

        {/* Global Search Results Display */}
        {!isSearching && searchQuery && searchResults.length > 0 && (
          <div className="mb-2">
            <div className="px-3 py-1.5 text-[11px] font-bold tracking-wider text-sky-400 uppercase">
              Found Users ({searchResults.length})
            </div>
            {searchResults.map((user) => {
              const avatar = getAvatar(user);
              const isOnline = onlineUsers.includes(user._id);

              return (
                <button
                  key={user._id}
                  onClick={() => {
                    setSelectedUser(user);
                    setSearchQuery("");
                  }}
                  className="w-full p-2.5 flex items-center gap-3 rounded-xl mb-1 transition-all hover:bg-white/10 border border-transparent hover:border-white/5 text-left group"
                >
                  <div className="relative flex-shrink-0">
                    <img
                      src={avatar}
                      alt={user.fullName}
                      className="size-11 object-cover rounded-full shadow-md border border-white/10"
                    />
                    {isOnline && (
                      <span className="absolute bottom-0 right-0 size-3 bg-emerald-400 rounded-full ring-2 ring-slate-900 shadow-[0_0_8px_#34d399]" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-white text-sm truncate flex items-center justify-between">
                      <span>{user.fullName}</span>
                      <span className="text-[11px] text-sky-400 font-medium">Chat</span>
                    </div>
                    <div className="text-xs text-white/50 truncate mt-0.5">
                      @{user.username} {user.about ? `• ${user.about}` : ""}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* ================= 1. GROUPS TAB CONTENT ================= */}
        {activeTab === "groups" && (
          <div>
            {displayedGroups.length === 0 ? (
              <div className="text-center py-12 px-4 space-y-3">
                <div className="size-12 rounded-2xl bg-white/5 border border-white/10 mx-auto flex items-center justify-center text-emerald-400">
                  <Users className="size-6" />
                </div>
                <h5 className="font-semibold text-white text-sm">No group chats yet</h5>
                <p className="text-xs text-white/50 max-w-[220px] mx-auto">
                  Create a group to chat, send voice notes, and make group video calls with friends!
                </p>
                <button
                  onClick={() => setIsCreateGroupModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs shadow-lg transition-all"
                >
                  Create New Group
                </button>
              </div>
            ) : (
              displayedGroups.map((group) => {
                const isSelected = selectedUser?._id === group._id;
                const avatar = getGroupAvatar(group);
                const lastMsg = group.lastMessage;
                const senderName =
                  lastMsg?.senderId?._id === authUser?._id
                    ? "You"
                    : lastMsg?.senderId?.fullName?.split(" ")[0] || "";

                return (
                  <button
                    key={group._id}
                    onClick={() => setSelectedUser({ ...group, isGroup: true })}
                    className={`
                      w-full p-2.5 flex items-center gap-3 rounded-xl mb-1 text-left
                      transition-all duration-200 group
                      ${
                        isSelected
                          ? "bg-white/15 border border-white/15 shadow-[0_0_15px_rgba(56,189,248,0.12)]"
                          : "hover:bg-white/5 border border-transparent"
                      }
                    `}
                  >
                    {/* Group Avatar */}
                    <div className="relative flex-shrink-0">
                      <img
                        src={avatar}
                        alt={group.name}
                        className="size-12 object-cover rounded-full shadow-md border border-white/10"
                      />
                      <span className="absolute bottom-0 right-0 size-4 bg-emerald-500 rounded-full ring-2 ring-slate-900 flex items-center justify-center text-white text-[9px]">
                        <Users className="size-2.5" />
                      </span>
                    </div>

                    {/* Group Meta */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <h4
                          className={`font-semibold text-sm truncate flex items-center gap-1.5 ${
                            isSelected ? "text-white" : "text-white/90"
                          }`}
                        >
                          <span className="truncate">{group.name}</span>
                        </h4>
                        {lastMsg?.createdAt && (
                          <span className="text-[11px] text-white/40 flex-shrink-0 ml-2">
                            {formatConversationTime(lastMsg.createdAt)}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between mt-1">
                        {/* Snippet */}
                        <div className="flex items-center gap-1 text-xs text-white/60 truncate min-w-0 flex-1 pr-2">
                          {lastMsg ? (
                            <>
                              <span className="font-medium text-white/80">
                                {senderName ? `${senderName}: ` : ""}
                              </span>
                              {lastMsg.image ? (
                                <span className="flex items-center gap-1 text-sky-400">
                                  <Camera className="size-3" /> Photo
                                </span>
                              ) : lastMsg.audio ? (
                                <span className="flex items-center gap-1 text-indigo-400">
                                  <Mic className="size-3" /> Voice message
                                </span>
                              ) : (
                                <span className="truncate">{lastMsg.text}</span>
                              )}
                            </>
                          ) : (
                            <span className="text-white/40 italic">
                              {group.members?.length || 0} participants
                            </span>
                          )}
                        </div>

                        {/* Unread Badge Count */}
                        {group.unreadCount > 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[11px] font-bold shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse flex-shrink-0">
                            {group.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        )}

        {/* ================= 2. CHATS & CONTACTS TABS CONTENT ================= */}
        {activeTab !== "groups" && !searchQuery && displayedUsers.length > 0 && (
          <div>
            {displayedUsers.map((user) => {
              const isSelected = selectedUser?._id === user._id && !selectedUser?.isGroup;
              const isOnline = onlineUsers.includes(user._id);
              const avatar = getAvatar(user);
              const lastMsg = user.lastMessage;
              const isLastMsgMine = lastMsg && lastMsg.senderId === authUser?._id;

              return (
                <button
                  key={user._id}
                  onClick={() => setSelectedUser(user)}
                  className={`
                    w-full p-2.5 flex items-center gap-3 rounded-xl mb-1 text-left
                    transition-all duration-200 group
                    ${
                      isSelected
                        ? "bg-white/15 border border-white/15 shadow-[0_0_15px_rgba(56,189,248,0.12)]"
                        : "hover:bg-white/5 border border-transparent"
                    }
                  `}
                >
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <img
                      src={avatar}
                      alt={user.fullName}
                      className="size-12 object-cover rounded-full shadow-md border border-white/10"
                    />
                    {isOnline && (
                      <span className="absolute bottom-0 right-0 size-3 bg-emerald-400 rounded-full ring-2 ring-slate-900 shadow-[0_0_8px_#34d399]" />
                    )}
                  </div>

                  {/* Conversation Meta */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <h4
                        className={`font-semibold text-sm truncate ${
                          isSelected ? "text-white" : "text-white/90"
                        }`}
                      >
                        {user.fullName}
                      </h4>
                      {lastMsg?.createdAt && (
                        <span className="text-[11px] text-white/40 flex-shrink-0 ml-2">
                          {formatConversationTime(lastMsg.createdAt)}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-1">
                      {/* Last Message Snippet */}
                      <div className="flex items-center gap-1.5 text-xs text-white/60 truncate min-w-0 flex-1 pr-2">
                        {isLastMsgMine && (
                          <span className="flex-shrink-0 text-white/50">
                            {lastMsg.status === "read" ? (
                              <CheckCheck className="size-3.5 text-sky-400" />
                            ) : lastMsg.status === "delivered" ? (
                              <CheckCheck className="size-3.5 text-white/60" />
                            ) : (
                              <Check className="size-3.5 text-white/40" />
                            )}
                          </span>
                        )}

                        {lastMsg ? (
                          lastMsg.image ? (
                            <span className="flex items-center gap-1 text-white/80 font-medium">
                              <Camera className="size-3 text-sky-400" /> Photo
                            </span>
                          ) : lastMsg.audio ? (
                            <span className="flex items-center gap-1 text-white/80 font-medium">
                              <Mic className="size-3 text-indigo-400" /> Voice message
                            </span>
                          ) : (
                            <span className="truncate">{lastMsg.text}</span>
                          )
                        ) : (
                          <span className="text-white/40 italic">
                            {isOnline ? "Online now • Tap to chat" : `@${user.username}`}
                          </span>
                        )}
                      </div>

                      {/* Unread Badge Count */}
                      {user.unreadCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-sky-500 text-white text-[11px] font-bold shadow-[0_0_8px_rgba(56,189,248,0.5)] animate-pulse flex-shrink-0">
                          {user.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Empty list for Chats tab */}
        {!searchQuery && activeTab === "chats" && displayedUsers.length === 0 && (
          <div className="text-center py-12 px-4 space-y-3">
            <div className="size-12 rounded-2xl bg-white/5 border border-white/10 mx-auto flex items-center justify-center text-sky-400">
              <Sparkles className="size-6" />
            </div>
            <h5 className="font-semibold text-white text-sm">No conversations yet</h5>
            <p className="text-xs text-white/50 max-w-[200px] mx-auto">
              Switch to Discover tab or create a group to start chatting!
            </p>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setActiveTab("contacts")}
                className="px-3.5 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs shadow-lg transition-all"
              >
                Browse Contacts
              </button>
              <button
                onClick={() => setIsCreateGroupModalOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs border border-white/10 transition-all"
              >
                New Group
              </button>
            </div>
          </div>
        )}

        {/* Empty list for Contacts tab */}
        {!searchQuery && activeTab === "contacts" && displayedUsers.length === 0 && (
          <div className="text-center py-12 px-4 text-white/50 text-xs font-medium">
            No contacts available yet.
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;