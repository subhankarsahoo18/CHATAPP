import User from "../models/userModel.js";
import Message from "../models/messageModel.js";
import cloudinary from "../lib/cloudinary.js";
import { io, getReceiverSocketId } from "../lib/socket.js";

// ================= GET USERS FOR SIDEBAR =================
export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;

    // Find all messages involving the logged-in user, excluding those deleted for this user
    const messages = await Message.find({
      $or: [{ senderId: loggedInUserId }, { receiverId: loggedInUserId }],
      deletedFor: { $nin: [loggedInUserId] },
    }).sort({ createdAt: -1 });

    // Build map of conversations: { otherUserId: { lastMessage, unreadCount } }
    const conversationMap = new Map();

    messages.forEach((msg) => {
      const otherId =
        msg.senderId.toString() === loggedInUserId.toString()
          ? msg.receiverId.toString()
          : msg.senderId.toString();

      if (!conversationMap.has(otherId)) {
        conversationMap.set(otherId, {
          lastMessage: {
            _id: msg._id,
            text: msg.isDeleted ? "This message was deleted" : msg.text,
            image: msg.isDeleted ? null : msg.image,
            audio: msg.isDeleted ? null : msg.audio,
            senderId: msg.senderId,
            status: msg.status,
            createdAt: msg.createdAt,
            isDeleted: msg.isDeleted,
          },
          unreadCount: 0,
        });
      }

      // Increment unread count if sent to logged-in user and not yet read
      if (
        msg.senderId.toString() === otherId &&
        msg.receiverId.toString() === loggedInUserId.toString() &&
        msg.status !== "read" &&
        !msg.isDeleted
      ) {
        conversationMap.get(otherId).unreadCount += 1;
      }
    });

    const activeUserIds = Array.from(conversationMap.keys());

    // Fetch user details for active conversations
    const activeUsers = await User.find({
      _id: { $in: activeUserIds },
    }).select("-password");

    const conversationUsers = activeUsers.map((user) => {
      const meta = conversationMap.get(user._id.toString());
      return {
        ...user.toObject(),
        lastMessage: meta?.lastMessage || null,
        unreadCount: meta?.unreadCount || 0,
      };
    });

    // Sort by latest message date descending
    conversationUsers.sort((a, b) => {
      const timeA = a.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt).getTime() : 0;
      const timeB = b.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt).getTime() : 0;
      return timeB - timeA;
    });

    // Also fetch other registered users (contact discovery / explore)
    const otherUsers = await User.find({
      _id: { $nin: [...activeUserIds, loggedInUserId] },
    }).select("-password").limit(50);

    const suggestedContacts = otherUsers.map((u) => ({
      ...u.toObject(),
      lastMessage: null,
      unreadCount: 0,
    }));

    // Return combined array with active conversations first, followed by other contacts
    res.status(200).json([...conversationUsers, ...suggestedContacts]);
  } catch (error) {
    console.error("Error in getUsersForSidebar:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ================= SEARCH GLOBAL USERS =================
export const searchUsers = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const { query } = req.query;

    if (!query) {
      return res.status(200).json([]);
    }

    // Search by fullName, username, mobileNumber, email
    const users = await User.find({
      _id: { $ne: loggedInUserId },
      $or: [
        { fullName: { $regex: query, $options: "i" } },
        { username: { $regex: query, $options: "i" } },
        { mobileNumber: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } },
      ],
    }).select("-password").limit(20);

    res.status(200).json(users);
  } catch (error) {
    console.error("Error in searchUsers:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ================= GET MESSAGES =================
export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;

    // Mark messages sent by userToChatId to me as 'read'
    await Message.updateMany(
      { senderId: userToChatId, receiverId: myId, status: { $ne: "read" } },
      { $set: { status: "read" } }
    );

    // Notify sender via socket that their messages were read
    const senderSocketId = getReceiverSocketId(userToChatId.toString());
    if (senderSocketId) {
      io.to(senderSocketId).emit("messagesRead", { receiverId: myId.toString() });
    }

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
      deletedFor: { $nin: [myId] },
    }).populate("replyTo", "text senderId image audio");

    res.status(200).json(messages);
  } catch (error) {
    console.log("Error in getMessages:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ================= SEND MESSAGE =================
export const sendMessage = async (req, res) => {
  try {
    const { text, image, audio, audioDuration, replyTo } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    let imageUrl = null;
    let audioUrl = null;

    // Upload image if provided
    if (image && image.startsWith("data:image")) {
      const uploadResponse = await cloudinary.uploader.upload(image, {
        folder: "chat_images",
      });
      imageUrl = uploadResponse.secure_url;
    } else if (image) {
      imageUrl = image;
    }

    // Upload audio if provided (sanitize any codecs parameter in data URI so Cloudinary and HTML5 audio parse cleanly)
    if (audio && (audio.startsWith("data:audio") || audio.startsWith("data:video"))) {
      const sanitizedAudio = audio.replace(/;codecs=[^;]+/, "");
      try {
        const uploadResponse = await cloudinary.uploader.upload(sanitizedAudio, {
          folder: "chat_audio",
          resource_type: "auto",
        });
        audioUrl = uploadResponse.secure_url;
      } catch (cloudErr) {
        console.warn("Cloudinary audio upload failed, falling back to direct audio data URI:", cloudErr.message);
        audioUrl = sanitizedAudio;
      }
    } else if (audio) {
      audioUrl = audio;
    }

    const receiverSocketId = getReceiverSocketId(receiverId.toString());
    const messageStatus = receiverSocketId ? "delivered" : "sent";

    const newMessage = await Message.create({
      senderId,
      receiverId,
      text: text || "",
      image: imageUrl,
      audio: audioUrl,
      audioDuration: audioDuration || 0,
      replyTo: replyTo || null,
      status: messageStatus,
    });

    const populatedMessage = await Message.findById(newMessage._id).populate(
      "replyTo",
      "text senderId image audio"
    );

    // Emit real-time message to receiver
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", populatedMessage);
    }

    res.status(201).json(populatedMessage);
  } catch (error) {
    console.log("Error in sendMessage:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ================= TOGGLE REACTION =================
export const toggleReaction = async (req, res) => {
  try {
    const { id: messageId } = req.params;
    const { emoji } = req.body;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ error: "Message not found" });

    const existingIdx = message.reactions.findIndex(
      (r) => r.userId.toString() === userId.toString()
    );

    if (existingIdx > -1) {
      if (message.reactions[existingIdx].emoji === emoji) {
        message.reactions.splice(existingIdx, 1);
      } else {
        message.reactions[existingIdx].emoji = emoji;
      }
    } else {
      message.reactions.push({ userId, emoji });
    }

    await message.save();

    const payload = {
      messageId: message._id,
      reactions: message.reactions,
    };

    const receiverSocketId = getReceiverSocketId(message.receiverId.toString());
    const senderSocketId = getReceiverSocketId(message.senderId.toString());

    if (receiverSocketId) io.to(receiverSocketId).emit("messageReaction", payload);
    if (senderSocketId) io.to(senderSocketId).emit("messageReaction", payload);

    res.status(200).json(message);
  } catch (error) {
    console.error("Error in toggleReaction:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ================= DELETE MESSAGE =================
export const deleteMessage = async (req, res) => {
  try {
    const { id: messageId } = req.params;
    const deleteType = req.body?.deleteType || req.query?.type || "forEveryone";
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ error: "Message not found" });

    const isSender = message.senderId.toString() === userId.toString();
    const isReceiver = message.receiverId.toString() === userId.toString();

    if (!isSender && !isReceiver) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    // 1. DELETE FOR ME
    if (deleteType === "forMe") {
      if (!message.deletedFor.some((id) => id.toString() === userId.toString())) {
        message.deletedFor.push(userId);
        await message.save();
      }

      return res.status(200).json({
        message: "Message deleted for you",
        messageId: message._id,
        deleteType: "forMe",
      });
    }

    // 2. DELETE FOR EVERYONE (Sender only)
    if (!isSender) {
      return res.status(403).json({ error: "Only the sender can delete for everyone" });
    }

    message.isDeleted = true;
    message.text = "This message was deleted";
    message.image = null;
    message.audio = null;
    message.audioDuration = 0;
    await message.save();

    const payload = {
      messageId: message._id,
      isDeleted: true,
      text: "This message was deleted",
      deleteType: "forEveryone",
    };

    const receiverSocketId = getReceiverSocketId(message.receiverId.toString());
    const senderSocketId = getReceiverSocketId(message.senderId.toString());

    if (receiverSocketId) io.to(receiverSocketId).emit("messageDeleted", payload);
    if (senderSocketId) io.to(senderSocketId).emit("messageDeleted", payload);

    res.status(200).json({
      message: "Message deleted for everyone",
      messageId: message._id,
      deleteType: "forEveryone",
    });
  } catch (error) {
    console.error("Error in deleteMessage:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ================= GET UNREAD OFFLINE MESSAGES =================
export const getUnreadOfflineMessages = async (req, res) => {
  try {
    const userId = req.user._id;

    // Find all unread messages received by this user while offline or disconnected
    const unreadMessages = await Message.find({
      receiverId: userId,
      status: { $ne: "read" },
      deletedFor: { $nin: [userId] },
    })
      .populate("senderId", "fullName username profilePic")
      .populate("replyTo", "text senderId image audio")
      .sort({ createdAt: 1 })
      .limit(100);

    // Update 'sent' messages to 'delivered'
    await Message.updateMany(
      { receiverId: userId, status: "sent" },
      { $set: { status: "delivered" } }
    );
    io.emit("messagesDelivered", { receiverId: userId });

    res.status(200).json(unreadMessages);
  } catch (error) {
    console.error("Error in getUnreadOfflineMessages:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
