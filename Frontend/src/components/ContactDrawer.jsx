import { useState } from "react";
import {
  X,
  Phone,
  Video,
  Mail,
  Calendar,
  Image as ImageIcon,
  Users,
  UserPlus,
  ShieldCheck,
  Crown,
  LogOut,
  MoreVertical,
  UserMinus,
  ShieldAlert,
} from "lucide-react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { getAvatar, getGroupAvatar } from "../lib/avatar";

const ContactDrawer = () => {
  const {
    selectedUser,
    isContactDrawerOpen,
    setIsContactDrawerOpen,
    setIsAddMemberModalOpen,
    messages,
    setLightboxImage,
    startCall,
    startGroupCall,
    leaveGroup,
    removeMemberFromGroup,
    toggleGroupAdmin,
  } = useChatStore();

  const { authUser } = useAuthStore();
  const [activeMemberMenu, setActiveMemberMenu] = useState(null);

  if (!isContactDrawerOpen || !selectedUser) return null;

  const isGroup = Boolean(selectedUser.isGroup || selectedUser.members);

  // Group admin checks
  const isAdmin =
    isGroup &&
    (selectedUser.admin?._id === authUser?._id ||
      selectedUser.admin === authUser?._id ||
      selectedUser.admins?.some((a) => (typeof a === "object" ? a._id : a) === authUser?._id));

  // Shared media from active chat
  const sharedMedia = messages.filter((m) => m.image && !m.isDeleted);

  const avatarUrl = isGroup
    ? getGroupAvatar(selectedUser)
    : getAvatar(selectedUser);

  const handleCall = (callType) => {
    if (isGroup) {
      startGroupCall(selectedUser, callType);
    } else {
      startCall(selectedUser, callType);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full max-w-sm glass-panel border-l border-white/10 flex flex-col shadow-2xl animate-fade-in bg-[var(--color-surface)]/95 backdrop-blur-2xl">
      {/* Drawer Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <h3 className="font-semibold text-white/90 text-base">
          {isGroup ? "Group Info" : "Contact Info"}
        </h3>
        <button
          onClick={() => setIsContactDrawerOpen(false)}
          className="p-2 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors"
          title="Close details"
        >
          <X className="size-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
        {/* Profile Card */}
        <div className="flex flex-col items-center text-center">
          <div className="size-24 rounded-full overflow-hidden border-2 border-white/20 shadow-xl mb-3 relative group">
            <img
              src={avatarUrl}
              alt={isGroup ? selectedUser.name : selectedUser.fullName}
              className="w-full h-full object-cover"
            />
          </div>
          <h2 className="text-xl font-bold text-white">
            {isGroup ? selectedUser.name : selectedUser.fullName}
          </h2>
          <p className="text-xs text-sky-400 font-medium mt-0.5">
            {isGroup
              ? `Group • ${selectedUser.members?.length || 0} participants`
              : `@${selectedUser.username}`}
          </p>

          {/* Quick Call Actions */}
          <div className="flex items-center gap-3 mt-4">
            <button
              onClick={() => handleCall("audio")}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-semibold transition-all hover:scale-105"
            >
              <Phone className="size-4 text-sky-400" />
              <span>Voice</span>
            </button>
            <button
              onClick={() => handleCall("video")}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-semibold transition-all hover:scale-105"
            >
              <Video className="size-4 text-indigo-400" />
              <span>Video</span>
            </button>
          </div>
        </div>

        {/* Bio / Description */}
        <div className="p-4 rounded-2xl bg-black/20 border border-white/5">
          <div className="text-[11px] font-bold uppercase tracking-wider text-white/40 mb-1">
            {isGroup ? "Description" : "About"}
          </div>
          <p className="text-sm text-white/90 leading-relaxed">
            {isGroup
              ? selectedUser.description || "Welcome to our group chat!"
              : selectedUser.about || "Hey there! I am using Gupshup."}
          </p>
        </div>

        {/* ================= GROUP MEMBERS SECTION ================= */}
        {isGroup && (
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold uppercase tracking-wider text-white/60">
                {selectedUser.members?.length || 0} Participants
              </span>
              {isAdmin && (
                <button
                  onClick={() => setIsAddMemberModalOpen(true)}
                  className="flex items-center gap-1 text-xs text-sky-400 font-semibold hover:text-sky-300 transition-colors"
                >
                  <UserPlus className="size-3.5" />
                  <span>Add Member</span>
                </button>
              )}
            </div>

            <div className="space-y-1 rounded-2xl bg-black/20 border border-white/5 p-2">
              {selectedUser.members?.map((member) => {
                const memberObj = typeof member === "object" ? member : { _id: member, fullName: "Member" };
                const isMe = memberObj._id === authUser?._id;
                const memberAvatar = getAvatar(memberObj);

                const isMemberAdmin =
                  (selectedUser.admin?._id || selectedUser.admin) === memberObj._id ||
                  selectedUser.admins?.some(
                    (a) => (typeof a === "object" ? a._id : a) === memberObj._id
                  );

                return (
                  <div
                    key={memberObj._id}
                    className="p-2 rounded-xl flex items-center justify-between hover:bg-white/5 transition-colors relative"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={memberAvatar}
                        alt={memberObj.fullName}
                        className="size-9 rounded-full object-cover border border-white/10"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-semibold text-white truncate">
                            {memberObj.fullName} {isMe && "(You)"}
                          </p>
                          {isMemberAdmin && (
                            <span className="flex items-center gap-1 px-1.5 py-0.2 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[9px] font-bold">
                              <Crown className="size-2.5" />
                              <span>Admin</span>
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-white/40 truncate">
                          @{memberObj.username || "member"}
                        </p>
                      </div>
                    </div>

                    {/* Admin management actions (only visible to admins, cannot manage self) */}
                    {isAdmin && !isMe && (
                      <div className="relative">
                        <button
                          onClick={() =>
                            setActiveMemberMenu(
                              activeMemberMenu === memberObj._id ? null : memberObj._id
                            )
                          }
                          className="p-1.5 rounded-full hover:bg-white/10 text-white/50 hover:text-white"
                        >
                          <MoreVertical className="size-3.5" />
                        </button>

                        {activeMemberMenu === memberObj._id && (
                          <div className="absolute right-0 top-full mt-1 w-44 rounded-xl bg-slate-950/95 border border-white/15 shadow-2xl p-1.5 z-50 animate-modal-pop text-xs space-y-1">
                            <button
                              onClick={() => {
                                toggleGroupAdmin(selectedUser._id, memberObj._id);
                                setActiveMemberMenu(null);
                              }}
                              className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-white flex items-center gap-2 font-medium"
                            >
                              <Crown className="size-3.5 text-amber-400" />
                              <span>
                                {isMemberAdmin ? "Dismiss as Admin" : "Make Group Admin"}
                              </span>
                            </button>

                            <button
                              onClick={() => {
                                removeMemberFromGroup(selectedUser._id, memberObj._id);
                                setActiveMemberMenu(null);
                              }}
                              className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-red-500/20 text-red-400 flex items-center gap-2 font-medium"
                            >
                              <UserMinus className="size-3.5" />
                              <span>Remove from Group</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Exit Group Button */}
            <button
              onClick={() => leaveGroup(selectedUser._id)}
              className="w-full py-2.5 px-4 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 font-semibold text-xs transition-all flex items-center justify-center gap-2"
            >
              <LogOut className="size-4" />
              <span>Exit Group</span>
            </button>
          </div>
        )}

        {/* ================= 1-on-1 CONTACT DETAILS ================= */}
        {!isGroup && (
          <div className="space-y-3 p-4 rounded-2xl bg-black/20 border border-white/5 text-sm">
            <div className="flex items-center gap-3 text-white/80">
              <Phone className="size-4 text-sky-400 flex-shrink-0" />
              <div className="min-w-0">
                <div className="text-[11px] text-white/40 font-medium">Mobile</div>
                <div className="truncate font-medium">
                  {selectedUser.mobileNumber || "Not shared"}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 text-white/80 pt-2 border-t border-white/5">
              <Mail className="size-4 text-indigo-400 flex-shrink-0" />
              <div className="min-w-0">
                <div className="text-[11px] text-white/40 font-medium">Email</div>
                <div className="truncate font-medium">
                  {selectedUser.email || "Not shared"}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 text-white/80 pt-2 border-t border-white/5">
              <Calendar className="size-4 text-emerald-400 flex-shrink-0" />
              <div className="min-w-0">
                <div className="text-[11px] text-white/40 font-medium">Joined</div>
                <div className="font-medium">
                  {selectedUser.createdAt
                    ? new Date(selectedUser.createdAt).toLocaleDateString()
                    : "Active Member"}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Shared Media Section */}
        <div>
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white/60">
              <ImageIcon className="size-4 text-sky-400" />
              <span>Shared Photos ({sharedMedia.length})</span>
            </div>
          </div>

          {sharedMedia.length === 0 ? (
            <div className="text-center py-8 rounded-2xl border border-dashed border-white/10 text-white/40 text-xs">
              No photos shared yet
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {sharedMedia.map((m) => (
                <div
                  key={m._id}
                  onClick={() => setLightboxImage(m.image)}
                  className="aspect-square rounded-xl overflow-hidden cursor-pointer border border-white/10 relative group hover:scale-105 transition-all shadow-md"
                >
                  <img
                    src={m.image}
                    alt="Shared media"
                    className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Privacy Note */}
        <div className="flex items-center gap-2 p-3 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-300 text-xs">
          <ShieldCheck className="size-4 flex-shrink-0" />
          <span>Messages & calls are secured with end-to-end transport encryption.</span>
        </div>
      </div>
    </div>
  );
};

export default ContactDrawer;
