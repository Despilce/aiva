import express from "express";
import {
  checkAuth,
  login,
  logout,
  signup,
  updateProfile,
  changePassword,
  updateStaffPerformance,
} from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);

router.put("/update-profile", protectRoute, updateProfile);
router.put("/change-password", protectRoute, changePassword);
router.post("/update-performance", protectRoute, updateStaffPerformance);

router.get("/check", protectRoute, checkAuth);

export { router as authRouter };
