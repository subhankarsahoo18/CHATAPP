import { useState, useMemo } from "react";
import { X, Search, Check, Loader2, UserPlus } from "lucide-react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { getAvatar } from "../lib/avatar";

const AddMembersModal = () => {
  const {
    isAddMemberModalOpen,
    setIsAddMemberModalOpen,
    selectedUser,
    users,
    addMembersToGroup,
  } = useChatStore();
  const { authUser } = useAuthStore();

  const [selectedMemberIds, setSelectedMemberIds] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Existing group member IDs
  const existingMemberIds = useMemo(() => {
    if (!selectedUser?.members) return [];
    return selectedUser.members.map((m) =>
      typeof m === "object" ? m._id?.toString() : m.toString()
    );
  }, [selectedUser]);

  // Candidates = users who are NOT current user and NOT already in group
  const candidateUsers = useMemo(() => {
    return users.filter(
      (u) =>
        u._id !== authUser?._id &&
        !existingMemberIds.includes(u._id.toString())
    );
  }, [users, authUser, existingMemberIds]);

  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return candidateUsers;
    const q = searchQuery.toLowerCase();
    return candidateUsers.filter(
      (u) =>
        u.fullName?.toLowerCase().includes(q) ||
        u.username?.toLowerCase().includes(q)
    );
  }, [candidateUsers, searchQuery]);

  if (!isAddMemberModalOpen || !selectedUser) return null;

  const toggleMember = (userId) => {
    if (selectedMemberIds.includes(userId)) {
      setSelectedMemberIds(selectedMemberIds.filter((id) => id !== userId));
    } else {
      setSelectedMemberIds([...selectedMemberIds, userId]);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (selectedMemberIds.length === 0) return;

    setIsSubmitting(true);
    try {
      await addMembersToGroup(selectedUser._id, selectedMemberIds);
      setSelectedMemberIds([]);
      setSearchQuery("");
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="glass-panel w-full max-w-md rounded-3xl bg-slate-950/95 border border-white/15 shadow-2xl animate-modal-pop flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center">
              <UserPlus className="size-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Add Participants</h3>
              <p className="text-[11px] text-white/50">{selectedUser.name}</p>
            </div>
          </div>
          <button
            onClick={() => setIsAddMemberModalOpen(false)}
            className="p-1 rounded-full hover:bg-white/10 text-white/60 hover:text-white"
          >
            <X className="size-4.5" />
          </button>
        </div>

        <form onSubmit={handleAdd} className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 size-4 text-white/40" />
            <input
              type="text"
              placeholder="Search contacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-black/30 border border-white/10 text-xs text-white placeholder-white/30 focus:outline-none focus:border-sky-400 transition-all"
            />
          </div>

          {/* Candidates List */}
          <div className="max-h-60 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
            {filteredUsers.length === 0 ? (
              <div className="text-center py-8 text-xs text-white/40">
                {candidateUsers.length === 0
                  ? "All your contacts are already in this group"
                  : "No contacts match your search"}
              </div>
            ) : (
              filteredUsers.map((u) => {
                const isSelected = selectedMemberIds.includes(u._id);
                const av = getAvatar(u);

                return (
                  <div
                    key={u._id}
                    onClick={() => toggleMember(u._id)}
                    className={`
                      p-2 rounded-xl flex items-center justify-between cursor-pointer transition-all
                      ${
                        isSelected
                          ? "bg-sky-500/15 border border-sky-500/30"
                          : "hover:bg-white/5 border border-transparent"
                      }
                    `}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={av}
                        alt={u.fullName}
                        className="size-8 rounded-full object-cover border border-white/10"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-white truncate">
                          {u.fullName}
                        </p>
                        <p className="text-[10px] text-white/40 truncate">
                          @{u.username}
                        </p>
                      </div>
                    </div>

                    <div
                      className={`
                        size-5 rounded-full flex items-center justify-center border transition-all
                        ${
                          isSelected
                            ? "bg-sky-500 border-sky-400 text-white"
                            : "border-white/30"
                        }
                      `}
                    >
                      {isSelected && <Check className="size-3 stroke-[3]" />}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAddMemberModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white/60 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={selectedMemberIds.length === 0 || isSubmitting}
              className="px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold shadow-lg shadow-sky-500/20 transition-all flex items-center gap-2"
            >
              {isSubmitting && <Loader2 className="size-3.5 animate-spin" />}
              <span>Add ({selectedMemberIds.length})</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddMembersModal;
