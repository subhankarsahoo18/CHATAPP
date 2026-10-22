import { useState, useEffect, useRef } from "react";
import { useAuthStore } from "../store/useAuthStore";
import {
  Camera,
  Mail,
  User,
  Phone,
  Edit2,
  Save,
  X,
  Info,
  Sparkles,
  CheckCircle2,
  Upload,
  ShieldCheck,
  Calendar,
  KeyRound,
  Check,
} from "lucide-react";
import { getAvatar } from "../lib/avatar";
import CameraCaptureModal from "../components/CameraCaptureModal";

const STATUS_PRESETS = [
  "Hey there! I am using Gupshup.",
  "Available to chat 🚀",
  "At work / In a meeting 💻",
  "Busy • Urgent calls only ⚡",
  "Traveling ✈️",
  "Living in the moment ✨",
];

const ProfilePage = () => {
  const { authUser, isUpdatingProfile, updateProfile } = useAuthStore();
  const [selectedImg, setSelectedImg] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    fullName: authUser?.fullName || "",
    username: authUser?.username || "",
    mobileNumber: authUser?.mobileNumber || "",
    about: authUser?.about || "Hey there! I am using Gupshup.",
  });

  useEffect(() => {
    if (authUser) {
      setFormData({
        fullName: authUser.fullName || "",
        username: authUser.username || "",
        mobileNumber: authUser.mobileNumber || "",
        about: authUser.about || "Hey there! I am using Gupshup.",
      });
    }
  }, [authUser]);

  const handleSave = async () => {
    await updateProfile(formData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData({
      fullName: authUser?.fullName || "",
      username: authUser?.username || "",
      mobileNumber: authUser?.mobileNumber || "",
      about: authUser?.about || "Hey there! I am using Gupshup.",
    });
    setIsEditing(false);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Image = reader.result;

      if (base64Image.length > 7_000_000) {
        alert("Image too large. Please select an image under 5MB.");
        return;
      }

      setSelectedImg(base64Image);
      await updateProfile({ profilePic: base64Image });
    };

    reader.readAsDataURL(file);
  };

  const avatarSrc = selectedImg || getAvatar(authUser);

  return (
    <div className="min-h-screen pt-20 pb-16 bg-slate-950 text-white relative overflow-hidden">
      {/* Background ambient radial glows */}
      <div className="absolute top-[10%] left-[25%] w-[500px] h-[500px] bg-sky-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[10%] right-[25%] w-[450px] h-[450px] bg-indigo-500/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-2xl mx-auto p-4 sm:p-6 relative z-10 space-y-6">
        {/* Main Profile Card with Hero Banner */}
        <div className="glass-panel rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-slate-900/70 backdrop-blur-2xl">
          {/* Cover Header Banner */}
          <div className="h-32 sm:h-40 bg-gradient-to-r from-sky-600 via-indigo-600 to-purple-700 relative p-6 flex justify-between items-start">
            <div className="absolute inset-0 bg-black/20" />
            <div className="relative z-10 flex items-center gap-2 text-white/90">
              <ShieldCheck className="size-4 text-sky-200" />
              <span className="text-xs font-bold tracking-wider uppercase">Verified Account</span>
            </div>

            {/* Edit / Save Action Button in Banner */}
            <div className="relative z-10">
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/20 rounded-xl transition-all text-xs font-bold text-white shadow-lg hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <Edit2 className="size-3.5 text-sky-300" />
                  <span>Edit Profile</span>
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCancel}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-black/50 hover:bg-black/70 backdrop-blur-md border border-white/20 rounded-xl text-xs font-semibold text-white/80"
                  >
                    <X className="size-3.5" />
                    <span>Cancel</span>
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isUpdatingProfile}
                    className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl shadow-lg transition-all text-xs disabled:opacity-50"
                  >
                    <Save className="size-3.5" />
                    <span>{isUpdatingProfile ? "Saving..." : "Save"}</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Profile Body with Overlapping Avatar */}
          <div className="px-6 sm:px-8 pb-8 pt-0 relative">
            {/* Overlapping Avatar */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-16 sm:-mt-20 mb-6">
              <div className="relative group self-center sm:self-auto">
                <div className="size-28 sm:size-32 rounded-full overflow-hidden border-4 border-slate-900 shadow-2xl bg-slate-800">
                  <img
                    src={avatarSrc}
                    alt={authUser?.fullName || "Profile"}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>

                {/* Camera Trigger Badge */}
                <button
                  type="button"
                  onClick={() => setIsCameraModalOpen(true)}
                  className={`
                    absolute bottom-1 right-1
                    size-9 rounded-full bg-sky-500 hover:bg-sky-400 text-slate-950
                    flex items-center justify-center cursor-pointer shadow-lg hover:scale-110
                    transition-all duration-200 border-2 border-slate-900
                    ${isUpdatingProfile ? "animate-pulse pointer-events-none opacity-70" : ""}
                  `}
                  title="Snap photo with live camera"
                >
                  <Camera className="size-4" />
                </button>

                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={isUpdatingProfile}
                />
              </div>

              {/* Photo Actions */}
              <div className="flex items-center justify-center sm:justify-start gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCameraModalOpen(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white text-xs font-semibold flex items-center gap-1.5 transition-all hover:scale-105"
                >
                  <Camera className="size-3.5 text-sky-400" />
                  <span>Live Camera</span>
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white text-xs font-semibold flex items-center gap-1.5 transition-all hover:scale-105"
                >
                  <Upload className="size-3.5 text-indigo-400" />
                  <span>Upload Image</span>
                </button>
              </div>
            </div>

            {/* Profile Fields */}
            <div className="space-y-5 pt-2">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-white/60 uppercase tracking-wider flex items-center gap-1.5 pl-1">
                  <User className="size-3.5 text-sky-400" />
                  Full Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full px-4 py-2.5 bg-black/40 border border-white/15 rounded-xl text-white text-sm focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 transition-all font-medium"
                    placeholder="Enter your full name"
                  />
                ) : (
                  <div className="px-4 py-2.5 bg-white/5 rounded-xl border border-white/5 text-sm font-semibold text-white">
                    {authUser?.fullName}
                  </div>
                )}
              </div>

              {/* Username */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-white/60 uppercase tracking-wider flex items-center gap-1.5 pl-1">
                  <Sparkles className="size-3.5 text-indigo-400" />
                  Username
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full px-4 py-2.5 bg-black/40 border border-white/15 rounded-xl text-white text-sm focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 transition-all font-medium"
                    placeholder="Enter your username"
                  />
                ) : (
                  <div className="px-4 py-2.5 bg-white/5 rounded-xl border border-white/5 text-sm font-semibold text-sky-400">
                    @{authUser?.username}
                  </div>
                )}
              </div>

              {/* Bio / Status */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-white/60 uppercase tracking-wider flex items-center gap-1.5 pl-1">
                  <Info className="size-3.5 text-emerald-400" />
                  About / Bio
                </label>
                {isEditing ? (
                  <div className="space-y-2">
                    <textarea
                      rows={2}
                      value={formData.about}
                      onChange={(e) => setFormData({ ...formData, about: e.target.value })}
                      className="w-full px-4 py-2 bg-black/40 border border-white/15 rounded-xl text-white text-xs focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 transition-all resize-none"
                      placeholder="Write a short bio or status..."
                    />
                    {/* Presets */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {STATUS_PRESETS.map((preset, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setFormData({ ...formData, about: preset })}
                          className="text-[11px] px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/15 text-white/70 hover:text-white border border-white/10 transition-colors"
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="px-4 py-2.5 bg-white/5 rounded-xl border border-white/5 text-xs text-white/90 leading-relaxed font-medium">
                    {authUser?.about || "Hey there! I am using Gupshup."}
                  </div>
                )}
              </div>

              {/* Mobile Number */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-white/60 uppercase tracking-wider flex items-center gap-1.5 pl-1">
                  <Phone className="size-3.5 text-pink-400" />
                  Mobile Number
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={formData.mobileNumber}
                    onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
                    className="w-full px-4 py-2.5 bg-black/40 border border-white/15 rounded-xl text-white text-sm focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 transition-all font-medium"
                    placeholder="+1234567890"
                  />
                ) : (
                  <div className="px-4 py-2.5 bg-white/5 rounded-xl border border-white/5 text-sm font-medium text-white/90">
                    {authUser?.mobileNumber}
                  </div>
                )}
              </div>

              {/* Email Address */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-white/60 uppercase tracking-wider flex items-center gap-1.5 pl-1">
                  <Mail className="size-3.5 text-amber-400" />
                  Email Address
                </label>
                <div className="px-4 py-2.5 bg-white/5 rounded-xl border border-white/5 text-sm font-medium text-white/80 flex items-center justify-between">
                  <span>{authUser?.email}</span>
                  <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="size-3.5" /> Verified
                  </span>
                </div>
              </div>
            </div>

            {/* Account Metadata Card */}
            <div className="mt-8 pt-5 border-t border-white/10 grid grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-3">
                <Calendar className="size-4 text-sky-400 flex-shrink-0" />
                <div>
                  <div className="text-[10px] text-white/40 font-semibold uppercase">Joined</div>
                  <div className="text-white/80 font-medium mt-0.5">
                    {authUser?.createdAt ? new Date(authUser.createdAt).toLocaleDateString() : "Active Member"}
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-3">
                <ShieldCheck className="size-4 text-emerald-400 flex-shrink-0" />
                <div>
                  <div className="text-[10px] text-white/40 font-semibold uppercase">Security</div>
                  <div className="text-emerald-400 font-medium mt-0.5">JWT Encrypted</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Live Camera View Modal */}
      <CameraCaptureModal
        isOpen={isCameraModalOpen}
        onClose={() => setIsCameraModalOpen(false)}
        onCapture={async (base64) => {
          setSelectedImg(base64);
          await updateProfile({ profilePic: base64 });
        }}
      />
    </div>
  );
};

export default ProfilePage;
