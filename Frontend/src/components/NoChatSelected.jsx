import {
  MessageSquare,
  ShieldCheck,
  Zap,
  Phone,
  Video,
  Mic,
  Users,
  Search,
  Plus,
  Lock,
  Sparkles,
  Command,
} from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";

const NoChatSelected = () => {
  const { authUser } = useAuthStore();
  const { setIsCreateGroupModalOpen } = useChatStore();

  const firstName = authUser?.fullName ? authUser.fullName.split(" ")[0] : "Friend";

  return (
    <div className="hidden md:flex flex-1 flex-col items-center justify-between p-8 sm:p-12 bg-transparent relative overflow-hidden select-none">
      {/* Background Ambient Radial Glows */}
      <div className="absolute top-[15%] left-[25%] w-[500px] h-[500px] bg-sky-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[15%] right-[25%] w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Top spacer */}
      <div />

      {/* Main Center Content */}
      <div className="max-w-xl text-center space-y-7 relative z-10 my-auto">
        {/* Animated Brand Emblem */}
        <div className="flex justify-center mb-1">
          <div className="relative group cursor-pointer">
            <div className="absolute -inset-2 bg-gradient-to-tr from-sky-500 via-indigo-500 to-purple-600 rounded-3xl blur-2xl opacity-40 group-hover:opacity-75 transition-all duration-700 animate-pulse" />
            <div className="size-20 rounded-3xl glass-panel bg-slate-900/80 flex items-center justify-center shadow-2xl border border-white/20 relative z-10 transition-transform duration-500 group-hover:scale-105">
              <MessageSquare className="size-10 text-sky-400 drop-shadow-[0_0_15px_rgba(56,189,248,0.7)]" />
            </div>
          </div>
        </div>

        {/* Welcome Text */}
        <div className="space-y-2.5">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Welcome to <span className="bg-gradient-to-r from-sky-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">Gupshup</span>, {firstName}!
          </h2>
          <p className="text-white/60 text-sm max-w-md mx-auto leading-relaxed">
            Select an existing conversation from the sidebar, start a direct message, or create a group to begin chatting and calling.
          </p>
        </div>

        {/* Interactive Feature Cards Grid */}
        <div className="grid grid-cols-2 gap-3 pt-2 text-left">
          {/* Card 1: Direct Messaging */}
          <div className="p-4 rounded-2xl glass-panel bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 group">
            <div className="size-9 rounded-xl bg-sky-500/15 text-sky-400 flex items-center justify-center flex-shrink-0 mb-2.5 shadow-inner group-hover:scale-110 transition-transform">
              <Zap className="size-4.5" />
            </div>
            <h4 className="text-xs font-bold text-white group-hover:text-sky-300 transition-colors">
              Instant Messaging
            </h4>
            <p className="text-[11px] text-white/50 mt-1 leading-normal">
              Real-time delivery with double blue checkmarks and read receipts.
            </p>
          </div>

          {/* Card 2: WhatsApp-style Groups */}
          <div
            onClick={() => setIsCreateGroupModalOpen(true)}
            className="p-4 rounded-2xl glass-panel bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2.5">
              <div className="size-9 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center flex-shrink-0 shadow-inner group-hover:scale-110 transition-transform">
                <Users className="size-4.5" />
              </div>
              <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1 bg-emerald-500/15 px-2 py-0.5 rounded-full">
                <Plus className="size-3" /> New
              </span>
            </div>
            <h4 className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">
              Group Chats
            </h4>
            <p className="text-[11px] text-white/50 mt-1 leading-normal">
              Create groups, assign admins, and chat with custom member colors.
            </p>
          </div>

          {/* Card 3: Voice & Video Calls */}
          <div className="p-4 rounded-2xl glass-panel bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 group">
            <div className="size-9 rounded-xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center flex-shrink-0 mb-2.5 shadow-inner group-hover:scale-110 transition-transform">
              <Video className="size-4.5" />
            </div>
            <h4 className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors">
              HD Video & Audio Calls
            </h4>
            <p className="text-[11px] text-white/50 mt-1 leading-normal">
              1-on-1 and multi-participant WebRTC calling with live waveforms.
            </p>
          </div>

          {/* Card 4: Voice Notes */}
          <div className="p-4 rounded-2xl glass-panel bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 group">
            <div className="size-9 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center flex-shrink-0 mb-2.5 shadow-inner group-hover:scale-110 transition-transform">
              <Mic className="size-4.5" />
            </div>
            <h4 className="text-xs font-bold text-white group-hover:text-purple-300 transition-colors">
              Voice Memos
            </h4>
            <p className="text-[11px] text-white/50 mt-1 leading-normal">
              Record voice notes with interactive waveform scrubber and speed control.
            </p>
          </div>
        </div>

        {/* Quick Keyboard Shortcuts Pill */}
        <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[11px] text-white/50 backdrop-blur-md">
          <span className="flex items-center gap-1 font-mono text-white/70">
            <kbd className="px-1.5 py-0.5 rounded bg-black/40 border border-white/15 text-[10px]">Enter</kbd> Send
          </span>
          <span className="size-1 rounded-full bg-white/20" />
          <span className="flex items-center gap-1 font-mono text-white/70">
            <kbd className="px-1.5 py-0.5 rounded bg-black/40 border border-white/15 text-[10px]">Hover</kbd> React & Delete
          </span>
        </div>
      </div>

      {/* WhatsApp Web-style iconic footer guarantee */}
      <div className="flex items-center justify-center gap-2 text-xs text-white/40 pt-4 border-t border-white/5 w-full max-w-md relative z-10">
        <Lock className="size-3.5 text-emerald-400 flex-shrink-0" />
        <span className="text-center">
          End-to-end transport encrypted. Your personal messages and calls stay private.
        </span>
      </div>
    </div>
  );
};

export default NoChatSelected;