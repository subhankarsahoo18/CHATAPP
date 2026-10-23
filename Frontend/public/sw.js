// Frontend/public/sw.js
// Service Worker for Gupshup device notifications and background alerts

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Handle clicking on the notification from Windows Action Center / Android notification shade
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const data = event.notification.data || {};

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // If a window is already open, focus it and tell it which chat to open
      for (const client of clientList) {
        if ("focus" in client) {
          client.focus();
          if (data.senderId) {
            client.postMessage({
              type: "OPEN_CHAT",
              senderId: data.senderId,
              isGroup: Boolean(data.isGroup),
              groupId: data.groupId,
            });
          }
          return;
        }
      }

      // If no window is open, launch a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow("/");
      }
    })
  );
});
