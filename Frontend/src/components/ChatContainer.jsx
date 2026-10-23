import { useEffect, useRef, useState, useMemo } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { formatMessageTime, isSameDay, formatDateSeparator } from "../lib/util";
import { getAvatar, getGroupAvatar, getSenderColor } from "../lib/avatar";
import {
  Check,
  CheckCheck,
  Play,
  Pause,
  Reply,
  Copy,
  Trash2,
  Smile,
  ZoomIn,
  Ban,
} from "lucide-react";
import toast from "react-hot-toast";

import { soundFx } from "../lib/audioSound";

const QUICK_EMOJIS = ["❤️", "👍", "😂", "😮", "😢", "🔥"];

/* ================= VOICE MESSAGE PLAYER ================= */
const VoiceMessagePlayer = ({ audioUrl, duration = 0, isMine }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(duration || 0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const audioRef = useRef(null);

  // Sanitize data URI if it still contains codecs parameter
  const cleanAudioUrl =
    typeof audioUrl === "string" ? audioUrl.replace(/;codecs=[^;]+/, "") : audioUrl;

  const togglePlay = () => {
    if (!audioRef.current) return;
    soundFx.resume();

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      // Pause any other voice notes playing simultaneously
      document.querySelectorAll("audio").forEach((el) => {
        if (el !== audioRef.current) {
          el.pause();
        }
      });

      audioRef.current.volume = 1.0;
      audioRef.current.muted = false;
      audioRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch((err) => {
          console.warn("Voice message playback failed:", err);
          toast.error("Tap screen to allow audio playback");
          setIsPlaying(false);
        });
    }
  };

  const handleSeek = (percentage) => {
    if (!audioRef.current) return;
    const dur = totalDuration || audioRef.current.duration || duration || 5;
    const seekTime = (percentage / 100) * dur;
    audioRef.current.currentTime = seekTime;
    setCurrentTime(seekTime);
  };

  const toggleSpeed = () => {
    if (!audioRef.current) return;
    const rates = [1, 1.5, 2];
    const nextIdx = (rates.indexOf(playbackRate) + 1) % rates.length;
    const nextRate = rates[nextIdx];
    audioRef.current.playbackRate = nextRate;
    setPlaybackRate(nextRate);
  };

  const formatSecs = (secs) => {
    const s = Math.round(secs);
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return `${m}:${rem < 10 ? "0" : ""}${rem}`;
  };

  const effectiveDuration = totalDuration || duration || 0;
  const progress = effectiveDuration > 0 ? Math.min(100, (currentTime / effectiveDuration) * 100) : 0;
  const waveformHeights = [6, 14, 9, 18, 22, 16, 20, 11, 24, 15, 10, 19, 21, 12, 8, 14, 18, 9];

  return (
    <div className="flex items-center gap-3 py-1 min-w-[230px] sm:min-w-[270px]">
      <audio
        ref={audioRef}
        src={cleanAudioUrl}
        preload="auto"
        onLoadedMetadata={(e) => {
          const d = e.target.duration;
          if (d && !isNaN(d) && isFinite(d) && d > 0) {
            setTotalDuration(Math.round(d));
          }
        }}
        onTimeUpdate={() => {
          const cur = audioRef.current?.currentTime || 0;
          setCurrentTime(cur);
          const d = audioRef.current?.duration;
          if (d && !isNaN(d) && isFinite(d) && d > 0 && !totalDuration) {
            setTotalDuration(Math.round(d));
          } else if (cur > effectiveDuration) {
            setTotalDuration(Math.ceil(cur));
          }
        }}
        onEnded={() => {
          setIsPlaying(false);
          setCurrentTime(0);
        }}
        onError={(e) => {
          console.warn("Audio element error:", audioRef.current?.error, e);
        }}
      />

      {/* Play / Pause button */}
      <button
        type="button"
        onClick={togglePlay}
        className={`size-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-md transition-all ${
          isMine
            ? "bg-white/20 hover:bg-white/30 text-white"
            : "bg-sky-500/20 text-sky-400 hover:bg-sky-500/30"
        }`}
        title={isPlaying ? "Pause" : "Play voice note"}
      >
        {isPlaying ? (
          <Pause className="size-4" />
        ) : (
          <Play className="size-4 translate-x-0.5 fill-current" />
        )}
      </button>

      {/* Waveform Visualization with Clickable Seeking */}
      <div className="flex-1 flex flex-col justify-center gap-1.5 min-w-0">
        <div
          className="flex items-center gap-1 h-6 cursor-pointer py-1"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const pct = Math.max(0, Math.min(100, (clickX / rect.width) * 100));
            handleSeek(pct);
          }}
          title="Click to seek"
        >
          {waveformHeights.map((h, i) => {
            const barPct = ((i + 1) / waveformHeights.length) * 100;
            const isFilled = progress >= barPct;
            return (
              <div
                key={i}
                className={`flex-1 rounded-full transition-all duration-150 ${
                  isFilled
                    ? isMine
                      ? "bg-white"
                      : "bg-sky-400"
                    : isMine
                    ? "bg-white/30 hover:bg-white/50"
                    : "bg-white/20 hover:bg-white/40"
                } ${isPlaying && isFilled ? "scale-y-110" : ""}`}
                style={{ height: `${h}px` }}
              />
            );
          })}
        </div>

        <div className="flex items-center justify-between text-[10px] text-white/70 font-mono">
          <span>{formatSecs(currentTime)}</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleSpeed}
              className="px-1.5 py-0.2 rounded bg-black/30 hover:bg-black/50 text-[9px] font-bold text-sky-300"
              title="Change playback speed"
            >
              {playbackRate}x
            </button>
            <span>{formatSecs(totalDuration || duration || 0)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ================= MAIN CHAT CONTAINER ================= */
const ChatContainer = () => {
  const {
    messages,
    getMessages,
    isMessagesLoading,
    selectedUser,
    subscribeToMessages,
    unsubscribeFromMessages,
    typingUsers,
    groupTypingUsers,
    toggleReaction,
    deleteMessage,
    setReplyingTo,
    setLightboxImage,
    searchInChatQuery,
  } = useChatStore();

  const { authUser, socket } = useAuthStore();
  const messageEndRef = useRef(null);
  const [activeReactionMenu, setActiveReactionMenu] = useState(null);
  const [deleteModalMessage, setDeleteModalMessage] = useState(null);

  const isGroup = Boolean(selectedUser?.isGroup || selectedUser?.members);
  const isTyping = !isGroup && typingUsers[selectedUser?._id];
  const currentGroupTypers = isGroup ? groupTypingUsers[selectedUser?._id] || {} : {};
  const groupTypingNames = Object.values(currentGroupTypers);

  useEffect(() => {
    if (selectedUser?._id) {
      getMessages(selectedUser._id);
    }
  }, [selectedUser?._id, getMessages]);

  useEffect(() => {
    if (messageEndRef.current && messages) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }

    if (messages && messages.length > 0 && socket && selectedUser) {
      const hasUnread = messages.some(
        (m) => m.senderId === selectedUser._id && m.status !== "read"
      );
      if (hasUnread) {
        socket.emit("markMessagesAsRead", { senderId: selectedUser._id });
      }
    }
  }, [messages, selectedUser, socket]);

  // Filter messages by search query if user is searching in chat
  const filteredMessages = useMemo(() => {
    if (!searchInChatQuery || !searchInChatQuery.trim()) return messages;
    const q = searchInChatQuery.toLowerCase();
    return messages.filter(
      (m) => m.text && m.text.toLowerCase().includes(q)
    );
  }, [messages, searchInChatQuery]);

  const handleCopyText = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  if (isMessagesLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden bg-transparent">
        <ChatHeader />
        <MessageSkeleton />
        <MessageInput />
      </div>
    );
  }

  const selectedUserAvatar = getAvatar(selectedUser);
  const authUserAvatar = getAvatar(authUser);

  return (
    <div className="flex-1 flex flex-col overflow-hidden relative bg-transparent">
      {/* Ambient background glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[25%] left-[15%] w-[450px] h-[450px] bg-sky-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[20%] right-[15%] w-[450px] h-[450px] bg-indigo-500/5 rounded-full blur-[120px]" />
      </div>

      <ChatHeader />

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 custom-scrollbar relative z-10">
        {filteredMessages.length === 0 && searchInChatQuery && (
          <div className="text-center py-12 text-white/50 text-xs font-medium">
            No messages found matching &quot;{searchInChatQuery}&quot;
          </div>
        )}

        {filteredMessages.map((message, idx) => {
          const senderObj = typeof message.senderId === "object" ? message.senderId : null;
          const msgSenderId = senderObj?._id || message.senderId;
          const isMine = msgSenderId === authUser?._id;
          const senderUser = senderObj;
          const otherAvatar = isGroup
            ? getAvatar(senderUser || { fullName: "Member" })
            : selectedUserAvatar;
          const senderColor = getSenderColor(msgSenderId);

          const prevMessage = filteredMessages[idx - 1];
          const nextMessage = filteredMessages[idx + 1];
          const prevSenderId = typeof prevMessage?.senderId === "object" ? prevMessage.senderId._id : prevMessage?.senderId;
          const nextSenderId = typeof nextMessage?.senderId === "object" ? nextMessage.senderId._id : nextMessage?.senderId;

          // Check if day changed between previous and current message
          const showDateSeparator =
            !prevMessage || !isSameDay(prevMessage.createdAt, message.createdAt);

          // Check if grouped with previous message
          const isConsecutive =
            prevMessage &&
            prevSenderId === msgSenderId &&
            !showDateSeparator &&
            new Date(message.createdAt) - new Date(prevMessage.createdAt) < 120000;

          // Check if last in consecutive group
          const isLastInGroup =
            !nextMessage ||
            nextSenderId !== msgSenderId ||
            !isSameDay(message.createdAt, nextMessage.createdAt);

          return (
            <div key={message._id} className="flex flex-col">
              {/* Day separator pill */}
              {showDateSeparator && (
                <div className="flex justify-center my-4">
                  <div className="px-3.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-[11px] font-semibold text-white/70 shadow-sm">
                    {formatDateSeparator(message.createdAt)}
                  </div>
                </div>
              )}

              <div
                className={`flex items-end gap-2 group relative ${
                  isMine ? "justify-end" : "justify-start"
                } ${isConsecutive ? "mt-1" : "mt-3"}`}
              >
                {/* Other User Avatar */}
                {!isMine && (
                  <div className="size-8 rounded-full overflow-hidden flex-shrink-0 border border-white/10 shadow-sm mb-1">
                    {isLastInGroup ? (
                      <img
                        src={otherAvatar}
                        alt={senderUser?.fullName || selectedUser.fullName || "Member"}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full" />
                    )}
                  </div>
                )}

                {/* Message Bubble + Action Bar Container */}
                <div className={`relative max-w-[85%] sm:max-w-[70%] flex flex-col ${isMine ? "items-end" : "items-start"}`}>
                  {/* Hover Action Toolbar (only for active messages) */}
                  {!message.isDeleted && (
                    <div
                      className={`
                        absolute -top-8 z-20 hidden group-hover:flex items-center gap-1
                        px-2 py-1 rounded-full bg-slate-900/90 border border-white/15 backdrop-blur-md shadow-xl
                        ${isMine ? "right-0" : "left-0"}
                      `}
                    >
                      {/* Emoji Reaction Trigger */}
                      <div className="relative">
                        <button
                          onClick={() =>
                            setActiveReactionMenu(
                              activeReactionMenu === message._id ? null : message._id
                            )
                          }
                          className="p-1 rounded-full hover:bg-white/10 text-white/70 hover:text-white"
                          title="React"
                        >
                          <Smile className="size-3.5" />
                        </button>

                        {/* Emoji quick popup */}
                        {activeReactionMenu === message._id && (
                          <div className="absolute bottom-full mb-1 left-0 flex items-center gap-1 p-1.5 rounded-full bg-slate-950/95 border border-white/20 shadow-2xl z-30 animate-modal-pop">
                            {QUICK_EMOJIS.map((emoji) => (
                              <button
                                key={emoji}
                                onClick={() => {
                                  toggleReaction(message._id, emoji);
                                  setActiveReactionMenu(null);
                                }}
                                className="size-7 rounded-full hover:bg-white/15 text-base flex items-center justify-center transition-transform hover:scale-125"
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Reply button */}
                      <button
                        onClick={() => setReplyingTo(message)}
                        className="p-1 rounded-full hover:bg-white/10 text-white/70 hover:text-white"
                        title="Reply"
                      >
                        <Reply className="size-3.5" />
                      </button>

                      {/* Copy button */}
                      {message.text && (
                        <button
                          onClick={() => handleCopyText(message.text)}
                          className="p-1 rounded-full hover:bg-white/10 text-white/70 hover:text-white"
                          title="Copy text"
                        >
                          <Copy className="size-3.5" />
                        </button>
                      )}

                      {/* Delete button (opens WhatsApp style modal) */}
                      <button
                        onClick={() =>
                          setDeleteModalMessage({
                            _id: message._id,
                            isMine,
                          })
                        }
                        className="p-1 rounded-full hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors"
                        title={isMine ? "Delete message" : "Delete for me"}
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Speech Bubble */}
                  <div
                    className={`
                      px-4 py-2.5 rounded-2xl shadow-lg relative transition-all
                      ${
                        isMine
                          ? "bg-gradient-to-br from-sky-500 to-indigo-600 text-white rounded-br-sm shadow-[0_4px_20px_rgba(56,189,248,0.2)]"
                          : "bg-[var(--color-surface-container-high)] text-white/90 rounded-bl-sm border border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.15)]"
                      }
                      ${message.isDeleted ? "opacity-60 italic" : ""}
                    `}
                  >
                    {/* Sender name for group chats */}
                    {isGroup && !isMine && !message.isDeleted && senderUser && (
                      <span className={`text-[11px] font-bold ${senderColor} block mb-1 tracking-tight`}>
                        {senderUser.fullName}
                      </span>
                    )}

                    {/* Reply Quote inside message */}
                    {message.replyTo && (
                      <div
                        className={`mb-2 p-2 rounded-lg border-l-2 text-xs flex flex-col ${
                          isMine
                            ? "bg-black/20 border-white text-white/90"
                            : "bg-white/5 border-sky-400 text-white/80"
                        }`}
                      >
                        <span className="font-bold text-[10px] text-sky-300 uppercase">
                          Replying to
                        </span>
                        <p className="truncate line-clamp-1 mt-0.5">
                          {message.replyTo.text || (message.replyTo.image ? "📷 Photo" : "🎙️ Voice note")}
                        </p>
                      </div>
                    )}

                    {/* Image Attachment */}
                    {message.image && !message.isDeleted && (
                      <div
                        onClick={() => setLightboxImage(message.image)}
                        className="relative group/img cursor-pointer rounded-xl overflow-hidden mb-2 max-w-[280px] sm:max-w-[340px] border border-white/10 shadow-md"
                      >
                        <img
                          src={message.image}
                          alt="Attachment"
                          className="w-full h-auto object-cover group-hover/img:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/img:opacity-100 flex items-center justify-center text-white transition-opacity">
                          <ZoomIn className="size-6" />
                        </div>
                      </div>
                    )}

                    {/* Voice Audio Message */}
                    {message.audio && !message.isDeleted && (
                      <VoiceMessagePlayer
                        audioUrl={message.audio}
                        duration={message.audioDuration}
                        isMine={isMine}
                      />
                    )}

                    {/* Text Message or Deleted Message Pill */}
                    {message.isDeleted ? (
                      <div className="flex items-center gap-1.5 italic text-white/55 text-[13.5px] py-0.5 select-none">
                        <Ban className="size-3.5 text-white/40 flex-shrink-0" />
                        <span>{isMine ? "You deleted this message" : "This message was deleted"}</span>
                      </div>
                    ) : (
                      message.text && (
                        <p className="text-[14.5px] leading-relaxed break-words whitespace-pre-wrap select-text">
                          {message.text}
                        </p>
                      )
                    )}

                    {/* Meta Time & Status Checkmarks */}
                    <div
                      className={`flex items-center gap-1.5 mt-1 text-[10px] font-medium ${
                        isMine ? "justify-end text-white/70" : "justify-start text-white/50"
                      }`}
                    >
                      <span>{formatMessageTime(message.createdAt)}</span>
                      {isMine && !message.isDeleted && (
                        <span>
                          {message.status === "read" ? (
                            <CheckCheck className="size-3.5 text-sky-200" />
                          ) : message.status === "delivered" ? (
                            <CheckCheck className="size-3.5 text-white/60" />
                          ) : (
                            <Check className="size-3.5 text-white/40" />
                          )}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Message Reactions Badges */}
                  {message.reactions && message.reactions.length > 0 && !message.isDeleted && (
                    <div
                      className={`flex flex-wrap gap-1 mt-1 z-10 ${
                        isMine ? "justify-end" : "justify-start"
                      }`}
                    >
                      {message.reactions.map((r, i) => (
                        <button
                          key={i}
                          onClick={() => toggleReaction(message._id, r.emoji)}
                          className="px-2 py-0.5 rounded-full bg-slate-900/80 border border-white/15 text-xs flex items-center gap-1 text-white shadow-md hover:scale-110 transition-transform"
                        >
                          <span>{r.emoji}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* My Avatar */}
                {isMine && (
                  <div className="size-8 rounded-full overflow-hidden flex-shrink-0 border border-white/10 shadow-sm mb-1">
                    {isLastInGroup ? (
                      <img
                        src={authUserAvatar}
                        alt="Me"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full" />
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Real-time typing bubble in the chat feed (1-on-1) */}
        {!isGroup && isTyping && (
          <div className="flex items-center gap-2 pt-2 animate-fade-in">
            <div className="size-8 rounded-full overflow-hidden border border-white/10 shadow-sm">
              <img
                src={selectedUserAvatar}
                alt={selectedUser.fullName}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="px-4 py-3 rounded-2xl rounded-bl-sm bg-[var(--color-surface-container-high)] border border-white/10 flex items-center gap-1.5 shadow-md">
              <span className="size-2 rounded-full bg-sky-400 animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="size-2 rounded-full bg-sky-400 animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="size-2 rounded-full bg-sky-400 animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        )}

        {/* Real-time typing bubble in the chat feed (Group) */}
        {isGroup && groupTypingNames.length > 0 && (
          <div className="flex items-center gap-2 pt-2 animate-fade-in">
            <div className="px-4 py-2.5 rounded-2xl rounded-bl-sm bg-[var(--color-surface-container-high)] border border-white/10 flex items-center gap-2.5 shadow-md">
              <span className="text-xs text-emerald-400 font-semibold">{groupTypingNames[0]} is typing</span>
              <div className="flex items-center gap-1">
                <span className="size-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="size-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="size-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messageEndRef} />
      </div>

      <MessageInput />

      {/* WhatsApp-style Delete Confirmation Modal */}
      {deleteModalMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="glass-panel w-full max-w-sm rounded-3xl p-6 bg-slate-950/95 border border-white/15 shadow-2xl animate-modal-pop text-center space-y-4">
            <div className="size-12 rounded-2xl bg-red-500/10 text-red-400 mx-auto flex items-center justify-center shadow-inner">
              <Trash2 className="size-6" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">Delete Message?</h3>
              <p className="text-xs text-white/60 mt-1">
                {deleteModalMessage.isMine
                  ? "You can delete this message for everyone or only for yourself."
                  : "This message will be removed from your chat."}
              </p>
            </div>

            <div className="space-y-2 pt-2">
              {deleteModalMessage.isMine && (
                <button
                  type="button"
                  onClick={() => {
                    deleteMessage(deleteModalMessage._id, "forEveryone");
                    setDeleteModalMessage(null);
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-sm shadow-lg shadow-red-500/20 transition-all hover:scale-[1.02] active:scale-98"
                >
                  Delete for everyone
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  deleteMessage(deleteModalMessage._id, "forMe");
                  setDeleteModalMessage(null);
                }}
                className={`w-full py-2.5 px-4 rounded-xl font-bold text-sm transition-all hover:scale-[1.02] active:scale-98 ${
                  deleteModalMessage.isMine
                    ? "bg-white/10 hover:bg-white/15 text-white"
                    : "bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20"
                }`}
              >
                Delete for me
              </button>

              <button
                type="button"
                onClick={() => setDeleteModalMessage(null)}
                className="w-full py-2 px-4 rounded-xl text-xs font-semibold text-white/50 hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatContainer;