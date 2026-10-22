import { useRef, useState, useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import {
  Image,
  Camera,
  Send,
  X,
  Smile,
  Mic,
  Square,
  Trash2,
  Reply,
} from "lucide-react";
import toast from "react-hot-toast";
import CameraCaptureModal from "./CameraCaptureModal";
import { soundFx } from "../lib/audioSound";

const EMOJI_LIST = [
  "😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇",
  "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚",
  "😋", "😛", "😝", "😜", "🤪", "🤨", "🧐", "🤓", "😎", "🤩",
  "🥳", "😏", "😒", "😞", "😔", "😟", "😕", "🙁", "☹️", "😣",
  "👍", "👎", "👌", "✌️", "🤞", "🤟", "🤘", "🤙", "👈", "👉",
  "👆", "👇", "☝️", "✋", "🤚", "🖐️", "🖖", "👋", "🤝", "👏",
  "🙌", "👐", "🤲", "🙏", "✍️", "💅", "🤳", "💪", "🦾", "🦿",
  "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔",
  "🔥", "✨", "🎉", "🎊", "💯", "🚀", "💡", "⭐", "🌟", "💫",
];

const MessageInput = () => {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState(null);

  // Audio recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);

  const fileInputRef = useRef(null);
  const inputRef = useRef(null);
  const emojiPickerRef = useRef(null);

  const {
    sendMessage,
    selectedUser,
    replyingTo,
    setReplyingTo,
  } = useChatStore();
  const { socket, authUser } = useAuthStore();

  // Close emoji picker on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(e.target)
      ) {
        setIsEmojiPickerOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      toast.error("Image size must be under 8MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  /* ================= AUDIO RECORDING ================= */
  const getSupportedAudioMimeType = () => {
    const types = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/ogg;codecs=opus",
      "audio/mp4",
      "audio/aac",
    ];
    for (const t of types) {
      if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(t)) {
        return t;
      }
    }
    return "";
  };

  const startRecording = async () => {
    try {
      soundFx.resume();

      if (!navigator?.mediaDevices?.getUserMedia) {
        if (!window.isSecureContext) {
          toast.error("Microphone requires a secure origin (HTTPS or localhost).", { duration: 6000 });
        } else {
          toast.error("Your browser does not support audio recording.", { duration: 5000 });
        }
        return;
      }

      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
      } catch (constraintErr) {
        // Fallback to basic audio constraint if enhanced audio is unsupported
        if (constraintErr.name === "OverconstrainedError" || constraintErr.name === "TypeError") {
          stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        } else {
          throw constraintErr;
        }
      }

      const mimeType = getSupportedAudioMimeType();
      const options = mimeType ? { mimeType } : undefined;
      const mediaRecorder = options ? new MediaRecorder(stream, options) : new MediaRecorder(stream);

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      // Collect data in 200ms slices so buffers are continually filled
      mediaRecorder.start(200);
      setIsRecording(true);
      setRecordingDuration(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Microphone access error:", err);
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        toast.error(
          "Microphone permission blocked! Click the 🔒 lock icon in your browser URL bar, set Microphone to 'Allow', then refresh.",
          { duration: 7000 }
        );
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        toast.error("No microphone hardware detected. Please plug in a mic or headset.", { duration: 5000 });
      } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
        toast.error("Microphone is in use by another app or tab. Please close other audio apps.", { duration: 5000 });
      } else {
        toast.error(`Microphone error: ${err.message || err.name}`, { duration: 5000 });
      }
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      try {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      } catch (e) {
        console.warn("Cancel recording stop error:", e);
      }
    }
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    setIsRecording(false);
    setRecordingDuration(0);
    audioChunksRef.current = [];
  };

  const sendVoiceNote = async () => {
    if (!mediaRecorderRef.current || !isRecording) return;

    const duration = Math.max(1, recordingDuration);
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);

    const recorder = mediaRecorderRef.current;
    const cleanMime = (recorder.mimeType || getSupportedAudioMimeType() || "audio/webm").split(";")[0];

    recorder.onstop = async () => {
      try {
        const audioBlob = new Blob(audioChunksRef.current, { type: cleanMime });
        if (audioBlob.size === 0) {
          toast.error("Audio recording was too short");
          return;
        }

        const reader = new FileReader();
        reader.onloadend = async () => {
          let base64Audio = reader.result;
          if (typeof base64Audio === "string") {
            base64Audio = base64Audio.replace(/;codecs=[^;]+/, "");
          }
          try {
            await sendMessage({
              audio: base64Audio,
              audioDuration: duration,
              replyTo: replyingTo?._id,
            });
          } catch (error) {
            console.error("Failed to send audio message:", error);
            toast.error("Failed to send voice message");
          }
        };
        reader.readAsDataURL(audioBlob);
      } finally {
        if (recorder.stream) {
          recorder.stream.getTracks().forEach((track) => track.stop());
        }
        setIsRecording(false);
        setRecordingDuration(0);
        audioChunksRef.current = [];
      }
    };

    try {
      if (recorder.state === "recording") {
        recorder.requestData();
      }
      recorder.stop();
    } catch (e) {
      console.warn("Error stopping recorder:", e);
    }
  };

  /* ================= SEND MESSAGE ================= */
  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!text.trim() && !imagePreview) return;

    try {
      await sendMessage({
        text: text.trim(),
        image: imagePreview,
        replyTo: replyingTo?._id,
      });

      setText("");
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";

      if (socket && selectedUser) {
        if (selectedUser.isGroup || selectedUser.members) {
          socket.emit("groupStopTyping", { groupId: selectedUser._id, userId: authUser?._id });
        } else {
          socket.emit("stopTyping", { receiverId: selectedUser._id });
        }
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const handleInputChange = (e) => {
    setText(e.target.value);

    if (!socket || !selectedUser) return;

    const isGroup = Boolean(selectedUser.isGroup || selectedUser.members);

    if (isGroup) {
      socket.emit("groupTyping", {
        groupId: selectedUser._id,
        user: { _id: authUser?._id, fullName: authUser?.fullName },
      });
    } else {
      socket.emit("typing", { receiverId: selectedUser._id });
    }

    if (typingTimeout) clearTimeout(typingTimeout);

    const timeout = setTimeout(() => {
      if (isGroup) {
        socket.emit("groupStopTyping", { groupId: selectedUser._id, userId: authUser?._id });
      } else {
        socket.emit("stopTyping", { receiverId: selectedUser._id });
      }
    }, 2000);

    setTypingTimeout(timeout);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleInsertEmoji = (emoji) => {
    setText((prev) => prev + emoji);
    inputRef.current?.focus();
  };

  const formatRecordingTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div
      className="p-2 sm:p-4 w-full max-w-full bg-transparent sticky bottom-0 z-20"
      style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
    >
      {/* Replying banner */}
      {replyingTo && (
        <div className="mb-2 p-2 sm:p-2.5 rounded-2xl bg-[var(--color-surface)]/90 backdrop-blur-xl border border-sky-500/30 shadow-lg flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2.5 min-w-0">
            <Reply className="size-4 text-sky-400 flex-shrink-0" />
            <div className="min-w-0 text-xs">
              <span className="font-bold text-sky-300">
                Replying to {replyingTo.senderId === selectedUser?._id ? selectedUser.fullName : "yourself"}
              </span>
              <p className="text-white/60 truncate line-clamp-1 mt-0.5">
                {replyingTo.text || (replyingTo.image ? "📷 Photo" : "🎙️ Voice note")}
              </p>
            </div>
          </div>
          <button
            onClick={() => setReplyingTo(null)}
            className="p-1.5 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-colors flex-shrink-0"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      {/* Image Preview Banner */}
      {imagePreview && (
        <div className="mb-3 flex items-center gap-2 animate-fade-in">
          <div className="relative group">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-20 h-20 object-cover rounded-2xl border border-white/20 shadow-xl"
            />
            <button
              onClick={removeImage}
              className="absolute -top-2 -right-2 size-6 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"
              type="button"
            >
              <X className="size-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Emoji Picker Popover */}
      {isEmojiPickerOpen && (
        <div
          ref={emojiPickerRef}
          className="absolute bottom-16 sm:bottom-20 left-2 sm:left-4 z-40 w-[calc(100vw-1rem)] sm:w-80 max-w-xs p-3 rounded-2xl glass-panel bg-slate-950/95 border border-white/15 shadow-2xl animate-modal-pop"
        >
          <div className="text-xs font-bold text-white/50 uppercase tracking-wider mb-2 px-1">
            Pick an Emoji
          </div>
          <div className="grid grid-cols-8 gap-1 max-h-48 overflow-y-auto custom-scrollbar p-1">
            {EMOJI_LIST.map((em, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleInsertEmoji(em)}
                className="size-8 rounded-lg hover:bg-white/15 text-lg flex items-center justify-center transition-transform hover:scale-125"
              >
                {em}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main input bar or voice recording bar */}
      {isRecording ? (
        <div className="flex items-center justify-between p-1.5 sm:p-2 rounded-full glass-panel border border-red-500/30 bg-red-950/30 shadow-xl animate-fade-in w-full min-w-0">
          <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-3 min-w-0">
            <span className="size-2.5 sm:size-3 rounded-full bg-red-500 animate-ping flex-shrink-0" />
            <span className="text-xs font-mono font-bold text-red-400 truncate">
              Recording {formatRecordingTime(recordingDuration)}
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={cancelRecording}
              className="p-2 sm:p-2.5 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors"
              title="Cancel recording"
            >
              <Trash2 className="size-4 sm:size-4.5" />
            </button>
            <button
              type="button"
              onClick={sendVoiceNote}
              className="p-2 sm:p-2.5 rounded-full bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold transition-all shadow-[0_0_15px_rgba(56,189,248,0.4)]"
              title="Send voice message"
            >
              <Send className="size-4 sm:size-4.5" />
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSendMessage} className="flex items-center gap-1.5 sm:gap-3 w-full min-w-0">
          <div className="flex-1 min-w-0 flex items-center gap-0.5 sm:gap-2 glass-panel rounded-full px-1.5 sm:px-3 py-0.5 sm:py-1 border border-white/10 shadow-xl focus-within:border-sky-400 focus-within:shadow-[0_0_20px_rgba(56,189,248,0.15)] transition-all">
            {/* Attachment Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={`p-1.5 sm:p-2 rounded-full transition-colors flex-shrink-0 ${
                imagePreview
                  ? "text-sky-400 bg-white/10"
                  : "text-white/60 hover:text-white hover:bg-white/10"
              }`}
              title="Attach photo from files"
            >
              <Image className="size-4.5 sm:size-5" />
            </button>

            {/* Live Camera Snapshot Button */}
            <button
              type="button"
              onClick={() => setIsCameraModalOpen(true)}
              className="p-1.5 sm:p-2 rounded-full transition-colors flex-shrink-0 text-white/60 hover:text-sky-400 hover:bg-white/10"
              title="Open camera view to take photo"
            >
              <Camera className="size-4.5 sm:size-5" />
            </button>

            {/* Emoji Button */}
            <button
              type="button"
              onClick={() => setIsEmojiPickerOpen(!isEmojiPickerOpen)}
              className={`p-1.5 sm:p-2 rounded-full transition-colors flex-shrink-0 ${
                isEmojiPickerOpen
                  ? "text-sky-400 bg-white/10"
                  : "text-white/60 hover:text-white hover:bg-white/10"
              }`}
              title="Insert emoji"
            >
              <Smile className="size-4.5 sm:size-5" />
            </button>

            {/* Text Input */}
            <input
              ref={inputRef}
              type="text"
              placeholder="Type a message..."
              value={text}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              className="flex-1 min-w-0 w-full bg-transparent border-none text-white placeholder-white/35 text-sm sm:text-[15px] focus:outline-none px-1.5 sm:px-2 py-2 sm:py-2.5"
            />

            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handleImageChange}
            />
          </div>

          {/* Action button: Send or Voice Record */}
          {text.trim() || imagePreview ? (
            <button
              type="submit"
              className="size-10 sm:size-12 rounded-full flex-shrink-0 bg-gradient-to-tr from-sky-500 to-indigo-600 text-white flex items-center justify-center shadow-[0_0_20px_rgba(56,189,248,0.35)] hover:scale-105 active:scale-95 transition-all"
              title="Send message"
            >
              <Send className="size-4.5 sm:size-5 translate-x-0.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={startRecording}
              className="size-10 sm:size-12 rounded-full flex-shrink-0 bg-white/10 hover:bg-white/20 text-white flex items-center justify-center border border-white/10 shadow-lg hover:scale-105 active:scale-95 transition-all group"
              title="Record voice note"
            >
              <Mic className="size-4.5 sm:size-5 text-sky-400 group-hover:scale-110 transition-transform" />
            </button>
          )}
        </form>
      )}

      {/* Live Camera View Modal */}
      <CameraCaptureModal
        isOpen={isCameraModalOpen}
        onClose={() => setIsCameraModalOpen(false)}
        onCapture={(capturedImg) => setImagePreview(capturedImg)}
      />
    </div>
  );
};

export default MessageInput;