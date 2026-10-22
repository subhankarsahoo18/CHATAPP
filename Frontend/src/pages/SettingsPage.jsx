import { useState } from "react";
import { THEMES } from "../constants";
import { useThemeStore } from "../store/useThemeStore";
import {
  Send,
  Volume2,
  VolumeX,
  Sparkles,
  Check,
  CheckCheck,
  ShieldCheck,
  Mic,
  Camera,
  Bell,
  Play,
  Monitor,
} from "lucide-react";
import { soundFx } from "../lib/audioSound";

const PREVIEW_MESSAGES = [
  {
    id: 1,
    content: "Hey! How does the new Gupshup theme look on your end?",
    isSent: false,
    time: "11:20 AM",
  },
  {
    id: 2,
    content: "It looks incredible! Smooth gradients, live voice notes, and instant group video calls 🚀✨",
    isSent: true,
    time: "11:21 AM",
  },
];

const SettingsPage = () => {
  const { theme, setTheme } = useThemeStore();
  const [isSoundOn, setIsSoundOn] = useState(soundFx.isSoundEnabled());

  const handleToggleSound = () => {
    const nextState = !isSoundOn;
    soundFx.setSoundEnabled(nextState);
    setIsSoundOn(nextState);
    if (nextState) {
      soundFx.playSentSound();
    }
  };

  return (
    <div className="min-h-screen pt-20 pb-16 bg-slate-950 text-white relative overflow-hidden">
      {/* Background ambient radial glows */}
      <div className="absolute top-[10%] left-[20%] w-[500px] h-[500px] bg-sky-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[10%] right-[20%] w-[450px] h-[450px] bg-indigo-500/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Settings & Appearance
          </h1>
          <p className="text-xs sm:text-sm text-white/50 mt-1">
            Personalize your messaging environment, notification ringtones, and visual color scheme
          </p>
        </div>

        {/* 1. Audio Notifications & Sound Effects */}
        <div className="glass-panel p-6 sm:p-7 rounded-3xl border border-white/10 shadow-2xl bg-slate-900/60 backdrop-blur-2xl space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-2xl bg-sky-500/15 text-sky-400 flex items-center justify-center shadow-inner">
                {isSoundOn ? <Volume2 className="size-5" /> : <VolumeX className="size-5" />}
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Sound Effects & Ringtones</h3>
                <p className="text-xs text-white/50">
                  Audio chimes for incoming messages, sent confirmation, and ringing calls
                </p>
              </div>
            </div>

            <button
              onClick={handleToggleSound}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors cursor-pointer ${
                isSoundOn ? "bg-sky-500" : "bg-white/15"
              }`}
            >
              <span
                className={`inline-block size-5 transform rounded-full bg-white shadow-md transition-transform ${
                  isSoundOn ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {/* Audio Chime Diagnostics */}
          <div className="pt-3 border-t border-white/10">
            <div className="text-[11px] font-bold text-white/60 uppercase tracking-wider mb-3">
              Test Audio Feedback
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  soundFx.resume();
                  soundFx.playReceivedSound();
                }}
                className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-left transition-all hover:scale-[1.02] active:scale-98 cursor-pointer group"
              >
                <div className="font-bold text-xs text-white group-hover:text-sky-300">Message Bell</div>
                <div className="text-[10px] text-white/50 mt-0.5">Test incoming chime</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  soundFx.resume();
                  soundFx.playSentSound();
                }}
                className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-left transition-all hover:scale-[1.02] active:scale-98 cursor-pointer group"
              >
                <div className="font-bold text-xs text-white group-hover:text-sky-300">Sent Swoosh</div>
                <div className="text-[10px] text-white/50 mt-0.5">Test sent audio</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  soundFx.resume();
                  soundFx.startIncomingRingtone();
                  setTimeout(() => soundFx.stopRingtone(), 3500);
                }}
                className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-left transition-all hover:scale-[1.02] active:scale-98 cursor-pointer group"
              >
                <div className="font-bold text-xs text-white group-hover:text-emerald-300">Incoming Ringtone</div>
                <div className="text-[10px] text-white/50 mt-0.5">Test call melody</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  soundFx.resume();
                  soundFx.playTestTone();
                }}
                className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-left transition-all hover:scale-[1.02] active:scale-98 cursor-pointer group"
              >
                <div className="font-bold text-xs text-white group-hover:text-amber-300">Speaker Chime</div>
                <div className="text-[10px] text-white/50 mt-0.5">Test hardware output</div>
              </button>
            </div>
          </div>
        </div>

        {/* 2. Visual Themes Grid */}
        <div className="glass-panel p-6 sm:p-7 rounded-3xl border border-white/10 shadow-2xl bg-slate-900/60 backdrop-blur-2xl space-y-4">
          <div className="flex items-center gap-2.5">
            <Sparkles className="size-5 text-indigo-400" />
            <h2 className="text-lg font-bold text-white">Visual Themes</h2>
          </div>
          <p className="text-xs text-white/50">
            Select your preferred color scheme for buttons, bubbles, and highlights
          </p>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2.5 pt-2">
            {THEMES.map((t) => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className={`
                  group flex flex-col items-center gap-2 p-2.5 rounded-2xl transition-all border cursor-pointer
                  ${
                    theme === t
                      ? "bg-white/15 border-sky-400 shadow-[0_0_15px_rgba(56,189,248,0.25)] scale-[1.03]"
                      : "bg-white/5 hover:bg-white/10 border-white/5 hover:scale-[1.02]"
                  }
                `}
              >
                <div className="relative h-9 w-full rounded-xl overflow-hidden shadow-sm" data-theme={t}>
                  <div className="absolute inset-0 grid grid-cols-4 gap-px p-1">
                    <div className="rounded-sm bg-primary" />
                    <div className="rounded-sm bg-secondary" />
                    <div className="rounded-sm bg-accent" />
                    <div className="rounded-sm bg-neutral" />
                  </div>
                </div>
                <span className="text-[11px] font-semibold truncate w-full text-center text-white/80 group-hover:text-white capitalize">
                  {t}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* 3. Live Chat Preview */}
        <div className="glass-panel p-6 sm:p-7 rounded-3xl border border-white/10 shadow-2xl bg-slate-900/60 backdrop-blur-2xl space-y-4">
          <div className="flex items-center gap-2">
            <Monitor className="size-5 text-emerald-400" />
            <h3 className="text-lg font-bold text-white">Live Conversation Preview</h3>
          </div>
          <p className="text-xs text-white/50">
            Preview how your incoming and outgoing chat bubbles appear with current theme
          </p>

          <div className="max-w-md mx-auto pt-2">
            <div className="rounded-3xl border border-white/15 overflow-hidden shadow-2xl glass-panel bg-slate-950/80">
              {/* Header */}
              <div className="px-5 py-3.5 border-b border-white/10 bg-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                    JD
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">Gupshup Community</h4>
                    <p className="text-[11px] text-emerald-400 font-medium">Online</p>
                  </div>
                </div>
              </div>

              {/* Chat Feed */}
              <div className="p-4 space-y-3 min-h-[190px] flex flex-col justify-end bg-black/20">
                {PREVIEW_MESSAGES.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.isSent ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`
                        max-w-[85%] rounded-2xl p-3 shadow-md text-xs
                        ${
                          message.isSent
                            ? "bg-gradient-to-br from-sky-500 to-indigo-600 text-white rounded-tr-sm"
                            : "bg-[var(--color-surface-container-high)] text-white/90 rounded-tl-sm border border-white/10"
                        }
                      `}
                    >
                      <p className="leading-relaxed">{message.content}</p>
                      <div className="flex items-center justify-end gap-1 mt-1 text-[10px] opacity-70">
                        <span>{message.time}</span>
                        {message.isSent && <CheckCheck className="size-3 text-sky-200" />}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 4. Privacy & Hardware Note */}
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between text-xs text-white/60">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="size-4 text-emerald-400" />
            <span>Browser media permissions (Microphone & Camera) are handled on-demand for calls.</span>
          </div>
          <span className="font-semibold text-white/80">Version 2.0</span>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;