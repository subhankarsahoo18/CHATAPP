import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import {
  LogOut,
  MessageSquare,
  Settings,
  User,
  Volume2,
  VolumeX,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { soundFx } from "../lib/audioSound";
import { getAvatar } from "../lib/avatar";

import { useChatStore } from "../store/useChatStore";

const Navbar = () => {
  const { logout, authUser } = useAuthStore();
  const { selectedUser } = useChatStore();
  const location = useLocation();
  const [isSoundOn, setIsSoundOn] = useState(soundFx.isSoundEnabled());

  const handleToggleSound = () => {
    const nextState = !isSoundOn;
    soundFx.setSoundEnabled(nextState);
    setIsSoundOn(nextState);
    if (nextState) {
      soundFx.playSentSound();
    }
  };

  const userAvatar = authUser ? getAvatar(authUser) : null;
  const isAuthPage = location.pathname === "/login" || location.pathname === "/signup";
  const isChatActiveOnMobile = Boolean(selectedUser && (location.pathname === "/" || location.pathname === "/chat"));

  return (
    <header
      className={`fixed top-0 w-full z-40 bg-slate-950/80 backdrop-blur-2xl border-b border-white/10 px-4 sm:px-8 py-3 justify-between items-center transition-all shadow-[0_4px_30px_rgba(0,0,0,0.5)] ${
        isChatActiveOnMobile ? "hidden md:flex" : "flex"
      }`}
    >
      {/* Brand logo */}
      <div className="flex items-center gap-6">
        <Link to="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity group">
          <div className="size-10 rounded-2xl bg-gradient-to-tr from-sky-500 via-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-[0_0_20px_rgba(56,189,248,0.35)] relative group-hover:scale-105 transition-transform">
            <MessageSquare className="size-5 z-10" />
            <div className="absolute inset-0 rounded-2xl bg-sky-400/25 blur-md" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-black bg-gradient-to-r from-sky-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent tracking-tight">
              Gupshup
            </span>
            <span className="text-[10px] text-white/40 font-semibold -mt-1 tracking-widest uppercase hidden sm:block">
              Messenger
            </span>
          </div>
        </Link>
      </div>

      {/* Nav Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Sound toggle button */}
        <button
          onClick={handleToggleSound}
          className={`p-2.5 rounded-xl border border-white/10 transition-all ${
            isSoundOn
              ? "bg-white/5 text-sky-400 hover:bg-white/10"
              : "bg-white/5 text-white/40 hover:bg-white/10"
          }`}
          title={isSoundOn ? "Sound chimes on (click to mute)" : "Sound chimes muted (click to unmute)"}
        >
          {isSoundOn ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
        </button>

        {/* Settings */}
        <Link
          to="/settings"
          className={`flex items-center gap-2 transition-all p-2.5 sm:px-3 sm:py-2 rounded-xl border ${
            location.pathname === "/settings"
              ? "bg-white/15 text-white border-white/20 shadow-sm"
              : "text-white/70 hover:text-white hover:bg-white/10 border-transparent hover:border-white/5"
          }`}
          title="Settings"
        >
          <Settings className="size-4" />
          <span className="hidden sm:inline font-semibold text-xs">Settings</span>
        </Link>

        {/* Authenticated Controls */}
        {authUser ? (
          <>
            {/* Profile */}
            <Link
              to="/profile"
              className={`flex items-center gap-2.5 transition-all p-1.5 sm:px-3 sm:py-1.5 rounded-xl border ${
                location.pathname === "/profile"
                  ? "bg-white/15 text-white border-white/20 shadow-sm"
                  : "text-white/70 hover:text-white hover:bg-white/10 border-transparent hover:border-white/5"
              }`}
              title="Profile"
            >
              <div className="size-7 rounded-full overflow-hidden border border-white/20 shadow-sm flex-shrink-0 relative">
                <img
                  src={userAvatar}
                  alt={authUser.fullName}
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="hidden sm:inline font-semibold text-xs max-w-[100px] truncate">
                {authUser.fullName.split(" ")[0]}
              </span>
            </Link>

            {/* Logout */}
            <button
              className="flex items-center gap-1.5 text-white/60 hover:text-red-400 transition-colors p-2.5 sm:px-3 sm:py-2 rounded-xl hover:bg-red-500/10 border border-transparent hover:border-red-500/20 cursor-pointer"
              onClick={logout}
              title="Sign out"
            >
              <LogOut className="size-4" />
              <span className="hidden sm:inline font-semibold text-xs">Logout</span>
            </button>
          </>
        ) : (
          /* Unauthenticated Navigation Links */
          <div className="flex items-center gap-2">
            {location.pathname !== "/login" && (
              <Link
                to="/login"
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-white/80 hover:text-white hover:bg-white/10 border border-transparent hover:border-white/10 transition-all"
              >
                Sign In
              </Link>
            )}

            {location.pathname !== "/signup" && (
              <Link
                to="/signup"
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-sky-500/20 transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5"
              >
                <span>Get Started</span>
                <ArrowRight className="size-3.5" />
              </Link>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;