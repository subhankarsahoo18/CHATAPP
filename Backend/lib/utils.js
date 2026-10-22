import jwt from "jsonwebtoken";

export const isProduction =
  process.env.NODE_ENV === "production" ||
  process.env.RENDER === "true" ||
  !!process.env.RENDER_EXTERNAL_URL;

export const generateToken = (userId, res) => {
  const token = jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.cookie("jwt", token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return token;
};

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "https://gupshup-tau.vercel.app",
  process.env.CLIENT_URL,
  process.env.FRONTEND_URL,
].filter(Boolean);

export const isOriginAllowed = (origin) => {
  if (!origin) return true;
  if (allowedOrigins.includes(origin)) return true;

  try {
    const url = new URL(origin);
    if (
      url.hostname === "localhost" ||
      url.hostname === "127.0.0.1" ||
      url.hostname.endsWith(".vercel.app")
    ) {
      return true;
    }
  } catch (err) {
    return false;
  }
  return false;
};

export const corsOptions = {
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};
