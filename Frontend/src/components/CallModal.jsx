import { useState, useEffect, useRef, useCallback } from "react";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Phone,
  Volume2,
  VolumeX,
  Volume1,
  Radio,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { getAvatar } from "../lib/avatar";
import { soundFx } from "../lib/audioSound";

const RTC_CONFIG = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun3.l.google.com:19302" },
    { urls: "stun:stun4.l.google.com:19302" },
    { urls: "stun:global.stun.twilio.com:3478" },
  ],
  iceCandidatePoolSize: 10,
};

const waitForIceGathering = (pc, timeoutMs = 800) => {
  return new Promise((resolve) => {
    if (pc.iceGatheringState === "complete") {
      resolve();
      return;
    }
    const checkState = () => {
      if (pc.iceGatheringState === "complete") {
        pc.removeEventListener("icegatheringstatechange", checkState);
        clearTimeout(timer);
        resolve();
      }
    };
    const timer = setTimeout(() => {
      pc.removeEventListener("icegatheringstatechange", checkState);
      resolve();
    }, timeoutMs);
    pc.addEventListener("icegatheringstatechange", checkState);
  });
};

const CallModal = () => {
  const { callState, endCall, acceptCall, rejectCall } = useChatStore();
  const { authUser, socket } = useAuthStore();

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isLoopbackOn, setIsLoopbackOn] = useState(false);
  const [micVolume, setMicVolume] = useState(0);
  const [callDuration, setCallDuration] = useState(0);
  const [cameraError, setCameraError] = useState(null);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  const [remoteHasStream, setRemoteHasStream] = useState(false);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const loopbackAudioRef = useRef(null);

  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const iceCandidatesQueueRef = useRef([]);

  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);

  const { isOpen, callType, status, isCaller, targetUser, incomingSignal } = callState;
  const isVideoCall = callType === "video";

  // ================= 1. CLEANUP UTILITY =================
  const cleanupCall = useCallback(() => {
    soundFx.stopRingtone();

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }

    if (peerConnectionRef.current) {
      try {
        peerConnectionRef.current.close();
      } catch (e) {
        console.warn("Error closing RTCPeerConnection:", e);
      }
      peerConnectionRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    if (loopbackAudioRef.current) {
      loopbackAudioRef.current.srcObject = null;
    }
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
    }
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }

    remoteStreamRef.current = null;
    iceCandidatesQueueRef.current = [];
    setRemoteHasStream(false);
    setAutoplayBlocked(false);
    setIsLoopbackOn(false);
  }, []);

  // ================= 2. LIVE MICROPHONE VU METER =================
  const setupAudioMeter = (stream) => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;

      const audioCtx = new AudioCtx();
      if (audioCtx.state === "suspended") {
        audioCtx.resume().catch(() => {});
      }
      audioContextRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      analyserRef.current = analyser;

      const microphone = audioCtx.createMediaStreamSource(stream);
      microphone.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateMeter = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        const normalized = Math.min(100, Math.round((avg / 128) * 100));
        setMicVolume(normalized);

        animationFrameRef.current = requestAnimationFrame(updateMeter);
      };

      updateMeter();
    } catch (e) {
      console.warn("Audio meter setup error:", e);
    }
  };

  // ================= 3. HANDLE REMOTE TRACKS =================
  const handleRemoteTrack = useCallback((event) => {
    console.log("[WebRTC] Remote track received:", event.track?.kind, event.streams);

    let stream = remoteStreamRef.current;
    if (!stream) {
      stream = new MediaStream();
      remoteStreamRef.current = stream;
    }

    // Add individual track to persistent stream
    if (event.track) {
      const exists = stream.getTracks().some((t) => t.id === event.track.id);
      if (!exists) {
        stream.addTrack(event.track);
      }
    }

    // Merge tracks from event.streams if available
    if (event.streams && event.streams[0]) {
      event.streams[0].getTracks().forEach((track) => {
        const exists = stream.getTracks().some((t) => t.id === track.id);
        if (!exists) {
          stream.addTrack(track);
        }
      });
    }

    setRemoteHasStream(true);

    // Play remote audio
    if (remoteAudioRef.current) {
      if (remoteAudioRef.current.srcObject !== stream) {
        remoteAudioRef.current.srcObject = stream;
      }
      remoteAudioRef.current.muted = !isSpeakerOn;
      remoteAudioRef.current.volume = isSpeakerOn ? 1.0 : 0.0;
      remoteAudioRef.current
        .play()
        .then(() => {
          setAutoplayBlocked(false);
        })
        .catch((err) => {
          console.warn("[WebRTC] Remote audio autoplay blocked by browser policy:", err);
          setAutoplayBlocked(true);
        });
    }

    // Play remote video if video call
    if (remoteVideoRef.current && isVideoCall) {
      if (remoteVideoRef.current.srcObject !== stream) {
        remoteVideoRef.current.srcObject = stream;
      }
      remoteVideoRef.current.play().catch((err) => {
        console.warn("[WebRTC] Remote video play error:", err);
      });
    }
  }, [isSpeakerOn, isVideoCall]);

  // Helper for resilient media acquisition with constraint and audio-fallback
  const getUserMediaWithFallback = async (needVideo) => {
    if (!navigator?.mediaDevices?.getUserMedia) {
      throw new Error("Your browser or connection does not support media devices.");
    }

    try {
      return await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: needVideo
          ? {
              width: { ideal: 1280 },
              height: { ideal: 720 },
              facingMode: "user",
            }
          : false,
      });
    } catch (err) {
      if (err.name === "OverconstrainedError" || err.name === "TypeError") {
        return await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: needVideo ? true : false,
        });
      }
      if (needVideo && (err.name === "NotFoundError" || err.name === "NotReadableError")) {
        console.warn("Camera failed, falling back to audio-only:", err);
        return await navigator.mediaDevices.getUserMedia({ audio: true });
      }
      throw err;
    }
  };

  const getMediaErrorMessage = (err) => {
    if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
      return "Microphone / Camera access is blocked. Click the 🔒 lock icon beside the URL in your browser address bar, set permissions to 'Allow', and refresh.";
    }
    if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
      return "No microphone or camera hardware found. Please plug in a microphone or headset.";
    }
    if (err.name === "NotReadableError" || err.name === "TrackStartError") {
      return "Microphone/Camera is in use by another program (e.g. Zoom, Meet, or another tab).";
    }
    return err.message || "Could not connect to microphone / camera hardware.";
  };

  // ================= 4. INITIALIZE CALLER =================
  const initCaller = async () => {
    setCameraError(null);
    try {
      soundFx.resume();

      const stream = await getUserMediaWithFallback(isVideoCall);
      localStreamRef.current = stream;

      if (localVideoRef.current && isVideoCall) {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.play().catch(() => {});
      }

      setupAudioMeter(stream);

      const pc = new RTCPeerConnection(RTC_CONFIG);
      peerConnectionRef.current = pc;

      // Add local media tracks
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      // Handle remote incoming tracks
      pc.ontrack = handleRemoteTrack;

      pc.onconnectionstatechange = () => {
        console.log("[WebRTC Caller] Connection state:", pc.connectionState);
      };
      pc.oniceconnectionstatechange = () => {
        console.log("[WebRTC Caller] ICE connection state:", pc.iceConnectionState);
      };

      // Handle ICE Candidates
      pc.onicecandidate = (event) => {
        if (event.candidate && socket && targetUser) {
          socket.emit("iceCandidate", {
            to: targetUser._id,
            candidate: event.candidate,
          });
        }
      };

      // Create Offer
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: isVideoCall,
      });
      await pc.setLocalDescription(offer);

      // Brief wait to gather initial host/srflx candidates directly into SDP
      await waitForIceGathering(pc, 600);

      const sdpToSend = pc.localDescription || offer;

      // Emit callUser with actual offer
      if (socket && targetUser) {
        socket.emit("callUser", {
          userToCall: targetUser._id,
          signalData: sdpToSend,
          from: authUser?._id,
          name: authUser?.fullName,
          avatar: authUser?.profilePic,
          callType,
        });
      }
    } catch (err) {
      console.warn("Caller media access error:", err);
      setCameraError(getMediaErrorMessage(err));
    }
  };

  // ================= 5. INITIALIZE RECEIVER ANSWER =================
  const answerIncomingCall = async () => {
    setCameraError(null);
    try {
      soundFx.resume();

      const stream = await getUserMediaWithFallback(isVideoCall);
      localStreamRef.current = stream;

      if (localVideoRef.current && isVideoCall) {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.play().catch(() => {});
      }

      setupAudioMeter(stream);

      const pc = new RTCPeerConnection(RTC_CONFIG);
      peerConnectionRef.current = pc;

      // Add local media tracks
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      pc.ontrack = handleRemoteTrack;

      pc.onconnectionstatechange = () => {
        console.log("[WebRTC Receiver] Connection state:", pc.connectionState);
      };
      pc.oniceconnectionstatechange = () => {
        console.log("[WebRTC Receiver] ICE connection state:", pc.iceConnectionState);
      };

      pc.onicecandidate = (event) => {
        if (event.candidate && socket && targetUser) {
          socket.emit("iceCandidate", {
            to: targetUser._id,
            candidate: event.candidate,
          });
        }
      };

      // Set Remote Description from incoming signal (offer)
      const signal = incomingSignal || callState.incomingSignal;
      if (signal) {
        const sdp = signal instanceof RTCSessionDescription ? signal : new RTCSessionDescription(signal);
        await pc.setRemoteDescription(sdp);

        // Drain any queued ICE candidates that arrived while phone was ringing
        while (iceCandidatesQueueRef.current.length > 0) {
          const cand = iceCandidatesQueueRef.current.shift();
          try {
            const iceCand = cand instanceof RTCIceCandidate ? cand : new RTCIceCandidate(cand);
            await pc.addIceCandidate(iceCand);
          } catch (e) {
            console.warn("Error adding queued ICE candidate on receiver:", e);
          }
        }

        // Create and send SDP Answer
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        // Brief wait to gather initial host/srflx candidates directly into SDP
        await waitForIceGathering(pc, 600);

        const sdpToSend = pc.localDescription || answer;

        if (socket && targetUser) {
          socket.emit("answerCall", {
            to: targetUser._id,
            signal: sdpToSend,
          });
        }
      }
    } catch (err) {
      console.warn("Receiver media access error:", err);
      setCameraError(
        err.name === "NotAllowedError" || err.name === "PermissionDeniedError"
          ? "Microphone / Camera permission was denied. Please allow device access."
          : "Could not connect to microphone / camera hardware."
      );
    }
  };

  // ================= 6. LIFECYCLE EFFECT =================
  // Initialize call based on role
  useEffect(() => {
    if (!isOpen) return;

    if (isCaller && status === "calling" && !peerConnectionRef.current) {
      initCaller();
    } else if (!isCaller && status === "connected" && !peerConnectionRef.current) {
      answerIncomingCall();
    }
  }, [isOpen, isCaller, status]);

  // Teardown ONLY when modal actually closes
  useEffect(() => {
    if (!isOpen) {
      cleanupCall();
      setCallDuration(0);
      setCameraError(null);
    }
  }, [isOpen, cleanupCall]);

  // ================= 7. SOCKET SIGNALING LISTENERS =================
  useEffect(() => {
    if (!socket || !isOpen) return;

    // Caller receives SDP Answer from Receiver
    const handleCallAccepted = async ({ signal } = {}) => {
      soundFx.stopRingtone();
      const pc = peerConnectionRef.current;
      const sdpData = signal || incomingSignal || callState.incomingSignal;

      if (pc && sdpData && pc.signalingState !== "closed") {
        try {
          if (pc.signalingState === "have-local-offer") {
            const sdp = sdpData instanceof RTCSessionDescription ? sdpData : new RTCSessionDescription(sdpData);
            await pc.setRemoteDescription(sdp);
          }

          // Drain any ICE candidates queued before answer arrived
          while (iceCandidatesQueueRef.current.length > 0) {
            const cand = iceCandidatesQueueRef.current.shift();
            try {
              const iceCand = cand instanceof RTCIceCandidate ? cand : new RTCIceCandidate(cand);
              await pc.addIceCandidate(iceCand);
            } catch (e) {
              console.warn("Error adding queued ICE candidate on caller:", e);
            }
          }
        } catch (e) {
          console.warn("Error setting remote description on caller:", e);
        }
      }
    };

    // Both receive ICE candidates
    const handleIceCandidate = async ({ candidate }) => {
      if (!candidate) return;
      const pc = peerConnectionRef.current;

      if (pc && pc.remoteDescription && pc.remoteDescription.type) {
        try {
          const iceCand = candidate instanceof RTCIceCandidate ? candidate : new RTCIceCandidate(candidate);
          await pc.addIceCandidate(iceCand);
        } catch (e) {
          console.warn("Error adding ICE candidate:", e);
        }
      } else {
        // Safe queuing even if peerConnection is not yet instantiated
        iceCandidatesQueueRef.current.push(candidate);
      }
    };

    socket.on("callAccepted", handleCallAccepted);
    socket.on("iceCandidate", handleIceCandidate);

    return () => {
      socket.off("callAccepted", handleCallAccepted);
      socket.off("iceCandidate", handleIceCandidate);
    };
  }, [socket, isOpen, incomingSignal, callState.incomingSignal]);

  // Sync remote video stream whenever element mounts or remote stream updates
  useEffect(() => {
    if (remoteVideoRef.current && remoteStreamRef.current) {
      if (remoteVideoRef.current.srcObject !== remoteStreamRef.current) {
        remoteVideoRef.current.srcObject = remoteStreamRef.current;
      }
      remoteVideoRef.current.play().catch(() => {});
    }
  }, [remoteHasStream, status, isVideoCall]);

  // Sync local video stream whenever element mounts or local stream updates
  useEffect(() => {
    if (localVideoRef.current && localStreamRef.current) {
      if (localVideoRef.current.srcObject !== localStreamRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
      }
      localVideoRef.current.play().catch(() => {});
    }
  }, [status, isVideoCall, isVideoEnabled, remoteHasStream]);

  // Sync remote audio stream whenever element mounts or speaker state updates
  useEffect(() => {
    if (remoteAudioRef.current && remoteStreamRef.current) {
      if (remoteAudioRef.current.srcObject !== remoteStreamRef.current) {
        remoteAudioRef.current.srcObject = remoteStreamRef.current;
      }
      remoteAudioRef.current.muted = !isSpeakerOn;
      remoteAudioRef.current.volume = isSpeakerOn ? 1.0 : 0.0;
      remoteAudioRef.current
        .play()
        .then(() => setAutoplayBlocked(false))
        .catch(() => setAutoplayBlocked(true));
    }
  }, [remoteHasStream, isSpeakerOn, status]);

  // ================= 8. CONTROLS & TOGGLES =================
  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks();
      videoTracks.forEach((track) => {
        track.enabled = !isVideoEnabled;
      });
    }
    setIsVideoEnabled(!isVideoEnabled);
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      audioTracks.forEach((track) => {
        track.enabled = isMuted;
      });
    }
    setIsMuted(!isMuted);
  };

  const toggleSpeaker = () => {
    const nextState = !isSpeakerOn;
    setIsSpeakerOn(nextState);
    if (remoteAudioRef.current) {
      remoteAudioRef.current.muted = !nextState;
      remoteAudioRef.current.volume = nextState ? 1.0 : 0.0;
    }
  };

  // Self audio loopback test
  const toggleLoopbackTest = () => {
    const nextState = !isLoopbackOn;
    setIsLoopbackOn(nextState);
    if (loopbackAudioRef.current) {
      if (nextState && localStreamRef.current) {
        loopbackAudioRef.current.srcObject = localStreamRef.current;
        loopbackAudioRef.current.muted = false;
        loopbackAudioRef.current.volume = 0.9;
        loopbackAudioRef.current.play().catch(() => {});
      } else {
        loopbackAudioRef.current.pause();
        loopbackAudioRef.current.srcObject = null;
      }
    }
  };

  // Test speaker output
  const handleTestSpeaker = () => {
    soundFx.resume();
    soundFx.playTestTone();
  };

  // Unblock autoplay
  const handleUnblockAudio = () => {
    soundFx.resume();
    if (remoteAudioRef.current) {
      remoteAudioRef.current.muted = false;
      remoteAudioRef.current.volume = 1.0;
      remoteAudioRef.current
        .play()
        .then(() => setAutoplayBlocked(false))
        .catch(() => {});
    }
  };

  const handleEndCall = () => {
    cleanupCall();
    endCall();
  };

  const handleRejectCall = () => {
    cleanupCall();
    rejectCall();
  };

  const handleAcceptCall = () => {
    soundFx.resume();
    // Warm up the audio element on direct user gesture to unlock browser autoplay policy
    if (remoteAudioRef.current) {
      remoteAudioRef.current.muted = false;
      remoteAudioRef.current.volume = 1.0;
      remoteAudioRef.current.play().catch(() => {});
    }
    acceptCall();
  };

  // Duration timer
  useEffect(() => {
    let interval = null;
    if (status === "connected") {
      interval = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setCallDuration(0);
    }
    return () => clearInterval(interval);
  }, [status]);

  if (!isOpen || !targetUser) return null;

  const formatDuration = (secs) => {
    const mins = Math.floor(secs / 60);
    const remSecs = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${remSecs.toString().padStart(2, "0")}`;
  };

  const avatarUrl = getAvatar(targetUser);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xl p-4 animate-fade-in">
      {/* Remote Audio Receiver Element (Direct audio connection for remote user's voice) */}
      <audio
        ref={(el) => {
          remoteAudioRef.current = el;
          if (el && remoteStreamRef.current && el.srcObject !== remoteStreamRef.current) {
            el.srcObject = remoteStreamRef.current;
            el.muted = !isSpeakerOn;
            el.volume = isSpeakerOn ? 1.0 : 0.0;
            el.play().then(() => setAutoplayBlocked(false)).catch(() => setAutoplayBlocked(true));
          }
        }}
        autoPlay
        playsInline
      />

      {/* Local Microphone Loopback Element (For hearing your own voice through headphones/speakers) */}
      <audio ref={loopbackAudioRef} playsInline />

      <div
        className={`glass-panel w-full rounded-3xl flex flex-col items-center relative overflow-hidden shadow-2xl border border-white/10 animate-modal-pop ${
          isVideoCall ? "max-w-3xl aspect-[4/3] sm:aspect-video p-0" : "max-w-md p-7"
        }`}
      >
        {/* Ambient Glows */}
        <div className="absolute -top-24 -left-24 w-52 h-52 bg-sky-500/20 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-52 h-52 bg-indigo-500/20 rounded-full blur-[80px] pointer-events-none" />

        {/* Autoplay blocked banner */}
        {autoplayBlocked && (
          <div
            onClick={handleUnblockAudio}
            className="absolute top-3 inset-x-4 z-40 p-2.5 rounded-xl bg-amber-500/90 text-slate-950 font-bold text-xs flex items-center justify-between cursor-pointer shadow-xl animate-bounce"
          >
            <div className="flex items-center gap-2">
              <VolumeX className="size-4 flex-shrink-0" />
              <span>Browser muted audio playback. Tap here to unmute and hear the caller!</span>
            </div>
            <button className="px-2 py-1 rounded bg-black text-white text-[11px] font-bold">
              Enable Sound
            </button>
          </div>
        )}

        {/* ================= 1. VIDEO CALL VIEW ================= */}
        {isVideoCall ? (
          <div className="relative w-full h-full flex flex-col justify-between overflow-hidden bg-slate-950">
            {/* Main Stage Video: Shows REMOTE video if connected, or LOCAL preview if calling/waiting */}
            {status === "connected" ? (
              remoteHasStream ? (
                <video
                  ref={(el) => {
                    remoteVideoRef.current = el;
                    if (el && remoteStreamRef.current && el.srcObject !== remoteStreamRef.current) {
                      el.srcObject = remoteStreamRef.current;
                      el.play().catch(() => {});
                    }
                  }}
                  autoPlay
                  playsInline
                  className="absolute inset-0 w-full h-full object-cover z-0"
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 z-0 space-y-4">
                  <div className="relative">
                    <div className="size-28 rounded-full overflow-hidden border-2 border-sky-400 shadow-[0_0_30px_rgba(56,189,248,0.4)]">
                      <img src={avatarUrl} alt={targetUser.fullName} className="w-full h-full object-cover" />
                    </div>
                    <span className="absolute inset-0 rounded-full border-2 border-sky-400 animate-ping opacity-60 pointer-events-none" />
                  </div>
                  <div className="text-center px-4">
                    <h4 className="text-white font-bold text-lg">{targetUser.fullName}</h4>
                    <p className="text-xs text-sky-400 font-medium flex items-center justify-center gap-1.5 mt-1">
                      <span className="size-2 rounded-full bg-sky-400 animate-pulse" />
                      Connecting video and audio stream...
                    </p>
                  </div>
                </div>
              )
            ) : isVideoEnabled && !cameraError ? (
              <video
                ref={(el) => {
                  localVideoRef.current = el;
                  if (el && localStreamRef.current && el.srcObject !== localStreamRef.current) {
                    el.srcObject = localStreamRef.current;
                    el.play().catch(() => {});
                  }
                }}
                autoPlay
                playsInline
                muted
                className="absolute inset-0 w-full h-full object-cover scale-x-[-1] z-0"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 z-0 space-y-4">
                <div className="size-24 rounded-full overflow-hidden border-2 border-white/20 shadow-xl">
                  <img src={avatarUrl} alt={targetUser.fullName} className="w-full h-full object-cover" />
                </div>
                <div className="text-center px-4">
                  <h4 className="text-white font-bold text-lg">{targetUser.fullName}</h4>
                  <p className="text-xs text-white/50 mt-1">
                    {cameraError ? cameraError : "Connecting video..."}
                  </p>
                </div>
              </div>
            )}

            {/* Small Floating Picture-in-Picture for LOCAL camera during connected video call */}
            {status === "connected" && (
              <div className="absolute bottom-24 right-4 z-30 w-32 sm:w-44 aspect-video rounded-2xl overflow-hidden border-2 border-white/25 shadow-2xl bg-black">
                {isVideoEnabled && !cameraError ? (
                  <video
                    ref={(el) => {
                      localVideoRef.current = el;
                      if (el && localStreamRef.current && el.srcObject !== localStreamRef.current) {
                        el.srcObject = localStreamRef.current;
                        el.play().catch(() => {});
                      }
                    }}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover scale-x-[-1]"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-800 text-[10px] text-white/60">
                    Camera Off
                  </div>
                )}
                <div className="absolute bottom-1 left-2 text-[9px] font-bold text-white/80 bg-black/60 px-1.5 py-0.5 rounded">
                  You
                </div>
              </div>
            )}

            {/* Gradient overlays */}
            <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/85 via-black/45 to-transparent pointer-events-none z-10" />
            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/95 via-black/60 to-transparent pointer-events-none z-10" />

            {/* Top Bar Header */}
            <div className="relative z-20 p-5 flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                <div className="size-11 rounded-full overflow-hidden border-2 border-white/30 shadow-lg">
                  <img src={avatarUrl} alt={targetUser.fullName} className="w-full h-full object-cover" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base drop-shadow-md">
                    {targetUser.fullName}
                  </h3>
                  <div className="flex items-center gap-2 text-xs font-medium text-sky-300 drop-shadow">
                    <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>
                      {status === "incoming" && "Incoming video call..."}
                      {status === "calling" && "Calling & Ringing..."}
                      {status === "connected" && formatDuration(callDuration)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Live Mic Activity Level Indicator */}
              <div
                className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/15 flex items-center gap-1.5 shadow-lg"
                title={`Your microphone input level: ${micVolume}%`}
              >
                <Mic className={`size-3.5 ${micVolume > 5 ? "text-emerald-400 animate-pulse" : "text-white/40"}`} />
                <div className="flex items-end gap-0.5 h-3">
                  {[10, 25, 45, 65, 85].map((thresh, idx) => (
                    <div
                      key={idx}
                      className={`w-1 rounded-full transition-all duration-75 ${
                        micVolume >= thresh ? "bg-emerald-400" : "bg-white/20"
                      }`}
                      style={{ height: `${(idx + 1) * 2.5}px` }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Controls Pill */}
            <div className="relative z-20 pb-6 pt-2 flex items-center justify-center gap-4">
              {status === "incoming" ? (
                <div className="flex items-center gap-6">
                  <button
                    onClick={handleRejectCall}
                    className="size-14 rounded-full bg-red-500/90 hover:bg-red-600 text-white flex items-center justify-center shadow-[0_0_25px_rgba(239,68,68,0.5)] hover:scale-105 transition-all"
                    title="Decline"
                  >
                    <PhoneOff className="size-6" />
                  </button>
                  <button
                    onClick={handleAcceptCall}
                    className="size-14 rounded-full bg-emerald-500/90 hover:bg-emerald-600 text-white flex items-center justify-center shadow-[0_0_25px_rgba(16,185,129,0.5)] hover:scale-105 transition-all animate-bounce"
                    title="Accept"
                  >
                    <Phone className="size-6" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3.5 p-2 rounded-full bg-black/60 backdrop-blur-xl border border-white/15 shadow-2xl">
                  {/* Mute Mic toggle */}
                  <button
                    onClick={toggleMute}
                    className={`size-12 rounded-full flex items-center justify-center transition-all ${
                      isMuted ? "bg-red-500/80 text-white shadow-lg" : "bg-white/10 hover:bg-white/20 text-white"
                    }`}
                    title={isMuted ? "Unmute microphone" : "Mute microphone"}
                  >
                    {isMuted ? <MicOff className="size-5" /> : <Mic className="size-5" />}
                  </button>

                  {/* Video toggle */}
                  <button
                    onClick={toggleVideo}
                    className={`size-12 rounded-full flex items-center justify-center transition-all ${
                      !isVideoEnabled ? "bg-red-500/80 text-white shadow-lg" : "bg-white/10 hover:bg-white/20 text-white"
                    }`}
                    title={isVideoEnabled ? "Turn camera off" : "Turn camera on"}
                  >
                    {isVideoEnabled ? <Video className="size-5" /> : <VideoOff className="size-5" />}
                  </button>

                  {/* Speaker toggle */}
                  <button
                    onClick={toggleSpeaker}
                    className={`size-12 rounded-full flex items-center justify-center transition-all ${
                      !isSpeakerOn ? "bg-red-500/80 text-white" : "bg-white/10 hover:bg-white/20 text-white"
                    }`}
                    title={isSpeakerOn ? "Speaker on (hear audio)" : "Speaker muted"}
                  >
                    {isSpeakerOn ? <Volume2 className="size-5" /> : <VolumeX className="size-5" />}
                  </button>

                  {/* End call */}
                  <button
                    onClick={handleEndCall}
                    className="size-12 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-[0_0_20px_rgba(239,68,68,0.5)] hover:scale-105 transition-all"
                    title="End call"
                  >
                    <PhoneOff className="size-5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ================= 2. VOICE CALL VIEW ================= */
          <div className="w-full flex flex-col items-center">
            {/* Call Type Pill */}
            <div className="px-3.5 py-1 rounded-full bg-white/10 border border-white/10 text-xs font-semibold uppercase tracking-wider text-white/80 mb-4 flex items-center gap-1.5">
              <Phone className="size-3.5 text-sky-400" />
              <span>Gupshup Voice Call</span>
            </div>

            {/* User Avatar with pulsing animation */}
            <div className="relative my-3 flex items-center justify-center">
              {status !== "connected" && (
                <div className="absolute inset-0 rounded-full bg-sky-400/20 animate-ping opacity-50 scale-125" />
              )}
              <div className="size-28 rounded-full overflow-hidden border-2 border-white/20 shadow-2xl relative z-10">
                <img
                  src={avatarUrl}
                  alt={targetUser.fullName || "User"}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* User Name & Status */}
            <div className="text-center mt-2 mb-4">
              <h3 className="text-2xl font-bold text-white tracking-tight">
                {targetUser.fullName || "User"}
              </h3>
              <p className="text-sm font-medium mt-1 text-sky-300">
                {status === "incoming" && "Incoming call..."}
                {status === "calling" && "Calling & Ringing..."}
                {status === "connected" && formatDuration(callDuration)}
              </p>
            </div>

            {/* Live Mic Activity & Audio Feedback Meter */}
            <div className="w-full p-3.5 rounded-2xl bg-black/40 border border-white/10 mb-5 flex items-center justify-between text-xs shadow-inner">
              <div className="flex items-center gap-2">
                <Mic className={`size-4 ${micVolume > 5 ? "text-emerald-400 animate-pulse" : "text-white/40"}`} />
                <span className="text-white/70 font-semibold text-xs">Mic Activity</span>
              </div>
              <div className="flex items-center gap-1.5 h-3.5">
                {[10, 20, 35, 50, 70, 85].map((thresh, idx) => (
                  <div
                    key={idx}
                    className={`w-1.5 rounded-full transition-all duration-75 ${
                      micVolume >= thresh ? "bg-emerald-400 shadow-[0_0_8px_#34d399]" : "bg-white/15"
                    }`}
                    style={{ height: `${(idx + 1) * 2.5}px` }}
                  />
                ))}
              </div>
            </div>

            {/* Action Controls */}
            {status === "incoming" ? (
              <div className="flex items-center gap-6 mt-2">
                <button
                  onClick={handleRejectCall}
                  className="size-14 rounded-full bg-red-500/90 hover:bg-red-600 text-white flex items-center justify-center shadow-[0_0_20px_rgba(239,68,68,0.4)] hover:scale-105 transition-all"
                  title="Decline"
                >
                  <PhoneOff className="size-6" />
                </button>
                <button
                  onClick={handleAcceptCall}
                  className="size-14 rounded-full bg-emerald-500/90 hover:bg-emerald-600 text-white flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:scale-105 transition-all animate-bounce"
                  title="Accept"
                >
                  <Phone className="size-6" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-4 mt-1">
                <button
                  onClick={toggleMute}
                  className={`size-12 rounded-full flex items-center justify-center transition-all ${
                    isMuted ? "bg-red-500/20 text-red-400 border border-red-500/40" : "bg-white/10 hover:bg-white/20 text-white"
                  }`}
                  title={isMuted ? "Unmute mic" : "Mute mic"}
                >
                  {isMuted ? <MicOff className="size-5" /> : <Mic className="size-5" />}
                </button>

                <button
                  onClick={toggleSpeaker}
                  className={`size-12 rounded-full flex items-center justify-center transition-all ${
                    !isSpeakerOn ? "bg-red-500/20 text-red-400 border border-red-500/40" : "bg-white/10 hover:bg-white/20 text-white"
                  }`}
                  title={isSpeakerOn ? "Speaker on" : "Speaker off"}
                >
                  {isSpeakerOn ? <Volume2 className="size-5" /> : <VolumeX className="size-5" />}
                </button>

                <button
                  onClick={handleEndCall}
                  className="size-12 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-[0_0_20px_rgba(239,68,68,0.5)] hover:scale-105 transition-all"
                  title="End call"
                >
                  <PhoneOff className="size-5" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CallModal;
