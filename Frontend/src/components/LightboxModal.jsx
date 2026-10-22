import { useEffect } from "react";
import { X, Download, ZoomIn } from "lucide-react";
import { useChatStore } from "../store/useChatStore";

const LightboxModal = () => {
  const { lightboxImage, setLightboxImage } = useChatStore();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setLightboxImage(null);
    };
    if (lightboxImage) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxImage, setLightboxImage]);

  if (!lightboxImage) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fade-in"
      onClick={() => setLightboxImage(null)}
    >
      {/* Top bar controls */}
      <div
        className="absolute top-5 right-6 flex items-center gap-3 z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <a
          href={lightboxImage}
          download="chat-image.jpg"
          target="_blank"
          rel="noopener noreferrer"
          className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all shadow-lg flex items-center justify-center"
          title="Download image"
        >
          <Download className="size-5" />
        </a>
        <button
          onClick={() => setLightboxImage(null)}
          className="p-2.5 rounded-full bg-white/10 hover:bg-red-500/80 text-white transition-all shadow-lg flex items-center justify-center"
          title="Close (Esc)"
        >
          <X className="size-5" />
        </button>
      </div>

      {/* Image frame */}
      <div
        className="relative max-w-4xl max-h-[85vh] flex items-center justify-center animate-modal-pop"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={lightboxImage}
          alt="Enlarged attachment"
          className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl border border-white/10"
        />
      </div>
    </div>
  );
};

export default LightboxModal;
