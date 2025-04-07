import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  getMessages,
  getUsersWithChats,
  searchUsers,
  sendMessage,
  getUsersForSidebar,
} from "../controllers/message.controller.js";

const router = express.Router();

router.get("/users/sidebar", protectRoute, getUsersForSidebar);
router.get("/users/chats", protectRoute, getUsersWithChats);
router.get("/users/search", protectRoute, searchUsers);
router.get("/:id", protectRoute, getMessages);
router.post("/send/:id", protectRoute, sendMessage);

export default router;
