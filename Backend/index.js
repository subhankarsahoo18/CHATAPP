import dotenv from "dotenv";
dotenv.config();

import path from "path";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";

import { connectDB } from "./lib/db.js";
import authRoutes from "./routes/auth.js";
import messageRoutes from "./routes/messageRoute.js";
import groupRoutes from "./routes/groupRoute.js";
import { app, server } from "./lib/socket.js";

const PORT = process.env.PORT || 5006;
const __dirname = path.resolve();

// 🔥 INCREASE BODY LIMIT HERE
app.use(express.json({
  limit: "50mb"
}));

app.use(express.urlencoded({
  limit: "50mb",
  extended: true
}));



app.use(cookieParser());

app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:5174"],
    credentials: true,
  })
);

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/groups", groupRoutes);

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));

  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
  });
}

const startServer = async () => {
  await connectDB();
  server.listen(PORT, () => {
    console.log("🚀 Server running on PORT:", PORT);
  });
};

startServer();
