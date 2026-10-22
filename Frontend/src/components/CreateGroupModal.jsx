import { useState, useMemo } from "react";
import { X, Camera, Users, Search, Check, Loader2 } from "lucide-react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { getAvatar } from "../lib/avatar";

const CreateGroupModal = () => {
  const {
    isCreateGroupModalOpen,
    setIsCreateGroupModalOpen,
    users,
    createGroup,
  } = useChatStore();
  const { authUser } = useAuthStore();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [groupPic, setGroupPic] = useState("");
  const [selectedMemberIds, setSelectedMemberIds] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Available contacts (excluding self)
  const availableUsers = useMemo(() => {
    return users.filter((u) => u._id !== authUser?._id);
  }, [users, authUser]);

  // Filtered contacts based on search query
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return availableUsers;
    const q = searchQuery.toLowerCase();
    return availableUsers.filter(
      (u) =>
        u.fullName?.toLowerCase().includes(q) ||
        u.username?.toLowerCase().includes(q)
    );
  }, [availableUsers, searchQuery]);

  // Selected users full objects for chips
  const selectedUsers = useMemo(() => {
    return availableUsers.filter((u) => selectedMemberIds.includes(u._id));
  }, [availableUsers, selectedMemberIds]);

  if (!isCreateGroupModalOpen) return null;

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setGroupPic(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const toggleMember = (userId) => {
    if (selectedMemberIds.includes(userId)) {
      setSelectedMemberIds(selectedMemberIds.filter((id) => id !== userId));
    } else {
      setSelectedMemberIds([...selectedMemberIds, userId]);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim() || selectedMemberIds.length === 0) return;

    setIsSubmitting(true);
    try {
      await createGroup({
        name: name.trim(),
        description: description.trim(),
        groupPic,
        members: selectedMemberIds,
      });

      // Reset state on success
      setName("");
      setDescription("");
      setGroupPic("");
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
      <div className="glass-panel w-full max-w-lg rounded-3xl bg-slate-950/95 border border-white/15 shadow-2xl animate-modal-pop flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-md">
              <Users className="size-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base tracking-tight leading-tight">
                New Group
              </h3>
              <p className="text-xs text-white/50">
                Add topic and select members
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsCreateGroupModalOpen(false)}
            className="p-1.5 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        <form onSubmit={handleCreate} className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
          {/* Avatar & Name Row */}
          <div className="flex items-center gap-4">
            {/* Group Picture Picker */}
            <div className="relative group flex-shrink-0">
              <div className="size-16 rounded-full overflow-hidden border-2 border-dashed border-white/30 group-hover:border-sky-400 transition-colors flex items-center justify-center bg-white/5">
                {groupPic ? (
                  <img
                    src={groupPic}
                    alt="Group preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Users className="size-7 text-white/40 group-hover:text-sky-400 transition-colors" />
                )}
              </div>
              <label className="absolute inset-0 rounded-full flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity text-white">
                <Camera className="size-5" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            </div>

            {/* Group Name Input */}
            <div className="flex-1">
              <label className="text-xs font-semibold text-white/70 block mb-1">
                Group Subject <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Project Alpha, Weekend Squad"
                value={name}
                maxLength={35}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/15 text-white text-sm placeholder-white/30 focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 transition-all font-medium"
                required
              />
            </div>
          </div>

          {/* Group Description */}
          <div>
            <label className="text-xs font-semibold text-white/70 block mb-1">
              Group Description (optional)
            </label>
            <textarea
              placeholder="What's this group about?"
              value={description}
              rows={2}
              maxLength={150}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-black/40 border border-white/15 text-white text-xs placeholder-white/30 focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 transition-all resize-none"
            />
          </div>

          {/* Member Selection Section */}
          <div className="pt-2 border-t border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white uppercase tracking-wider">
                Select Members <span className="text-red-400">*</span>
              </label>
              <span className="text-xs text-sky-400 font-semibold">
                {selectedMemberIds.length} selected
              </span>
            </div>

            {/* Selected Members Chips */}
            {selectedUsers.length > 0 && (
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto py-1">
                {selectedUsers.map((u) => {
                  const av = getAvatar(u);
                  return (
                    <span
                      key={u._id}
                      className="inline-flex items-center gap-1.5 pl-1 pr-2 py-1 rounded-full bg-sky-500/20 border border-sky-500/30 text-white text-xs font-medium animate-fade-in"
                    >
                      <img
                        src={av}
                        alt={u.fullName}
                        className="size-5 rounded-full object-cover"
                      />
                      <span className="max-w-[100px] truncate">{u.fullName}</span>
                      <button
                        type="button"
                        onClick={() => toggleMember(u._id)}
                        className="hover:text-red-300 ml-0.5"
                      >
                        <X className="size-3" />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}

            {/* Contact Search Input */}
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

            {/* Contacts List */}
            <div className="max-h-52 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
              {filteredUsers.length === 0 ? (
                <div className="text-center py-6 text-xs text-white/40">
                  No matching contacts found
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
                          className="size-9 rounded-full object-cover border border-white/10"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-white truncate">
                            {u.fullName}
                          </p>
                          <p className="text-[11px] text-white/40 truncate">
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
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setIsCreateGroupModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white/60 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || selectedMemberIds.length === 0 || isSubmitting}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold shadow-lg shadow-sky-500/20 transition-all flex items-center gap-2"
            >
              {isSubmitting && <Loader2 className="size-3.5 animate-spin" />}
              <span>Create Group</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateGroupModal;
