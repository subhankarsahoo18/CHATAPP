// backend/socket.js

import { Server } from "socket.io";
import http from "http";
import express from "express";
import { isOriginAllowed } from "./utils.js";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    credentials: true,
    methods: ["GET", "POST"],
  },
});

import Message from "../models/messageModel.js";
import mongoose from "mongoose";

// Store online users
const userSocketMap = {}; 
// { userId: socketId }

export function getReceiverSocketId(userId) {
  if (!userId) return null;
  const key = typeof userId === "object" ? (userId._id || userId).toString() : userId.toString();
  return userSocketMap[key];
}

io.on("connection", async (socket) => {
  console.log("User connected:", socket.id);

  const userId = socket.handshake.query.userId || socket.handshake.auth?.userId;

  if (userId) {
    userSocketMap[userId.toString()] = socket.id;

    // 🔥 Find and deliver messages that arrived while user was offline (internet off)
    if (mongoose.connection.readyState === 1) {
      try {
        const pendingMessages = await Message.find({
          receiverId: userId,
          status: "sent",
        })
          .populate("senderId", "fullName username profilePic")
          .populate("replyTo", "text senderId image audio")
          .sort({ createdAt: 1 });

        if (pendingMessages.length > 0) {
          await Message.updateMany(
            { receiverId: userId, status: "sent" },
            { $set: { status: "delivered" } }
          );

          // Notify senders that messages are delivered (double ticks)
          io.emit("messagesDelivered", { receiverId: userId });

          // Send all messages that arrived while offline to the reconnecting user
          socket.emit("offlineMessagesReceived", pendingMessages);
          console.log(`[Socket] Delivered ${pendingMessages.length} offline messages to user ${userId}`);
        }
      } catch (err) {
        console.log("Error updating delivered status:", err);
      }
    }
  }

  // Explicit check for offline messages requested by frontend on network recovery
  socket.on("checkOfflineMessages", async () => {
    if (!userId || mongoose.connection.readyState !== 1) return;
    try {
      const pendingMessages = await Message.find({
        receiverId: userId,
        status: { $ne: "read" },
        deletedFor: { $nin: [userId] },
      })
        .populate("senderId", "fullName username profilePic")
        .populate("replyTo", "text senderId image audio")
        .sort({ createdAt: 1 })
        .limit(50);

      if (pendingMessages.length > 0) {
        socket.emit("offlineMessagesReceived", pendingMessages);
      }
    } catch (err) {
      console.log("Error in checkOfflineMessages:", err);
    }
  });

  // Send updated online users to all clients
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  // Typing indicators
  socket.on("typing", ({ receiverId }) => {
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("userTyping", { senderId: userId });
    }
  });

  socket.on("stopTyping", ({ receiverId }) => {
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("userStoppedTyping", { senderId: userId });
    }
  });

  // Message Read Receipts
  socket.on("markMessagesAsRead", ({ senderId }) => {
    // senderId is the person who sent the messages.
    // The current user (userId) has read them.
    const senderSocketId = getReceiverSocketId(senderId);
    if (senderSocketId) {
      io.to(senderSocketId).emit("messagesRead", { receiverId: userId });
    }
  });

  // ================= CALL SIGNALING =================
  socket.on("callUser", ({ userToCall, signalData, from, name, callType, avatar }) => {
    const receiverSocketId = getReceiverSocketId(userToCall);
    console.log(`[Socket] callUser: from=${from} to=${userToCall} socketId=${receiverSocketId} type=${callType}`);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("incomingCall", {
        signal: signalData,
        from,
        name,
        callType,
        avatar,
      });
    }
  });

  socket.on("answerCall", ({ to, signal }) => {
    const receiverSocketId = getReceiverSocketId(to);
    console.log(`[Socket] answerCall: to=${to} socketId=${receiverSocketId}`);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("callAccepted", { signal });
    }
  });

  socket.on("rejectCall", ({ to }) => {
    const receiverSocketId = getReceiverSocketId(to);
    console.log(`[Socket] rejectCall: to=${to} socketId=${receiverSocketId}`);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("callRejected");
    }
  });

  socket.on("endCall", ({ to }) => {
    const receiverSocketId = getReceiverSocketId(to);
    console.log(`[Socket] endCall: to=${to} socketId=${receiverSocketId}`);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("callEnded");
    }
  });

  socket.on("iceCandidate", ({ to, candidate }) => {
    const receiverSocketId = getReceiverSocketId(to);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("iceCandidate", { candidate, from: userId });
    }
  });

  // ================= GROUP CHAT SOCKET EVENTS =================
  socket.on("joinGroupRoom", ({ groupId }) => {
    if (groupId) socket.join(`group_${groupId}`);
  });

  socket.on("leaveGroupRoom", ({ groupId }) => {
    if (groupId) socket.leave(`group_${groupId}`);
  });

  socket.on("groupTyping", ({ groupId, user }) => {
    if (groupId) {
      socket.to(`group_${groupId}`).emit("groupUserTyping", { groupId, user });
    }
  });

  socket.on("groupStopTyping", ({ groupId, userId: stopUserId }) => {
    if (groupId) {
      socket.to(`group_${groupId}`).emit("groupUserStoppedTyping", { groupId, userId: stopUserId || userId });
    }
  });

  // ================= GROUP CALL SIGNALING =================
  socket.on("startGroupCall", ({ groupId, groupName, groupPic, callType, members, caller }) => {
    const callRoomId = `call_${groupId}`;
    socket.join(callRoomId);

    if (Array.isArray(members)) {
      members.forEach((m) => {
        const mId = typeof m === "object" ? m._id : m;
        if (mId && mId.toString() !== userId?.toString()) {
          const receiverSocketId = getReceiverSocketId(mId.toString());
          if (receiverSocketId) {
            io.to(receiverSocketId).emit("incomingGroupCall", {
              groupId,
              groupName,
              groupPic,
              callType,
              caller,
              callRoomId,
            });
          }
        }
      });
    }
  });

  socket.on("joinGroupCall", ({ groupId, user, callType }) => {
    const callRoomId = `call_${groupId}`;
    socket.join(callRoomId);
    socket.to(callRoomId).emit("groupCallParticipantJoined", {
      user,
      socketId: socket.id,
      callType,
    });
  });

  socket.on("groupCallSignal", ({ toSocketId, signal, user }) => {
    if (toSocketId) {
      io.to(toSocketId).emit("groupCallSignal", {
        fromSocketId: socket.id,
        signal,
        user,
      });
    }
  });

  socket.on("groupCallStateUpdate", ({ groupId, user, isMuted, isVideoOff }) => {
    const callRoomId = `call_${groupId}`;
    socket.to(callRoomId).emit("groupCallParticipantStateUpdated", {
      user,
      isMuted,
      isVideoOff,
      socketId: socket.id,
    });
  });

  socket.on("leaveGroupCall", ({ groupId, user }) => {
    const callRoomId = `call_${groupId}`;
    socket.leave(callRoomId);
    socket.to(callRoomId).emit("groupCallParticipantLeft", {
      user,
      socketId: socket.id,
    });
  });

  socket.on("rejectGroupCall", ({ groupId, user }) => {
    const callRoomId = `call_${groupId}`;
    socket.to(callRoomId).emit("groupCallRejectedBy", {
      user,
    });
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);

    // Remove user safely
    for (const key in userSocketMap) {
      if (userSocketMap[key] === socket.id) {
        delete userSocketMap[key];
        break;
      }
    }

    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

export { io, app, server };
