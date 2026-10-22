import cloudinary from "../lib/cloudinary.js";
import Group from "../models/groupModel.js";
import Message from "../models/messageModel.js";
import User from "../models/userModel.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

// ================= CREATE GROUP =================
export const createGroup = async (req, res) => {
  try {
    const { name, description, groupPic, members } = req.body;
    const myId = req.user._id;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Group name is required" });
    }

    // Parse member IDs and ensure current user is included
    let memberIds = Array.isArray(members) ? [...members] : [];
    if (!memberIds.includes(myId.toString())) {
      memberIds.push(myId.toString());
    }

    if (memberIds.length < 2) {
      return res.status(400).json({ error: "A group must have at least 2 members" });
    }

    let uploadedGroupPic = "";
    if (groupPic && groupPic.startsWith("data:image")) {
      const uploadRes = await cloudinary.uploader.upload(groupPic, {
        folder: "chatapp/groups",
      });
      uploadedGroupPic = uploadRes.secure_url;
    }

    const newGroup = new Group({
      name: name.trim(),
      description: description?.trim() || "Welcome to our group chat!",
      groupPic: uploadedGroupPic,
      admin: myId,
      admins: [myId],
      members: memberIds,
      createdBy: myId,
    });

    await newGroup.save();

    const populatedGroup = await Group.findById(newGroup._id)
      .populate("members", "fullName username profilePic about")
      .populate("admins", "fullName username profilePic")
      .populate("admin", "fullName username profilePic");

    // Notify all online members via socket
    memberIds.forEach((mId) => {
      const socketId = getReceiverSocketId(mId.toString());
      if (socketId) {
        io.to(socketId).emit("newGroupCreated", populatedGroup);
      }
    });

    res.status(201).json(populatedGroup);
  } catch (error) {
    console.error("Error in createGroup:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ================= GET GROUPS FOR USER =================
export const getGroups = async (req, res) => {
  try {
    const myId = req.user._id;

    const groups = await Group.find({ members: myId })
      .populate("members", "fullName username profilePic about")
      .populate("admins", "fullName username profilePic")
      .populate("admin", "fullName username profilePic")
      .populate({
        path: "lastMessage",
        populate: {
          path: "senderId",
          select: "fullName username profilePic",
        },
      })
      .sort({ updatedAt: -1 });

    // Compute unread count for each group
    const groupsWithUnread = await Promise.all(
      groups.map(async (grp) => {
        const unreadCount = await Message.countDocuments({
          groupId: grp._id,
          senderId: { $ne: myId },
          "readBy.userId": { $ne: myId },
          deletedFor: { $nin: [myId] },
        });

        return {
          ...grp.toObject(),
          unreadCount,
        };
      })
    );

    res.status(200).json(groupsWithUnread);
  } catch (error) {
    console.error("Error in getGroups:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ================= GET GROUP DETAILS =================
export const getGroupDetails = async (req, res) => {
  try {
    const { id: groupId } = req.params;
    const myId = req.user._id;

    const group = await Group.findById(groupId)
      .populate("members", "fullName username profilePic about")
      .populate("admins", "fullName username profilePic")
      .populate("admin", "fullName username profilePic");

    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    const isMember = group.members.some((m) => m._id.toString() === myId.toString());
    if (!isMember) {
      return res.status(403).json({ error: "You are not a member of this group" });
    }

    res.status(200).json(group);
  } catch (error) {
    console.error("Error in getGroupDetails:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ================= GET GROUP MESSAGES =================
export const getGroupMessages = async (req, res) => {
  try {
    const { id: groupId } = req.params;
    const myId = req.user._id;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    const isMember = group.members.some((m) => m.toString() === myId.toString());
    if (!isMember) {
      return res.status(403).json({ error: "You are not a member of this group" });
    }

    // Mark messages in this group as read by current user
    await Message.updateMany(
      {
        groupId,
        senderId: { $ne: myId },
        "readBy.userId": { $ne: myId },
      },
      {
        $addToSet: {
          readBy: { userId: myId, readAt: new Date() },
        },
      }
    );

    const messages = await Message.find({
      groupId,
      deletedFor: { $nin: [myId] },
    })
      .populate("senderId", "fullName username profilePic")
      .populate({
        path: "replyTo",
        populate: {
          path: "senderId",
          select: "fullName username",
        },
      })
      .sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (error) {
    console.error("Error in getGroupMessages:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ================= SEND GROUP MESSAGE =================
export const sendGroupMessage = async (req, res) => {
  try {
    const { id: groupId } = req.params;
    const { text, image, audio, audioDuration, replyTo } = req.body;
    const senderId = req.user._id;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    const isMember = group.members.some((m) => m.toString() === senderId.toString());
    if (!isMember) {
      return res.status(403).json({ error: "You are not a member of this group" });
    }

    let imageUrl = null;
    let audioUrl = null;

    if (image) {
      const uploadRes = await cloudinary.uploader.upload(image, {
        folder: "chatapp/group_images",
      });
      imageUrl = uploadRes.secure_url;
    }

    if (audio) {
      const sanitizedAudio = audio.replace(/;codecs=[^;]+/, "");
      const uploadRes = await cloudinary.uploader.upload(sanitizedAudio, {
        resource_type: "auto",
        folder: "chatapp/group_voice_notes",
      });
      audioUrl = uploadRes.secure_url;
    }

    const newMessage = new Message({
      senderId,
      groupId,
      isGroup: true,
      text: text?.trim() || "",
      image: imageUrl,
      audio: audioUrl,
      audioDuration: audioDuration || 0,
      replyTo: replyTo || null,
      readBy: [{ userId: senderId, readAt: new Date() }],
    });

    await newMessage.save();

    // Update group's last message and timestamp
    group.lastMessage = newMessage._id;
    group.updatedAt = new Date();
    await group.save();

    const populatedMessage = await Message.findById(newMessage._id)
      .populate("senderId", "fullName username profilePic")
      .populate({
        path: "replyTo",
        populate: {
          path: "senderId",
          select: "fullName username",
        },
      });

    // Broadcast to group room and to all members' sockets
    io.to(`group_${groupId}`).emit("newGroupMessage", populatedMessage);

    group.members.forEach((mId) => {
      const socketId = getReceiverSocketId(mId.toString());
      if (socketId) {
        io.to(socketId).emit("newGroupMessage", populatedMessage);
      }
    });

    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error("Error in sendGroupMessage:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ================= UPDATE GROUP =================
export const updateGroup = async (req, res) => {
  try {
    const { id: groupId } = req.params;
    const { name, description, groupPic } = req.body;
    const myId = req.user._id;

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ error: "Group not found" });

    const isMember = group.members.some((m) => m.toString() === myId.toString());
    if (!isMember) return res.status(403).json({ error: "Not authorized" });

    if (name && name.trim()) group.name = name.trim();
    if (description !== undefined) group.description = description.trim();

    if (groupPic && groupPic.startsWith("data:image")) {
      const uploadRes = await cloudinary.uploader.upload(groupPic, {
        folder: "chatapp/groups",
      });
      group.groupPic = uploadRes.secure_url;
    }

    await group.save();

    const updatedGroup = await Group.findById(groupId)
      .populate("members", "fullName username profilePic about")
      .populate("admins", "fullName username profilePic")
      .populate("admin", "fullName username profilePic");

    group.members.forEach((mId) => {
      const sId = getReceiverSocketId(mId.toString());
      if (sId) io.to(sId).emit("groupUpdated", updatedGroup);
    });

    res.status(200).json(updatedGroup);
  } catch (error) {
    console.error("Error in updateGroup:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ================= ADD MEMBERS =================
export const addMembers = async (req, res) => {
  try {
    const { id: groupId } = req.params;
    const { members } = req.body; // array of user IDs
    const myId = req.user._id;

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ error: "Group not found" });

    const isAdmin =
      group.admins.some((a) => a.toString() === myId.toString()) ||
      group.admin.toString() === myId.toString();

    if (!isAdmin) {
      return res.status(403).json({ error: "Only group admins can add members" });
    }

    const newMembers = Array.isArray(members) ? members : [members];
    newMembers.forEach((id) => {
      if (!group.members.some((m) => m.toString() === id.toString())) {
        group.members.push(id);
      }
    });

    await group.save();

    const updatedGroup = await Group.findById(groupId)
      .populate("members", "fullName username profilePic about")
      .populate("admins", "fullName username profilePic")
      .populate("admin", "fullName username profilePic");

    // Notify all members
    updatedGroup.members.forEach((m) => {
      const sId = getReceiverSocketId(m._id.toString());
      if (sId) io.to(sId).emit("groupUpdated", updatedGroup);
    });

    res.status(200).json(updatedGroup);
  } catch (error) {
    console.error("Error in addMembers:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ================= REMOVE MEMBER / LEAVE GROUP =================
export const removeMember = async (req, res) => {
  try {
    const { id: groupId, userId } = req.params;
    const myId = req.user._id;

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ error: "Group not found" });

    const isSelfLeaving = myId.toString() === userId.toString();
    const isAdmin =
      group.admins.some((a) => a.toString() === myId.toString()) ||
      group.admin.toString() === myId.toString();

    if (!isSelfLeaving && !isAdmin) {
      return res.status(403).json({ error: "Only group admins can remove members" });
    }

    // Filter out the member
    group.members = group.members.filter((m) => m.toString() !== userId.toString());
    group.admins = group.admins.filter((a) => a.toString() !== userId.toString());

    // If primary admin leaves, appoint new admin if any members remain
    if (group.admin.toString() === userId.toString() && group.members.length > 0) {
      group.admin = group.members[0];
      if (!group.admins.some((a) => a.toString() === group.members[0].toString())) {
        group.admins.push(group.members[0]);
      }
    }

    if (group.members.length === 0) {
      await Group.findByIdAndDelete(groupId);
      return res.status(200).json({ message: "Group deleted as all members left", groupId });
    }

    await group.save();

    const updatedGroup = await Group.findById(groupId)
      .populate("members", "fullName username profilePic about")
      .populate("admins", "fullName username profilePic")
      .populate("admin", "fullName username profilePic");

    // Notify remaining members
    updatedGroup.members.forEach((m) => {
      const sId = getReceiverSocketId(m._id.toString());
      if (sId) io.to(sId).emit("groupUpdated", updatedGroup);
    });

    // Notify removed user
    const removedSocketId = getReceiverSocketId(userId);
    if (removedSocketId) {
      io.to(removedSocketId).emit("removedFromGroup", { groupId });
    }

    res.status(200).json({ message: "Member removed", group: updatedGroup });
  } catch (error) {
    console.error("Error in removeMember:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ================= TOGGLE ADMIN STATUS =================
export const toggleAdmin = async (req, res) => {
  try {
    const { id: groupId, userId } = req.params;
    const myId = req.user._id;

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ error: "Group not found" });

    const isCreatorOrAdmin =
      group.admin.toString() === myId.toString() ||
      group.admins.some((a) => a.toString() === myId.toString());

    if (!isCreatorOrAdmin) {
      return res.status(403).json({ error: "Only admins can change admin privileges" });
    }

    const alreadyAdmin = group.admins.some((a) => a.toString() === userId.toString());
    if (alreadyAdmin) {
      // Cannot demote primary creator
      if (group.admin.toString() === userId.toString()) {
        return res.status(400).json({ error: "Cannot demote the group creator" });
      }
      group.admins = group.admins.filter((a) => a.toString() !== userId.toString());
    } else {
      group.admins.push(userId);
    }

    await group.save();

    const updatedGroup = await Group.findById(groupId)
      .populate("members", "fullName username profilePic about")
      .populate("admins", "fullName username profilePic")
      .populate("admin", "fullName username profilePic");

    updatedGroup.members.forEach((m) => {
      const sId = getReceiverSocketId(m._id.toString());
      if (sId) io.to(sId).emit("groupUpdated", updatedGroup);
    });

    res.status(200).json(updatedGroup);
  } catch (error) {
    console.error("Error in toggleAdmin:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
