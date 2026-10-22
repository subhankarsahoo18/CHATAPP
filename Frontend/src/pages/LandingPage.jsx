import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
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
  ArrowRight,
  Check,
  CheckCheck,
  Play,
  Pause,
  Crown,
  Trash2,
  Smile,
  ChevronDown,
  Globe,
  Radio,
  Layers,
  Heart,
  Volume2,
} from "lucide-react";
import { soundFx } from "../lib/audioSound";

const LandingPage = () => {
  const { authUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState("groups"); // "groups" | "calls" | "voicenotes" | "deletion"
  const [isWavePlaying, setIsWavePlaying] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const handleTestAudio = () => {
    soundFx.resume();
    setIsWavePlaying(!isWavePlaying);
    if (!isWavePlaying) {
      soundFx.playReceivedSound();
    }
  };

  const FAQS = [
    {
      q: "How does group chatting and calling work on Gupshup?",
      a: "You can create custom group chats with friends or colleagues, assign group administrators, customize group avatars, and initiate instant multi-participant voice or video calls with responsive grid layouts.",
    },
    {
      q: "Can I delete messages for everyone like in WhatsApp?",
      a: "Yes! Gupshup features WhatsApp-style message deletion. You can choose 'Delete for me' to remove messages strictly from your view, or 'Delete for everyone' (if you are the sender) to retract the message for all participants in real time.",
    },
    {
      q: "Are voice notes and audio calls compatible with mobile browsers?",
      a: "Absolutely. Gupshup is built with adaptive WebM and Opus audio processing, HTML5 audio buffering, and WebRTC peer streaming that works smoothly on mobile, tablet, and desktop devices.",
    },
    {
      q: "Is Gupshup secure and private?",
      a: "All conversations and calls are transmitted through secure real-time WebSockets and peer-to-peer WebRTC channels with JWT token authentication, ensuring your messages remain private between you and your contacts.",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white relative overflow-hidden pt-16 select-none">
      {/* Background Ambient Radial Glows */}
      <div className="absolute top-[5%] left-[20%] w-[600px] h-[600px] bg-sky-500/12 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute top-[35%] right-[10%] w-[500px] h-[500px] bg-indigo-600/12 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[10%] left-[10%] w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[160px] pointer-events-none" />

      {/* Grid Pattern Texture Overlay */}
      <div
        className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
          backgroundSize: "32px 32px",
        }}
      />

      {/* ================= 1. HERO SECTION ================= */}
      <section className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pt-12 sm:pt-20 pb-16 text-center space-y-8">
        {/* Launch Announcement Pill */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md shadow-lg animate-fade-in hover:bg-white/10 transition-colors cursor-pointer">
          <span className="size-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-xs font-semibold text-white/80">
            Gupshup 2.0 Live • WhatsApp-Style Groups, HD WebRTC Calls & Voice Memos
          </span>
          <ArrowRight className="size-3 text-sky-400" />
        </div>

        {/* Hero Title */}
        <div className="space-y-4 max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.1]">
            Fast, Secure & Modern{" "}
            <span className="bg-gradient-to-r from-sky-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
              Real-Time Messaging
            </span>
          </h1>
          <p className="text-base sm:text-xl text-white/60 max-w-2xl mx-auto leading-relaxed font-normal">
            Connect through direct conversations, multi-participant group chats, crystal-clear audio & video calls, and voice notes. Built for seamless communication.
          </p>
        </div>

        {/* Hero CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
          {authUser ? (
            <Link
              to="/"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-sky-500 via-indigo-600 to-purple-600 hover:from-sky-400 hover:via-indigo-500 hover:to-purple-500 text-white font-extrabold text-sm sm:text-base shadow-xl shadow-sky-500/25 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
            >
              <span>Open Chat Dashboard</span>
              <ArrowRight className="size-4" />
            </Link>
          ) : (
            <>
              <Link
                to="/signup"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-sky-500 via-indigo-600 to-purple-600 hover:from-sky-400 hover:via-indigo-500 hover:to-purple-500 text-white font-extrabold text-sm sm:text-base shadow-xl shadow-sky-500/25 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
              >
                <span>Start Chatting Free</span>
                <ArrowRight className="size-4" />
              </Link>
              <Link
                to="/login"
                className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-sm sm:text-base backdrop-blur-md transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
              >
                <span>Sign In to Web</span>
              </Link>
            </>
          )}
        </div>

        {/* Trust Points */}
        <div className="flex flex-wrap items-center justify-center gap-6 pt-4 text-xs font-semibold text-white/50">
          <div className="flex items-center gap-1.5">
            <Check className="size-4 text-emerald-400" />
            <span>100% Free & Open</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Lock className="size-4 text-sky-400" />
            <span>End-to-End Transport Encrypted</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Zap className="size-4 text-amber-400" />
            <span>Sub-Second Socket Delivery</span>
          </div>
        </div>

        {/* ================= HERO APP PREVIEW SHOWCASE ================= */}
        <div className="pt-10 max-w-5xl mx-auto">
          <div className="rounded-3xl border border-white/15 p-2 sm:p-3 bg-slate-900/40 backdrop-blur-2xl shadow-[0_20px_80px_rgba(0,0,0,0.8)] relative group">
            {/* Top Gloss Reflection */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />

            {/* Inner App Window Mockup */}
            <div className="rounded-2xl bg-slate-950 border border-white/10 overflow-hidden text-left flex flex-col md:flex-row h-[480px]">
              {/* Sidebar Preview */}
              <div className="w-full md:w-80 border-r border-white/10 bg-slate-900/60 p-3 flex flex-col justify-between hidden md:flex">
                <div className="space-y-3">
                  <div className="flex items-center justify-between px-2 pt-1">
                    <span className="font-extrabold text-sm text-white flex items-center gap-2">
                      <MessageSquare className="size-4 text-sky-400" /> Chats
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                      Online
                    </span>
                  </div>

                  <div className="space-y-1">
                    {/* Item 1: Active Group */}
                    <div className="p-2.5 rounded-xl bg-white/15 border border-white/10 flex items-center gap-2.5 cursor-pointer">
                      <div className="size-10 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xs font-bold shadow relative flex-shrink-0">
                        <Users className="size-4" />
                        <span className="absolute bottom-0 right-0 size-2.5 bg-emerald-400 rounded-full ring-2 ring-slate-950" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-white truncate">Engineering & Core</span>
                          <span className="text-[10px] text-white/40">10:42 AM</span>
                        </div>
                        <p className="text-[11px] text-sky-300 truncate mt-0.5">
                          Priya: Updated group call signaling! 🚀
                        </p>
                      </div>
                    </div>

                    {/* Item 2 */}
                    <div className="p-2.5 rounded-xl hover:bg-white/5 flex items-center gap-2.5 opacity-80 cursor-pointer">
                      <div className="size-10 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        SJ
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-white truncate">Sarah Jenkins</span>
                          <span className="text-[10px] text-white/40">Yesterday</span>
                        </div>
                        <p className="text-[11px] text-white/50 truncate mt-0.5 flex items-center gap-1">
                          <Mic className="size-3 text-indigo-400" /> Voice message (0:18)
                        </p>
                      </div>
                    </div>

                    {/* Item 3 */}
                    <div className="p-2.5 rounded-xl hover:bg-white/5 flex items-center gap-2.5 opacity-70 cursor-pointer">
                      <div className="size-10 rounded-full bg-gradient-to-tr from-purple-500 to-pink-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        DC
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-white truncate">David Chen</span>
                          <span className="text-[10px] text-white/40">Oct 20</span>
                        </div>
                        <p className="text-[11px] text-white/50 truncate mt-0.5">
                          Sent a photo attachment
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-2 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between text-xs text-white/60">
                  <div className="flex items-center gap-2">
                    <div className="size-2 rounded-full bg-emerald-400" />
                    <span>Socket Connected</span>
                  </div>
                  <span className="font-mono text-[10px]">v2.0</span>
                </div>
              </div>

              {/* Chat Feed Area Preview */}
              <div className="flex-1 flex flex-col justify-between bg-slate-950/80 p-4">
                {/* Chat Header */}
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white">
                      <Users className="size-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm flex items-center gap-1.5">
                        <span>Engineering & Core</span>
                        <Crown className="size-3 text-amber-400" />
                      </h4>
                      <p className="text-[11px] text-white/50">4 participants • Priya, Alex, Subhankar, David</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-white/70">
                    <button
                      type="button"
                      onClick={handleTestAudio}
                      className="p-2 rounded-full bg-sky-500/20 text-sky-400 hover:bg-sky-500/30 transition-colors"
                      title="Test Audio Chime"
                    >
                      <Volume2 className="size-4" />
                    </button>
                    <div className="p-2 rounded-full bg-white/5 text-sky-400">
                      <Phone className="size-4" />
                    </div>
                    <div className="p-2 rounded-full bg-white/5 text-indigo-400">
                      <Video className="size-4" />
                    </div>
                  </div>
                </div>

                {/* Simulated Conversation Feed */}
                <div className="space-y-3 py-3 overflow-hidden text-xs">
                  {/* Incoming Group Message 1 */}
                  <div className="flex items-start gap-2 max-w-[85%]">
                    <div className="size-7 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-[10px] flex-shrink-0">
                      PS
                    </div>
                    <div className="p-3 rounded-2xl rounded-tl-sm bg-[var(--color-surface-container-high)] text-white/90 border border-white/10 shadow-sm space-y-1">
                      <span className="text-[10px] font-bold text-emerald-400 block">Priya Sharma</span>
                      <p>Hey team! Testing the new audio & video calling update. Anyone free for a quick mesh call?</p>
                      <div className="flex justify-between items-center text-[10px] text-white/40 pt-0.5">
                        <span>10:41 AM</span>
                        <span className="text-xs">👍 ❤️</span>
                      </div>
                    </div>
                  </div>

                  {/* Outgoing Voice Note */}
                  <div className="flex justify-end">
                    <div className="p-3 rounded-2xl rounded-tr-sm bg-gradient-to-br from-sky-500 to-indigo-600 text-white shadow-lg space-y-1.5 max-w-[85%]">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={handleTestAudio}
                          className="size-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white flex-shrink-0"
                        >
                          {isWavePlaying ? (
                            <Pause className="size-3.5" />
                          ) : (
                            <Play className="size-3.5 translate-x-0.5 fill-current" />
                          )}
                        </button>
                        <div className="flex items-center gap-1 h-5">
                          {[14, 22, 10, 26, 18, 30, 16, 24, 12, 28, 14, 8, 20].map((h, i) => (
                            <span
                              key={i}
                              className={`w-1 rounded-full ${
                                isWavePlaying ? "bg-emerald-300 animate-pulse" : "bg-white/80"
                              }`}
                              style={{ height: `${h}px` }}
                            />
                          ))}
                        </div>
                        <span className="text-[11px] font-mono text-white/90">0:24</span>
                      </div>
                      <div className="flex justify-end items-center gap-1 text-[10px] text-white/70">
                        <span>10:42 AM</span>
                        <CheckCheck className="size-3 text-sky-200" />
                      </div>
                    </div>
                  </div>

                  {/* Retracted / WhatsApp Deleted Message indicator */}
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-white/5 border border-white/10 text-white/50 text-[11px] italic max-w-xs">
                    <Trash2 className="size-3.5 text-white/40" />
                    <span>This message was deleted</span>
                  </div>
                </div>

                {/* Simulated Input Bar */}
                <div className="pt-2 border-t border-white/10 flex items-center gap-2">
                  <div className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white/40 text-xs flex items-center justify-between">
                    <span>Type a message to the group...</span>
                    <Smile className="size-4 text-white/30" />
                  </div>
                  <div className="size-9 rounded-xl bg-sky-500 flex items-center justify-center text-slate-950 font-bold">
                    <Mic className="size-4" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= 2. FOUR PILLARS FEATURE SHOWCASE ================= */}
      <section className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24 border-t border-white/10">
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
          <span className="text-xs font-bold uppercase tracking-widest text-sky-400">
            Engineered for Modern Conversations
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Every feature you expect from modern chat apps.
          </h2>
          <p className="text-sm text-white/50 leading-relaxed">
            Inspired by WhatsApp and Telegram, Gupshup delivers uncompromising speed, group organization, and media capabilities.
          </p>
        </div>

        {/* 4 Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Feature 1: Groups */}
          <div className="p-7 rounded-3xl glass-panel bg-slate-900/50 border border-white/10 shadow-xl space-y-4 hover:border-emerald-500/30 transition-all group">
            <div className="size-12 rounded-2xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
              <Users className="size-6" />
            </div>
            <h3 className="text-xl font-bold text-white tracking-tight">
              WhatsApp-Style Groups & Admin Roles
            </h3>
            <p className="text-xs sm:text-sm text-white/60 leading-relaxed">
              Create multi-member groups with custom titles and avatars. Manage members with Group Admin privileges, add new contacts, promote or demote admins, and track unread group message badges.
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold">
                Admin Badges
              </span>
              <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/70 text-xs font-semibold">
                Sender Pastel Colors
              </span>
              <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/70 text-xs font-semibold">
                Group Typing Alerts
              </span>
            </div>
          </div>

          {/* Feature 2: Calling */}
          <div className="p-7 rounded-3xl glass-panel bg-slate-900/50 border border-white/10 shadow-xl space-y-4 hover:border-sky-500/30 transition-all group">
            <div className="size-12 rounded-2xl bg-sky-500/15 text-sky-400 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
              <Video className="size-6" />
            </div>
            <h3 className="text-xl font-bold text-white tracking-tight">
              HD WebRTC Audio & Video Calling
            </h3>
            <p className="text-xs sm:text-sm text-white/60 leading-relaxed">
              Experience peer-to-peer 1-on-1 calls and multi-participant group calling directly in your browser. Features live microphone visualizer bars, camera toggles, and musical incoming ringtones.
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              <span className="px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-300 text-xs font-semibold">
                Multi-User Video Grid
              </span>
              <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/70 text-xs font-semibold">
                Live Equalizer
              </span>
              <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/70 text-xs font-semibold">
                Screen & Mute Controls
              </span>
            </div>
          </div>

          {/* Feature 3: Voice Notes */}
          <div className="p-7 rounded-3xl glass-panel bg-slate-900/50 border border-white/10 shadow-xl space-y-4 hover:border-indigo-500/30 transition-all group">
            <div className="size-12 rounded-2xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
              <Mic className="size-6" />
            </div>
            <h3 className="text-xl font-bold text-white tracking-tight">
              Interactive Voice Notes & Waveforms
            </h3>
            <p className="text-xs sm:text-sm text-white/60 leading-relaxed">
              Record voice memos with timeslice buffering, audio transcoding, and interactive waveforms. Scrub through audio tracks, adjust playback rates, and share voice recordings instantly.
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              <span className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold">
                Waveform Scrubber
              </span>
              <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/70 text-xs font-semibold">
                Opus Codec Support
              </span>
              <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/70 text-xs font-semibold">
                Playback Speed
              </span>
            </div>
          </div>

          {/* Feature 4: Deletion & Reactions */}
          <div className="p-7 rounded-3xl glass-panel bg-slate-900/50 border border-white/10 shadow-xl space-y-4 hover:border-purple-500/30 transition-all group">
            <div className="size-12 rounded-2xl bg-purple-500/15 text-purple-400 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
              <Trash2 className="size-6" />
            </div>
            <h3 className="text-xl font-bold text-white tracking-tight">
              Delete for Me vs. Delete for Everyone
            </h3>
            <p className="text-xs sm:text-sm text-white/60 leading-relaxed">
              Full control over your chat history. Choose between deleting messages only for yourself or retracting them for both participants with a standard retracted placeholder and attachment purge.
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              <span className="px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold">
                Quick Emoji Reactions
              </span>
              <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/70 text-xs font-semibold">
                Reply Quoting
              </span>
              <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/70 text-xs font-semibold">
                Image Lightbox
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ================= 3. FAQ SECTION ================= */}
      <section className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-16 border-t border-white/10">
        <div className="text-center space-y-3 mb-10">
          <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">
            Got Questions?
          </span>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl glass-panel bg-slate-900/60 border border-white/10 overflow-hidden transition-all"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(idx)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-sm sm:text-base text-white hover:text-sky-300 transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`size-4 text-white/50 transition-transform duration-300 flex-shrink-0 ${
                      isOpen ? "rotate-180 text-sky-400" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-xs sm:text-sm text-white/60 leading-relaxed border-t border-white/5 pt-3 animate-fade-in">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ================= 4. BOTTOM FINAL CTA ================= */}
      <section className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-20 text-center">
        <div className="glass-panel p-8 sm:p-14 rounded-3xl bg-gradient-to-br from-slate-900/90 via-slate-950 to-indigo-950/60 border border-white/15 shadow-2xl relative overflow-hidden">
          {/* Inner Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-sky-500/20 rounded-full blur-[100px] pointer-events-none" />

          <div className="relative z-10 space-y-6 max-w-xl mx-auto">
            <div className="size-14 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white mx-auto shadow-[0_0_25px_rgba(56,189,248,0.4)]">
              <MessageSquare className="size-7" />
            </div>

            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Ready to experience modern chatting?
            </h2>
            <p className="text-sm text-white/60 leading-relaxed">
              Create your account in seconds, start chatting with friends, or invite members to group discussions and calls.
            </p>

            <div className="pt-2">
              <Link
                to={authUser ? "/" : "/signup"}
                className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-sky-500 via-indigo-600 to-purple-600 hover:from-sky-400 hover:via-indigo-500 hover:to-purple-500 text-white font-extrabold text-sm sm:text-base shadow-xl shadow-sky-500/25 transition-all hover:scale-105 active:scale-95"
              >
                <span>{authUser ? "Open Gupshup Messenger" : "Create Free Account"}</span>
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ================= 5. FOOTER ================= */}
      <footer className="relative z-10 border-t border-white/10 py-8 px-4 sm:px-8 text-center text-xs text-white/40">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="size-6 rounded-lg bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white">
              <MessageSquare className="size-3.5" />
            </div>
            <span className="font-bold text-white/80">Gupshup Messenger</span>
            <span>• Built for modern conversations</span>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/settings" className="hover:text-white transition-colors">
              Sound & Themes
            </Link>
            <span>•</span>
            <span className="text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="size-3.5" /> Encrypted WebSockets
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
