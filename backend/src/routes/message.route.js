import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  getMessages,
  getUsersWithChats,
  searchUsers,
  sendMessage,
} from "../controllers/message.controller.js";

const router = express.Router();

router.get("/users/chats", protectRoute, getUsersWithChats);
router.get("/users/search", protectRoute, searchUsers);
router.get("/users", protectRoute, getUsersWithChats);
router.get("/:id", protectRoute, getMessages);
router.post("/send/:id", protectRoute, sendMessage);

export default router;
