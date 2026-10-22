// Frontend/src/lib/avatar.js

const GRADIENTS = [
  ["#3b82f6", "#1d4ed8"], // Blue
  ["#8b5cf6", "#6d28d9"], // Purple
  ["#ec4899", "#be185d"], // Pink
  ["#10b981", "#047857"], // Emerald
  ["#f59e0b", "#d97706"], // Amber
  ["#06b6d4", "#0e7490"], // Cyan
  ["#6366f1", "#4338ca"], // Indigo
  ["#14b8a6", "#0f766e"], // Teal
];

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function getInitials(name) {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

/**
 * Returns a high-resolution, beautiful SVG Data URI with vibrant gradient background
 * and bold centered initials. Zero external network dependency, zero broken images.
 */
export function generateInitialsAvatar(name = "User", id = "") {
  const initials = getInitials(name);
  const colorIndex = hashString((id || name) + "salt") % GRADIENTS.length;
  const [c1, c2] = GRADIENTS[colorIndex];

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <defs>
        <linearGradient id="grad-${colorIndex}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${c1}" />
          <stop offset="100%" stop-color="${c2}" />
        </linearGradient>
      </defs>
      <rect width="100" height="100" rx="50" fill="url(#grad-${colorIndex})" />
      <text x="50" y="55" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="38" font-weight="700" fill="#ffffff" text-anchor="middle" dominant-baseline="middle" letter-spacing="1">
        ${initials}
      </text>
    </svg>
  `.trim();

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Main avatar resolver:
 * Uses user's profilePic if valid, otherwise falls back to dynamic initials avatar.
 */
export function getAvatar(user) {
  if (user && user.profilePic && user.profilePic.trim() !== "" && user.profilePic !== "/avatar.png") {
    return user.profilePic;
  }
  const name = user?.fullName || user?.username || "User";
  const id = user?._id || user?.email || name;
  return generateInitialsAvatar(name, id);
}

/**
 * Returns a distinct color class for group message sender names
 */
const SENDER_COLORS = [
  "text-emerald-400",
  "text-sky-400",
  "text-violet-400",
  "text-amber-400",
  "text-rose-400",
  "text-teal-400",
  "text-cyan-400",
  "text-fuchsia-400",
];

export function getSenderColor(userId = "") {
  const idx = hashString(userId + "sender") % SENDER_COLORS.length;
  return SENDER_COLORS[idx];
}

/**
 * Group avatar generator with group icon SVG and gradient
 */
export function getGroupAvatar(group) {
  if (group && group.groupPic && group.groupPic.trim() !== "") {
    return group.groupPic;
  }

  const name = group?.name || "Group";
  const id = group?._id || name;
  const colorIndex = hashString(id + "group") % GRADIENTS.length;
  const [c1, c2] = GRADIENTS[colorIndex];

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <defs>
        <linearGradient id="grp-grad-${colorIndex}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${c1}" />
          <stop offset="100%" stop-color="${c2}" />
        </linearGradient>
      </defs>
      <rect width="100" height="100" rx="50" fill="url(#grp-grad-${colorIndex})" />
      <g fill="#ffffff" transform="translate(25, 25) scale(2)">
        <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
      </g>
    </svg>
  `.trim();

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

