import { useState, useEffect, useRef } from "react";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Phone,
  Users,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { getAvatar, getGroupAvatar } from "../lib/avatar";

const GroupCallModal = () => {
  const {
    groupCallState,
    acceptGroupCall,
    rejectGroupCall,
    leaveGroupCall,
    toggleGroupCallMute,
    toggleGroupCallVideo,
  } = useChatStore();
  const { authUser } = useAuthStore();

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  const localVideoRef = useRef(null);
  const localStreamRef = useRef(null);

  const {
    isOpen,
    groupName,
    groupPic,
    callType,
    status,
    caller,
    participants = [],
  } = groupCallState;

  const isVideoCall = callType === "video";

  // Setup media stream when connected
  useEffect(() => {
    if (!isOpen || status !== "connected") {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
        localStreamRef.current = null;
      }
      return;
    }

    let isCancelled = false;

    const startMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: isVideoCall ? { width: { ideal: 640 }, height: { ideal: 480 } } : false,
        });

        if (isCancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        localStreamRef.current = stream;
        if (localVideoRef.current && isVideoCall) {
          localVideoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.warn("Could not get media stream for group call:", err);
      }
    };

    startMedia();

    return () => {
      isCancelled = true;
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
        localStreamRef.current = null;
      }
    };
  }, [isOpen, status, isVideoCall]);

  // Call duration timer
  useEffect(() => {
    let timer = null;
    if (status === "connected") {
      timer = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setCallDuration(0);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [status]);

  if (!isOpen) return null;

  const formatDuration = (secs) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins}:${rem < 10 ? "0" : ""}${rem}`;
  };

  const handleToggleMute = () => {
    const nextState = !isMuted;
    setIsMuted(nextState);
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !nextState;
      });
    }
    toggleGroupCallMute(nextState);
  };

  const handleToggleVideo = () => {
    const nextState = !isVideoOff;
    setIsVideoOff(nextState);
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = !nextState;
      });
    }
    toggleGroupCallVideo(nextState);
  };

  const groupAvatar = getGroupAvatar({ name: groupName, groupPic });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xl p-4 animate-fade-in">
      <div className="glass-panel w-full max-w-4xl h-[85vh] rounded-3xl bg-slate-950/95 border border-white/15 shadow-2xl animate-modal-pop flex flex-col overflow-hidden relative">
        {/* Ambient Glows */}
        <div className="absolute -top-24 -left-24 w-60 h-60 bg-sky-500/20 rounded-full blur-[90px] pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-60 h-60 bg-indigo-500/20 rounded-full blur-[90px] pointer-events-none" />

        {/* ================= INCOMING GROUP CALL VIEW ================= */}
        {status === "incoming" && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6">
            <div className="relative">
              <div className="size-28 rounded-full overflow-hidden border-4 border-sky-400 shadow-2xl animate-pulse">
                <img
                  src={groupAvatar}
                  alt={groupName}
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="absolute -bottom-1 -right-1 size-8 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center text-white shadow-lg">
                <Users className="size-4" />
              </span>
            </div>

            <div>
              <span className="px-3 py-1 rounded-full bg-sky-500/20 border border-sky-400/30 text-sky-300 font-bold text-xs uppercase tracking-wider inline-block mb-2">
                Incoming Group {isVideoCall ? "Video" : "Voice"} Call
              </span>
              <h2 className="text-2xl font-bold text-white tracking-tight">
                {groupName}
              </h2>
              <p className="text-sm text-white/60 mt-1">
                Started by <span className="text-white font-medium">{caller?.fullName || "Group Member"}</span>
              </p>
            </div>

            {/* Answer / Decline controls */}
            <div className="flex items-center gap-8 pt-6">
              <button
                onClick={rejectGroupCall}
                className="size-16 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-xl shadow-red-500/30 transition-transform hover:scale-110 active:scale-95"
                title="Decline"
              >
                <PhoneOff className="size-7" />
              </button>

              <button
                onClick={acceptGroupCall}
                className="size-16 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center shadow-xl shadow-emerald-500/30 transition-transform hover:scale-110 active:scale-95 animate-bounce"
                title="Join Call"
              >
                <Phone className="size-7" />
              </button>
            </div>
          </div>
        )}

        {/* ================= CONNECTED / CALLING VIEW ================= */}
        {status !== "incoming" && (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            {/* Top Bar */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between z-10 bg-black/40 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-full overflow-hidden border border-white/20">
                  <img
                    src={groupAvatar}
                    alt={groupName}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm tracking-tight flex items-center gap-2">
                    <span>{groupName}</span>
                    <span className="px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-400 text-[10px] font-semibold">
                      {participants.length} online
                    </span>
                  </h3>
                  <p className="text-xs text-white/50 flex items-center gap-1.5 mt-0.5">
                    <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>
                      {status === "calling"
                        ? "Calling group members..."
                        : formatDuration(callDuration)}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Multi-Participant Grid Stage */}
            <div className="flex-1 p-4 overflow-y-auto custom-scrollbar flex items-center justify-center">
              <div
                className={`w-full h-full grid gap-3 ${
                  participants.length <= 1
                    ? "grid-cols-1"
                    : participants.length === 2
                    ? "grid-cols-1 sm:grid-cols-2"
                    : "grid-cols-2 lg:grid-cols-3"
                }`}
              >
                {/* Local User Card */}
                <div className="relative rounded-2xl overflow-hidden bg-slate-900/90 border border-white/10 flex flex-col items-center justify-center shadow-lg group">
                  {isVideoCall && !isVideoOff ? (
                    <video
                      ref={localVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover scale-x-[-1]"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center p-6 space-y-3">
                      <div className="relative">
                        <img
                          src={getAvatar(authUser)}
                          alt={authUser?.fullName}
                          className="size-20 rounded-full object-cover border-2 border-white/20 shadow-xl"
                        />
                        {!isMuted && (
                          <span className="absolute inset-0 rounded-full border-2 border-emerald-400 animate-ping pointer-events-none opacity-40" />
                        )}
                      </div>
                      <span className="text-xs font-bold text-white flex items-center gap-1">
                        {authUser?.fullName} (You)
                      </span>
                    </div>
                  )}

                  {/* Status Overlay */}
                  <div className="absolute bottom-2.5 inset-x-2.5 flex items-center justify-between text-xs text-white/80 bg-black/60 backdrop-blur-md px-3 py-1 rounded-xl">
                    <span className="font-semibold text-[11px] truncate">You</span>
                    <div className="flex items-center gap-1.5">
                      {isMuted && <MicOff className="size-3.5 text-red-400" />}
                      {isVideoOff && <VideoOff className="size-3.5 text-amber-400" />}
                    </div>
                  </div>
                </div>

                {/* Remote Participants */}
                {participants
                  .filter((p) => p.user?._id !== authUser?._id)
                  .map((p, idx) => {
                    const participantAvatar = getAvatar(p.user);
                    return (
                      <div
                        key={p.socketId || idx}
                        className="relative rounded-2xl overflow-hidden bg-slate-900/90 border border-white/10 flex flex-col items-center justify-center shadow-lg group"
                      >
                        <div className="flex flex-col items-center justify-center p-6 space-y-3">
                          <div className="relative">
                            <img
                              src={participantAvatar}
                              alt={p.user?.fullName}
                              className="size-20 rounded-full object-cover border-2 border-white/20 shadow-xl"
                            />
                            {!p.isMuted && (
                              <span className="absolute inset-0 rounded-full border-2 border-emerald-400 animate-ping pointer-events-none opacity-40" />
                            )}
                          </div>
                          <span className="text-xs font-bold text-white text-center truncate max-w-[140px]">
                            {p.user?.fullName}
                          </span>
                        </div>

                        {/* Status Overlay */}
                        <div className="absolute bottom-2.5 inset-x-2.5 flex items-center justify-between text-xs text-white/80 bg-black/60 backdrop-blur-md px-3 py-1 rounded-xl">
                          <span className="font-semibold text-[11px] truncate">
                            {p.user?.fullName}
                          </span>
                          <div className="flex items-center gap-1.5">
                            {p.isMuted && <MicOff className="size-3.5 text-red-400" />}
                            {p.isVideoOff && (
                              <VideoOff className="size-3.5 text-amber-400" />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Bottom Controls Bar */}
            <div className="p-4 border-t border-white/10 bg-black/50 backdrop-blur-md flex items-center justify-center gap-5 z-10">
              {/* Mute Toggle */}
              <button
                onClick={handleToggleMute}
                className={`size-12 rounded-full flex items-center justify-center transition-all ${
                  isMuted
                    ? "bg-red-500/20 text-red-400 border border-red-500/30"
                    : "bg-white/10 text-white hover:bg-white/20"
                }`}
                title={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? <MicOff className="size-5" /> : <Mic className="size-5" />}
              </button>

              {/* Video Toggle */}
              {isVideoCall && (
                <button
                  onClick={handleToggleVideo}
                  className={`size-12 rounded-full flex items-center justify-center transition-all ${
                    isVideoOff
                      ? "bg-red-500/20 text-red-400 border border-red-500/30"
                      : "bg-white/10 text-white hover:bg-white/20"
                  }`}
                  title={isVideoOff ? "Turn video on" : "Turn video off"}
                >
                  {isVideoOff ? (
                    <VideoOff className="size-5" />
                  ) : (
                    <Video className="size-5" />
                  )}
                </button>
              )}

              {/* End / Leave Group Call */}
              <button
                onClick={leaveGroupCall}
                className="size-14 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-xl shadow-red-500/30 transition-transform hover:scale-105 active:scale-95"
                title="Leave Group Call"
              >
                <PhoneOff className="size-6" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GroupCallModal;
