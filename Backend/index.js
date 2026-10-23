import dotenv from "dotenv";
dotenv.config();

import path from "path";
import fs from "fs";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";

import { connectDB } from "./lib/db.js";
import authRoutes from "./routes/auth.js";
import messageRoutes from "./routes/messageRoute.js";
import groupRoutes from "./routes/groupRoute.js";
import { app, server } from "./lib/socket.js";
import { corsOptions } from "./lib/utils.js";

const PORT = process.env.PORT || 5006;
const __dirname = path.resolve();

// Trust reverse proxy (Render, Vercel, etc.) for secure cookie and protocol detection
app.set("trust proxy", 1);

// 🔥 INCREASE BODY LIMIT HERE
app.use(express.json({
  limit: "50mb"
}));

app.use(express.urlencoded({
  limit: "50mb",
  extended: true
}));

app.use(cookieParser());

app.use(cors(corsOptions));

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/groups", groupRoutes);

const frontendDistPath = path.join(__dirname, "../Frontend/dist");
if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));

  app.get("{/*splat}", (req, res) => {
    res.sendFile(path.join(frontendDistPath, "index.html"));
  });
} else {
  app.get("/", (req, res) => {
    res.send("🚀 Gupshup API Server is running");
  });
}

const startServer = async () => {
  await connectDB();
  server.listen(PORT, () => {
    console.log("🚀 Server running on PORT:", PORT);
  });
};

startServer();
