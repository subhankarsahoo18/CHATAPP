// Frontend/src/lib/deviceNotification.js
import { soundFx } from "./audioSound";

let swRegistration = null;
const recentlyNotifiedMessageIds = new Set();

/**
 * Register Service Worker for native background notifications
 */
export const initServiceWorker = async () => {
  if (typeof window !== "undefined" && "serviceWorker" in navigator) {
    try {
      const reg = await navigator.serviceWorker.register("/sw.js");
      swRegistration = reg;
      console.log("[Notification] Service Worker registered successfully");
      return reg;
    } catch (err) {
      console.warn("[Notification] Service Worker registration failed:", err);
      return null;
    }
  }
  return null;
};

/**
 * Helper to get the ready Service Worker registration
 */
export const getActiveServiceWorker = async () => {
  if (swRegistration) return swRegistration;
  if (typeof window !== "undefined" && "serviceWorker" in navigator) {
    try {
      swRegistration = await navigator.serviceWorker.ready;
      return swRegistration;
    } catch (e) {
      return null;
    }
  }
  return null;
};

/**
 * Check if the browser supports notifications
 */
export const isNotificationSupported = () => {
  return typeof window !== "undefined" && "Notification" in window;
};

/**
 * Get current notification permission state: "granted" | "denied" | "default"
 */
export const getNotificationPermission = () => {
  if (!isNotificationSupported()) return "denied";
  return Notification.permission;
};

/**
 * Request notification permission from user
 */
export const requestNotificationPermission = async () => {
  if (!isNotificationSupported()) return false;

  try {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      localStorage.setItem("gupshup_notifications_enabled", "true");
      return true;
    } else {
      localStorage.setItem("gupshup_notifications_enabled", "false");
      return false;
    }
  } catch (err) {
    console.warn("Failed to request notification permission:", err);
    return false;
  }
};

/**
 * Check if notifications are enabled in settings
 */
export const isNotificationsEnabled = () => {
  if (!isNotificationSupported()) return false;
  const pref = localStorage.getItem("gupshup_notifications_enabled");
  return Notification.permission === "granted" && pref !== "false";
};

/**
 * Helper to format preview text for notifications
 */
export const formatMessagePreview = (message) => {
  if (!message) return "New message";
  if (message.image && !message.text) return "📷 Photo";
  if (message.audio && !message.text) {
    const d = message.audioDuration ? Math.round(message.audioDuration) : 0;
    return d > 0 ? `🎤 Voice message (${d}s)` : "🎤 Voice message";
  }
  if (message.text) {
    return message.image ? `📷 ${message.text}` : message.text;
  }
  return "New message";
};

/**
 * Show a native system notification on the user's device notification panel
 */
export const showDeviceNotification = async ({
  title,
  body,
  icon,
  senderId,
  isGroup = false,
  groupId = null,
  tag = null,
  onClick = null,
}) => {
  if (!isNotificationsEnabled()) return null;

  const defaultIcon = "/avatar.svg";
  const notificationIcon = icon && typeof icon === "string" && icon.startsWith("http") ? icon : defaultIcon;
  const notificationTag = tag || (isGroup ? `group-${groupId}` : `sender-${senderId}`);

  const options = {
    body: body || "You received a new message",
    icon: notificationIcon,
    badge: defaultIcon,
    tag: notificationTag,
    renotify: true,
    vibrate: [200, 100, 200],
    data: {
      senderId,
      isGroup,
      groupId,
      url: "/",
    },
  };

  // Try Service Worker registration first (standard for modern browsers & Android)
  try {
    const reg = await getActiveServiceWorker();
    if (reg && "showNotification" in reg) {
      await reg.showNotification(title, options);
      return true;
    }
  } catch (e) {
    console.warn("SW notification failed, falling back to window.Notification:", e);
  }

  // Fallback to standard window Notification
  try {
    const notification = new Notification(title, options);

    notification.onclick = (e) => {
      e.preventDefault();
      window.focus();
      notification.close();
      if (typeof onClick === "function") {
        onClick({ senderId, isGroup, groupId });
      }
    };

    return notification;
  } catch (err) {
    console.warn("Could not display device notification:", err);
    return null;
  }
};

