import { useState, useEffect } from "react";
import { Bell, X, Sparkles, Check } from "lucide-react";
import {
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
} from "../lib/deviceNotification";
import toast from "react-hot-toast";

const NotificationPromptBanner = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isGranted, setIsGranted] = useState(false);

  useEffect(() => {
    if (!isNotificationSupported()) return;

    const permission = getNotificationPermission();
    const isDismissed = sessionStorage.getItem("gupshup_notif_banner_dismissed");

    if (permission === "default" && !isDismissed) {
      // Delay prompt slightly so it feels natural after page load
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 2000);
      return () => clearTimeout(timer);
    } else if (permission === "granted") {
      setIsGranted(true);
    }
  }, []);

  const handleEnable = async () => {
    const granted = await requestNotificationPermission();
    if (granted) {
      setIsGranted(true);
      setIsVisible(false);
      toast.success("Device notifications enabled! You'll receive alerts when someone messages you.", {
        icon: "🔔",
      });
    } else {
      setIsVisible(false);
      toast("Notifications were not enabled. You can enable them anytime in Settings.", {
        icon: "ℹ️",
      });
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem("gupshup_notif_banner_dismissed", "true");
  };

  if (!isVisible || isGranted) return null;

  return (
    <div className="absolute top-16 md:top-20 inset-x-3 sm:inset-x-8 z-40 max-w-xl mx-auto animate-modal-pop pointer-events-auto">
      <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-900/90 border border-sky-500/30 shadow-[0_10px_35px_rgba(0,0,0,0.6)] backdrop-blur-xl flex items-center justify-between gap-3 text-white">
        <div className="flex items-center gap-3 min-w-0">
          <div className="size-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-sky-500/20">
            <Bell className="size-5 text-white animate-pulse" />
          </div>
          <div className="min-w-0">
            <h4 className="font-bold text-xs sm:text-sm text-white flex items-center gap-1.5 truncate">
              <span>Enable WhatsApp-Style Notifications</span>
              <Sparkles className="size-3 text-sky-400 flex-shrink-0" />
            </h4>
            <p className="text-[11px] sm:text-xs text-white/60 truncate mt-0.5">
              Get device notifications when you turn on internet or someone messages you
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={handleEnable}
            className="px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs transition-all shadow-md hover:scale-105 active:scale-95 cursor-pointer"
          >
            Enable
          </button>
          <button
            onClick={handleDismiss}
            className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Dismiss"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationPromptBanner;
