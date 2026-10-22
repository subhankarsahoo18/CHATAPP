import express from "express";
import { protectRoute } from "../middleware/authMiddleware.js";
import {
  createGroup,
  getGroups,
  getGroupDetails,
  getGroupMessages,
  sendGroupMessage,
  updateGroup,
  addMembers,
  removeMember,
  toggleAdmin,
} from "../controllers/groupController.js";

const router = express.Router();

router.post("/", protectRoute, createGroup);
router.get("/", protectRoute, getGroups);
router.get("/:id", protectRoute, getGroupDetails);
router.put("/:id", protectRoute, updateGroup);

router.get("/:id/messages", protectRoute, getGroupMessages);
router.post("/:id/messages", protectRoute, sendGroupMessage);

router.post("/:id/members", protectRoute, addMembers);
router.delete("/:id/members/:userId", protectRoute, removeMember);
router.put("/:id/admins/:userId", protectRoute, toggleAdmin);

export default router;
