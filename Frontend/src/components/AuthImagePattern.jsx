import {
  MessageSquare,
  ShieldCheck,
  Zap,
  Phone,
  Video,
  Play,
  CheckCheck,
  Mic,
  Camera,
  Users,
  Sparkles,
} from "lucide-react";

const AuthImagePattern = ({ title, subtitle }) => {
  return (
    <div className="hidden lg:flex flex-1 flex-col items-center justify-center p-8 lg:p-12 relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/40 select-none">
      {/* Ambient Radial Mesh Lights */}
      <div className="absolute top-[10%] left-[10%] w-[500px] h-[500px] bg-sky-500/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[10%] right-[10%] w-[500px] h-[500px] bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Grid Pattern Overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
          backgroundSize: "28px 28px",
        }}
      />

      <div className="w-full max-w-lg space-y-8 relative z-10">
        {/* Floating Interactive Live Chat Mockup */}
        <div className="glass-panel p-5 rounded-3xl bg-slate-950/80 border border-white/15 shadow-[0_20px_60px_rgba(0,0,0,0.6)] backdrop-blur-2xl space-y-4 animate-modal-pop">
          {/* Chat Window Header */}
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md relative">
                <Users className="size-5" />
                <span className="absolute bottom-0 right-0 size-3 bg-emerald-400 rounded-full ring-2 ring-slate-950 shadow-[0_0_8px_#34d399]" />
              </div>
              <div>
                <h4 className="font-bold text-white text-sm tracking-tight flex items-center gap-2">
                  <span>Product Design & Core</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                    Group
                  </span>
                </h4>
                <p className="text-[11px] text-white/50">4 online • Subhankar, Priya, Alex...</p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-white/60">
              <div className="p-2 rounded-full bg-white/5 text-sky-400">
                <Phone className="size-4" />
              </div>
              <div className="p-2 rounded-full bg-white/5 text-indigo-400">
                <Video className="size-4" />
              </div>
            </div>
          </div>

          {/* Simulated Message Bubbles */}
          <div className="space-y-3 text-xs">
            {/* Incoming message 1 */}
            <div className="flex items-start gap-2.5">
              <div className="size-7 rounded-full bg-indigo-500/30 border border-indigo-400/40 text-indigo-300 font-bold flex items-center justify-center text-[11px] flex-shrink-0">
                P
              </div>
              <div className="bg-[var(--color-surface-container-high)] text-white/90 p-3 rounded-2xl rounded-tl-sm border border-white/10 shadow-sm max-w-[85%]">
                <span className="text-[10px] font-bold text-emerald-400 block mb-1">Priya Sharma</span>
                <p className="leading-relaxed">
                  Hey team! Just tried the new audio calling and voice notes update. It sounds crystal clear! 🎙️✨
                </p>
                <span className="text-[10px] text-white/40 block text-right mt-1">10:42 AM</span>
              </div>
            </div>

            {/* Outgoing voice note message */}
            <div className="flex justify-end">
              <div className="bg-gradient-to-br from-sky-500 to-indigo-600 text-white p-3 rounded-2xl rounded-tr-sm shadow-md max-w-[85%] space-y-1.5">
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-full bg-white/20 flex items-center justify-center text-white flex-shrink-0">
                    <Play className="size-3.5 translate-x-0.5 fill-current" />
                  </div>
                  {/* Waveform graphic */}
                  <div className="flex items-center gap-0.5 h-6">
                    {[12, 18, 8, 22, 16, 26, 14, 20, 10, 24, 18, 12, 22, 16, 8].map((h, i) => (
                      <span
                        key={i}
                        className="w-1 rounded-full bg-white/80"
                        style={{ height: `${h}px` }}
                      />
                    ))}
                  </div>
                  <span className="text-[11px] font-mono text-white/90">0:18</span>
                </div>
                <div className="flex items-center justify-end gap-1 text-[10px] text-white/70">
                  <span>10:43 AM</span>
                  <CheckCheck className="size-3 text-sky-200" />
                </div>
              </div>
            </div>

            {/* Active call indicator banner */}
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between text-[11px] text-emerald-300">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="font-semibold">Group Video Call in progress</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">
                Join Call
              </span>
            </div>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md flex items-center gap-3">
            <div className="size-9 rounded-xl bg-sky-500/15 text-sky-400 flex items-center justify-center flex-shrink-0 shadow-inner">
              <Zap className="size-4.5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">Ultra Fast</div>
              <div className="text-[11px] text-white/50">Sub-second socket sync</div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md flex items-center gap-3">
            <div className="size-9 rounded-xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center flex-shrink-0 shadow-inner">
              <Phone className="size-4.5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">HD WebRTC Calls</div>
              <div className="text-[11px] text-white/50">Crystal peer audio & video</div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md flex items-center gap-3">
            <div className="size-9 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center flex-shrink-0 shadow-inner">
              <Users className="size-4.5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">Group Hubs</div>
              <div className="text-[11px] text-white/50">WhatsApp-style groups & roles</div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md flex items-center gap-3">
            <div className="size-9 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center flex-shrink-0 shadow-inner">
              <ShieldCheck className="size-4.5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">Private & Safe</div>
              <div className="text-[11px] text-white/50">Direct secure transmission</div>
            </div>
          </div>
        </div>

        {/* Catchy headline */}
        <div className="text-center pt-2">
          <h3 className="text-xl font-extrabold text-white tracking-tight">{title}</h3>
          <p className="text-xs text-white/50 mt-1 max-w-sm mx-auto leading-relaxed">{subtitle}</p>
        </div>
      </div>
    </div>
  );
};

export default AuthImagePattern;