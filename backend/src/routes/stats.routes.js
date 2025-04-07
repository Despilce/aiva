const express = require("express");
const router = express.Router();
const { getDepartmentStats } = require("../controllers/stats.controller");
const { verifyToken, isManager } = require("../middleware/auth");

// Get department statistics (requires authentication and manager role)
router.get(
  "/department/:department",
  [verifyToken, isManager],
  getDepartmentStats
);

module.exports = router;
