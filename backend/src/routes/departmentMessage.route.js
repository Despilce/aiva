import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  getDepartmentMessages,
  sendDepartmentMessage,
  acceptDepartmentMessage,
  solveDepartmentMessage,
  markMessageNotSolved,
  resetAllPerformance,
} from "../controllers/departmentMessage.controller.js";

const router = express.Router();

router.get("/:department(*)", protectRoute, getDepartmentMessages);
router.post("/send/:department(*)", protectRoute, sendDepartmentMessage);
router.post("/accept/:messageId", protectRoute, acceptDepartmentMessage);
router.post("/solve/:messageId", protectRoute, solveDepartmentMessage);
router.post("/not-solved/:messageId", protectRoute, markMessageNotSolved);
router.post("/reset-performance", protectRoute, resetAllPerformance);

export { router as departmentMessageRouter };