/**
 * Dispatches device notifications for messages that arrived while the user was offline (internet turned off)
 */
export const notifyOfflineMessages = (messages, onOpenChat) => {
  if (!Array.isArray(messages) || messages.length === 0) return;
  if (!isNotificationsEnabled()) return;

  // Filter out any messages we already notified in the last 5 minutes to avoid duplicates
  const freshMessages = messages.filter((msg) => {
    const id = msg._id?.toString();
    if (!id) return true;
    if (recentlyNotifiedMessageIds.has(id)) return false;
    recentlyNotifiedMessageIds.add(id);

    // Expire after 5 minutes
    setTimeout(() => {
      recentlyNotifiedMessageIds.delete(id);
    }, 5 * 60 * 1000);

    return true;
  });

  if (freshMessages.length === 0) return;

  soundFx.playReceivedSound();

  // Separate direct messages and group messages
  const directBySender = {};
  const groupByGroup = {};

  freshMessages.forEach((msg) => {
    if (msg.isGroup || msg.groupId) {
      const gId = typeof msg.groupId === "object" ? msg.groupId?._id : msg.groupId;
      if (!gId) return;
      if (!groupByGroup[gId]) {
        groupByGroup[gId] = {
          group: typeof msg.groupId === "object" ? msg.groupId : { _id: gId, name: "Group" },
          messages: [],
        };
      }
      groupByGroup[gId].messages.push(msg);
    } else {
      const sender = msg.senderId;
      const senderId = typeof sender === "object" ? sender?._id : sender;
      if (!senderId) return;

      if (!directBySender[senderId]) {
        directBySender[senderId] = {
          sender: typeof sender === "object" ? sender : { _id: senderId, fullName: "New Message" },
          messages: [],
        };
      }
      directBySender[senderId].messages.push(msg);
    }
  });

  // 1. Display notifications for 1-on-1 direct messages
  Object.values(directBySender).forEach(({ sender, messages: senderMsgs }) => {
    const senderName = sender.fullName || "Someone";
    const avatar = sender.profilePic;
    const count = senderMsgs.length;
    const latestMessage = senderMsgs[senderMsgs.length - 1];
    const preview = formatMessagePreview(latestMessage);

    const title = count > 1 ? `${senderName} (${count} new messages)` : senderName;
    const body = count > 1 ? `Latest: ${preview}` : preview;

    showDeviceNotification({
      title,
      body,
      icon: avatar,
      senderId: sender._id,
      isGroup: false,
      tag: `offline-direct-${sender._id}`,
      onClick: () => {
        if (typeof onOpenChat === "function") {
          onOpenChat(sender, false);
        }
      },
    });
  });

  // 2. Display notifications for group messages
  Object.values(groupByGroup).forEach(({ group, messages: groupMsgs }) => {
    const groupName = group.name || "Group Chat";
    const avatar = group.groupPic;
    const count = groupMsgs.length;
    const latestMessage = groupMsgs[groupMsgs.length - 1];
    const latestSender =
      typeof latestMessage.senderId === "object"
        ? latestMessage.senderId?.fullName
        : "Member";
    const preview = formatMessagePreview(latestMessage);

    const title = count > 1 ? `${groupName} (${count} messages)` : groupName;
    const body = `${latestSender}: ${preview}`;

    showDeviceNotification({
      title,
      body,
      icon: avatar,
      senderId: null,
      isGroup: true,
      groupId: group._id,
      tag: `offline-group-${group._id}`,
      onClick: () => {
        if (typeof onOpenChat === "function") {
          onOpenChat(group, true);
        }
      },
    });
  });
};
