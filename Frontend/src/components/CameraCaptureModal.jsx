import { useEffect, useRef, useState } from "react";
import { Camera, X, RefreshCw, Check, AlertCircle } from "lucide-react";

const CameraCaptureModal = ({ isOpen, onClose, onCapture }) => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setCapturedImage(null);
      setCameraError(null);
      return;
    }

    startCamera();

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    setIsLoading(true);
    setCameraError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user",
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
      setIsLoading(false);
    } catch (err) {
      console.error("Camera access failed:", err);
      setCameraError(
        err.name === "NotAllowedError" || err.name === "PermissionDeniedError"
          ? "Camera permission was denied. Please allow camera access in your browser settings."
          : "Could not find or connect to a camera device."
      );
      setIsLoading(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const handleSnap = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext("2d");
    // Mirror horizontally so it feels natural like a selfie camera
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const base64 = canvas.toDataURL("image/jpeg", 0.9);
    setCapturedImage(base64);
  };

  const handleRetake = () => {
    setCapturedImage(null);
    if (videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  };

  const handleConfirm = () => {
    if (capturedImage && onCapture) {
      onCapture(capturedImage);
    }
    stopCamera();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in">
      <div className="glass-panel w-full max-w-lg rounded-3xl p-6 flex flex-col items-center relative overflow-hidden border border-white/10 shadow-2xl animate-modal-pop">
        {/* Header */}
        <div className="w-full flex items-center justify-between pb-4 border-b border-white/10 mb-4">
          <div className="flex items-center gap-2 text-white font-bold text-base">
            <Camera className="size-5 text-sky-400" />
            <span>Camera View</span>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1.5 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Video or Snapshot Screen */}
        <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden bg-slate-950 border border-white/10 relative flex items-center justify-center">
          {isLoading && (
            <div className="flex flex-col items-center gap-3 text-white/60 text-xs">
              <span className="loading loading-spinner loading-md text-sky-400" />
              <span>Starting camera stream...</span>
            </div>
          )}

          {cameraError && (
            <div className="p-6 text-center space-y-3">
              <div className="size-12 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 mx-auto flex items-center justify-center">
                <AlertCircle className="size-6" />
              </div>
              <p className="text-xs text-white/70 max-w-xs">{cameraError}</p>
              <button
                onClick={startCamera}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-all"
              >
                Retry Camera
              </button>
            </div>
          )}

          {/* Live Camera View */}
          {!capturedImage && !cameraError && (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover scale-x-[-1]"
            />
          )}

          {/* Captured Snapshot Preview */}
          {capturedImage && (
            <img
              src={capturedImage}
              alt="Captured snapshot"
              className="w-full h-full object-cover"
            />
          )}

          {/* Live Indicator Badge */}
          {!capturedImage && !cameraError && !isLoading && (
            <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-bold text-emerald-400 flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
              LIVE CAMERA
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="w-full pt-5 flex items-center justify-center gap-4">
          {!capturedImage ? (
            <button
              onClick={handleSnap}
              disabled={isLoading || !!cameraError}
              className="px-6 py-3 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 text-white font-bold text-sm shadow-[0_0_20px_rgba(56,189,248,0.4)] hover:scale-105 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-40 disabled:hover:scale-100"
            >
              <Camera className="size-4" />
              <span>Capture Photo</span>
            </button>
          ) : (
            <>
              <button
                onClick={handleRetake}
                className="px-4 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-semibold text-xs transition-all flex items-center gap-1.5"
              >
                <RefreshCw className="size-4" />
                <span>Retake</span>
              </button>
              <button
                onClick={handleConfirm}
                className="px-6 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg transition-all flex items-center gap-1.5 hover:scale-105"
              >
                <Check className="size-4" />
                <span>Use Photo</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CameraCaptureModal;
