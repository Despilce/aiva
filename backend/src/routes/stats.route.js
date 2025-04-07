import express from "express";
import { getDepartmentStats } from "../controllers/stats.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/department/:department", protectRoute, getDepartmentStats);

export default router;
