import express from "express";
import { getDepartmentStats } from "../controllers/stats.controller.js";
import { protectRoute, isManager } from "../middleware/auth.middleware.js";

const router = express.Router();

// Debug middleware for stats routes
router.use((req, res, next) => {
  console.log("Stats route accessed:", {
    method: req.method,
    url: req.url,
    params: req.params,
    query: req.query,
    user: req.user
      ? {
          id: req.user._id,
          userType: req.user.userType,
          department: req.user.department,
        }
      : null,
  });
  next();
});

// Get department statistics (requires authentication and manager role)
router.get(
  "/department/:department",
  [protectRoute, isManager],
  (req, res, next) => {
    try {
      // URL decode the department parameter
      req.params.department = decodeURIComponent(req.params.department);
      console.log("Decoded department name:", req.params.department);
      next();
    } catch (error) {
      console.error("Error decoding department name:", error);
      res.status(400).json({ message: "Invalid department name format" });
    }
  },
  getDepartmentStats
);

// Debug endpoint to check route registration
router.get("/debug", (req, res) => {
  res.json({
    message: "Stats routes are working",
    timestamp: new Date().toISOString(),
  });
});

export { router as statsRouter };
